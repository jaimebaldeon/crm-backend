const dashboardService = require('../services/dashboardService');

exports.getDashboardData = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData();
    res.json(data);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).send('Server Error');
  }
};
