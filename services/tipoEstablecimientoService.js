const pool = require('../config/db');

exports.getTipoEstablecimiento = async () => {
  const result = await pool.query('SELECT DISTINCT general FROM mapping_categoria');
  return result.rows;
};
