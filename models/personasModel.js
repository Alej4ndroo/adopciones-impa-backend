const db = require('../config/db');
const bcrypt = require('bcrypt');

// READ - Obtener todas las personas con datos del usuario
async function getPersonas() {
    const query = `
        SELECT 
            p.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'fecha_nacimiento', u.fecha_nacimiento,
                'id_rol', r.id_rol,
                'nombre_rol', r.nombre_rol, 
                'activo', u.activo,
                'fecha_creacion', u.fecha_creacion
            ) as usuarios
        FROM personas p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        LEFT JOIN roles r ON u.id_rol = r.id_rol
        ORDER BY p.id_persona DESC
    `;

    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener solo personas con usuarios activos
async function getPersonasActivas() {
    const query = `
        SELECT 
            p.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'fecha_nacimiento', u.fecha_nacimiento,
                'id_rol', r.id_rol,
                'nombre_rol', r.nombre_rol, 
                'activo', u.activo,
                'fecha_creacion', u.fecha_creacion
            ) as usuarios
        FROM personas p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE u.activo = true
        ORDER BY p.id_persona DESC
    `;

    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener una persona por ID
async function getPersonaPorUsuarioId(id_usuario) {
    const query = `
        SELECT 
            p.*, 
            ine.archivo_url AS url_ine,
            acnac.archivo_url AS url_acta,
            comdom.archivo_url AS url_comprobante,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'foto_perfil_base64', u.foto_perfil_base64,
                'fecha_nacimiento', u.fecha_nacimiento,
                'id_rol', r.id_rol,
                'nombre_rol', r.nombre_rol, 
                'activo', u.activo,
                'fecha_creacion', u.fecha_creacion,
                'fecha_actualizacion', u.fecha_actualizacion
            ) as usuarios
        FROM personas p
        LEFT JOIN usuarios u ON p.id_usuario = u.id_usuario
        LEFT JOIN documentos_persona ine ON p.id_persona = ine.id_persona AND ine.tipo_documento = 'ine'
        LEFT JOIN documentos_persona acnac ON p.id_persona = acnac.id_persona AND acnac.tipo_documento = 'acnac'
        LEFT JOIN documentos_persona comdom ON p.id_persona = comdom.id_persona AND comdom.tipo_documento = 'comdom'
        JOIN roles r ON u.id_rol = r.id_rol
        WHERE p.id_usuario = $1 AND u.activo = true
    `;

    const result = await db.query(query, [id_usuario]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

/**
 * Crea un nuevo empleado insertando registros en las tablas 'usuarios', 'direcciones' y 'empleados'.
 * @param {object} data - Datos completos del empleado/usuario incluyendo campos de dirección.
 * @returns {object} - El registro del empleado creado con datos esenciales del usuario.
 */

// CREATE - Crear una nueva persona
async function crearPersona(data) {
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

// UPDATE - Actualizar una persona existente
async function actualizarPersona(id_persona, datosActualizados) {
    // Construir la query dinámicamente basada en los campos proporcionados
    const campos = Object.keys(datosActualizados);
    const valores = Object.values(datosActualizados);

    const setClauses = campos.map((campo, index) => `${campo} = $${index + 1}`);
    valores.push(id_persona); // Para el WHERE

    const query = `
        UPDATE personas 
        SET ${setClauses.join(', ')}
        WHERE id_persona = $${valores.length}
        RETURNING *
    `;

    const result = await db.query(query, valores);
    if (result.rows.length === 0) {
        throw new Error('Persona no encontrada');
    }

    // Obtener la persona completa con datos del usuario
    return await getPersonaPorId(result.rows[0].id_persona);
}

// UPDATE - Actualizar estado de documentación
async function actualizarDocumentacion(id_persona, estado_documentacion) {
    const query = `
        UPDATE personas 
        SET documentacion_verificada = $1
        WHERE id_persona = $2
        RETURNING *
    `;

    const result = await db.query(query, [estado_documentacion, id_persona]);
    if (result.rows.length === 0) {
        throw new Error('Persona no encontrada');
    }

    return await getPersonaPorId(result.rows[0].id_persona);
}

// UPDATE/INSERT - Subir o actualizar documentos de persona
async function subirDocumentosPersona(id_persona, documentos) {
    const results = [];

    for (const doc of documentos) {
        const { tipo_documento, archivo_url } = doc;

        const selectQuery = `
            SELECT * FROM documentos_persona
            WHERE id_persona = $1 AND tipo_documento = $2
        `;
        const selectResult = await db.query(selectQuery, [id_persona, tipo_documento]);

        if (selectResult.rows.length === 0) {
            const insertQuery = `
                INSERT INTO documentos_persona (id_persona, tipo_documento, archivo_url)
                VALUES ($1, $2, $3)
                RETURNING *
            `;
            const insertResult = await db.query(insertQuery, [id_persona, tipo_documento, archivo_url]);
            results.push(insertResult.rows[0]);
        } else {
            const updateQuery = `
                UPDATE documentos_persona
                SET archivo_url = $1
                WHERE id_persona = $2 AND tipo_documento = $3
                RETURNING *
            `;
            const updateResult = await db.query(updateQuery, [archivo_url, id_persona, tipo_documento]);
            results.push(updateResult.rows[0]);
        }
    }

    return results;
}

// UPDATE - Actualizar solo dirección
async function actualizarDireccion(id_persona, datos) {
    const { calle, colonia, ciudad, codigo_postal } = datos;
    const id = Number(id_persona);
    if (!Number.isInteger(id)) throw new Error('id_persona inválido');

    const query = `
    UPDATE personas
    SET calle = $1, colonia = $2, ciudad = $3, codigo_postal = $4
    WHERE id_persona = $5
    RETURNING *;
  `;
    const values = [calle, colonia, ciudad, codigo_postal, id];
    const { rows } = await db.query(query, values);
    return rows[0];
}

// DELETE - Eliminar una persona (esto también eliminará el usuario por CASCADE)
async function eliminarPersona(id_persona) {
    const query = `
        DELETE FROM personas 
        WHERE id_persona = $1
        RETURNING *
    `;

    const result = await db.query(query, [id_persona]);
    if (result.rows.length === 0) {
        throw new Error('Persona no encontrada');
    }

    return result.rows[0];
}

// SEARCH - Buscar personas por nombre de usuario
async function buscarPersonasPorNombre(nombre) {
    const query = `
        SELECT 
            p.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM personas p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE u.nombre ILIKE $1
        AND u.activo = true
        ORDER BY u.nombre
    `;

    const result = await db.query(query, [`%${nombre}%`]);
    return result.rows;
}

// SEARCH - Buscar personas por ciudad
async function getPersonasPorCiudad(ciudad) {
    const query = `
        SELECT 
            p.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM personas p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.ciudad ILIKE $1
        AND u.activo = true
        ORDER BY p.ciudad, u.nombre
    `;

    const result = await db.query(query, [`%${ciudad}%`]);
    return result.rows;
}

// SEARCH - Buscar personas por colonia
async function getPersonasPorColonia(colonia) {
    const query = `
        SELECT 
            p.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM personas p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.colonia ILIKE $1
        AND u.activo = true
        ORDER BY p.colonia, u.nombre
    `;

    const result = await db.query(query, [`%${colonia}%`]);
    return result.rows;
}

// SEARCH - Buscar personas por código postal
async function getPersonasPorCodigoPostal(codigo_postal) {
    const query = `
        SELECT 
            p.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM personas p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.codigo_postal = $1
        AND u.activo = true
        ORDER BY u.nombre
    `;

    const result = await db.query(query, [codigo_postal]);
    return result.rows;
}

// FILTER - Obtener personas por estado de documentación
async function getPersonasPorDocumentacion(estado_documentacion) {
    const query = `
        SELECT 
            p.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM personas p
        INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
        WHERE p.documentacion_verificada = $1
        AND u.activo = true
        ORDER BY p.id_persona DESC
    `;

    const result = await db.query(query, [estado_documentacion]);
    return result.rows;
}

// UTILITY - Verificar si un usuario ya tiene perfil de persona
async function usuarioTienePersona(id_usuario) {
    const query = `
        SELECT id_persona 
        FROM personas 
        WHERE id_usuario = $1
    `;

    const result = await db.query(query, [id_usuario]);
    return result.rows.length > 0;
}

// UTILITY - Obtener estadísticas de personas
async function getEstadisticasPersonas() {
    const queries = {
        total: `
            SELECT COUNT(*) as count 
            FROM personas
        `,
        activas: `
            SELECT COUNT(*) as count 
            FROM personas p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            WHERE u.activo = true
        `,
        porDocumentacion: `
            SELECT p.documentacion_verificada, COUNT(*) as count 
            FROM personas p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            WHERE u.activo = true
            GROUP BY p.documentacion_verificada
        `,
        porCiudad: `
            SELECT p.ciudad, COUNT(*) as count 
            FROM personas p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            WHERE u.activo = true
            GROUP BY p.ciudad
            ORDER BY count DESC
        `
    };

    const [totalResult, activasResult, documentacionResult, ciudadResult] = await Promise.all([
        db.query(queries.total),
        db.query(queries.activas),
        db.query(queries.porDocumentacion),
        db.query(queries.porCiudad)
    ]);

    // Convertir resultados a objeto
    const porDocumentacion = {};
    documentacionResult.rows.forEach(row => {
        porDocumentacion[row.documentacion_verificada] = parseInt(row.count);
    });

    const porCiudad = {};
    ciudadResult.rows.forEach(row => {
        porCiudad[row.ciudad] = parseInt(row.count);
    });

    return {
        total_personas: parseInt(totalResult.rows[0].count),
        personas_activas: parseInt(activasResult.rows[0].count),
        por_documentacion: porDocumentacion,
        por_ciudad: porCiudad
    };
}

// UTILITY - Obtener dirección completa formateada
function formatearDireccionCompleta(persona) {
    return `${persona.calle}, ${persona.colonia}, CP ${persona.codigo_postal}, ${persona.ciudad}`;
}

// UTILITY - Validar código postal (formato básico)
function validarCodigoPostal(codigo_postal) {
    // Validación básica para código postal mexicano (5 dígitos)
    const regex = /^\d{5}$/;
    return regex.test(codigo_postal);
}

module.exports = {
    // READ operations
    getPersonas,
    getPersonasActivas,
    getPersonaPorUsuarioId,

    // CREATE operations
    crearPersona,

    // UPDATE operations
    actualizarPersona,
    actualizarDocumentacion,
    subirDocumentosPersona,
    actualizarDireccion,

    // DELETE operations
    eliminarPersona,

    // SEARCH operations
    buscarPersonasPorNombre,
    getPersonasPorCiudad,
    getPersonasPorColonia,
    getPersonasPorCodigoPostal,
    getPersonasPorDocumentacion,

    // UTILITY operations
    usuarioTienePersona,
    getEstadisticasPersonas,
    formatearDireccionCompleta,
    validarCodigoPostal
};
