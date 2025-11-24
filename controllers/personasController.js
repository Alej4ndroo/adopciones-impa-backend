const Persona = require('../models/personasModel');
const Usuario = require('../models/usuariosModel');

// Listar todas las personas
exports.listar = async (req, res) => {
  try {
    const personas = await Persona.getPersonas();
    res.json(personas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener personas' });
  }
};

// Crear una nueva persona
exports.crear = async (req, res) => {
  try {
    const nuevaPersona = await Persona.crearPersona(req.body);
    res.status(201).json(nuevaPersona);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear persona' });
  }
};

exports.actualizarDireccion = async (req, res) => {
  try {
    console.log('Controller Persona - req.body:', req.body);
    const { id_persona, calle, colonia, ciudad, codigo_postal } = req.body;

    const id = Number(id_persona);
    if (!Number.isInteger(id)) {
      console.error('id_persona inválido:', id_persona, 'typeof:', typeof id_persona);
      return res.status(400).json({ ok: false, error: 'id_persona inválido' });
    }

    const datos = { calle, colonia, ciudad, codigo_postal };
    const personaActualizada = await Persona.actualizarDireccion(id, datos);
    return res.json({ ok: true, persona: personaActualizada });
  } catch (error) {
    console.error('Error actualizarDireccion:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};

/**
 * Subir documento en base64 (sin multer).
 * Espera en el body: { id_usuario, tipo_documento, archivo_base64 }
 */
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
