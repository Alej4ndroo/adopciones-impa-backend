// routes/adopciones.js
const express = require('express');
const router = express.Router();
const adopcionesController = require('../controllers/adopcionesController');

router.get('/listar', adopcionesController.listar);
router.patch('/:id/aprobar', adopcionesController.aprobar);
router.patch('/:id/rechazar', adopcionesController.rechazar);
router.patch('/contar', adopcionesController.contar);

module.exports = router;
