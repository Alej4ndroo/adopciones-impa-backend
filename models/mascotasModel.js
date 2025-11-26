const db = require('../config/db');

// READ - Obtener todas las mascotas con datos del usuario creador
async function getMascotas() {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono
            ) as usuarios,
            COALESCE(json_agg(img.imagen_base64) FILTER (WHERE img.imagen_base64 IS NOT NULL), '[]'::json) as imagenes_base64
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        LEFT JOIN imagenes_mascotas img ON m.id_mascota = img.id_mascota
        
        GROUP BY m.id_mascota, u.id_usuario, u.nombre, u.correo_electronico, u.telefono
        ORDER BY m.fecha_creacion DESC
    `;

    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener solo mascotas activas
async function getMascotasActivas() {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.activo = true
        ORDER BY m.fecha_creacion DESC
    `;

    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener mascotas disponibles para adopción
async function getMascotasDisponibles() {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.estado_adopcion = 'disponible' 
        AND m.activo = true
        ORDER BY m.fecha_ingreso ASC
    `;

    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener mascotas disponibles para adopción
async function getMascotasDisponibles() {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono
            ) as registrado_por
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.estado_adopcion = 'disponible' 
        AND m.activo = true
        ORDER BY m.fecha_ingreso ASC
    `;

    const result = await db.query(query);
    return result.rows;
}

// READ - Obtener SOLO el conteo de mascotas disponibles para adopción
async function countMascotasDisponibles() {
    const query = `
        SELECT 
            COUNT(*) AS count 
        FROM mascotas m
        WHERE m.activo = true;
    `;

    const result = await db.query(query);
    return parseInt(result.rows[0].count, 10);
}

// READ - Obtener una mascota por ID
async function getMascotaPorId(id_mascota) {
    const query = `
        SELECT 
            m.*,
            
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico,
                'telefono', u.telefono
            ) as usuario,
            
            COALESCE(
                (
                    SELECT json_agg(im.imagen_base64)
                    FROM imagenes_mascotas im
                    WHERE im.id_mascota = m.id_mascota
                ),
                '[]'::json 
            ) as imagenes_base64
            
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.id_mascota = $1
    `;

    const result = await db.query(query, [id_mascota]);
    if (result.rows.length === 0) {
        throw new Error('Mascota no encontrada');
    }
    
    return result.rows[0];
}

// CREATE - Crear una nueva mascota
async function crearMascota(mascotaData) {
    const {
        nombre,
        especie,
        raza = null,
        edad_en_meses,
        color,
        tamano,
        sexo,
        esterilizado = false,
        vacunado = false,  
        descripcion = null,
        estado_adopcion = 'disponible',
        fecha_ingreso = new Date().toISOString().split('T')[0],
        creado_por,
        activo = true,
        imagenes_base64 = [] 
    } = mascotaData;

    let id_mascota;

    try {
        // --- 1. Inserción de la Mascota principal (Tabla: mascotas) ---
        const queryMascota = `
            INSERT INTO mascotas (
                nombre, especie, raza, edad_en_meses, color, tamano, 
                sexo, esterilizado, vacunado, descripcion, estado_adopcion, fecha_ingreso, 
                creado_por, activo
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id_mascota
        `;

        const valuesMascota = [
            nombre, especie, raza, edad_en_meses, color, tamano,
            sexo, esterilizado, vacunado, descripcion, estado_adopcion, fecha_ingreso,
            creado_por, activo
        ];

        const resultMascota = await db.query(queryMascota, valuesMascota);
        id_mascota = resultMascota.rows[0].id_mascota;

        if (imagenes_base64 && imagenes_base64.length > 0) {
            
            const insercionDeImagenes = imagenes_base64.map(async (base64String) => {
                const queryImagen = `
                    INSERT INTO imagenes_mascotas (id_mascota, imagen_base64) 
                    VALUES ($1, $2)
                `;
                const valuesImagen = [id_mascota, base64String];
                
                return db.query(queryImagen, valuesImagen);
            });

            await Promise.all(insercionDeImagenes);
        }
        return await getMascotaPorId(id_mascota);

    } catch (error) {
        console.error("Error al crear la mascota o sus imágenes:", error);
        throw error; 
    }
}

// UPDATE - Actualizar una mascota existente
async function actualizarMascota(id_mascota, datosActualizados) {
    // Construir la query dinámicamente basada en los campos proporcionados
    const campos = Object.keys(datosActualizados);
    const valores = Object.values(datosActualizados);

    // Agregar fecha_actualizacion automáticamente
    campos.push('fecha_actualizacion');
    valores.push(new Date().toISOString());

    const setClauses = campos.map((campo, index) => `${campo} = $${index + 1}`);
    valores.push(id_mascota); // Para el WHERE

    const query = `
        UPDATE mascotas 
        SET ${setClauses.join(', ')}
        WHERE id_mascota = $${valores.length}
        RETURNING *
    `;

    const result = await db.query(query, valores);
    if (result.rows.length === 0) {
        throw new Error('Mascota no encontrada');
    }

    // Obtener la mascota completa con datos del usuario
    return await getMascotaPorId(result.rows[0].id_mascota);
}

// UPDATE - Cambiar estado de adopción
async function cambiarEstadoAdopcion(id_mascota, estado_adopcion) {
    const query = `
        UPDATE mascotas 
        SET estado_adopcion = $1, fecha_actualizacion = $2
        WHERE id_mascota = $3
        RETURNING *
    `;

    const result = await db.query(query, [estado_adopcion, new Date().toISOString(), id_mascota]);
    if (result.rows.length === 0) {
        throw new Error('Mascota no encontrada');
    }

    return await getMascotaPorId(result.rows[0].id_mascota);
}

// UPDATE - Marcar mascota como adoptada
async function marcarComoAdoptada(id_mascota) {
    return await cambiarEstadoAdopcion(id_mascota, 'adoptada');
}

// UPDATE - Marcar mascota como en proceso
async function marcarEnProceso(id_mascota) {
    return await cambiarEstadoAdopcion(id_mascota, 'en_proceso');
}

// UPDATE - Hacer disponible para adopción
async function hacerDisponible(id_mascota) {
    return await cambiarEstadoAdopcion(id_mascota, 'disponible');
}

// UPDATE - Cambiar estado activo (soft delete)
async function cambiarEstadoActivo(id_mascota, activo) {
    const query = `
        UPDATE mascotas 
        SET activo = $1, fecha_actualizacion = $2
        WHERE id_mascota = $3
        RETURNING *
    `;

    const result = await db.query(query, [activo, new Date().toISOString(), id_mascota]);
    if (result.rows.length === 0) {
        throw new Error('Mascota no encontrada');
    }

    return result.rows[0];
}

// DELETE - Eliminar una mascota permanentemente
async function eliminarMascota(id_mascota) {
    const query = `
        DELETE FROM mascotas 
        WHERE id_mascota = $1
        RETURNING *
    `;

    const result = await db.query(query, [id_mascota]);
    if (result.rows.length === 0) {
        throw new Error('Mascota no encontrada');
    }

    return result.rows[0];
}

// SEARCH - Buscar mascotas por nombre
async function buscarMascotasPorNombre(nombre) {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.nombre ILIKE $1 
        AND m.activo = true
        ORDER BY m.nombre
    `;

    const result = await db.query(query, [`%${nombre}%`]);
    return result.rows;
}

// FILTER - Obtener mascotas por especie
async function getMascotasPorEspecie(especie) {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.especie = $1 
        AND m.activo = true
        ORDER BY m.fecha_ingreso ASC
    `;

    const result = await db.query(query, [especie]);
    return result.rows;
}

// FILTER - Obtener mascotas por raza
async function getMascotasPorRaza(raza) {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.raza ILIKE $1 
        AND m.activo = true
        ORDER BY m.nombre
    `;

    const result = await db.query(query, [`%${raza}%`]);
    return result.rows;
}

// FILTER - Obtener mascotas por tamaño
async function getMascotasPorTamano(tamano) {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.tamano = $1 
        AND m.activo = true
        ORDER BY m.fecha_ingreso ASC
    `;

    const result = await db.query(query, [tamano]);
    return result.rows;
}

// FILTER - Obtener mascotas por sexo
async function getMascotasPorSexo(sexo) {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.sexo = $1 
        AND m.activo = true
        ORDER BY m.fecha_ingreso ASC
    `;

    const result = await db.query(query, [sexo]);
    return result.rows;
}

// FILTER - Obtener mascotas por rango de edad
async function getMascotasPorEdad(edad_minima, edad_maxima) {
    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE m.edad_en_meses >= $1 
        AND m.edad_en_meses <= $2
        AND m.activo = true
        ORDER BY m.edad_en_meses
    `;

    const result = await db.query(query, [edad_minima, edad_maxima]);
    return result.rows;
}

// FILTER - Búsqueda avanzada con múltiples filtros
async function busquedaAvanzada(filtros) {
    const {
        especie = null,
        tamano = null,
        sexo = null,
        edad_minima = null,
        edad_maxima = null,
        estado_adopcion = 'disponible'
    } = filtros;

    let whereConditions = ['m.activo = true', 'm.estado_adopcion = $1'];
    let values = [estado_adopcion];
    let paramCount = 1;

    if (especie) {
        paramCount++;
        whereConditions.push(`m.especie = $${paramCount}`);
        values.push(especie);
    }

    if (tamano) {
        paramCount++;
        whereConditions.push(`m.tamano = $${paramCount}`);
        values.push(tamano);
    }

    if (sexo) {
        paramCount++;
        whereConditions.push(`m.sexo = $${paramCount}`);
        values.push(sexo);
    }

    if (edad_minima !== null) {
        paramCount++;
        whereConditions.push(`m.edad_en_meses >= $${paramCount}`);
        values.push(edad_minima);
    }

    if (edad_maxima !== null) {
        paramCount++;
        whereConditions.push(`m.edad_en_meses <= $${paramCount}`);
        values.push(edad_maxima);
    }

    const query = `
        SELECT 
            m.*,
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) as usuarios
        FROM mascotas m
        LEFT JOIN usuarios u ON m.creado_por = u.id_usuario
        WHERE ${whereConditions.join(' AND ')}
        ORDER BY m.fecha_ingreso ASC
    `;

    const result = await db.query(query, values);
    return result.rows;
}

// UTILITY - Obtener estadísticas de mascotas
async function getEstadisticasMascotas() {
    const queries = {
        total: `
            SELECT COUNT(*) as count 
            FROM mascotas 
            WHERE activo = true
        `,
        porEspecie: `
            SELECT especie, COUNT(*) as count 
            FROM mascotas 
            WHERE activo = true 
            GROUP BY especie
        `,
        porEstado: `
            SELECT estado_adopcion, COUNT(*) as count 
            FROM mascotas 
            WHERE activo = true 
            GROUP BY estado_adopcion
        `,
        porTamano: `
            SELECT tamano, COUNT(*) as count 
            FROM mascotas 
            WHERE activo = true 
            GROUP BY tamano
        `
    };

    const [totalResult, especieResult, estadoResult, tamanoResult] = await Promise.all([
        db.query(queries.total),
        db.query(queries.porEspecie),
        db.query(queries.porEstado),
        db.query(queries.porTamano)
    ]);

    // Convertir resultados a objeto
    const porEspecie = {};
    especieResult.rows.forEach(row => {
        porEspecie[row.especie] = parseInt(row.count);
    });

    const porEstadoAdopcion = {};
    estadoResult.rows.forEach(row => {
        porEstadoAdopcion[row.estado_adopcion] = parseInt(row.count);
    });

    const porTamano = {};
    tamanoResult.rows.forEach(row => {
        porTamano[row.tamano] = parseInt(row.count);
    });

    return {
        total_mascotas: parseInt(totalResult.rows[0].count),
        por_especie: porEspecie,
        por_estado_adopcion: porEstadoAdopcion,
        por_tamano: porTamano
    };
}

// UTILITY - Convertir edad de meses a años y meses
function convertirEdad(edad_en_meses) {
    const años = Math.floor(edad_en_meses / 12);
    const meses = edad_en_meses % 12;

    if (años === 0) {
        return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else if (meses === 0) {
        return `${años} ${años === 1 ? 'año' : 'años'}`;
    } else {
        return `${años} ${años === 1 ? 'año' : 'años'} y ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
}

// UTILITY - Obtener mascotas por usuario creador
async function getMascotasPorCreador(creado_por) {
    const query = `
        SELECT * 
        FROM mascotas 
        WHERE creado_por = $1 
        AND activo = true
        ORDER BY fecha_creacion DESC
    `;

    const result = await db.query(query, [creado_por]);
    return result.rows;
}

module.exports = {
    // READ operations
    getMascotas,
    getMascotasActivas,
    getMascotasDisponibles,
    countMascotasDisponibles,
    getMascotaPorId,
    getMascotasPorCreador,

    // CREATE operations
    crearMascota,

    // UPDATE operations
    actualizarMascota,
    cambiarEstadoAdopcion,
    marcarComoAdoptada,
    marcarEnProceso,
    hacerDisponible,
    cambiarEstadoActivo,

    // DELETE operations
    eliminarMascota,

    // SEARCH operations
    buscarMascotasPorNombre,
    getMascotasPorEspecie,
    getMascotasPorRaza,
    getMascotasPorTamano,
    getMascotasPorSexo,
    getMascotasPorEdad,
    busquedaAvanzada,

    // UTILITY operations
    getEstadisticasMascotas,
    convertirEdad
};
