// routes/personas.js
const express = require('express');
const router = express.Router();
const empleadosController = require('../controllers/empleadosController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Ruta para API
router.get('/listar', verifyToken, checkPermission('ver_empleado'), empleadosController.listar);
router.get('/obtener-perfil', verifyToken, empleadosController.obtener_perfil);
//router.post('/actualizar', verifyToken, checkPermission('editar_empleado'), empleadosController.actualizar);
router.post('/crear', verifyToken, checkPermission('crear_empleado'), empleadosController.crear);

module.exports = router;