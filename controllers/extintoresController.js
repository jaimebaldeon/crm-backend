const extintoresService = require('../services/extintoresService');

exports.saveActivos = async (req, res) => {
    try {
      const activosData = req.body.activosData; // Retrieve the form data from request body
      const contratoId = req.body.contratoId; // Retrieve the form data from request body
      const result = await extintoresService.saveActivos(activosData, contratoId); // Pass the data to the service
      res.status(201).json({ message: 'Contract form submitted successfully', extintoresId: result });
    } catch (error) {
      if (error.message === 'Extintores ya existe en la base de datos') {
        res.status(400).json({ message: 'Extintores ya existe en la base de datos' });
      } else {
        console.error('Error submitting extintores form:', error);
        res.status(500).json({ message: 'Fallo al enviar formulario del extintores' });
      }
    }
};

exports.getExtintoresNuevos = async (req, res) => {
  try {
    const extintoresData = req.query; // Retrieve the form data from request query
    const data = await extintoresService.getExtintoresNuevos(extintoresData); // Pass the data to the service
    res.status(201).json(data);
  } catch (error) {
    console.error('Error leyendo extintores nuevos:', err);
    res.status(500).json({ message: 'Fallo al leer extintores nuevos' });
  }
};

exports.getExtintoresCaducados = async (req, res) => {
    try {
      const extintoresData = req.query; // Retrieve the form data from request query
      const data = await extintoresService.getExtintoresCaducados(extintoresData); // Pass the data to the service
      res.status(201).json(data);
    } catch (error) {
      console.error('Error leyendo extintores caducados:', err);
      res.status(500).json({ message: 'Fallo al leer extintores caducados' });
    }
};

exports.updateExtintoresCaducados = async (req, res) => {
  try {
    const extintoresData = req.body; // Retrieve the form data from request body
    const data = await extintoresService.updateExtintoresCaducados(extintoresData); // Pass the data to the service
    res.status(201).json({ message: 'Contract form submitted successfully', extintoresCaducados: data });
  } catch (error) {
    console.error('Error actualizando extintores caducados:', err);
    res.status(500).json({ message: 'Fallo actualizando extintores caducados' });
  }
};

exports.updateExtintoresRetimbrados = async (req, res) => {
  try {
    const extintoresData = req.body; // Retrieve the form data from request body
    const data = await extintoresService.updateExtintoresRetimbrados(extintoresData); // Pass the data to the service
    res.status(201).json({ message: 'Retimbrados actualizados con exito', extintoresRetimbrados: data });
  } catch (error) {
    console.error('Error actualizando extintores retimbrados:', err);
    res.status(500).json({ message: 'Fallo actualizando extintores retimbrados' });
  }
};

exports.getExtintores = async (req, res) => {
  try {
    const extintoresData = req.query; // Retrieve the form data from request query
    const data = await extintoresService.getExtintores(extintoresData.contratoId); // Pass the data to the service
    res.status(201).json(data);
  } catch (error) {
    console.error('Error leyendo extintores caducados:', err);
    res.status(500).json({ message: 'Fallo al leer extintores caducados' });
  }
};

exports.updateActivos = async (req, res) => {
  try {
    const activosData = req.body.activosData; 
    const contratoId = req.body.contratoId;
    const data = await extintoresService.updateActivos(activosData, contratoId); 
    res.status(201).json({ message: 'Extintores actualizados correctamente', extintoresActualizados: data });
  } catch (error) {
    console.error('Error actualizando extintores:', error);
    res.status(500).json({ message: 'Fallo actualizando extintores' });
  }
};
