// controllers/citasController.js
const Adopcion = require('../models/adopcionesModel');
const Notificaciones = require('../models/notificacionesModel');

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

// Crear una nueva solicitud de adopción
exports.crear = async (req, res) => {
  try {
    const datosAdopcion = req.body;

    if (!datosAdopcion.id_usuario || !datosAdopcion.id_mascota) {
      return res.status(400).json({ mensaje: 'Faltan datos (id_usuario o id_mascota)' });
    }

    const nuevaAdopcion = await Adopcion.crearAdopcion(datosAdopcion);
    
    res.status(201).json(nuevaAdopcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear la solicitud de adopción' });
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

    const idUsuario = adopcion.id_usuario || adopcion.usuario?.id_usuario;
    if (idUsuario) {
      try {
        await Notificaciones.crearNotificacion({
          id_usuario: idUsuario,
          tipo_notificacion: 'aceptacion',
          titulo: '¡Tu adopción fue aprobada!',
          mensaje: `La solicitud de adopción para ${adopcion.mascota?.nombre || 'la mascota seleccionada'} ha sido aprobada. Nos pondremos en contacto para los siguientes pasos.`
        });
      } catch (notifError) {
        console.error('No se pudo crear notificación de adopción aprobada:', notifError);
      }
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

    const idUsuario = adopcion.id_usuario || adopcion.usuario?.id_usuario;
    if (idUsuario) {
      try {
        await Notificaciones.crearNotificacion({
          id_usuario: idUsuario,
          tipo_notificacion: 'rechazo',
          titulo: 'Solicitud de adopción rechazada',
          mensaje: `La solicitud de adopción para ${adopcion.mascota?.nombre || 'la mascota seleccionada'} fue rechazada. Puedes revisar tus documentos o intentar con otra mascota.`
        });
      } catch (notifError) {
        console.error('No se pudo crear notificación de adopción rechazada:', notifError);
      }
    }

    res.json(adopcion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al rechazar adopción' });
  }
};
