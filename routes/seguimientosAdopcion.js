// routes/seguimientos.js
const express = require('express');
const router = express.Router();
const seguimientosAdopcionController = require('../controllers/seguimientosAdopcionController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.get('/listar', seguimientosAdopcionController.listar);
router.post('/crear', verifyToken, seguimientosAdopcionController.crear);

module.exports = router;
