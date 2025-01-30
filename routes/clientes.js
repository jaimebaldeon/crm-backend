const express = require('express');
const clientesController = require('../controllers/clientesController');
const router = express.Router();

// Route to handle client form submission
router.post('/', clientesController.submitClientForm);

// Route to handle client update
router.post('/update-cliente', clientesController.updateCliente);


module.exports = router;