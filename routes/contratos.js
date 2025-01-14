const express = require('express');
const contratosController = require('../controllers/contratosController');
const router = express.Router();

// Route to handle contract form submission
router.post('/', contratosController.submitContractForm);

module.exports = router;