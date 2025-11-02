// controllers/mascotasController.js
const Mascota = require('../models/mascotasModel'); // tu modelo

// Listar todas las mascotas
exports.listar = async (req, res) => {
  try {
    const mascotas = await Mascota.getMascotas();
    res.json(mascotas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener mascotas' });
  }
};

// Crear una nueva mascota
exports.crear = async (req, res) => {
  try {
    const nuevaMascota = await Mascota.crearMascota(req.body);
    res.status(201).json(nuevaMascota);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear mascota' });
  }
};

// Contar mascotas disponibles
exports.contarDisponibles = async (req, res) => {
  try {
    const conteoDisponibles = await Mascota.countMascotasDisponibles(req.body);
    res.status(201).json(conteoDisponibles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al contar mascotas disponibles' });
  }
};