// routes/citas.js
const express = require('express');
const router = express.Router();
const citasController = require('../controllers/citasController');

router.get('/listar', citasController.listar);
router.post('/crear', citasController.crear);
router.get('/contar', citasController.contarCitasHoy);

module.exports = router;
