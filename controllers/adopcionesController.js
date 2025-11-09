// controllers/citasController.js
const Adopcion = require('../models/adopcionesModel');

// Listar todas las adopciones
exports.listar = async (req, res) => {
  try {
    const adopciones = await Adopcion.getAdopciones();
    res.json(adopciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener adopciones' });
  }
};

// Listar adopciones por usuario
exports.listarPorUsuario = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    // Validar que el id sea numérico
    if (!id_usuario || isNaN(id_usuario)) {
      return res.status(400).json({ mensaje: 'ID de usuario inválido' });
    }

    // Llamar al método del modelo
    const adopciones = await Adopcion.getAdopcionesPorUsuario(id_usuario);

    // Si no encuentra adopciones
    if (!adopciones || adopciones.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontraron adopciones para este usuario' });
    }

    res.json(adopciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener adopciones del usuario' });
  }
};

// Listar todas las adopciones
exports.contar = async (req, res) => {
  try {
    const conteoAdopciones = await Adopcion.countAdopcionesAprobadas();
    res.json(conteoAdopciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener adopciones' });
  }
};

// Aprobar adopción
exports.aprobar = async (req, res) => {
  try {
    const { id } = req.params;
    const adopcionId = Number(id);
    if (Number.isNaN(adopcionId)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const datos = req.body;
    const adopcion = await Adopcion.aprobarAdopcion(adopcionId, datos);

    if (!adopcion) {
      return res.status(404).json({ mensaje: 'Adopción no encontrada' });
    }

    res.json(adopcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al aprobar adopción' });
  }
};

// Rechazar o cancelar adopción
exports.rechazar = async (req, res) => {
  try {
    const { id } = req.params;
    const adopcionId = Number(id);
    if (Number.isNaN(adopcionId)) {
      return res.status(400).json({ mensaje: 'ID inválido' });
    }

    const datos = req.body;
    const adopcion = await Adopcion.rechazarAdopcion(adopcionId, datos);

    if (!adopcion) {
      return res.status(404).json({ mensaje: 'Adopción no encontrada' });
    }

    res.json(adopcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al rechazar adopción' });
  }
};
