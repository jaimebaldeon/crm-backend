const pool = require('../config/db');

exports.getMarcaExtintor = async () => {
  const result = await pool.query(  `SELECT marca FROM ref_provedores_extintores
                                    ORDER BY marca ASC`);
  return result.rows;
};
