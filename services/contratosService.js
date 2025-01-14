const pool = require('../config/db');

exports.saveContrato = async (contratoData) => {
  const {
    clientId,
    products,
    hasExtintores,
    tipo,
  } = contratoData;

  // Transform the products array into the required format
  const productosServicios = products.map(p => p.productoServicio); // Array of product names
  const cantidades = products.map(p => Number(p.cantidad));         // Array of quantities as numbers
  const precios = products.map(p => Number(p.precio));              // Array of prices as numbers

  // Calculate cuota as the sum of the product of quantities and prices
  const cuota = cantidades.reduce((total, cantidad, index) => total + (cantidad * precios[index]), 0);

  // Get current month and year
  const currentDate = new Date();
  const mes = currentDate.toLocaleString('default', { month: 'long' }).toUpperCase(); 
  const ano = currentDate.getFullYear();

  // Get current date in yyyy-mm-dd format
  const fecha_inicio = currentDate.toISOString().split('T')[0]; // Formats the date as 'yyyy-mm-dd'

  const query = `
  INSERT INTO contratos (id_cliente, productos_servicios, cantidades, precios, cuota, tipo, mes, año, fecha_fin, estado, notas_adicionales, fecha_inicio)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id_contrato;
  `;

  const values = [
    clientId,
    JSON.stringify(productosServicios),              // Stringify the array of product names
    JSON.stringify(cantidades),                      // Stringify the array of quantities
    JSON.stringify(precios),
    cuota,                                           
    tipo,                                         
    mes,                                     
    ano,                                            
    null,                                            
    'Activo',                                        
    null,       // Example additional notes
    fecha_inicio           
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Return the inserted contrato ID
  } catch (error) {
    if (error.code === '23505') { // Check for duplicate entry error
      throw new Error('Contrato ya existe en la base de datos');
    } else {
      throw new Error('Fallo al guardar el contrato');
    }
  }

};