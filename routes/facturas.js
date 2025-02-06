const express = require('express');
const facturasController = require('../controllers/facturasController');
const router = express.Router();

// Ruta que genera las facturas de un mes esecificado
router.get('/generate-facturas', facturasController.generateFacturas);

// Ruta que devuelve las facturas de un cliente
router.get('/get-facturas', facturasController.getFacturas);


module.exports = router;