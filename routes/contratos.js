const express = require('express');
const contratosController = require('../controllers/contratosController');
const router = express.Router();

// Route to handle contract form submission
router.post('/', contratosController.submitContractForm);

// Ruta que devuelve los contratos de un cliente
router.get('/contratos-cliente', contratosController.getContratos);

// Ruta que actualiza el contrato de un cliente
router.post('/update-contrato', contratosController.updateContrato);

module.exports = router;