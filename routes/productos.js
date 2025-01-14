const express = require('express');
const productosServiciosController = require('../controllers/productosServiciosController');
const router = express.Router();

router.get('/concepto-by-descripcion-corta', productosServiciosController.getConceptoByDescCorta);

module.exports = router;
