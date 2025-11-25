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

// Listar usuarios que son clientes
exports.listarClientes = async (req, res) => {
  try {
    const usuariosClientes = await Usuario.getUsuariosClientes();
    res.json(usuariosClientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios clientes' });
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

// Obtener un usuario por ID (con datos completos/direcciones)
exports.obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Usuario.getDatosCompletosPorId(id);
    if (!data || !data.usuario_completo) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(data.usuario_completo);
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

// Editar (actualizar) usuario existente (no se usa en frontend público)
exports.editar = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizados = req.body;
    console.log('[actualizar_perfil] id_usuario:', id_usuario, 'body:', datosActualizados);

    const resultado = await Usuario.actualizarUsuario(id, datosActualizados);

    if (!resultado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    res.status(200).json({ perfil: resultado.perfil || resultado });

  } catch (error) {
    console.error('Error en editar usuario:', error);
    res.status(500).json({ mensaje: 'Error al actualizar usuario' });
  }
};

exports.actualizar_perfil = async (req, res) => {
  try {
    const id_usuario = req.params.id || req.usuario.id_usuario;
    const datosActualizados = req.body;

    // Validar que haya datos para actualizar
    if (!datosActualizados || Object.keys(datosActualizados).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron datos para actualizar' 
      });
    }

    // Campos permitidos para actualizar
    const camposPermitidos = [
      'nombre',
      'correo_electronico',
      'telefono',
      'fecha_nacimiento',
      'activo',
      'documentacion_verificada',
      'calle',
      'colonia',
      'codigo_postal',
      'ciudad',
      'estado',
      'pais',
      'foto_perfil_base64'
    ];

    // Filtrar solo los campos permitidos
    const datosParaActualizar = {};
    for (const campo of camposPermitidos) {
      if (datosActualizados.hasOwnProperty(campo)) {
        datosParaActualizar[campo] = datosActualizados[campo];
      }
    }

    // Verificar que haya al menos un campo permitido para actualizar
    if (Object.keys(datosParaActualizar).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron campos válidos para actualizar' 
      });
    }

    // Actualizar el perfil (modelo ya refresca datos completos)
    const resultado = await Usuario.actualizarUsuario(id_usuario, datosParaActualizar);
    if (!resultado) {
      return res.status(404).json({ 
        error: 'No se pudo actualizar el perfil' 
      });
    }

    res.status(200).json(resultado.perfil || resultado);

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el perfil del usuario' 
    });
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

exports.subirDocumento = async (req, res) => {
  try {
    const { id_usuario, tipo_documento, archivo_base64 } = req.body;

    if (!id_usuario || !tipo_documento || !archivo_base64) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos: id_usuario, tipo_documento o archivo_base64.' });
    }

    const type = tipo_documento.toLowerCase();
    const fieldMap = {
      ine: 'url_ine',
      acnac: 'url_acta',
      comdom: 'url_comprobante'
    };
    const targetField = fieldMap[type];
    if (!targetField) {
      return res.status(400).json({ ok: false, mensaje: 'Tipo de documento no soportado.' });
    }

    // Guardamos el base64 en documentos_persona ligado al usuario
    const documento = await Usuario.upsertDocumentoUsuario(id_usuario, type, archivo_base64);

    return res.json({ ok: true, documento });
  } catch (error) {
    console.error('Error en subirDocumento (base64):', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};
