// routes/consultas.js
const express = require('express');
const router = express.Router();
const consultasController = require('../controllers/consultasController');
const { verifyToken, checkPermission } = require('../middlewares/authMiddleware');

router.get('/listar', consultasController.listar);
router.post('/crear', verifyToken, checkPermission('crear_consulta'), consultasController.crear);

module.exports = router;
