// controllers/consultasController.js
const consultasModel = require('../models/consultasModel');

// Listar todas las consultas
exports.listar = async (req, res) => {
  try {
    const consultas = await consultasModel.getConsultas();
    res.json(consultas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener consultas' });
  }
};

// Crear una nueva consulta
exports.crear = async (req, res) => {
  try {
    const nuevaConsulta = await consultasModel.crearConsulta(req.body);
    res.status(201).json(nuevaConsulta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear consulta' });
  }
};