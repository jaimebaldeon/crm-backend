const tipoExtintorService = require('../services/tipoExtintorService');

exports.getTipoExtintor = async (req, res) => {
  try {
    const data = await tipoExtintorService.getTipoExtintor();
    res.json(data);
  } catch (err) {
    console.error('Error fetching tipo_extintor:', err);
    res.status(500).send('Server Error');
  }
};
