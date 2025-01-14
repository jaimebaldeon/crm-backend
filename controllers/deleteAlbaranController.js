const albaranesService = require('../services/albaranesService');

exports.deleteAlbaran = async (req, res) => {
    try {
      const idAlbaran = req.body.idAlbaran; // Retrieve the form data from request body
      const data = await albaranesService.deleteAlbaranByIdAlbaran(idAlbaran); 

      if (data.length === 0) {
        // No rows were deleted
        return res.status(404).json({ message: 'No se encontró el albarán para eliminar.' });
      }

      // Rows were deleted
      res.status(201).json({ message: 'Albaran eliminado con exito', albaranActualizado: data });
    } catch (error) {
        console.error('Error eliminando albaran:', error);
        res.status(500).json({ message: 'Fallo eliminando albaran' });
    }
};