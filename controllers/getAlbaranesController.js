const { getAlbaranesByClientId, getAlbaran } = require('../services/albaranesService');

exports.getAlbaranes = async (req, res) => {
  try {
    let estado = 'PENDIENTE'
    if (req.query.estado==='true') {
      estado = 'ACEPTADO'
    };
    const data = await getAlbaranesByClientId(req.query.clientId, estado);
    res.json(data);
  } catch (err) {
    console.error('Error fetching albaranes:', err);
    res.status(500).send('Server Error');
  }
};

exports.getAlbaran = async (req, res) => {
  try {
    const data = await getAlbaran(req.query.albaranId);
    res.json(data);
  } catch (err) {
    console.error('Error fetching albaran:', err);
    res.status(500).send('Server Error');
  }
};