// controllers/serviciosModel.js
const Servicio = require('../models/serviciosModel'); // tu modelo

// Listar todos los servicios
exports.listar = async (req, res) => {
  try {
    const servicios = await Servicio.getServicios();
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener servicios' });
  }
};