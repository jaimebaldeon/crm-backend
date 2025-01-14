const express = require('express');
const router = express.Router();
const getAlbaranesController = require('../controllers/getAlbaranesController');

// Route to generate albaranes
router.get('/', getAlbaranesController.getAlbaranes);

module.exports = router;

