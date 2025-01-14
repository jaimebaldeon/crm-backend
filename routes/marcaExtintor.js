const express = require('express');
const marcaExtintorController = require('../controllers/marcaExtintorController');
const router = express.Router();

// Route to fetch tipo extintor data
router.get('/', marcaExtintorController.getMarcaExtintor);

module.exports = router;
