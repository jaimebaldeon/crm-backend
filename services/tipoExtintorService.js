const pool = require('../config/db');

exports.getTipoExtintor = async () => {
  const result = await pool.query(  `SELECT concepto FROM ref_productos
                                    WHERE categoria = 'EXTINTORES' AND concepto LIKE 'EXTINTOR%'
                                    ORDER BY concepto DESC`);
  return result.rows;
};
