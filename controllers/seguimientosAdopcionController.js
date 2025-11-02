// controllers/seguimientosAdopcionController.js
const SeguimientoAdopcion = require('../models/seguimientoAdopcionModel');

// Listar todos los seguimientos de adopción
exports.listar = async (req, res) => {
  try {
    const seguimientosAdopcion = await SeguimientoAdopcion.getSeguimientos();
    res.json(seguimientosAdopcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener adopciones' });
  }
};
