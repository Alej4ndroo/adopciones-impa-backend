// controllers/serviciosModel.js
const Servicio = require('../models/serviciosModel'); // tu modelo

exports.listar = async (req, res) => {
  try {
    const servicios = await Servicio.getServicios();
    res.json(servicios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener servicios' });
  }
};

exports.obtener = async (req, res) => {
  try {
    const servicio = await Servicio.getServicioPorId(req.params.id);
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }
    res.json(servicio);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener servicio' });
  }
};

exports.crear = async (req, res) => {
  try {
    const nuevo = await Servicio.crearServicio(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear servicio' });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const actualizado = await Servicio.actualizarServicio(req.params.id, req.body);
    if (!actualizado) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }
    res.json(actualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar servicio' });
  }
};

exports.activar = async (req, res) => {
  try {
    const servicio = await Servicio.activarServicio(req.params.id);
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }
    res.json({ mensaje: 'Servicio activado', servicio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al activar servicio' });
  }
};

exports.desactivar = async (req, res) => {
  try {
    const servicio = await Servicio.desactivarServicio(req.params.id);
    if (!servicio) {
      return res.status(404).json({ mensaje: 'Servicio no encontrado' });
    }
    res.json({ mensaje: 'Servicio desactivado', servicio });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al desactivar servicio' });
  }
};
