const express = require('express');
const facturasController = require('../controllers/facturasController');
const router = express.Router();

// Ruta que genera las facturas de un mes esecificado
router.get('/generate-facturas', facturasController.generateFacturas);

// Ruta que devuelve las facturas de un cliente
router.get('/get-facturas', facturasController.getFacturas);

// Ruta que actualiza la factura de un cliente
router.post('/update-factura', facturasController.updateFactura);

module.exports = router;