// services/albaranService.js
const pool = require('../config/db');
const fs = require('fs-extra');
const path = require('path');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { getDate } = require('../utils/documentHelpers');


// Fetch contracts for a specific month from the database
async function getContractsByMonth(month) {
  const query = `SELECT * FROM contratos WHERE UPPER(mes) = UPPER($1) AND UPPER(estado) = 'ACTIVO'`;
  const result = await pool.query(query, [month]);
  return result.rows;
}

// Fetch alabaranes for a specific client from the database
async function getAlbaranesByClientId(clientId, estado) {
  const query = `SELECT * FROM data_trabajos WHERE id_cliente = $1 AND UPPER(estado) = $2`;
  const result = await pool.query(query, [clientId, estado]);
  return result.rows;
}

// Fetch alabaran from the database
async function getAlbaran(albaranId) {
  const query = `SELECT * FROM data_trabajos WHERE id_albaran = $1`;
  const result = await pool.query(query, [albaranId]);
  return result.rows[0];
}

// Fetch alabaranes aceptados for a specific month from the database
async function getAlbaranesAceptadosByMonth(month, year) {
  const query = `SELECT * FROM data_trabajos WHERE UPPER(mes) = UPPER($1) AND año=($2) AND UPPER(estado) = 'ACEPTADO'`;
  const result = await pool.query(query, [month, year]);
  return result.rows;
}

// Delete albaranes pendientes for a specific month from the database
async function deleteAlbaranesPendientesByMonth(month, year) {
  const query = `DELETE FROM data_trabajos WHERE UPPER(mes) = UPPER($1) AND año=($2) AND UPPER(estado) = 'PENDIENTE' RETURNING *`;
  const result = await pool.query(query, [month, year]);
  return result.rows;
}

// Delete albaran by Id Albaran
async function deleteAlbaranByIdAlbaran(idAlbaran) {
  const query = `DELETE FROM data_trabajos WHERE id_albaran = $1 RETURNING *`;
  const result = await pool.query(query, [idAlbaran]);
  return result.rows;
}

// Get client data for a specific contract from the database
async function getClientByContract(contract) {
    try {
        const query = `SELECT * FROM clientes WHERE id_cliente = $1`;
        const result = await pool.query(query, [contract.id_cliente]);
        // Return the single client object if found, otherwise return null
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching client by contract:', error);
        throw new Error('Failed to retrieve client data');
    }
}

// Get client assets from the database
async function getClientAssets(client) {
    try {
        const query = `SELECT * FROM activos WHERE id_cliente = $1 AND estado = 'ACTIVO'`;
        const result = await pool.query(query, [client.id_cliente]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching client assets:', error);
        throw new Error('Failed to retrieve client assets');
    }
}

// Get the last value of id_albaran from the data_trabajos table
async function getUltimoIdAlbaran() {
  try {
    const query = `SELECT MAX(id_albaran) AS ultimo_id FROM data_trabajos;`;
    const result = await pool.query(query);

    // If the table is empty, result.rows[0].ultimo_id will be null
    return result.rows[0].ultimo_id || null;
  } catch (error) {
    console.error('Error retrieving the last id_albaran:', error);
    throw new Error('Failed to retrieve the last id_albaran');
  }
}

// Derive Maintenance Services and Products for a given client
async function deriveMaintenance(activosCliente) {
    const productosServicios = []; // List of derived products and services
    let saltarAlbaran = false; // Flag to skip albaran if there's missing data
    let clienteSinDatos = false; // Flag to detect client with missing asset's data
    let clienteIncorrecto = false; // Flag to detect client with any other error

    
    // Current year for maintenance calculations
    const currentYear = new Date().getFullYear();
  
    // Loop through each client asset
    for (const row_activo of activosCliente) {
      try {
        // Check for "EXTINTOR" assets
        if (row_activo.nombre.includes('EXTINTOR')) {
          // Validate extintor data
          if (!Number.isInteger(row_activo.fecha_fabricacion)) {
            console.log(`FALTAN DATOS EXTINTORES: ${row_activo.nombre}`);
            clienteSinDatos = true;
            saltarAlbaran = true;
            break;
          }
  
          // Check extintor lifecycle (caducado, retimbrado, nuevo)
          const fabricationYear = parseInt(row_activo.fecha_fabricacion, 10);
          const caducado = fabricationYear && (currentYear - fabricationYear) >= 20;
          const retimbrado = row_activo.fecha_retimbrado === null 
            ? false 
            : (currentYear - parseInt(row_activo.fecha_retimbrado, 10)) >= 5;
          const nuevo = fabricationYear === currentYear;
  
          if (caducado || nuevo) {
            // Add new extintor to products and services
            const desc = await fetchProductDescription(row_activo.nombre, 'PRODUCTOS');
            productosServicios.push(desc.descripcion_corta);
          } else {
            // Add maintenance service
            const maintenanceDesc = await fetchServiceDescription(row_activo.nombre, 'MANTENIMIENTO');
            productosServicios.push(maintenanceDesc.descripcion_corta);
  
            // Add retimbrado service if necessary
            if (retimbrado) {
              const retimbradoDesc = await fetchServiceDescription(row_activo.nombre, 'RETIMBRADO');
              productosServicios.push(retimbradoDesc.descripcion_corta);
            }
          }
  
        } else if (row_activo.nombre.includes('BOCAS DE INCENDIO EQUIPADAS')) {
          // Handle "BOCAS DE INCENDIO EQUIPADAS" assets
  
          const maintenanceDesc = await fetchServiceDescription(row_activo.nombre, 'MANTENIMIENTO');
          productosServicios.push(...Array(row_activo.cantidad).fill(maintenanceDesc.descripcion_corta));
  
        } else {
          // General case for other assets
          const maintenanceDesc = await fetchServiceDescription(row_activo.nombre, 'MANTENIMIENTO');
          productosServicios.push(...Array(row_activo.cantidad).fill(maintenanceDesc.descripcion_corta));
        }
  
      } catch (error) {
        console.error('ERROR PRODUCTOS CLIENTE:', error);
        clienteIncorrecto = true;
        saltarAlbaran = true;
        break;
      }
    }

    // Count occurrences of each product/service in productos_servicios
    const productosServiciosCounter = productosServicios.reduce((counter, item) => {
        counter[item] = (counter[item] || 0) + 1;
        return counter;
    }, {});
  
    return { productosServiciosCounter, saltarAlbaran, clienteSinDatos, clienteIncorrecto };
}
  
// Helper function to fetch product description from a reference table
async function fetchProductDescription(productName, conceptType) {
    // Fetching from REF_PRODUCTOS table
    const query = `
      SELECT descripcion_corta 
      FROM ref_productos 
      WHERE concepto = $1
    `;
    const result = await pool.query(query, [productName]);
    return result.rows[0] || null;
}
  
// Helper function to fetch service description from a reference table
async function fetchServiceDescription(productName, conceptType) {
    // Fetching from REF_SERVICIOS table
    const query = `
      SELECT descripcion_corta 
      FROM ref_servicios 
      WHERE producto_asociado LIKE '%' || $1 || '%'
        AND concepto LIKE '%' || $2 || '%'
    `;
    const result = await pool.query(query, [productName, conceptType]);
    return result.rows[0] || null;
}


// Generate an albaran document and save it to a directory
async function generateAlbaranDocument(contract, client, activosCliente, productosServiciosCounter) {
    try {
      // Load the DOCX template file
      const templatePath = path.join(__dirname, '../templates/plantilla_albaran.docx');
      const templateContent = await fs.readFile(templatePath, 'binary');
  
      // Load template content into PizZip and Docxtemplater
      const zip = new PizZip(templateContent);
      const doc = new Docxtemplater(zip);
  
      // Get additional data for the template
      const albaranNumber = await getUltimoIdAlbaran() + 1;
      const [day, month, year] = getDate();

      // Set Maintenance services Data
      const sortedProductosServicios = Object.keys(productosServiciosCounter)
        .sort()  // Sort keys alphabetically
        .reduce((sortedObj, key) => {
            sortedObj[key] = productosServiciosCounter[key];
            return sortedObj;
        }, {});

      // Separate keys and values into two lists
      const productosServicios = Object.keys(sortedProductosServicios); 
      const cantidades = Object.values(sortedProductosServicios);  

      // Prepare the maintenance data for the table
      const maintenanceData = productosServicios.map((producto, index) => ({
        cant: cantidades[index] || '',
        concepto: producto,
      }));

      // Prepare combined table data
      const combinedTableData = [];

      // Filter extintores data from activosCliente
      const extintoresCliente = activosCliente.filter(activo =>
        activo.nombre.toLowerCase().includes('extintor')
      );
      
      // Prepare extintores data
      if (extintoresCliente.length > 10) {
        // Add only maintenance data
        for (const item of maintenanceData) {
            combinedTableData.push({
              cant: item.cant,
              concepto: item.concepto,
              num: '', // No placa for maintenance
              ano_fab: '',
              ano_rt: '',
            });
          }
      }
      else {
        // Add extintores data in albaran row-by-row
        const maxLength = Math.max(maintenanceData.length, extintoresCliente.length);
        for (let i = 0; i < maxLength; i++) {
            combinedTableData.push({
                cant: maintenanceData[i]?.cant || '',
                concepto: maintenanceData[i]?.concepto || '',
                num: extintoresCliente[i]?.n_identificador || '',
                ano_fab: extintoresCliente[i]?.fecha_fabricacion || '',
                ano_rt: extintoresCliente[i]?.fecha_retimbrado || '',
            });
        }
      }

      // Calculate empty rows to add
      const emptyRowsCount = Math.max(14 - combinedTableData.length - Math.floor((maintenanceData.length - 1) / 2), 0);
      for (let i = 0; i < emptyRowsCount; i++) {
        combinedTableData.push({
            cant: '',
            concepto: '',
            num: '',
            ano_fab: '',
            ano_rt: '',
        });
      }

      // Set template variables
      let client_name = client.nombre; // Default placeholder for client name
      let client_name_small = ''
      let client_address = client.direccion; // Default placeholder for client name
      let client_address_small = ''

      // Adjust placeholder key if the name length exceeds 40 characters
      if (client.nombre.length >= 40) {
        client_name = ''; // Use smaller font placeholder
        client_name_small = client.nombre
      }

      // Adjust placeholder key if the name length exceeds 40 characters
      if (client.direccion.length >= 40) {
        client_address = ''; // Use smaller font placeholder
        client_address_small = client.direccion
      }

      // Set template variables
      doc.setData({
        num_albaran: albaranNumber,
        date: `${day} de ${month} de ${year}`,
        client_name: client_name,
        client_name_small: client_name_small,
        client_address: client_address,
        client_address_small: client_address_small,
        client_city: client.ciudad,
        client_province: client.provincia,
        client_schedule: client.horario || '',
        client_iban: client.iban || '',
        client_cif: client.cif || '',
        client_postal_code: client.cp || '',
        client_phone: client.telefono || '',
        client_activity: client.actividad || '',
        combined_table: combinedTableData,
      });
  
      // Render the document with the data
      doc.render();
  
      // Generate the final document as a buffer
      const output = doc.getZip().generate({ type: 'nodebuffer' });
  
      // Define the output path
      const outputDirectory = path.join(__dirname, `../albaranes/${year}/${contract.mes}`);
      await fs.ensureDir(outputDirectory);
      const outputPath = path.join(outputDirectory, `albaran_${client.nombre}_${client.id_cliente}.docx`);
  
      // Write the generated document to file
      await fs.writeFile(outputPath, output);
  
      console.log(`Albarán generated and saved at: ${outputPath}`);

      return albaranNumber;

    } catch (error) {
      console.error('Error generating albaran document:', error);
      throw new Error('Failed to generate albaran document');
    }
}

// Get contract prices
function getContractPrices (prices, products) {
  // Parse precios if it's a string representation of a list
  if (typeof prices === "string") {
    prices = JSON.parse(prices);
  }

  newPrices = []
  products.forEach((product => {
      // Check if the word 'mantenimiento' is not in the product
      if (!product.toLowerCase().includes('mantenimiento') || prices === "") {
          // If not 'mantenimiento' or no price is provided, add the price 20
          newPrices.push(20);
      } else {
          // If it is 'mantenimiento', use the next price from the precios list
          newPrices.push(prices.length > 0 ? prices[0] : null);
          prices = prices.slice(1); // Remove the used price from the list
      }
  }));
  
  return newPrices;
}

// Inserts generated albaranes into the database.
async function insertAlbaranes (albaranes) {
  const query = `
    INSERT INTO data_trabajos
      (id_contrato, id_cliente, productos_servicios, cantidades, precios, cuota, mes, año, estado, nota, notas_adicionales, fecha)
    VALUES ($1, $2, $3, $4, $5, $6, UPPER($7), $8, $9, $10, $11, $12)
    RETURNING id_albaran;
  `;

  const results = [];
  for (const albaran of albaranes) {
    const values = [
      albaran.idContrato,
      albaran.idCliente,
      albaran.productosServicios, 
      albaran.cantidades, 
      albaran.precios, 
      albaran.cuota,
      albaran.mes,
      albaran.anio,
      albaran.estado || 'PENDIENTE', 
      albaran.nota || null, 
      albaran.notas_adicionales || null,
      albaran.fecha,
    ];
    const result = await pool.query(query, values);
    results.push(result.rows[0]);
  }

  return { inserted: results.length, albaranes: results };
};

// Update albaran data
async function updateAlbaran (albaran) {
  const query = `
    UPDATE data_trabajos
    SET
      productos_servicios = $1,
      cantidades = $2,
      precios = $3,
      cuota = $4,
      estado = $5
    WHERE id_albaran = $6
    RETURNING *; -- Devuelve las filas actualizadas
  `;

  const calcularTotalCuota = (cantidades, precios) => {
    const cantidadArray = cantidades.map(Number); // Ensure all quantities are numbers
    const precioArray = precios.map(Number); // Ensure all prices are numbers
    return cantidadArray.reduce((total, cantidad, i) => total + cantidad * precioArray[i], 0);
  };

  const values = [
    albaran.productos_servicios, 
    albaran.cantidades, 
    albaran.precios, 
    calcularTotalCuota(albaran.cantidades, albaran.precios),
    'ACEPTADO', 
    albaran.id_albaran,
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows; // Devuelve las filas actualizadas, si es necesario
  } catch (error) {
    console.error('Error actualizando albaran:', error);
    throw error; // Rethrow para manejar errores a nivel superior
  }
};

module.exports = {
  getContractsByMonth,
  getAlbaranesAceptadosByMonth,
  deleteAlbaranesPendientesByMonth,
  getClientByContract,
  getClientAssets,
  deriveMaintenance,
  generateAlbaranDocument,
  getContractPrices,
  insertAlbaranes,
  getAlbaranesByClientId,
  updateAlbaran,
  deleteAlbaranByIdAlbaran,
  getAlbaran
};
