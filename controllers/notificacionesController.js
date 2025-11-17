// controllers/seguimientosAdopcionController.js
const Notficacion = require('../models/notificacionesModel');

// Listar todos los seguimientos de adopción
exports.listar = async (req, res) => {
  try {
    const { id_usuario } = req.params;

    if (!id_usuario) {
      return res.status(400).json({ mensaje: 'No se proporcionó ID de usuario' });
    }

    const notificaciones = await Notficacion.getNotificaciones(id_usuario);
    res.json(notificaciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener notificaciones' });
  }
};
