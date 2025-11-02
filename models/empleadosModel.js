const db = require('../config/db');
const bcrypt = require('bcrypt');

// READ - Obtener todos los empleados con datos del usuario
async function getEmpleados() {
    const query = `
        SELECT 
            e.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo,
                'fecha_creacion', u.fecha_creacion
            ) as usuarios
        FROM empleados e
        LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
        ORDER BY e.fecha_contratacion DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener todos los empleados con datos del usuario
async function getVeterinarios() {
    const query = `
        SELECT 
            e.id_empleado,
            e.numero_empleado,
            e.licenciatura,
            e.especialidad,
            e.cedula_profesional,
            u.id_usuario,
            u.nombre,
            u.correo_electronico,
            u.telefono
        FROM empleados e
        JOIN usuarios u ON e.id_usuario = u.id_usuario
        WHERE u.id_rol = 3 AND u.activo = TRUE -- Filtra por rol de veterinario (id=3)
        ORDER BY u.nombre;
    `;
    
    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener solo empleados activos
async function getEmpleadosActivos() {
    const query = `
        SELECT 
            e.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo,
                'fecha_creacion', u.fecha_creacion
            ) as usuario
        FROM empleados e
        INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
        WHERE u.activo = true
        ORDER BY e.fecha_contratacion DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener un empleado por ID
/**
 * @param {number} id_usuario - El ID del usuario a buscar.
 * @returns {Promise<object|null>} El objeto del empleado o null si no se encuentra.
 */
async function obtenerPerfil(id_usuario) {
    const client = await db.connect();
    
    const selectQuery = `
        SELECT 
            -- Campos de Empleados (e)
            e.id_empleado,
            e.numero_empleado,
            e.fecha_contratacion,
            e.cedula_profesional,
            e.licenciatura,
            e.especialidad,
            e.activo AS empleado_activo,
            
            -- Campos de Usuarios (u)
            u.id_usuario,
            u.nombre,
            u.correo_electronico,
            u.fecha_nacimiento,
            u.telefono,
            u.foto_perfil_base64,
            u.id_rol,
            u.documentacion_verificada,
            u.activo AS usuario_activo,
            
            -- Campos de Direcciones (d)
            d.id_direccion,
            d.calle,
            d.colonia,
            d.codigo_postal,
            d.ciudad,
            d.estado,
            d.pais,
            d.tipo_direccion
            
        FROM 
            usuarios u
        JOIN 
            empleados e ON u.id_usuario = e.id_usuario
        LEFT JOIN 
            direcciones d ON u.id_usuario = d.id_usuario AND d.es_principal = true
        WHERE 
            u.id_usuario = $1; -- 🚨 CAMBIO CLAVE AQUÍ
    `;
    
    // 

    try {
        // 2. 🚀 Ejecutar la Consulta
        const result = await client.query(selectQuery, [id_usuario]);
        
        // 3. 📤 Devolver el Resultado
        if (result.rows.length > 0) {
            return result.rows[0]; // Devuelve el perfil del empleado encontrado
        } else {
            return null; // No se encontró ningún empleado con ese ID de usuario
        }
        
    } catch (error) {
        console.error("Error al obtener empleado por ID de usuario:", error);
        throw error; 
    } finally {
        client.release(); // 🔄 LIBERA LA CONEXIÓN
    }
}

// READ - Obtener empleado por número de empleado
async function getEmpleadoPorNumero(numero_empleado) {
    const query = `
        SELECT 
            e.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM empleados e
        LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
        WHERE e.numero_empleado = $1
    `;
    
    const result = await db.query(query, [numero_empleado]);
    if (result.rows.length === 0) {
        throw new Error('Empleado no encontrado');
    }
    return result.rows[0];
}

/**
 * Crea un nuevo empleado insertando registros en las tablas 'usuarios', 'direcciones' y 'empleados'.
 * @param {object} data - Datos completos del empleado/usuario incluyendo campos de dirección.
 * @returns {object} - El registro del empleado creado con datos esenciales del usuario.
 */

async function crearEmpleado(data) {
    const {
        // Datos de USUARIOS (Tabla 1)
        nombre,
        correo_electronico,
        contrasena,
        fecha_nacimiento,
        telefono,
        foto_perfil_base64 = null, // Usando TEXT según tu tabla
        id_rol, // Requerido
        documentacion_verificada = 'pendiente',
        activo = true,
        
        // Datos de DIRECCIONES (Tabla 2) - Se asume que es la dirección principal
        calle,
        colonia,
        codigo_postal,
        ciudad,
        estado = 'Michoacan',
        pais = 'México',
        tipo_direccion = 'domicilio',
        es_principal = true,

        // Datos de EMPLEADOS (Tabla 3)
        numero_empleado,
        cedula_profesional, // Opcional
        licenciatura,
        especialidad, // Opcional
        // activo (se omite para evitar redundancia, pero lo incluyo por si lo usas)
    } = data;

    const client = await db.connect();
    
    try {
        await client.query('BEGIN'); // 🚩 INICIA LA TRANSACCIÓN

        // 1. 🔑 Hashear la Contraseña
        // Se recomienda un costo de 10 o más
        const hashedPassword = await bcrypt.hash(contrasena, 10);

        // 2. 👥 Insertar en la tabla 'usuarios'
        const userInsertQuery = `
            INSERT INTO usuarios (
                nombre, correo_electronico, contrasena, fecha_nacimiento, telefono, 
                foto_perfil_base64, id_rol, activo, documentacion_verificada
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_usuario, nombre
        `;
        
        const userResult = await client.query(userInsertQuery, [
            nombre,
            correo_electronico,
            hashedPassword, // <-- GUARDAMOS EL HASH
            fecha_nacimiento,
            telefono,
            foto_perfil_base64,
            id_rol,
            activo,
            documentacion_verificada
        ]);
        
        const newUserId = userResult.rows[0].id_usuario;

        // 3. 🏠 Insertar en la tabla 'direcciones'
        const addressInsertQuery = `
            INSERT INTO direcciones (
                id_usuario, calle, colonia, codigo_postal, ciudad, 
                estado, pais, tipo_direccion, es_principal
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id_direccion
        `;
        
        await client.query(addressInsertQuery, [
            newUserId,
            calle,
            colonia,
            codigo_postal,
            ciudad,
            estado,
            pais,
            tipo_direccion,
            es_principal
        ]);

        // 4. 💼 Insertar en la tabla 'empleados'
        // NOTA: Tu tabla 'empleados' tiene el campo 'activo', lo incluimos para ser exactos.
        const employeeInsertQuery = `
            INSERT INTO empleados (
                id_usuario, numero_empleado, fecha_contratacion, cedula_profesional, 
                licenciatura, especialidad, activo
            )
            VALUES ($1, $2, NOW(), $3, $4, $5, $6)
            RETURNING id_empleado
        `;
        
        const employeeResult = await client.query(employeeInsertQuery, [
            newUserId,
            numero_empleado,
            cedula_profesional,
            licenciatura,
            especialidad,
            activo
        ]);
        
        const newEmployeeId = employeeResult.rows[0].id_empleado;

        // 5. Obtener y Devolver el registro completo
        const selectQuery = `
            SELECT 
                e.*,
                u.nombre,
                u.correo_electronico
            FROM empleados e
            JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE e.id_empleado = $1
        `;
        
        const selectResult = await client.query(selectQuery, [newEmployeeId]);
        
        await client.query('COMMIT'); // ✅ CONFIRMA LA TRANSACCIÓN
        return selectResult.rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK'); // ❌ DESHACE TODO SI ALGO FALLA
        console.error("Error al crear empleado. Se ejecutó ROLLBACK.", error);
        throw error;
    } finally {
        client.release(); // 🔄 LIBERA LA CONEXIÓN
    }
}

// UPDATE - Actualizar un empleado existente
async function actualizarEmpleado(id_empleado, datosActualizados) {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // Construir query dinámicamente
        const campos = Object.keys(datosActualizados);
        const valores = Object.values(datosActualizados);
        const placeholders = campos.map((_, index) => `$${index + 2}`).join(', ');
        const setClauses = campos.map((campo, index) => `${campo} = $${index + 2}`).join(', ');
        
        const updateQuery = `
            UPDATE empleados 
            SET ${setClauses}
            WHERE id_empleado = $1
            RETURNING *
        `;
        
        await client.query(updateQuery, [id_empleado, ...valores]);
        
        // Obtener datos completos actualizados
        const selectQuery = `
            SELECT 
                e.*,
                json_build_object(
                    'id_usuario', u.id_usuario,
                    'nombre', u.nombre,
                    'correo_electronico', u.correo_electronico,
                    'telefono', u.telefono,
                    'activo', u.activo
                ) as usuarios
            FROM empleados e
            LEFT JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE e.id_empleado = $1
        `;
        
        const selectResult = await client.query(selectQuery, [id_empleado]);
        
        await client.query('COMMIT');
        
        if (selectResult.rows.length === 0) {
            throw new Error('Empleado no encontrado');
        }
        
        return selectResult.rows[0];
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// DELETE - Eliminar un empleado (esto también eliminará el usuario por CASCADE si está configurado)
async function eliminarEmpleado(id_empleado) {
    const query = `
        DELETE FROM empleados 
        WHERE id_empleado = $1 
        RETURNING *
    `;
    
    const result = await db.query(query, [id_empleado]);
    if (result.rows.length === 0) {
        throw new Error('Empleado no encontrado');
    }
    return result.rows[0];
}

// SEARCH - Buscar empleados por licenciatura
async function getEmpleadosPorCargo(licenciatura) {
    const query = `
        SELECT 
            e.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM empleados e
        INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
        WHERE e.licenciatura ILIKE $1 AND u.activo = true
        ORDER BY e.fecha_contratacion DESC
    `;
    
    const result = await db.query(query, [`%${licenciatura}%`]);
    return result.rows;
}

// SEARCH - Buscar empleados por nombre
async function buscarEmpleadosPorNombre(nombre) {
    const query = `
        SELECT 
            e.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono,
                'activo', u.activo
            ) as usuarios
        FROM empleados e
        INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
        WHERE u.nombre ILIKE $1 AND u.activo = true
        ORDER BY u.nombre
    `;
    
    const result = await db.query(query, [`%${nombre}%`]);
    return result.rows;
}

// UTILITY - Verificar si existe un número de empleado
async function existeNumeroEmpleado(numero_empleado, excluirId = null) {
    let query = `
        SELECT id_empleado 
        FROM empleados 
        WHERE numero_empleado = $1
    `;
    let params = [numero_empleado];
    
    if (excluirId) {
        query += ` AND id_empleado != $2`;
        params.push(excluirId);
    }
    
    const result = await db.query(query, params);
    return result.rows.length > 0;
}

// UTILITY - Generar número de empleado automático
async function generarNumeroEmpleado() {
    const año = new Date().getFullYear().toString().slice(-2);
    
    // Obtener el último número de empleado del año actual
    const query = `
        SELECT numero_empleado 
        FROM empleados 
        WHERE numero_empleado LIKE $1
        ORDER BY numero_empleado DESC 
        LIMIT 1
    `;
    
    const result = await db.query(query, [`${año}%`]);
    
    let siguienteNumero = 1;
    if (result.rows.length > 0) {
        const ultimoNumero = result.rows[0].numero_empleado;
        const numeroSecuencial = parseInt(ultimoNumero.slice(-4));
        siguienteNumero = numeroSecuencial + 1;
    }
    
    // Formato: AANNNN (año + número secuencial de 4 dígitos)
    return `${año}${siguienteNumero.toString().padStart(4, '0')}`;
}

// UTILITY - Obtener estadísticas de empleados
async function getEstadisticasEmpleados() {
    const client = await db.connect();
    
    try {
        // Total de empleados
        const totalQuery = `SELECT COUNT(*) as total FROM empleados`;
        const totalResult = await client.query(totalQuery);
        
        // Empleados activos
        const activosQuery = `
            SELECT COUNT(*) as activos 
            FROM empleados e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE u.activo = true
        `;
        const activosResult = await client.query(activosQuery);
        
        // Empleados por licenciatura
        const cargoQuery = `
            SELECT e.licenciatura, COUNT(*) as cantidad
            FROM empleados e
            INNER JOIN usuarios u ON e.id_usuario = u.id_usuario
            WHERE u.activo = true
            GROUP BY e.licenciatura
        `;
        const cargoResult = await client.query(cargoQuery);
        
        // Convertir resultado de cargos a objeto
        const cargoCount = {};
        cargoResult.rows.forEach(row => {
            cargoCount[row.licenciatura] = parseInt(row.cantidad);
        });
        
        return {
            total_empleados: parseInt(totalResult.rows[0].total),
            empleados_activos: parseInt(activosResult.rows[0].activos),
            empleados_por_cargo: cargoCount
        };
        
    } finally {
        client.release();
    }
}

module.exports = { 
    // READ operations
    getEmpleados,
    getEmpleadosActivos,
    obtenerPerfil,
    getEmpleadoPorNumero,
    getEmpleadosPorCargo,
    getVeterinarios,
    
    // CREATE operations
    crearEmpleado,
    
    // UPDATE operations
    actualizarEmpleado,
    
    // DELETE operations
    eliminarEmpleado,
    
    // SEARCH operations
    buscarEmpleadosPorNombre,
    
    // UTILITY operations
    existeNumeroEmpleado,
    generarNumeroEmpleado,
    getEstadisticasEmpleados
};