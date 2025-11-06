const db = require('../config/db');
const bcrypt = require('bcryptjs');

// READ - Obtener todos los usuarios (con rol y dirección principal)
async function getUsuarios() {
  const query = `
    SELECT 
      u.*, 
      r.nombre_rol,
      d.calle AS direccion_calle,
      d.colonia AS direccion_colonia,
      d.codigo_postal AS direccion_cp,
      d.ciudad AS direccion_ciudad,
      d.estado AS direccion_estado,
      d.pais AS direccion_pais,
      d.tipo_direccion
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN direcciones d ON u.id_usuario = d.id_usuario AND d.es_principal = TRUE
    ORDER BY u.fecha_creacion DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener solo usuarios activos (con rol y dirección principal)
async function getUsuariosActivos() {
  const query = `
    SELECT 
      u.*, 
      r.nombre_rol,
      d.calle AS direccion_calle, 
      d.colonia AS direccion_colonia, 
      d.codigo_postal AS direccion_cp, 
      d.ciudad AS direccion_ciudad, 
      d.estado AS direccion_estado,
      d.pais AS direccion_pais,
      d.tipo_direccion
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN direcciones d ON u.id_usuario = d.id_usuario AND d.es_principal = TRUE
    WHERE u.activo = TRUE 
    ORDER BY u.fecha_creacion DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener un usuario por ID (con rol y TODAS las direcciones)
async function getUsuarioPorId(id_usuario) {
  const query = `
    SELECT 
      u.*, 
      r.nombre_rol,
      (
        SELECT COALESCE(json_agg(d.* ORDER BY d.es_principal DESC, d.id_direccion ASC), '[]'::json) 
        FROM direcciones d 
        WHERE d.id_usuario = u.id_usuario
      ) AS direcciones
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.id_usuario = $1
  `;
  const result = await db.query(query, [id_usuario]);
  return result.rows[0];
}

// READ - Obtener usuario por correo electrónico (con rol, permisos y TODAS las direcciones)
async function getUsuarioPorCorreo(correo_electronico) {
  const query = `
    SELECT 
      u.*, -- Traer todo de la tabla usuarios
      r.nombre_rol,
      ARRAY_AGG(DISTINCT p.nombre_permiso) AS permisos,
      (
        SELECT COALESCE(json_agg(d.* ORDER BY d.es_principal DESC, d.id_direccion ASC), '[]'::json) 
        FROM direcciones d 
        WHERE d.id_usuario = u.id_usuario
      ) AS direcciones
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN roles_permisos rp ON r.id_rol = rp.id_rol
    LEFT JOIN permisos p ON rp.id_permiso = p.id_permiso
    WHERE u.correo_electronico = $1
    GROUP BY 
      u.id_usuario, -- Agrupar por la PK es suficiente para incluir todos los campos de u.*
      r.id_rol, r.nombre_rol;
  `;
  const result = await db.query(query, [correo_electronico]);
  return result.rows[0];
}

// CREATE - Crear una nueva persona
async function crearUsuario(data) {
    const {
        // Datos de USUARIO
        nombre,
        correo_electronico,
        contrasena,
        fecha_nacimiento,
        telefono,
        foto_perfil_base64 = null,
        id_rol,
        documentacion_verificada = "pendiente",
        activo = true,

        // Datos de DIRECCIÓN
        calle,
        colonia,
        codigo_postal,
        ciudad,
        estado = "Michoacán",
        pais = "México",
        tipo_direccion = "domicilio",
        es_principal = true,
    } = data;

    const client = await db.connect();

    try {
        await client.query("BEGIN"); // Inicia transacción

        // 1️⃣ Hashear contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // 2️⃣ Insertar usuario
        const userInsertQuery = `
            INSERT INTO usuarios (
                nombre, correo_electronico, contrasena, fecha_nacimiento, telefono, 
                foto_perfil_base64, id_rol, activo, documentacion_verificada
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_usuario, nombre, correo_electronico
        `;

        const userResult = await client.query(userInsertQuery, [
            nombre,
            correo_electronico,
            hashedPassword,
            fecha_nacimiento,
            telefono,
            foto_perfil_base64,
            id_rol,
            activo,
            documentacion_verificada
        ]);

        const newUser = userResult.rows[0];

        // 3️⃣ Insertar dirección principal
        const addressInsertQuery = `
            INSERT INTO direcciones (
                id_usuario, calle, colonia, codigo_postal, ciudad, 
                estado, pais, tipo_direccion, es_principal
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_direccion
        `;

        const addressResult = await client.query(addressInsertQuery, [
            newUser.id_usuario,
            calle,
            colonia,
            codigo_postal,
            ciudad,
            estado,
            pais,
            tipo_direccion,
            es_principal
        ]);

        const newAddress = addressResult.rows[0];

        // 4️⃣ Confirmar transacción
        await client.query("COMMIT");

        // 5️⃣ Retornar datos creados
        return {
            mensaje: "Usuario creado correctamente.",
            usuario: newUser,
            direccion: newAddress
        };

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al crear persona. Se ejecutó ROLLBACK.", error);
        throw error;
    } finally {
        client.release();
    }
}

// UPDATE - Actualizar un usuario existente
// Nota: Esto solo actualiza la tabla 'usuarios'.
async function actualizarUsuario(id_usuario, datosActualizados) {
  // Asegúrate de incluir id_rol si también se puede actualizar aquí
  const { nombre, correo_electronico, fecha_nacimiento, telefono, id_rol } = datosActualizados;
  
  // Convertir a string YYYY-MM-DD
  const fecha = fecha_nacimiento ? (fecha_nacimiento.split('T')[0] || fecha_nacimiento) : null;

  // Construir la consulta dinámicamente (forma más segura)
  // Pero para este ejemplo, asumimos que todos los campos vienen o se manejan.
  // Por simplicidad, actualizo los campos de tu función original + id_rol
  
  const query = `
    UPDATE usuarios
    SET 
      nombre = $1, 
      correo_electronico = $2, 
      fecha_nacimiento = $3, 
      telefono = $4,
      id_rol = $5, 
      fecha_actualizacion = NOW()
    WHERE id_usuario = $6
    RETURNING *
  `;
  // Ajusta los valores según los campos que realmente quieras actualizar
  const values = [nombre, correo_electronico, fecha, telefono, id_rol, id_usuario];
  console.log('Valores para actualizarUsuario:', values);
  const result = await db.query(query, values);
  return result.rows[0];
}

// (El resto de las funciones de actualización no necesitan joins)

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

// SEARCH - Buscar usuarios por nombre (con rol y dirección principal)
async function buscarUsuariosPorNombre(nombre) {
  const query = `
    SELECT 
      u.*, 
      r.nombre_rol,
      d.calle AS direccion_calle, 
      d.colonia AS direccion_colonia, 
      d.codigo_postal AS direccion_cp, 
      d.ciudad AS direccion_ciudad, 
      d.estado AS direccion_estado,
      d.pais AS direccion_pais,
      d.tipo_direccion
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN direcciones d ON u.id_usuario = d.id_usuario AND d.es_principal = TRUE
    WHERE u.nombre ILIKE $1 AND u.activo=TRUE
    ORDER BY u.nombre
  `;
  const result = await db.query(query, [`%${nombre}%`]);
  return result.rows;
}

// SEARCH - Buscar usuarios por tipo (con rol y dirección principal)
// (Usando 'tipo_usuario' como en tu función original)
async function getUsuariosPorTipo(tipo_usuario) {
  const query = `
    SELECT 
      u.*, 
      r.nombre_rol,
      d.calle AS direccion_calle, 
      d.colonia AS direccion_colonia, 
      d.codigo_postal AS direccion_cp, 
      d.ciudad AS direccion_ciudad, 
      d.estado AS direccion_estado,
      d.pais AS direccion_pais,
      d.tipo_direccion
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN direcciones d ON u.id_usuario = d.id_usuario AND d.es_principal = TRUE
    WHERE u.tipo_usuario=$1 AND u.activo=TRUE 
    ORDER BY u.fecha_creacion DESC
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