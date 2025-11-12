// routes/adopciones.js
const express = require('express');
const router = express.Router();
const adopcionesController = require('../controllers/adopcionesController');

router.get('/listar', adopcionesController.listar);
router.get('/usuario/:id_usuario', adopcionesController.listarPorUsuario);
router.post('/crear', adopcionesController.crear);
router.patch('/:id/aprobar', adopcionesController.aprobar);
router.patch('/:id/rechazar', adopcionesController.rechazar);
router.get('/contar', adopcionesController.contar);

module.exports = router;
