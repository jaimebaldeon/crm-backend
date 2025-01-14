// routes/productosServicios.js
const express = require('express');
const productosServiciosController = require('../controllers/productosServiciosController');
const router = express.Router();

// Route to fetch dashboard data (client count, upcoming maintenance)
router.get('/', productosServiciosController.getProductosServiciosNoMantenibles);

module.exports = router;
