const pool = require('../config/db');
const fs = require('fs-extra');
const path = require('path');
const ExcelJS = require('exceljs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { getDate } = require('../utils/documentHelpers');
const { getProvinciaProveedor } = require('../services/extintoresService');

exports.saveCertificado = async (albaran) => {
  const query = `
    INSERT INTO certificados (id_cliente, id_albaran, fecha)
    VALUES ($1, $2, $3)
    RETURNING id_certificado;
  `;

  // Valores a insertar en la consulta
  const values = [
    albaran.id_cliente,          // ID Cliente proveniente del albarán
    albaran.id_albaran,          // ID Albarán
    new Date().toISOString().split('T')[0], // Fecha en formato 'YYYY-MM-DD'
  ];

  try {
    // Ejecutar la consulta
    const result = await pool.query(query, values);

    // Retornar el ID de la certificado insertada
    return result.rows[0].id_certificado;
  } catch (error) {
    // Verificar si el error es por clave duplicada (Código de error 23505)
    if (error.code === '23505' && error.constraint === 'certificados_id_albaran_unique') {
      console.error('Clave duplicada al insertar certificado:', error.detail);
      throw new Error(`Certificado ya existente para el albarán con ID ${albaran.id_albaran}`);
    }

    // Para cualquier otro error, mostrar un mensaje genérico
    console.error('Error inserting certificado:', error);
    throw new Error('No se pudo insertar la certificado');
  }
};



// Generate an albaran document and save it to a directory
exports.generateCertificadoDocumentExcel = async (albaran, extintores, otrosActivos, client, idCertificado) => {
    try {
      // Load the XLSX template file
      const templatePath = path.join(__dirname, '../templates/plantilla_certificado.xlsx');
  
      // Cargar el archivo Excel
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(templatePath);
      const hojaCertificado = workbook.getWorksheet(1); // Seleccionar la primera hoja
  
      // Get additional data for the template
      const [day, month, year] = getDate();

      // Fila inicial donde comenzarán a escribirse los extintores en el Excel
      let filaInicial = 3;

      let contadorRetimbrados = 0;
      let ultimaFila = filaInicial;

      // Insertar datos extintores en Excel
      for (let index = 0; index < extintores.length; index++) {
        const extintor = extintores[index];
        const fila = filaInicial + index;
        ultimaFila = fila;
      
        const provincia = await getProvinciaProveedor(extintor.marca_modelo);
      
        hojaCertificado.getCell(`A${fila}`).value = index + 1;
        hojaCertificado.getCell(`B${fila}`).value = extintor.marca_modelo || '';
        // hojaCertificado.getCell(`C${fila}`).value = provincia || '';
        hojaCertificado.getCell(`C${fila}`).value = extintor.n_identificador || '';
        hojaCertificado.getCell(`D${fila}`).value = extintor.tipo || '';
        hojaCertificado.getCell(`E${fila}`).value = extintor.eficacia || '';
        hojaCertificado.getCell(`F${fila}`).value = extintor.fecha_fabricacion || '';
        hojaCertificado.getCell(`G${fila}`).value = extintor.fecha_retimbrado || '';

        if (extintor.fecha_retimbrado && Number(extintor.fecha_retimbrado) === year) {
          contadorRetimbrados++;
        }
      }

      // Insertar extintores retimbrados
      if (contadorRetimbrados > 0) {
        ultimaFila = ultimaFila + 2; 
        hojaCertificado.getCell(`B${ultimaFila}`).value = `Se ha realizado la prueba de presión quinquenal a ${contadorRetimbrados} extintor(es) portátil(es).`;
        hojaCertificado.getCell(`B${ultimaFila}`).alignment = { horizontal: 'left' };
      }

      // Insertar Otros Activos
      otrosActivos.forEach((activo, index) => {

        // Insertar Alumbrado Emergencia
        if (activo.nombre && activo.nombre === 'ALUMBRADOS DE EMERGENCIA' ) {
          ultimaFila = ultimaFila + 2; 

          // Titulo
          hojaCertificado.getCell(`B${ultimaFila}`).value = 'ALUMBRADO DE EMERGENCIA';
          hojaCertificado.getCell(`B${ultimaFila}`).font = {
            bold: true,
            underline: true
          };
          hojaCertificado.getCell(`B${ultimaFila}`).alignment = { horizontal: 'left' };

          const mensaje = [
            'Se ha realizado la revisión general de los alumbrados de emergencia en',
            'lo relativo a su nivel de autonomía mínimo, para asegurar el buen estado',
            'de funcionamiento según la norma UNE.EN 50172.'
          ];

          mensaje.forEach((linea, i) => {
            const fila = ultimaFila + 1 + i; // Desplazar las líneas debajo del título
            hojaCertificado.getCell(`B${fila}`).value = linea;
            hojaCertificado.getCell(`B${fila}`).font = { bold: false, underline: false };
            hojaCertificado.getCell(`B${fila}`).alignment = { horizontal: 'left' };
          });

          ultimaFila += mensaje.length; // Actualizar la fila final
        } 

        // Insertar BIES
        if ( activo.nombre && activo.nombre.includes('BOCAS DE INCENDIO') ) {
          ultimaFila = ultimaFila + 2; 

          // Titulo
          hojaCertificado.getCell(`B${ultimaFila}`).value = 'BOCAS DE INCENDIO EQUIPADAS';
          hojaCertificado.getCell(`B${ultimaFila}`).font = {
            bold: true,
            underline: true
          };
          hojaCertificado.getCell(`B${ultimaFila}`).alignment = { horizontal: 'left' };

          const mensaje = [
            'Se han realizado las operaciones de mantenimiento y verificaciones',
            `correspondientes de las BIES de ${activo.nombre.slice(-4)} (bocas de incendio equipadas).`,
            'No existen anomalías o deficiencias que impidan su correcto funcionamiento.'
          ];

          mensaje.forEach((linea, i) => {
            const fila = ultimaFila + 1 + i; // Desplazar las líneas debajo del título
            hojaCertificado.getCell(`B${fila}`).value = linea;
            hojaCertificado.getCell(`B${fila}`).font = { bold: false, underline: false };
            hojaCertificado.getCell(`B${fila}`).alignment = { horizontal: 'left' };
          });

          ultimaFila += mensaje.length; // Actualizar la fila final

        }

        // Insertar datos Central PCI
        if ( activo.nombre && activo.nombre.includes('CENTRAL DETECCION DE INCENDIOS') ) {
          ultimaFila = ultimaFila + 2; 

          // Titulo
          hojaCertificado.getCell(`B${ultimaFila}`).value = 'SISTEMA DE DETECCION ALARMA DE INCENDIOS';
          hojaCertificado.getCell(`B${ultimaFila}`).font = {
            bold: true,
            underline: true
          };
          hojaCertificado.getCell(`B${ultimaFila}`).alignment = { horizontal: 'left' };

          const mensaje = [
            'Revisión de sistemas  detección de alarmas incendios compuesta de:',
            '- Central de Incendios Convencional',
            '- Detectores  ópticos de humos',
            '- Pulsadores de alarma',
            '- Sirena  acústica',
            '- Fuente  alimentación  batería  2  amperios 12 voltios carga correcta',
            '   24 voltios',
            '- El funcionamiento de todos los equipos que componen este sistema',
            '   están en perfecto estado de servicio'
          ];

          mensaje.forEach((linea, i) => {
            const fila = ultimaFila + 1 + i; // Desplazar las líneas debajo del título
            hojaCertificado.getCell(`B${fila}`).value = linea;
            hojaCertificado.getCell(`B${fila}`).font = { bold: false, underline: false };
            hojaCertificado.getCell(`B${fila}`).alignment = { horizontal: 'left' };
          });

          ultimaFila += mensaje.length; // Actualizar la fila final

        }

      });

      // Crear el directorio de salida si no existe
      const outputDirectory = path.join(__dirname, `../../certificados/${year}/${albaran.mes}`);
      await fs.ensureDir(outputDirectory);
      const outputPath = path.join(outputDirectory, `certificado_${client.nombre}_${client.id_cliente}.xlsx`);
  
      // Guardar el archivo generado
      await workbook.xlsx.writeFile(outputPath);
  
      console.log(`Certificado generated and saved at: ${outputPath}`);

      return idCertificado;

    } catch (error) {
      console.error('Error generating certificado excel document:', error);
      throw new Error('Failed to generate certificado excel document');
    }
}

exports.generateCertificadoDocumentWord = async (albaran, extintores, otrosActivos, client, idCertificado) => {
  try {
    // Load the Word template file
    const templatePath = path.join(__dirname, '../templates/plantilla_certificado.docx');
    const content = fs.readFileSync(templatePath, 'binary');
  
    // Inicializar PizZip y Docxtemplater
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Obtener fecha actual
    const [day, month, year] = getDate();

    // Datos a reemplazar en la plantilla
    doc.setData({
      MMYYYYMMYYYY: `${month.toUpperCase()} ${year} ${month.toUpperCase()} ${year + 1}`,               
      N: client.nombre,       
      D1: client.direccion,         
      D2: `${client.cp} - ${client.ciudad}`,
    });

    // Renderizar el documento
    doc.render();
  
    // Crear el directorio de salida si no existe
    const outputDirectory = path.join(__dirname, `../../certificados/${year}/${albaran.mes}`);
    await fs.ensureDir(outputDirectory);
    const outputPath = path.join(outputDirectory, `certificado_${client.nombre}_${client.id_cliente}.docx`);

    // Guardar el archivo generado
    const buffer = doc.getZip().generate({ type: 'nodebuffer' });
    fs.writeFileSync(outputPath, buffer);

    console.log(`Certificado generated and saved at: ${outputPath}`);
    return outputPath;


  } catch (error) {
    console.error('Error generating certificado word document:', error);
    throw new Error('Failed to generate certificado word document');
  }
}

// Fetch certificados for a specific search from the database
exports.getCertificadosByClientId = async (clientId) => {
  const query = `SELECT * FROM certificados WHERE id_cliente = $1`;
  const result = await pool.query(query, [ clientId ]);
  return result.rows;
}

// Update certificado
exports.updateCertificado = async (certificadoData) => {
  const {
    id_certificado,
    id_cliente,
    id_albaran,
    fecha,
    cantidades,
    precios
  } = certificadoData;

  const query = `
    UPDATE certificados
    SET 
      id_cliente = $1,
      id_albaran = $2,
      fecha = $3,
      cuota = $4
    WHERE id_certificado = $5
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
    id_certificado,
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Return the inserted contrato ID
  } catch (error) {
      throw new Error('Fallo al actualizar el contrato');
  }

};