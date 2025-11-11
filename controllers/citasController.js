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

// Listar citas por usuario
exports.listarPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    // Validar que el id sea numérico
    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({ mensaje: 'ID de usuario inválido' });
    }

    // Llamar al método del modelo
    const citas = await Cita.getCitasPorUsuario(id_usuario);

    // Si no encuentra citas
    if (!citas || citas.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron citas para este usuario' });
    }

    res.json(citas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener citas del usuario' });
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
