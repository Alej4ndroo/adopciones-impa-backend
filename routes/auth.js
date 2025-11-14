// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /login - Procesar login
router.post('/login', authController.login);
router.post('/registro', authController.registro);
router.post('/contrasena-olvidada', authController.contrasenaOlvidada);

module.exports = router;