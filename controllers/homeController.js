const path = require('path');

// Función para mostrar home.html
exports.renderHome = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/home.html'));
};