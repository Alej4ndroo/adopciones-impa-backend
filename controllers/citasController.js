// controllers/citasController.js
const Cita = require('../models/citasModel');

// Listar todas las citas
exports.listar = async (req, res) => {
  try {
    const citas = await Cita.getCitas();
    res.json(citas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener citas' });
  }
};

// Crear una nueva cita
exports.crear = async (req, res) => {
  try {
    const nuevaCita = await Cita.crearCita(req.body);
    res.status(201).json(nuevaCita);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear cita' });
  }
};

// Contar citas de hoy
exports.contarCitasHoy = async (req, res) => {
  try {
    const conteoCitas = await Cita.countCitasHoy(req.body);
    res.status(201).json(conteoCitas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al contar mascotas disponibles' });
  }
};
