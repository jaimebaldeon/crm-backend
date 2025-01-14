// routes/productosServicios.js
const express = require('express');
const productosServiciosController = require('../controllers/productosServiciosController');
const pool = require('../config/db');
const router = express.Router();

// Route to fetch dashboard data (client count, upcoming maintenance)
router.get('/', productosServiciosController.getProductosMantenibles);

module.exports = router;
