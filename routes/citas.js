// routes/citas.js
const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');

router.get('/listar', citasController.listar);
router.get('/usuario/:id_usuario', citasController.listarPorUsuario);
router.post('/crear', citasController.crear);
router.get('/contar', citasController.contarCitasHoy);
router.put('/actualizar-fecha/:id', citasController.actualizarFecha);
router.put('/actualizar/:id', citasController.actualizar);

module.exports = router;
