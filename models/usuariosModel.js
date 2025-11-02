const db = require('../config/db'); // Pool de pg
const bcrypt = require('bcryptjs'); // para hashear contraseñas

// READ - Obtener todos los usuarios
async function getUsuarios() {
  const query = 'SELECT * FROM usuarios ORDER BY fecha_creacion DESC';
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener solo usuarios activos
async function getUsuariosActivos() {
  const query = 'SELECT * FROM usuarios WHERE activo = TRUE ORDER BY fecha_creacion DESC';
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener un usuario por ID
async function getUsuarioPorId(id_usuario) {
  const query = 'SELECT * FROM usuarios WHERE id_usuario = $1';
  const result = await db.query(query, [id_usuario]);
  return result.rows[0];
}

// READ - Obtener usuario por correo electrónico
async function getUsuarioPorCorreo(correo_electronico) {
  const query = `
    SELECT 
      u.id_usuario,
      u.correo_electronico,
      u.contrasena,
      u.nombre,
      r.id_rol,
      r.nombre_rol,
      ARRAY_AGG(DISTINCT p.nombre_permiso) AS permisos
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN roles_permisos rp ON r.id_rol = rp.id_rol
    LEFT JOIN permisos p ON rp.id_permiso = p.id_permiso
    WHERE u.correo_electronico = $1
    GROUP BY 
      u.id_usuario, u.correo_electronico, u.contrasena, u.nombre,
      r.id_rol, r.nombre_rol;
  `;
  const result = await db.query(query, [correo_electronico]);
  return result.rows[0];
}

// CREATE - Crear un nuevo usuario
async function crearUsuario(usuarioData) {
  const { nombre, correo_electronico, contrasena, fecha_nacimiento, telefono = null, tipo_usuario, activo = true } = usuarioData;

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(contrasena, 10);

  const query = `
    INSERT INTO usuarios (nombre, correo_electronico, contrasena, fecha_nacimiento, telefono, tipo_usuario, activo)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [nombre, correo_electronico, hashedPassword, fecha_nacimiento, telefono, tipo_usuario, activo];
  const result = await db.query(query, values);
  return result.rows[0];
}

// UPDATE - Actualizar un usuario existente
async function actualizarUsuario(id_usuario, datosActualizados) {
  const { nombre, correo_electronico, fecha_nacimiento, telefono } = datosActualizados;
  // Convertir a string YYYY-MM-DD
  const fecha = fecha_nacimiento.split('T')[0] || fecha_nacimiento;
  const query = `
    UPDATE usuarios
    SET nombre=$1, correo_electronico=$2, fecha_nacimiento=$3, telefono=$4, fecha_actualizacion=NOW()
    WHERE id_usuario=$5
    RETURNING *
  `;
  const values = [nombre, correo_electronico, fecha, telefono, id_usuario];
  console.log('Valores para actualizarUsuario:', values);
  const result = await db.query(query, values);
  return result.rows[0];
}

async function actualizarFotoPerfil(id_usuario, url_foto) {
  const query = `
    UPDATE usuarios
    SET foto_perfil_base64 = $1, fecha_actualizacion = NOW()
    WHERE id_usuario = $2
    RETURNING *
  `;
  const values = [url_foto, id_usuario];
  const result = await db.query(query, values);
  return result.rows[0];
}

// SOFT DELETE - Cambiar estado activo
async function cambiarEstadoUsuario(id_usuario, activo) {
  const query = `
    UPDATE usuarios
    SET activo=$1, fecha_actualizacion=NOW()
    WHERE id_usuario=$2
    RETURNING *
  `;
  const result = await db.query(query, [activo, id_usuario]);
  return result.rows[0];
}

async function desactivarUsuario(id_usuario) {
  return cambiarEstadoUsuario(id_usuario, false);
}

async function activarUsuario(id_usuario) {
  return cambiarEstadoUsuario(id_usuario, true);
}

// DELETE - Eliminar un usuario permanentemente
async function eliminarUsuario(id_usuario) {
  const query = 'DELETE FROM usuarios WHERE id_usuario=$1 RETURNING *';
  const result = await db.query(query, [id_usuario]);
  return result.rows[0];
}

// SEARCH - Buscar usuarios por nombre
async function buscarUsuariosPorNombre(nombre) {
  const query = `
    SELECT * FROM usuarios
    WHERE nombre ILIKE $1 AND activo=TRUE
    ORDER BY nombre
  `;
  const result = await db.query(query, [`%${nombre}%`]);
  return result.rows;
}

// SEARCH - Buscar usuarios por tipo
async function getUsuariosPorTipo(tipo_usuario) {
  const query = `
    SELECT * FROM usuarios
    WHERE tipo_usuario=$1 AND activo=TRUE
    ORDER BY fecha_creacion DESC
  `;
  const result = await db.query(query, [tipo_usuario]);
  return result.rows;
}

// UTILITY - Verificar si existe un correo
async function existeCorreo(correo_electronico, excluirId = null) {
  let query = 'SELECT id_usuario FROM usuarios WHERE correo_electronico=$1';
  let values = [correo_electronico];

  if (excluirId) {
    query += ' AND id_usuario <> $2';
    values.push(excluirId);
  }

  const result = await db.query(query, values);
  return result.rows.length > 0;
}

module.exports = {
  getUsuarios,
  getUsuariosActivos,
  getUsuarioPorId,
  getUsuarioPorCorreo,
  getUsuariosPorTipo,
  crearUsuario,
  actualizarUsuario,
  actualizarFotoPerfil,
  cambiarEstadoUsuario,
  desactivarUsuario,
  activarUsuario,
  eliminarUsuario,
  buscarUsuariosPorNombre,
  existeCorreo
};
