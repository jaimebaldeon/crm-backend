const express = require('express');
const router = express.Router();
const searchClientesController = require('../controllers/searchClientesController');

// Route to generate albaranes
router.get('/', searchClientesController.searchClientes);

module.exports = router;

