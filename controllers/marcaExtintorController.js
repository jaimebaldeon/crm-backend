const marcaExtintorService = require('../services/marcaExtintorService');

exports.getMarcaExtintor = async (req, res) => {
  try {
    const data = await marcaExtintorService.getMarcaExtintor();
    res.json(data);
  } catch (err) {
    console.error('Error fetching marca_extintor:', err);
    res.status(500).send('Server Error');
  }
};
