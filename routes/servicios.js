// routes/servicios.js
const express = require('express');
const router = express.Router();
const path = require('path');
const serviciosController = require('../controllers/serviciosController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Ruta para mostrar la página HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/servicios.html'));
});

// Rutas API
router.get('/listar', serviciosController.listar);
router.get('/:id', serviciosController.obtener);
router.post('/crear', verifyToken, serviciosController.crear);
router.put('/actualizar/:id', verifyToken, serviciosController.actualizar);
router.patch('/activar/:id', verifyToken, serviciosController.activar);
router.patch('/desactivar/:id', verifyToken, serviciosController.desactivar);

module.exports = router;
