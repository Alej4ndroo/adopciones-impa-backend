// routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/listar', verifyToken, checkPermission('ver_usuario'), usuariosController.listar);
router.get('/listar-clientes', verifyToken, checkPermission('ver_usuario'), usuariosController.listarClientes);
router.post('/crear', verifyToken, checkPermission('crear_usuario'), usuariosController.crear);
router.get('/:id', verifyToken, usuariosController.obtenerPorId);
router.put('/actualizar/:id', verifyToken, usuariosController.actualizar_perfil);
router.post('/subir-documento', verifyToken, usuariosController.subirDocumento);

module.exports = router; 
