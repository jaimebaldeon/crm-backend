const tipoEstablecimientoService = require('../services/tipoEstablecimientoService');

exports.getTipoEstablecimiento = async (req, res) => {
  try {
    const data = await tipoEstablecimientoService.getTipoEstablecimiento();
    res.json(data);
  } catch (err) {
    console.error('Error fetching tipo_establecimiento:', err);
    res.status(500).send('Server Error');
  }
};
