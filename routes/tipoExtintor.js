const express = require('express');
const tipoExtintorController = require('../controllers/tipoExtintorController');
const pool = require('../config/db.js');
const router = express.Router();

// Route to fetch tipo extintor data
router.get('/', tipoExtintorController.getTipoExtintor);

module.exports = router;
