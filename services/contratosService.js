const pool = require('../config/db');

exports.saveContrato = async (contratoData) => {
  const {
    id_cliente,
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
    id_cliente,
    productosServicios,              
    cantidades,                     
    precios,
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

// Fetch contratos for a specific client id search from the database
exports.getContratosByClientId = async (clientId) => {
  const query = `SELECT * FROM contratos WHERE id_cliente = $1`;
  const result = await pool.query(query, [clientId]);
  return result.rows;
};

exports.updateContrato = async (contratoData) => {
  const {
    id_contrato,
    id_cliente,
    productos_servicios,
    cantidades,
    precios,
    tipo,                                         
    mes,                                     
    año, 
    fecha_fin, 
    estado, 
    notas_adicionales,
    fecha_inicio
  } = contratoData;

  // Calculate cuota as the sum of the product of quantities and prices
  const cuota = cantidades.reduce((total, cantidad, index) => total + (cantidad * precios[index]), 0);

  const query = `
    UPDATE contratos
    SET 
      id_cliente = $1,
      productos_servicios = $2,
      cantidades = $3,
      precios = $4,
      cuota = $5,
      tipo = $6,
      mes = $7,
      año = $8,
      fecha_fin = $9,
      estado = $10,
      notas_adicionales = $11,
      fecha_inicio = $12
    WHERE id_contrato = $13
    RETURNING *;
  `;

  const values = [
    id_cliente,
    productos_servicios,              
    cantidades,                      
    precios,
    cuota,                                           
    tipo,                                         
    mes,                                     
    año,                                            
    fecha_fin, 
    estado, 
    notas_adicionales,
    fecha_inicio,
    id_contrato,           
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Return the inserted contrato ID
  } catch (error) {
      throw new Error('Fallo al actualizar el contrato');
  }

};