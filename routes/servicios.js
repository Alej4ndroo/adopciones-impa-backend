// routes/servicios.js
const express = require('express');
const router = express.Router();
const path = require('path');
const serviciosController = require('../controllers/serviciosController');

// Ruta para mostrar la página HTML
router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/servicios.html'));
});

// Ruta para API
router.get('/listar', serviciosController.listar);

module.exports = router;