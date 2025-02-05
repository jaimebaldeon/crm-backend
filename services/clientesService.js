const pool = require('../config/db');

exports.saveClient = async (clientData) => {
  const {
    nombreCliente,
    calle,
    numero,
    cif,
    cp,
    ciudad,
    provincia,
    actividad,
    tipoEstablecimiento,
    telefono,
    iban,
    horario,
    direccionFacturacion,
    notasAdicionales,
  } = clientData;

  const query = `
  INSERT INTO clientes (Nombre, CIF, Direccion, CP, Ciudad, Provincia, Actividad, Horario, IBAN, Telefono, Direccion_Facturacion, Categoria_Establecimiento)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id_cliente;
  `;

  const values = [
    nombreCliente,
    cif,
    calle + ' ' + numero,
    cp,
    ciudad,
    provincia,
    actividad,
    horario,
    iban,
    telefono,
    direccionFacturacion,
    tipoEstablecimiento,
    // notasAdicionales
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Return the inserted client ID
  } catch (error) {
    if (error.code === '23505') { // Check for duplicate entry error
      throw new Error('Cliente ya existe en la base de datos');
    } else {
      throw new Error('Fallo al guardar el cliente');
    }
  }

};


exports.updateCliente = async (clientData) => {
  const {
    id_cliente,
    nombre,
    cif,
    direccion,
    cp,
    ciudad,
    provincia,
    actividad,
    horario,
    iban,
    telefono,
    direccion_facturacion,
    categoria_establecimiento,
    notasAdicionales,
  } = clientData;


  const query = `
    UPDATE clientes
    SET 
      nombre = $1,
      cif = $2,
      direccion = $3,
      cp = $4,
      ciudad = $5,
      provincia = $6,
      actividad = $7,
      horario = $8,
      iban = $9,
      telefono = $10,
      direccion_facturacion = $11,
      categoria_establecimiento = $12
    WHERE id_cliente = $13
    RETURNING *;
  `;

  const values = [
    nombre,
    cif,
    direccion,
    cp,
    ciudad,
    provincia,
    actividad,
    horario,
    iban,
    telefono,
    direccion_facturacion,
    categoria_establecimiento,   
    id_cliente,
  ];
  
  try {
    const result = await pool.query(query, values);
    return result.rows[0]; // Return the inserted contrato ID
  } catch (error) {
      throw new Error('Fallo al actualizar el contrato');
  }

};


exports.searchClientes = async (searchData) => {
  const { nombreCliente, direccion, cif, idCliente } = searchData;

  // Initialize query and values
  let query = `SELECT * FROM clientes WHERE 1=1`; // Use `1=1` to simplify conditional appending
  const values = [];

  // Dynamically add conditions based on provided search criteria
  if (nombreCliente) {
    query += ` AND UPPER(nombre) ILIKE $${values.length + 1}`; // Case-insensitive match
    values.push(`%${nombreCliente}%`);
  }

  if (direccion) {
    query += ` AND UPPER(direccion) ILIKE $${values.length + 1}`; // Case-insensitive match
    values.push(`%${direccion}%`);
  }

  if (cif) {
    query += ` AND UPPER(cif) ILIKE $${values.length + 1}`; // Case-insensitive match
    values.push(`%${cif}%`);
  }

  if (idCliente) {
    query += ` AND id_cliente = $${values.length + 1}`; // Exact match for numeric ID
    values.push(idCliente);
  }

  try {
    const result = await pool.query(query, values);
    return result.rows; // Return the matching rows
  } catch (error) {
    console.error('Error searching for client:', error);
    throw error; // Rethrow error for further handling
  }
};