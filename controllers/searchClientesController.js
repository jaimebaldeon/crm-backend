const { searchClientes } = require('../services/clientesService');

exports.searchClientes = async (req, res) => {
  try {
    const data = await searchClientes(req.query.searchData);
    res.json(data);
  } catch (err) {
    console.error('Error fetching albaranes:', err);
    res.status(500).send('Server Error');
  }
};