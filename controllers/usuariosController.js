// controllers/usuariosController.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Usuario = require('../models/usuariosModel');

// --- Configuración de Multer para subida de archivos ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/img')); // Ruta donde se guardarán las imágenes
    console.log('Multer destination: ../public/img');
  },
  filename: function (req, file, cb) {
    // 1. Generar un nombre de archivo temporal único para evitar colisiones
    // y no depender de req.body, que puede no estar listo.
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

exports.upload = multer({ storage: storage });

// Listar todos los usuarios
exports.listar = async (req, res) => {
  try {
    const usuarios = await Usuario.getUsuarios();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};


// Listar usuarios activos
exports.listarActivos = async (req, res) => {
  try {
    const usuarios = await Usuario.getUsuariosActivos();
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios activos' });
  }
};

// Obtener un usuario por ID
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.getUsuarioPorId(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuario' });
  }
};

// Crear un nuevo usuario
exports.crear = async (req, res) => {
  try {
    const nuevoUsuario = await Usuario.crearUsuario(req.body);
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear usuario' });
  }
};

// Editar usuario
exports.editar = async (req, res) => {
  try {
    console.log('Datos recibidos en el controller:', req.body);
    const { id } = req.params;
    const id_usuario = Number(id);
    const datos = req.body;
    const usuarioActualizado = await Usuario.actualizarUsuario(id_usuario, datos);
    res.json(usuarioActualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
};

//actualizar foto
exports.actualizarFotoPerfil = async (req, res) => {  
  console.log('Iniciando actualizarFotoPerfil...');
  try {
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);

    const { id_usuario } = req.body;
    const tempFile = req.file; 

    if (!id_usuario || !tempFile) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos (id_usuario o archivo).' });
    }

    //nombre de archivo final y la ruta
    const extension = path.extname(tempFile.originalname);
    const nombreFinal = `foto_perfil.${id_usuario}${extension}`;
    const rutaFinal = path.join(tempFile.destination, nombreFinal);

    //archivo temporal al nombre final
    fs.renameSync(tempFile.path, rutaFinal);
    console.log(`Archivo renombrado de ${tempFile.filename} a ${nombreFinal}`);

    //guardar la URL final en la base de datos
    const url_foto = `/img/${nombreFinal}`;
    const usuarioActualizado = await Usuario.actualizarFotoPerfil(id_usuario, url_foto);

    res.json({ ok: true, usuario: usuarioActualizado, url_foto: url_foto });
  } catch (error) {
    console.error('Error en el controlador actualizarFotoPerfil:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

// Desactivar usuario (soft delete)
exports.desactivar = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.desactivarUsuario(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario desactivado', usuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al desactivar usuario' });
  }
};

// Eliminar usuario permanentemente
exports.eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioEliminado = await Usuario.eliminarUsuario(id);
    if (!usuarioEliminado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json({ mensaje: 'Usuario eliminado', usuarioEliminado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar usuario' });
  }
};
