const albaranesService = require('../services/albaranesService');

exports.updateAlbaran = async (req, res) => {
    try {
      const albaranData = req.body.albaranData; // Retrieve the form data from request body
      const data = await albaranesService.updateAlbaran(albaranData); // Pass the data to the service
      res.status(201).json({ message: 'Albaran actualizado con exito', albaranActualizado: data });
    } catch (error) {
        console.error('Error actualizando albaran:', error);
        res.status(500).json({ message: 'Fallo actualizando albaran' });
    }
};