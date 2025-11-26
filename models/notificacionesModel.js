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

async function crearNotificacion({ id_usuario, tipo_notificacion, titulo, mensaje }) {
  if (!id_usuario || !tipo_notificacion || !titulo || !mensaje) {
    throw new Error('Faltan datos obligatorios para crear la notificación');
  }

  const query = `
    INSERT INTO notificaciones (id_usuario, tipo_notificacion, titulo, mensaje)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;

  const { rows } = await db.query(query, [id_usuario, tipo_notificacion, titulo, mensaje]);
  return rows[0];
}

async function existeNotificacionPorTitulo(id_usuario, titulo) {
  const query = `
    SELECT 1 FROM notificaciones
    WHERE id_usuario = $1 AND titulo = $2
    LIMIT 1;
  `;
  const { rowCount } = await db.query(query, [id_usuario, titulo]);
  return rowCount > 0;
}

async function eliminarNotificacionPorTitulo(id_usuario, titulo) {
  const query = `
    DELETE FROM notificaciones
    WHERE id_usuario = $1 AND titulo = $2
  `;
  await db.query(query, [id_usuario, titulo]);
}

module.exports = {
  getNotificaciones,
  crearNotificacion,
  existeNotificacionPorTitulo,
  eliminarNotificacionPorTitulo,
};
