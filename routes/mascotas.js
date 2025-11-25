// routes/mascotas.js
const express = require('express');
const router = express.Router();
const mascotasController = require('../controllers/mascotasController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

// Ruta para API
router.get('/listar', mascotasController.listar);
router.post('/crear', verifyToken, checkPermission('crear_mascota'), mascotasController.crear);
router.get('/contar', mascotasController.contarDisponibles);
router.get('/:id_mascota', mascotasController.obtenerPorId);
router.put('/actualizar/:id_mascota', verifyToken, checkPermission('crear_mascota'), mascotasController.actualizar);

module.exports = router;
