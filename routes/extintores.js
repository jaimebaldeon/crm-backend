const express = require('express');
const extintoresController = require('../controllers/extintoresController');
const router = express.Router();

// Route to fetch tipo extintor data
router.post('/', extintoresController.submitExtintoresForm);

// Ruta que devuelve los extintores caducados de un cliente/contrato
router.get('/caducados', extintoresController.getExtintoresCaducados);

// Ruta que actualiza los extintores caducados de un cliente/contrato
router.post('/update-caducados', extintoresController.updateExtintoresCaducados);

// Ruta que actualiza los extintores retimbrados de un cliente/contrato
router.post('/update-retimbrados', extintoresController.updateExtintoresRetimbrados);

module.exports = router;
