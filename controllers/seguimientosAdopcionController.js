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

exports.crear = async (req, res) => {
  try {
    const {
      id_adopcion,
      fecha_seguimiento,
      estado_mascota,
      observaciones,
      requiere_atencion = false,
      siguiente_seguimiento,
      fotos = []
    } = req.body || {};

    if (!id_adopcion || !fecha_seguimiento || !estado_mascota) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios del seguimiento.' });
    }

    const fotosValidas = Array.isArray(fotos)
      ? fotos.filter((f) => f?.url || f?.archivo_base64)
      : [];
    if (!fotosValidas.length) {
      return res.status(400).json({ mensaje: 'Debes adjuntar al menos una foto del seguimiento.' });
    }

    const seguimiento = await SeguimientoAdopcion.crearSeguimiento({
      id_adopcion,
      fecha_seguimiento,
      estado_mascota,
      observaciones,
      requiere_atencion,
      siguiente_seguimiento,
      realizado_por: req.usuario?.id_usuario || null
    });

    const fotosGuardadas = await SeguimientoAdopcion.agregarFotosSeguimiento(
      seguimiento.id_seguimiento,
      fotosValidas
    );

    res.status(201).json({ seguimiento, fotos: fotosGuardadas });
  } catch (error) {
    console.error('Error al crear seguimiento:', error);
    res.status(500).json({ mensaje: 'Error al crear el seguimiento de adopción' });
  }
};
