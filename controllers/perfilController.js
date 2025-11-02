// controllers/perfilController.js
const path = require('path');

// Función para mostrar home.html
exports.renderPerfil = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/perfil.html'));
};