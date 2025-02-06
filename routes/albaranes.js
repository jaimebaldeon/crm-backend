const express = require('express');
const getAlbaranesController = require('../controllers/getAlbaranesController');
const router = express.Router();

// Ruta que genera las facturas de un mes esecificado
router.get('/get-albaran', getAlbaranesController.getAlbaran);


module.exports = router;