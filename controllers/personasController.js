// controllers/mascotasController.js
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Persona = require('../models/personasModel'); // tu modelo

//configuración de Multer para subida de docs
const docStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/docs')); // Ruta para documentos
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

exports.uploadDoc = multer({ storage: docStorage });

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

//subir un documento específico (INE, Acta, Comprobante)
exports.subirDocumento = async (req, res) => {
  try {
    const { id_persona, tipo_documento } = req.body;
    const id = Number(id_persona);
    const tempFile = req.file;

    if (!id || !tempFile || !tipo_documento) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos (id_persona, archivo o tipo_documento).' });
    }

    // Construir el nombre de archivo final y la ruta
    const extension = path.extname(tempFile.originalname);
    const nombreFinal = `${tipo_documento}_${id}${extension}`;
    const rutaFinal = path.join(tempFile.destination, nombreFinal);

    // Renombrar el archivo temporal al nombre final
    fs.renameSync(tempFile.path, rutaFinal);
    console.log(`Documento renombrado de ${tempFile.filename} a ${nombreFinal}`);

    // Preparar el documento para guardar en la BD
    const url_documento = `/docs/${nombreFinal}`;
    const documento = {
      tipo_documento: tipo_documento,
      archivo_url: url_documento
    };

    // Llamar al modelo para insertar/actualizar el documento
    const resultado = await Persona.subirDocumentosPersona(id, [documento]);

    return res.json({ ok: true, url_documento, resultado });
  } catch (error) {
    console.error('Error en subirDocumento:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
};