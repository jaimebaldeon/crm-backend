const clientesService = require('../services/clientesService');

exports.submitClientForm = async (req, res) => {
    try {
      const clientData = req.body; // Retrieve the form data from request body
      const result = await clientesService.saveClient(clientData); // Pass the data to the service
      res.status(201).json({ message: 'Client form submitted successfully', clientId: result.id_cliente });
    } catch (error) {
      if (error.message === 'Cliente ya existe en la base de datos') {
        res.status(400).json({ message: 'Cliente ya existe en la base de datos' });
      } else {
        console.error('Error submitting client form:', error);
        res.status(500).json({ message: 'Fallo al enviar formulario del cliente' });
      }
    }
  };