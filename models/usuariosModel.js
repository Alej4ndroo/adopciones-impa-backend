const db = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * @param {number} id_usuario - El ID del usuario a buscar.
 * @returns {Promise<object | null>} Un objeto con la propiedad 'usuario_completo' o null si no se encuentra.
 * 
 */
async function getDatosCompletosPorId(id_usuario) {
  const query = `
    SELECT
      -- Construye el objeto JSON principal del usuario
      json_build_object(
        'id_usuario', u.id_usuario,
        'nombre', u.nombre,
        'correo_electronico', u.correo_electronico,
        'fecha_nacimiento', u.fecha_nacimiento,
        'telefono', u.telefono,
        'documentacion_verificada', u.documentacion_verificada,
        'foto_perfil_base64', u.foto_perfil_base64,
        'activo', u.activo,
        'id_rol', u.id_rol,
        
        'rol', json_build_object(
          'id_rol', r.id_rol,
          'nombre_rol', r.nombre_rol
        ),
        
        'empleado', (
          SELECT json_build_object(
            'id_empleado', emp.id_empleado,
            'numero_empleado', emp.numero_empleado,
            'fecha_contratacion', emp.fecha_contratacion,
            'cedula_profesional', emp.cedula_profesional,
            'licenciatura', emp.licenciatura,
            'especialidad', emp.especialidad
          )
          FROM empleados emp
          WHERE emp.id_usuario = u.id_usuario
        ),
        
        'direcciones', (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id_direccion', d.id_direccion,
              'calle', d.calle,
              'colonia', d.colonia,
              'codigo_postal', d.codigo_postal,
              'ciudad', d.ciudad,
              'estado', d.estado,
              'pais', d.pais,
              'tipo_direccion', d.tipo_direccion,
              'es_principal', d.es_principal
            )
          ), '[]'::json)
          FROM direcciones d
          WHERE d.id_usuario = u.id_usuario
        ),
        
        'permisos', (
          SELECT COALESCE(json_agg(p.nombre_permiso), '[]'::json)
          FROM roles_permisos rp
          JOIN permisos p ON rp.id_permiso = p.id_permiso
          WHERE rp.id_rol = u.id_rol
        )
      ) AS usuario_completo
    FROM 
      usuarios u
    JOIN 
      roles r ON u.id_rol = r.id_rol
    WHERE 
      u.id_usuario = $1;
  `;
  
  try {
    const { rows } = await db.query(query, [id_usuario]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error al obtener datos completos del usuario:', error);
    throw error;
  }
};

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

// READ - Obtener todos los usuarios (con rol y dirección principal)
async function getUsuariosClientes() {
  const query = `
    SELECT 
      u.*, 
      r.nombre_rol,
      json_build_object(
          'calle', d.calle,
          'colonia', d.colonia,
          'codigo_postal', d.codigo_postal,
          'ciudad', d.ciudad,
          'estado', d.estado
      ) as direccion
    FROM usuarios u
    LEFT JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN direcciones d ON u.id_usuario = d.id_usuario AND d.es_principal = TRUE
    WHERE u.id_rol = 4
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
      u.*,
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
      u.id_usuario,
      r.id_rol, r.nombre_rol;
  `;
  const result = await db.query(query, [correo_electronico]);
  return result.rows[0];
}

// CREATE - Crear un nuevo usuario
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

        // Datos de DIRECCIÓN (opcionales)
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

        // --- INICIO DE LA MODIFICACIÓN ---
        
        let newAddress = null; // Inicializamos la dirección como nula

        // 3️⃣ Insertar dirección principal (SOLO SI SE PROPORCIONAN DATOS)
        //    Usamos 'calle' como el indicador principal de que vienen datos de dirección.
        if (calle) {
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
            
            newAddress = addressResult.rows[0];
        }
        // --- FIN DE LA MODIFICACIÓN ---

        // 4️⃣ Confirmar transacción
        await client.query("COMMIT");

        // 5️⃣ Retornar datos creados
        return {
            mensaje: "Usuario creado correctamente.",
            usuario: newUser,
            direccion: newAddress // Devolverá null si no se creó una dirección
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
async function actualizarUsuario(id_usuario, data) {
    const client = await db.connect();

    try {
        await client.query("BEGIN"); // Inicia transacción

        // Desestructurar los posibles campos a actualizar
        const {
            // Datos del usuario
            nombre,
            correo_electronico,
            contrasena,
            fecha_nacimiento,
            telefono,
            foto_perfil_base64,
            id_rol,
            documentacion_verificada,
            activo,

            // Datos de la dirección
            calle,
            colonia,
            codigo_postal,
            ciudad,
            estado,
            pais,
            tipo_direccion,
            es_principal
        } = data;

        // ⚙️ Si viene una nueva contraseña, la hasheamos
        let hashedPassword = null;
        if (contrasena) {
            hashedPassword = await bcrypt.hash(contrasena, 10);
        }

        // 🧩 Actualizar usuario
        const updateUserQuery = `
            UPDATE usuarios
            SET 
                nombre = COALESCE($1, nombre),
                correo_electronico = COALESCE($2, correo_electronico),
                contrasena = COALESCE($3, contrasena),
                fecha_nacimiento = COALESCE($4, fecha_nacimiento),
                telefono = COALESCE($5, telefono),
                foto_perfil_base64 = COALESCE($6, foto_perfil_base64),
                id_rol = COALESCE($7, id_rol),
                documentacion_verificada = COALESCE($8, documentacion_verificada),
                activo = COALESCE($9, activo),
                fecha_actualizacion = NOW()
            WHERE id_usuario = $10
            RETURNING *;
        `;

        const userResult = await client.query(updateUserQuery, [
            nombre || null,
            correo_electronico || null,
            hashedPassword || null,
            fecha_nacimiento || null,
            telefono || null,
            foto_perfil_base64 || null,
            id_rol || null,
            documentacion_verificada || null,
            activo !== undefined ? activo : null,
            id_usuario
        ]);

        const usuarioActualizado = userResult.rows[0];

        // 🏠 Si se incluyen datos de dirección, se actualiza
        if (calle || colonia || codigo_postal || ciudad || estado || pais) {
            const updateAddressQuery = `
                UPDATE direcciones
                SET 
                    calle = COALESCE($1, calle),
                    colonia = COALESCE($2, colonia),
                    codigo_postal = COALESCE($3, codigo_postal),
                    ciudad = COALESCE($4, ciudad),
                    estado = COALESCE($5, estado),
                    pais = COALESCE($6, pais),
                    tipo_direccion = COALESCE($7, tipo_direccion),
                    es_principal = COALESCE($8, es_principal)
                WHERE id_usuario = $9
                  AND es_principal = true
                RETURNING *;
            `;

            const addressResult = await client.query(updateAddressQuery, [
                calle || null,
                colonia || null,
                codigo_postal || null,
                ciudad || null,
                estado || null,
                pais || null,
                tipo_direccion || null,
                es_principal !== undefined ? es_principal : true,
                id_usuario
            ]);

            usuarioActualizado.direccion = addressResult.rows[0] || null;
        }

        await client.query("COMMIT");

        return {
            mensaje: "Usuario actualizado correctamente.",
            perfil: usuarioActualizado
        };

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("❌ Error al actualizar usuario. Se ejecutó ROLLBACK:", error);
        throw error;
    } finally {
        client.release();
    }
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
  getDatosCompletosPorId,
  getUsuarios,
  getUsuariosClientes,
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