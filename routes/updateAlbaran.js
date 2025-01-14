const express = require('express');
const router = express.Router();
const updateAlbaranController = require('../controllers/updateAlbaranController');

// Route to generate albaranes
router.post('/', updateAlbaranController.updateAlbaran);

module.exports = router;

