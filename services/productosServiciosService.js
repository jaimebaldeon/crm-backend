const pool = require('../config/db');

exports.getProductosMantenibles = async () => {
  const result = await pool.query(`
    SELECT concepto FROM ref_productos
    WHERE mantenible IS NOT NULL
    ORDER BY concepto ASC`);
  return result.rows;
};

exports.getProductosNoMantenibles = async () => {
  const result = await pool.query(`
    SELECT * FROM ref_productos
    WHERE mantenible IS NULL
    ORDER BY concepto ASC`);
  return result.rows;
};

exports.getServiciosNoRecurrentes = async () => {
  const result = await pool.query(`
    SELECT * FROM ref_servicios
    WHERE recurrente = 'NO'
    ORDER BY concepto ASC`);
  return result.rows;
};

exports.getConceptoByDescCorta = async (descripcionesCortas) => {
  if (!descripcionesCortas || descripcionesCortas.length === 0) {
    throw new Error('The descripcionesCortas list cannot be empty.');
  }

  const query = `
    SELECT concepto 
    FROM ref_productos
    WHERE descripcion_corta = ANY ($1::text[])
    ORDER BY concepto ASC
  `;

  const result = await pool.query(query, [descripcionesCortas]);
  return result.rows;
};