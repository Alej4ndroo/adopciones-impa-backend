const db = require('../config/db');

/**
 * Obtiene todas las solicitudes de adopción con datos anidados del adoptante, usuario y mascota.
 */
const getAdopciones = async () => {
    const query = `
        SELECT 
            a.id_adopcion, 
            a.fecha_solicitud, 
            a.estado, 
            a.estado_solicitud, 
            a.documentos_verificados, 
            a.fecha_entrega,
            a.motivo_adopcion,
            
            -- Objeto anidado de Mascota
            json_build_object(
                'id_mascota', m.id_mascota,
                'nombre', m.nombre,
                'especie', m.especie,
                'raza', m.raza
            ) AS mascota,
            
            -- Objeto anidado de Adoptante (Usuario)
            json_build_object(
                'id_usuario', u.id_usuario,
                'nombre', u.nombre,
                'correo_electronico', u.correo_electronico
            ) AS usuario, 
            
            -- Objeto anidado del Usuario que procesó la solicitud
            json_build_object(
                'id_usuario', u_p.id_usuario,
                'nombre', u_p.nombre,
                'correo_electronico', u_p.correo_electronico
            ) AS procesado_por
        FROM adopciones a
        LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario
        LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
        LEFT JOIN usuarios u_p ON a.procesado_por = u_p.id_usuario
        ORDER BY a.fecha_solicitud DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
};

/**
 * Obtiene adopciones filtradas por estado, con datos anidados de adoptante y mascota.
 */
const getAdopcionesPorEstado = async (estado) => {
    const query = `
        SELECT 
            a.id_adopcion, 
            a.fecha_solicitud, 
            a.estado, 
            a.estado_solicitud,
            
            json_build_object(
                'id_persona', p.id_persona,
                'nombre', u_a.nombre,
                'correo_electronico', u_a.correo_electronico
            ) AS adoptante,
            
            json_build_object(
                'id_mascota', m.id_mascota,
                'nombre', m.nombre,
                'especie', m.especie
            ) AS mascota
        FROM adopciones a
        LEFT JOIN personas p ON a.id_persona = p.id_persona
        LEFT JOIN usuarios u_a ON p.id_usuario = u_a.id_usuario -- Usuario del Adoptante
        LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
        WHERE a.estado = $1
        ORDER BY a.fecha_solicitud DESC
    `;
    
    const result = await db.query(query, [estado]);
    return result.rows;
};

/**
 * Obtiene una adopción específica por ID con todos los detalles anidados.
 */
const getAdopcionPorId = async (id) => {
    const query = `
        SELECT 
            a.*, -- Todos los campos de Adopciones
            
            -- Objeto anidado de Adoptante (Persona y su Usuario)
            json_build_object(
                'id_persona', p.id_persona,
                'calle', p.calle,
                'colonia', p.colonia,
                'codigo_postal', p.codigo_postal,
                'ciudad', p.ciudad,
                'documentacion_verificada', p.documentacion_verificada,
                'usuario', json_build_object(
                    'id_usuario', u_a.id_usuario,
                    'nombre', u_a.nombre,
                    'correo_electronico', u_a.correo_electronico,
                    'telefono', u_a.telefono
                )
            ) AS adoptante,
            
            -- Objeto anidado de Mascota
            json_build_object(
                'id_mascota', m.id_mascota,
                'nombre', m.nombre,
                'especie', m.especie,
                'raza', m.raza,
                'edad_en_meses', m.edad_en_meses,
                'color', m.color,
                'tamano', m.tamano,
                'sexo', m.sexo
            ) AS mascota,
            
            -- Objeto anidado del Usuario que procesó la solicitud
            json_build_object(
                'id_usuario', u_p.id_usuario,
                'nombre', u_p.nombre,
                'correo_electronico', u_p.correo_electronico
            ) AS procesado_por

        FROM adopciones a
        LEFT JOIN personas p ON a.id_persona = p.id_persona
        LEFT JOIN usuarios u_a ON p.id_usuario = u_a.id_usuario -- Usuario del Adoptante
        LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
        LEFT JOIN usuarios u_p ON a.procesado_por = u_p.id_usuario -- Usuario Procesador
        WHERE a.id_adopcion = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
};

/**
 * Obtiene todas las adopciones de una persona específica con datos anidados de la mascota.
 */
const getAdopcionesPorUsuario = async (id_usuario) => {
  const query = `
    SELECT 
        a.id_adopcion,
        a.fecha_solicitud,
        a.estado,
        a.estado_solicitud,
        a.documentos_verificados,
        a.fecha_entrega,
        a.motivo_adopcion,
        json_build_object(
            'id_mascota', m.id_mascota,
            'nombre', m.nombre,
            'especie', m.especie,
            'raza', m.raza
        ) AS mascota
    FROM adopciones a
    LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
    WHERE a.id_usuario = $1
    ORDER BY a.fecha_solicitud DESC
  `;

  const result = await db.query(query, [id_usuario]);
  return result.rows;
};

/**
 * Obtiene el historial de adopciones de una mascota, anidando la información del adoptante (persona/usuario) y el procesador.
 */
const getAdopcionesPorMascota = async (idMascota) => {
    const query = `
        SELECT 
            a.*,
            
            -- Objeto anidado de Adoptante (Persona y su Usuario)
            json_build_object(
                'id_persona', p.id_persona,
                'calle', p.calle,
                'usuario', json_build_object(
                    'id_usuario', u_a.id_usuario,
                    'nombre', u_a.nombre,
                    'telefono', u_a.telefono,
                    'correo_electronico', u_a.correo_electronico
                )
            ) AS adoptante,
            
            -- Objeto anidado del Usuario que procesó la solicitud
            json_build_object(
                'id_usuario', u_p.id_usuario,
                'nombre', u_p.nombre,
                'correo_electronico', u_p.correo_electronico
            ) AS procesado_por

        FROM adopciones a
        LEFT JOIN personas p ON a.id_persona = p.id_persona
        LEFT JOIN usuarios u_a ON p.id_usuario = u_a.id_usuario -- Usuario del Adoptante
        LEFT JOIN usuarios u_p ON a.procesado_por = u_p.id_usuario -- Usuario Procesador
        WHERE a.id_mascota = $1
        ORDER BY a.fecha_solicitud DESC
    `;
    
    const result = await db.query(query, [idMascota]);
    return result.rows;
};

/**
 * Obtiene adopciones pendientes de verificación de documentos, anidando la info de adoptante y mascota.
 */
const getAdopcionesPendientesDocumentos = async () => {
    const query = `
        SELECT 
            a.id_adopcion, 
            a.fecha_solicitud, 
            a.estado_solicitud,
            a.ubicacion_en_hogar,
            a.motivo_adopcion,
            
            json_build_object(
                'id_persona', p.id_persona,
                'usuario', json_build_object(
                    'nombre', u_a.nombre,
                    'telefono', u_a.telefono,
                    'correo_electronico', u_a.correo_electronico
                )
            ) AS adoptante,
            
            json_build_object(
                'id_mascota', m.id_mascota,
                'nombre', m.nombre,
                'especie', m.especie
            ) AS mascota
        FROM adopciones a
        LEFT JOIN personas p ON a.id_persona = p.id_persona
        LEFT JOIN usuarios u_a ON p.id_usuario = u_a.id_usuario -- Usuario del Adoptante
        LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
        WHERE a.documentos_verificados = FALSE 
        AND a.estado_solicitud = 'en_revision'
        ORDER BY a.fecha_solicitud ASC
    `;
    
    const result = await db.query(query);
    return result.rows;
};

// ==================== CREATE OPERATIONS ====================

/**
 * Crea una nueva solicitud de adopción
 */
const crearSolicitudAdopcion = async (datosAdopcion) => {
    const {
        id_persona,
        id_mascota,
        motivo_adopcion,
        ubicacion_en_hogar,
        observaciones
    } = datosAdopcion;
    
    const query = `
        INSERT INTO adopciones (
            id_persona,
            id_mascota,
            motivo_adopcion,
            ubicacion_en_hogar,
            observaciones,
            estado,
            estado_solicitud,
            documentos_verificados
        ) VALUES ($1, $2, $3, $4, $5, 'en_proceso', 'en_revision', FALSE)
        RETURNING *
    `;
    
    const values = [
        id_persona,
        id_mascota,
        motivo_adopcion,
        ubicacion_en_hogar,
        observaciones
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
};

// ==================== UPDATE OPERATIONS ====================

/**
 * Actualiza información general de una adopción
 */
const actualizarAdopcion = async (id, datosActualizados) => {
    const campos = [];
    const valores = [];
    let contador = 1;
    
    // Construir dinámicamente la query según los campos proporcionados
    for (const [key, value] of Object.entries(datosActualizados)) {
        if (value !== undefined) {
            campos.push(`${key} = $${contador}`);
            valores.push(value);
            contador++;
        }
    }
    
    if (campos.length === 0) {
        throw new Error('No hay campos para actualizar');
    }
    
    valores.push(id);
    
    const query = `
        UPDATE adopciones 
        SET ${campos.join(', ')}
        WHERE id_adopcion = $${contador}
        RETURNING *
    `;
    
    const result = await db.query(query, valores);
    return result.rows[0];
};

/**
 * Aprueba una solicitud de adopción
 */
const aprobarAdopcion = async (id, datosAprobacion) => {
    const {
        fecha_entrega,
        procesado_por,
        observaciones
    } = datosAprobacion;
      
    const query = `
        UPDATE adopciones 
        SET 
            estado = 'adoptado', -- Cambiado de 'completada' a 'adoptado' para ser coherente con el ENUM
            estado_solicitud = 'aprobada',
            fecha_entrega = COALESCE($1, CURRENT_TIMESTAMP),
            procesado_por = $2,
            observaciones = COALESCE($3, observaciones),
            documentos_verificados = TRUE
        WHERE id_adopcion = $4
        RETURNING *
    `;
    
    const values = [fecha_entrega, procesado_por, observaciones, id];
    const result = await db.query(query, values);
    return result.rows[0];
};

/**
 * Rechaza una solicitud de adopción
 */
const rechazarAdopcion = async (id, datosRechazo) => {
    const {
        procesado_por,
        observaciones
    } = datosRechazo;
    
    const query = `
        UPDATE adopciones 
        SET 
            estado = 'disponible', -- La mascota vuelve a estar disponible
            estado_solicitud = 'rechazada',
            procesado_por = $1,
            observaciones = $2
        WHERE id_adopcion = $3
        RETURNING *
    `;
    
    const values = [procesado_por, observaciones, id];
    const result = await db.query(query, values);
    return result.rows[0];
};

/**
 * Marca los documentos como verificados
 */
const verificarDocumentos = async (id, procesadoPor) => {
    const query = `
        UPDATE adopciones 
        SET 
            documentos_verificados = TRUE,
            procesado_por = $1
        WHERE id_adopcion = $2
        RETURNING *
    `;
    
    const result = await db.query(query, [procesadoPor, id]);
    return result.rows[0];
};

/**
 * Registra la devolución de una mascota adoptada
 */
const registrarDevolucion = async (id, datosDevolucion) => {
    const {
        motivo_devolucion,
        fecha_devolucion,
        procesado_por,
        observaciones
    } = datosDevolucion;
    
    const query = `
        UPDATE adopciones 
        SET 
            estado = 'disponible', -- Cambiado para que la mascota regrese a disponible
            motivo_devolucion = $1,
            fecha_devolucion = COALESCE($2, CURRENT_TIMESTAMP),
            procesado_por = $3,
            observaciones = COALESCE($4, observaciones)
        WHERE id_adopcion = $5
        RETURNING *
    `;
    
    const values = [
        motivo_devolucion,
        fecha_devolucion,
        procesado_por,
        observaciones,
        id
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
};

// ==================== DELETE OPERATIONS ====================

/**
 * Elimina una adopción (usar con precaución)
 */
const eliminarAdopcion = async (id) => {
    const query = 'DELETE FROM adopciones WHERE id_adopcion = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
};

// ==================== UTILITY OPERATIONS ====================

/**
 * Obtiene estadísticas generales de adopciones
 */
const getEstadisticasAdopciones = async () => {
    const query = `
        SELECT 
            COUNT(*) as total_adopciones,
            COUNT(*) FILTER (WHERE estado = 'adoptado') as completadas,
            COUNT(*) FILTER (WHERE estado = 'en_proceso') as en_proceso,
            COUNT(*) FILTER (WHERE estado = 'cancelada') as canceladas,
            COUNT(*) FILTER (WHERE estado = 'disponible' AND fecha_devolucion IS NOT NULL) as devueltas,
            COUNT(*) FILTER (WHERE estado_solicitud = 'en_revision') as en_revision,
            COUNT(*) FILTER (WHERE estado_solicitud = 'aprobada') as aprobadas,
            COUNT(*) FILTER (WHERE estado_solicitud = 'rechazada') as rechazadas,
            COUNT(*) FILTER (WHERE documentos_verificados = FALSE AND estado_solicitud = 'en_revision') as sin_documentos,
            ROUND(AVG(CASE 
                WHEN fecha_entrega IS NOT NULL 
                THEN EXTRACT(EPOCH FROM (fecha_entrega - fecha_solicitud))/86400 
            END), 2) as dias_promedio_entrega
        FROM adopciones
    `;
    
    const result = await db.query(query);
    return result.rows[0];
};

/**
 * Calcula el tiempo promedio de adopción por estado
 */
const getTiempoPromedioAdopcion = async () => {
    const query = `
        SELECT 
            estado,
            COUNT(*) as cantidad,
            ROUND(AVG(
                EXTRACT(EPOCH FROM (
                    COALESCE(fecha_entrega, CURRENT_TIMESTAMP) - fecha_solicitud
                ))/86400
            ), 2) as dias_promedio
        FROM adopciones
        GROUP BY estado
        ORDER BY cantidad DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
};

/**
 * Verifica si una persona puede adoptar (no tiene adopciones en proceso)
 */
const puedeAdoptar = async (idPersona) => {
    const query = `
        SELECT COUNT(*) as adopciones_activas
        FROM adopciones
        WHERE id_persona = $1 
        AND estado IN ('en_proceso')
        AND estado_solicitud = 'en_revision'
    `;
    
    const result = await db.query(query, [idPersona]);
    const adopcionesActivas = parseInt(result.rows[0].adopciones_activas);
    
    return {
        puede_adoptar: adopcionesActivas === 0,
        adopciones_activas: adopcionesActivas,
        mensaje: adopcionesActivas > 0 
            ? 'Ya tiene una solicitud de adopción en proceso' 
            : 'Puede realizar una nueva solicitud'
    };
};

/**
 * Obtiene el historial completo de una mascota con detalles anidados del adoptante.
 */
const getHistorialMascota = async (idMascota) => {
    const query = `
        SELECT 
            a.*,
            -- Objeto anidado de Adoptante (Persona y su Usuario)
            json_build_object(
                'id_persona', p.id_persona,
                'calle', p.calle,
                'usuario', json_build_object(
                    'nombre', u_a.nombre,
                    'telefono', u_a.telefono,
                    'correo_electronico', u_a.correo_electronico
                )
            ) AS adoptante,
            
            json_build_object(
                'id_usuario', u_p.id_usuario,
                'nombre', u_p.nombre
            ) AS procesado_por,
            
            EXTRACT(EPOCH FROM (
                COALESCE(fecha_entrega, CURRENT_TIMESTAMP) - fecha_solicitud
            ))/86400 as dias_en_proceso
        FROM adopciones a
        LEFT JOIN personas p ON a.id_persona = p.id_persona
        LEFT JOIN usuarios u_a ON p.id_usuario = u_a.id_usuario -- Usuario del Adoptante
        LEFT JOIN usuarios u_p ON a.procesado_por = u_p.id_usuario -- Usuario Procesador
        WHERE a.id_mascota = $1
        ORDER BY a.fecha_solicitud DESC
    `;
    
    const result = await db.query(query, [idMascota]);
    
    // Calcular estadísticas del historial
    const estadisticas = {
        total_adopciones: result.rows.length,
        adopciones_exitosas: result.rows.filter(a => a.estado === 'adoptado').length,
        devoluciones: result.rows.filter(a => a.estado === 'disponible' && a.fecha_devolucion).length,
        historial: result.rows
    };
    
    return estadisticas;
};

/**
 * Valida que las fechas de adopción sean coherentes
 */
const validarFechasAdopcion = async (id) => {
    const query = `
        SELECT 
            fecha_solicitud,
            fecha_entrega,
            fecha_devolucion,
            CASE 
                WHEN fecha_entrega < fecha_solicitud THEN FALSE
                WHEN fecha_devolucion IS NOT NULL AND fecha_devolucion < fecha_entrega THEN FALSE
                ELSE TRUE
            END as fechas_validas
        FROM adopciones
        WHERE id_adopcion = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
};

/**
 * Calcula los días que lleva una adopción en proceso
 */
const calcularDiasEnProceso = async (id) => {
    const query = `
        SELECT 
            id_adopcion,
            fecha_solicitud,
            fecha_entrega,
            estado,
            ROUND(EXTRACT(EPOCH FROM (
                COALESCE(fecha_entrega, CURRENT_TIMESTAMP) - fecha_solicitud
            ))/86400, 2) as dias_en_proceso
        FROM adopciones
        WHERE id_adopcion = $1
    `;
    
    const result = await db.query(query, [id]);
    return result.rows[0];
};

// ==================== EXPORTS ====================

module.exports = {
    // READ operations
    getAdopciones,
    getAdopcionesPorEstado,
    getAdopcionPorId,
    getAdopcionesPorUsuario,
    getAdopcionesPorMascota,
    getAdopcionesPendientesDocumentos,
    
    // CREATE operations
    crearSolicitudAdopcion,
    
    // UPDATE operations
    actualizarAdopcion,
    aprobarAdopcion,
    rechazarAdopcion,
    verificarDocumentos,
    registrarDevolucion,
    
    // DELETE operations
    eliminarAdopcion,
    
    // UTILITY operations
    getEstadisticasAdopciones,
    getTiempoPromedioAdopcion,
    puedeAdoptar,
    getHistorialMascota,
    validarFechasAdopcion,
    calcularDiasEnProceso
};
