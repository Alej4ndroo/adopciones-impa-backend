const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');

// Middleware de autenticación
const requireAuth = (req, res, next) => {
  if (!req.session.usuario) {
    return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
  }
  next();
};

// Ruta protegida - solo sirve el HTML
router.get('/', requireAuth, perfilController.renderPerfil);

module.exports = router;