// routes/personas.js
const express = require('express');
const router = express.Router();
const seguimientosAdopcionController = require('../controllers/seguimientosAdopcionController');

router.get('/listar', seguimientosAdopcionController.listar);
//router.post('/crear', seguimientosAdopcionController.crear);

module.exports = router;