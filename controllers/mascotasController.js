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

// Obtener una mascota por ID
exports.obtenerPorId = async (req, res) => {
    try {
        const { id_mascota } = req.params;
        const mascota = await Mascota.getMascotaPorId(id_mascota);
        res.json(mascota);

    } catch (error) {
        console.error(error);
        if (error.message === 'Mascota no encontrada') {
            res.status(404).json({ mensaje: 'Mascota no encontrada' });
        } else {
            res.status(500).json({ mensaje: 'Error al obtener la mascota' });
        }
    }
};

// Actualizar una mascota
exports.actualizar = async (req, res) => {
  try {
    const { id_mascota } = req.params;
    if (!id_mascota) {
      return res.status(400).json({ mensaje: 'Falta el id de la mascota.' });
    }

    const mascotaActualizada = await Mascota.actualizarMascota(id_mascota, req.body);
    res.json({ mensaje: 'Mascota actualizada con éxito.', mascota: mascotaActualizada });
  } catch (error) {
    console.error('Error al actualizar mascota:', error);
    if (error.message === 'Mascota no encontrada') {
      return res.status(404).json({ mensaje: 'Mascota no encontrada.' });
    }
    res.status(500).json({ mensaje: 'Error al actualizar la mascota.' });
  }
};
