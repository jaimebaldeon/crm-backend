const pool = require('../config/db');
const fs = require('fs-extra');
const path = require('path');
const ExcelJS = require('exceljs');
const { getDate } = require('../utils/documentHelpers');


// Fetch contracts for a specific month from the database
exports.getAlbaranesConFactura = async (month, year) => {
  // Mapa para convertir el nombre del mes en texto a un número
  const monthMap = {
    enero: 1,
    febrero: 2,
    marzo: 3,
    abril: 4,
    mayo: 5,
    junio: 6,
    julio: 7,
    agosto: 8,
    septiembre: 9,
    octubre: 10,
    noviembre: 11,
    diciembre: 12,
  };

  // Convertir el mes a número (lowercase para evitar errores)
  const monthNumber = monthMap[month.toLowerCase()];

  // Verificar si el mes es válido
  if (!monthNumber) {
    throw new Error('Mes no válido. Debe ser un nombre de mes en español.');
  }

  const query = `
    SELECT * 
    FROM facturas 
    WHERE DATE_PART('month', fecha) = $1 
    AND DATE_PART('year', fecha) = $2
`;
  const result = await pool.query(query, [monthNumber, year]);
  return result.rows;
}


exports.saveFactura = async (albaran) => {
  const query = `
    INSERT INTO facturas (id_cliente, id_albaran, fecha, cuota)
    VALUES ($1, $2, $3, $4)
    RETURNING id_factura;
  `;

  // Valores a insertar en la consulta
  const values = [
    albaran.id_cliente,          // ID Cliente proveniente del albarán
    albaran.id_albaran,          // ID Albarán
    new Date().toISOString().split('T')[0], // Fecha en formato 'YYYY-MM-DD'
    albaran.cuota * 1.21
  ];

  try {
    // Ejecutar la consulta
    const result = await pool.query(query, values);

    // Retornar el ID de la factura insertada
    return result.rows[0].id_factura;
  } catch (error) {
    // Verificar si el error es por clave duplicada (Código de error 23505)
    if (error.code === '23505' && error.constraint === 'facturas_id_albaran_unique') {
      console.error('Clave duplicada al insertar factura:', error.detail);
      throw new Error(`Factura ya existente para el albarán con ID ${albaran.id_albaran}`);
    }

    // Para cualquier otro error, mostrar un mensaje genérico
    console.error('Error inserting factura:', error);
    throw new Error('No se pudo insertar la factura');
  }
};



// Generate an albaran document and save it to a directory
exports.generateFacturaDocument = async (albaran, client, idFactura) => {
    try {
      // Load the DOCX template file
      const templatePath = path.join(__dirname, '../templates/plantilla_factura.xlsx');
  
      // Cargar el archivo Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      const hojaFactura = workbook.getWorksheet(1); // Seleccionar la primera hoja
  
      // Get additional data for the template
      const [day, month, year] = getDate();

      // Insertar fecha en las celdas
      hojaFactura.getCell('C11').value = day;
      hojaFactura.getCell('D11').value = month;
      hojaFactura.getCell('E11').value = year;


      // Insertar datos del cliente
      hojaFactura.getCell('C14').value = client.nombre;

      // Dividir la dirección del cliente
      const direccion = client.direccion_facturacion.split(';');
      hojaFactura.getCell('C15').value = direccion[0]; // Calle y número
      hojaFactura.getCell('C16').value = direccion[2]; // Código postal
      hojaFactura.getCell('D16').value = direccion[1]; // Ciudad
      hojaFactura.getCell('H16').value = client.cif;

      // Insertar datos de productos y servicios
      const filaInicial = 20;  // Primera fila para insertar los datos de productos

      albaran.productos_servicios.forEach((producto, i) => {
        const cantidad = parseFloat(albaran.cantidades[i]);
        const precio = parseFloat(albaran.precios[i]);
        const totalProducto = cantidad * precio;

        // Insertar los datos en las celdas correspondientes
        hojaFactura.getCell(`B${filaInicial + (2 * i)}`).value = cantidad;   // Cantidad
        hojaFactura.getCell(`C${filaInicial + (2 * i)}`).value = producto;   // Descripción del producto
        hojaFactura.getCell(`G${filaInicial + (2 * i)}`).value = precio;     // Precio unitario
        hojaFactura.getCell(`H${filaInicial + (2 * i)}`).value = totalProducto; // Total por producto
      });
      
      // Insertar el total sin IVA
      hojaFactura.getCell('H44').value = parseFloat(albaran.cuota);

      // Calcular e insertar IVA
      let iva = 0;
      if (albaran.nota !== 'SI') {
        iva = parseFloat(albaran.cuota) * 0.21;
        hojaFactura.getCell('H46').value = iva;
      }

      // Insertar el número de factura
      hojaFactura.getCell('H14').value = `${idFactura}/${String(new Date().getFullYear()).slice(-2)}`;

      // Insertar el total con IVA
      const totalConIva = parseFloat(albaran.cuota) + iva;
      hojaFactura.getCell('H48').value = totalConIva;
      
      
      
        // Mantener el formato original
      hojaFactura.eachRow({ includeEmpty: true }, (row) => {
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.style = cell.style; // Mantener estilo de celda
        });
      });

      // Crear el directorio de salida si no existe
      const outputDirectory = path.join(__dirname, `../facturas/${year}/${albaran.mes}`);
      await fs.ensureDir(outputDirectory);
      const outputPath = path.join(outputDirectory, `factura_${client.nombre}_${client.id_cliente}.xlsx`);
  
      // Guardar el archivo generado
      await workbook.xlsx.writeFile(outputPath);
  
      console.log(`Factura generated and saved at: ${outputPath}`);

      return idFactura;

    } catch (error) {
      console.error('Error generating factura document:', error);
      throw new Error('Failed to generate factura document');
    }
}

// Fetch facturas for a specific search from the database
exports.getFacturasByClientId = async (clientId) => {
  const query = `SELECT * FROM facturas WHERE id_cliente = $1`;
  const result = await pool.query(query, [ clientId ]);
  return result.rows;
}

// Update factura
exports.updateFactura = async (facturaData) => {
  const {
    id_factura,
    id_cliente,
    id_albaran,
    fecha,
    cantidades,
    precios
  } = facturaData;

  const query = `
    UPDATE facturas
    SET 
      id_cliente = $1,
      id_albaran = $2,
      fecha = $3,
      cuota = $4
    WHERE id_factura = $5
    RETURNING *;
  `;

  const calcularTotalCuota = (cantidades, precios) => {
    const cantidadArray = cantidades.map(Number); // Ensure all quantities are numbers
    const precioArray = precios.map(Number); // Ensure all prices are numbers
    return cantidadArray.reduce((total, cantidad, i) => total + cantidad * precioArray[i], 0);
  };

  const values = [
    id_cliente,
    id_albaran,
    fecha,
    calcularTotalCuota(cantidades, precios),
    id_factura,
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Return the inserted contrato ID
  } catch (error) {
      throw new Error('Fallo al actualizar el contrato');
  }

};