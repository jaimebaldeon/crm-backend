const pool = require('../config/db');

exports.getDashboardData = async () => {
  const clientCount = await pool.query('SELECT COUNT(*) FROM clientes');
  const upcomingMaintenance = await pool.query(`
    SELECT * FROM contratos WHERE mes = 'OCTUBRE' LIMIT 5
  `);
  
  return {
    clientCount: clientCount.rows[0].count,
    upcomingMaintenance: upcomingMaintenance.rows
  };
};
