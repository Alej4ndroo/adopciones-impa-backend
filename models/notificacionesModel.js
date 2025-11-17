// models/notificacionesModel.js
const db = require('../config/db');

async function getNotificaciones(id_usuario) {
  const query = `
    SELECT * FROM notificaciones
    WHERE id_usuario = $1
    ORDER BY creada_at DESC;
  `;
  
  const result = await db.query(query, [id_usuario]);
  
  return result.rows;
}

module.exports = {
  getNotificaciones,
};