const express = require('express');
const router = express.Router();
const generateAlbaranesController = require('../controllers/generateAlbaranesController');

// Route to generate albaranes
router.get('/', generateAlbaranesController.generateAlbaranes);

module.exports = router;

