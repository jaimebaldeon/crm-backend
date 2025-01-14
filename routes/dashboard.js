// routes/dashboard.js
const express = require('express');
const pool = require('../config/db');
const dashboardController = require('../controllers/dashboardController');
const router = express.Router();

// Route to fetch dashboard data (client count, upcoming maintenance)
router.get('/', dashboardController.getDashboardData);

module.exports = router;
