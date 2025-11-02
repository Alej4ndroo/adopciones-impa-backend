// routes/personas.js
const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personasController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/listar', personasController.listar);
router.post('/crear', personasController.crear);
router.post('/actualizarDireccion', personasController.actualizarDireccion);

router.post('/subir-ine', verifyToken, personasController.uploadDoc.single('documento'), personasController.subirDocumento);
router.post('/subir-acnac', verifyToken, personasController.uploadDoc.single('documento'), personasController.subirDocumento);
router.post('/subir-comdom', verifyToken, personasController.uploadDoc.single('documento'), personasController.subirDocumento);

module.exports = router;