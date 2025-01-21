const express = require('express');
const contratosController = require('../controllers/contratosController');
const router = express.Router();

// Route to handle contract form submission
router.post('/', contratosController.submitContractForm);

// Ruta que devuelve los contratos de un cliente
router.get('/contratos-cliente', contratosController.getContratos);

module.exports = router;