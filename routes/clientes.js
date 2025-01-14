const express = require('express');
const clientesController = require('../controllers/clientesController');
const router = express.Router();

// Route to handle client form submission
router.post('/', clientesController.submitClientForm);

module.exports = router;