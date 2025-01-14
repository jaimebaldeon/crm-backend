const express = require('express');
const router = express.Router();
const deleteAlbaranController = require('../controllers/deleteAlbaranController');

// Route to generate albaranes
router.post('/', deleteAlbaranController.deleteAlbaran);

module.exports = router;

