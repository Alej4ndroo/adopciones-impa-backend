// routes/personas.js
const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personasController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/listar', personasController.listar);
router.post('/crear', personasController.crear);
router.post('/actualizarDireccion', personasController.actualizarDireccion);

// Subida de documentos en base64 (sin multer)
router.post('/subir-documento', verifyToken, personasController.subirDocumento);

module.exports = router;
