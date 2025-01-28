const express = require('express');
const extintoresController = require('../controllers/extintoresController');
const router = express.Router();

// Ruta que guarda nuevos activos de un cliente/contrato
router.post('/', extintoresController.saveActivos);

// Ruta que devuelve los extintores caducados de un cliente/contrato
router.get('/caducados', extintoresController.getExtintoresCaducados);

// Ruta que actualiza los extintores caducados de un cliente/contrato
router.post('/update-caducados', extintoresController.updateExtintoresCaducados);

// Ruta que actualiza los extintores retimbrados de un cliente/contrato
router.post('/update-retimbrados', extintoresController.updateExtintoresRetimbrados);

// Ruta que devuelve los extintores de un cliente/contrato
router.get('/extintores', extintoresController.getExtintores);

// Ruta que actualiza los extintores caducados de un cliente/contrato
router.post('/update', extintoresController.updateActivos);

module.exports = router;
