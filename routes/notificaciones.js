// routes/notificaciones.js
const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Ruta para API
router.get('/:id_usuario', verifyToken, notificacionesController.listar);
router.post(
  '/',
  verifyToken,
  checkPermission('crear_notificacion'),
  notificacionesController.crear
);

module.exports = router;
