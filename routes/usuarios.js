// routes/usuarios.js
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/listar', verifyToken, checkPermission('ver_usuario'), usuariosController.listar);
router.post('/crear', verifyToken, checkPermission('crear_usuario'), usuariosController.crear);
router.put('/actualizar/:id', verifyToken, usuariosController.editar);

router.post('/actualizar-foto', verifyToken, usuariosController.upload.single('foto_perfil'), usuariosController.actualizarFotoPerfil);

module.exports = router; 