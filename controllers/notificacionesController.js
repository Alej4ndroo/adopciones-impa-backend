// controllers/notificacionesController.js
const Notificacion = require('../models/notificacionesModel');
const { ensureNotificacionPerfilIncompleto, ensureNotificacionSeguimiento } = require('../services/notificacionesService');

// Listar todas las notificaciones del usuario
exports.listar = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    if (!id_usuario) {
      return res.status(400).json({ mensaje: 'No se proporcionó ID de usuario' });
    }

    await ensureNotificacionPerfilIncompleto(Number(id_usuario));
    await ensureNotificacionSeguimiento(Number(id_usuario));
    const notificaciones = await Notificacion.getNotificaciones(id_usuario);
    res.json(notificaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
  }
};

exports.crear = async (req, res) => {
  try {
    const { id_usuario, tipo_notificacion, titulo, mensaje } = req.body || {};

    if (!id_usuario || !tipo_notificacion || !titulo || !mensaje) {
      return res.status(400).json({ mensaje: 'Faltan datos para crear la notificación' });
    }

    const notificacion = await Notificacion.crearNotificacion({
      id_usuario,
      tipo_notificacion,
      titulo,
      mensaje,
    });

    res.status(201).json(notificacion);
  } catch (error) {
    console.error('Error al crear notificación:', error);
    res.status(500).json({ mensaje: 'No se pudo crear la notificación' });
  }
};
