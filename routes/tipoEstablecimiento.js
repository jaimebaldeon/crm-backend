// routes/tipoEstablecimiento.js
const express = require('express');
const tipoEstablecimientoController = require('../controllers/tipoEstablecimientoController');
const pool = require('../config/db');
const router = express.Router();

// Route to fetch dashboard data (client count, upcoming maintenance)
router.get('/', tipoEstablecimientoController.getTipoEstablecimiento);

// router.get('/', async (req, res) => {
//   try {
//     // Query the database for tipo_establecimiento data
//     const result = await pool.query('SELECT DISTINCT general FROM mapping_categoria');

    
//     res.json(result.rows);
//   } catch (error) {
//     console.error('Error fetching tipo_establecimiento:', error);
//     res.status(500).send('Server Error');
//   }
// });

module.exports = router;
