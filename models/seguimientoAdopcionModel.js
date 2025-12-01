const db = require('../config/db'); 

// READ - Obtener todos los seguimientos
async function getSeguimientos() {
  const query = `
    SELECT 
      s.id_seguimiento,
      s.id_adopcion,
      s.fecha_seguimiento,
      s.estado_mascota,
      s.observaciones,
      s.requiere_atencion,
      s.siguiente_seguimiento,
      s.fecha_creacion,
      json_build_object(
        'id_usuario', u.id_usuario,
        'nombre', u.nombre,
        'correo_electronico', u.correo_electronico,
        'foto_perfil_base64', u.foto_perfil_base64
      ) AS realizado_por,
      json_build_object(
        'id_adopcion', a.id_adopcion,
        'id_mascota', a.id_mascota,
        'id_persona', NULL,
        'estado_solicitud', a.estado_solicitud,
        'fecha_solicitud', a.fecha_solicitud,
        'fecha_entrega', a.fecha_entrega,
        'mascota', json_build_object(
          'id_mascota', m.id_mascota,
          'nombre', m.nombre,
          'especie', m.especie,
          'raza', m.raza
        ),
        'persona', json_build_object(
          'id_persona', NULL,
          'nombre', up.nombre,
          'telefono', up.telefono,
          'correo_electronico', up.correo_electronico
        )
      ) AS adopcion,
      COALESCE(
        json_agg(
          json_build_object(
            'id_foto', sf.id_foto,
            'url', sf.url,
            'descripcion', sf.descripcion,
            'fecha_creacion', sf.fecha_creacion
          ) ORDER BY sf.fecha_creacion DESC
        ) FILTER (WHERE sf.id_foto IS NOT NULL),
        '[]'::json
      ) AS fotos
    FROM seguimientos_adopcion s
    LEFT JOIN usuarios u ON s.realizado_por = u.id_usuario
    LEFT JOIN adopciones a ON s.id_adopcion = a.id_adopcion
    LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
    LEFT JOIN usuarios up ON a.id_usuario = up.id_usuario
    LEFT JOIN seguimiento_fotos sf ON s.id_seguimiento = sf.id_seguimiento
    GROUP BY 
      s.id_seguimiento, s.id_adopcion, s.fecha_seguimiento, 
      s.estado_mascota, s.observaciones, s.requiere_atencion,
      s.siguiente_seguimiento, s.fecha_creacion,
      u.id_usuario, u.nombre, u.correo_electronico, u.foto_perfil_base64,
      a.id_adopcion, a.id_mascota, a.estado_solicitud,
      a.fecha_solicitud, a.fecha_entrega,
      m.id_mascota, m.nombre, m.especie, m.raza,
      up.nombre, up.telefono, up.correo_electronico
    ORDER BY s.fecha_seguimiento DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener un seguimiento por ID
async function getSeguimientoPorId(id_seguimiento) {
  const query = `
    SELECT 
      s.id_seguimiento,
      s.id_adopcion,
      s.fecha_seguimiento,
      s.estado_mascota,
      s.observaciones,
      s.requiere_atencion,
      s.siguiente_seguimiento,
      s.fecha_creacion,
      json_build_object(
        'id_usuario', u.id_usuario,
        'nombre', u.nombre,
        'correo_electronico', u.correo_electronico,
        'foto_perfil_base64', u.foto_perfil_base64
      ) AS realizado_por,
      json_build_object(
        'id_adopcion', a.id_adopcion,
        'id_mascota', a.id_mascota,
        'id_persona', NULL,
        'estado_solicitud', a.estado_solicitud,
        'fecha_solicitud', a.fecha_solicitud,
        'fecha_entrega', a.fecha_entrega,
        'mascota', json_build_object(
          'id_mascota', m.id_mascota,
          'nombre', m.nombre,
          'especie', m.especie,
          'raza', m.raza
        ),
        'persona', json_build_object(
          'id_persona', NULL,
          'nombre', up.nombre,
          'telefono', up.telefono,
          'correo_electronico', up.correo_electronico
        )
      ) AS adopcion,
      COALESCE(
        json_agg(
          json_build_object(
            'id_foto', sf.id_foto,
            'url', sf.url,
            'descripcion', sf.descripcion,
            'fecha_creacion', sf.fecha_creacion
          ) ORDER BY sf.fecha_creacion DESC
        ) FILTER (WHERE sf.id_foto IS NOT NULL),
        '[]'::json
      ) AS fotos
    FROM seguimientos_adopcion s
    LEFT JOIN usuarios u ON s.realizado_por = u.id_usuario
    LEFT JOIN adopciones a ON s.id_adopcion = a.id_adopcion
    LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
    LEFT JOIN usuarios up ON a.id_usuario = up.id_usuario
    LEFT JOIN seguimiento_fotos sf ON s.id_seguimiento = sf.id_seguimiento
    WHERE s.id_seguimiento = $1
    GROUP BY 
      s.id_seguimiento, s.id_adopcion, s.fecha_seguimiento, 
      s.estado_mascota, s.observaciones, s.requiere_atencion,
      s.siguiente_seguimiento, s.fecha_creacion,
      u.id_usuario, u.nombre, u.correo_electronico, u.foto_perfil_base64,
      a.id_adopcion, a.id_mascota, a.estado_solicitud,
      a.fecha_solicitud, a.fecha_entrega,
      m.id_mascota, m.nombre, m.especie, m.raza,
      up.nombre, up.telefono, up.correo_electronico
  `;
  const result = await db.query(query, [id_seguimiento]);
  return result.rows[0];
}

// READ - Obtener seguimientos por adopción
async function getSeguimientosPorAdopcion(id_adopcion) {
  const query = `
    SELECT 
      s.id_seguimiento,
      s.id_adopcion,
      s.fecha_seguimiento,
      s.estado_mascota,
      s.observaciones,
      s.requiere_atencion,
      s.siguiente_seguimiento,
      s.fecha_creacion,
      json_build_object(
        'id_usuario', u.id_usuario,
        'nombre', u.nombre,
        'correo_electronico', u.correo_electronico,
        'foto_perfil_base64', u.foto_perfil_base64
      ) AS realizado_por,
      json_build_object(
        'id_adopcion', a.id_adopcion,
        'id_mascota', a.id_mascota,
        'id_persona', NULL,
        'estado_solicitud', a.estado_solicitud,
        'fecha_solicitud', a.fecha_solicitud,
        'fecha_entrega', a.fecha_entrega,
        'mascota', json_build_object(
          'id_mascota', m.id_mascota,
          'nombre', m.nombre,
          'especie', m.especie,
          'raza', m.raza
        ),
        'persona', json_build_object(
          'id_persona', NULL,
          'nombre', up.nombre,
          'telefono', up.telefono,
          'correo_electronico', up.correo_electronico
        )
      ) AS adopcion,
      COALESCE(
        json_agg(
          json_build_object(
            'id_foto', sf.id_foto,
            'url', sf.url,
            'descripcion', sf.descripcion,
            'fecha_creacion', sf.fecha_creacion
          ) ORDER BY sf.fecha_creacion DESC
        ) FILTER (WHERE sf.id_foto IS NOT NULL),
        '[]'::json
      ) AS fotos
    FROM seguimientos_adopcion s
    LEFT JOIN usuarios u ON s.realizado_por = u.id_usuario
    LEFT JOIN adopciones a ON s.id_adopcion = a.id_adopcion
    LEFT JOIN mascotas m ON a.id_mascota = m.id_mascota
    LEFT JOIN usuarios up ON a.id_usuario = up.id_usuario
    LEFT JOIN seguimiento_fotos sf ON s.id_seguimiento = sf.id_seguimiento
    WHERE s.id_adopcion = $1
    GROUP BY 
      s.id_seguimiento, s.id_adopcion, s.fecha_seguimiento, 
      s.estado_mascota, s.observaciones, s.requiere_atencion,
      s.siguiente_seguimiento, s.fecha_creacion,
      u.id_usuario, u.nombre, u.correo_electronico, u.foto_perfil_base64,
      a.id_adopcion, a.id_mascota, a.estado_solicitud,
      a.fecha_solicitud, a.fecha_entrega,
      m.id_mascota, m.nombre, m.especie, m.raza,
      up.nombre, up.telefono, up.correo_electronico
    ORDER BY s.fecha_seguimiento DESC
  `;
  const result = await db.query(query, [id_adopcion]);
  return result.rows;
}

// CREATE - Crear un nuevo seguimiento
async function crearSeguimiento(seguimientoData) {
  const { 
    id_adopcion, 
    fecha_seguimiento, 
    estado_mascota, 
    observaciones = null, 
    requiere_atencion = false, 
    siguiente_seguimiento = null, 
    realizado_por = null 
  } = seguimientoData;

  const query = `
    INSERT INTO seguimientos_adopcion (
      id_adopcion, fecha_seguimiento, estado_mascota, observaciones,
      requiere_atencion, siguiente_seguimiento, realizado_por
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const values = [
    id_adopcion, 
    fecha_seguimiento, 
    estado_mascota, 
    observaciones, 
    requiere_atencion, 
    siguiente_seguimiento, 
    realizado_por
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

async function agregarFotosSeguimiento(id_seguimiento, fotos = []) {
  if (!id_seguimiento || !Array.isArray(fotos) || fotos.length === 0) return [];
  const inserts = [];
  for (const foto of fotos) {
    const url = foto?.url || foto?.archivo_base64;
    if (!url) continue;
    const descripcion = foto?.descripcion || null;
    const query = `
      INSERT INTO seguimiento_fotos (id_seguimiento, url, descripcion)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const { rows } = await db.query(query, [id_seguimiento, url, descripcion]);
    if (rows[0]) inserts.push(rows[0]);
  }
  return inserts;
}

// UPDATE - Actualizar un seguimiento existente
async function actualizarSeguimiento(id_seguimiento, datosActualizados) {
  const { 
    fecha_seguimiento, 
    estado_mascota, 
    observaciones, 
    requiere_atencion, 
    siguiente_seguimiento, 
    realizado_por 
  } = datosActualizados;

  const query = `
    UPDATE seguimientos_adopcion
    SET 
      fecha_seguimiento = $1, 
      estado_mascota = $2, 
      observaciones = $3, 
      requiere_atencion = $4, 
      siguiente_seguimiento = $5, 
      realizado_por = $6
    WHERE id_seguimiento = $7
    RETURNING *
  `;
  const values = [
    fecha_seguimiento, 
    estado_mascota, 
    observaciones, 
    requiere_atencion, 
    siguiente_seguimiento, 
    realizado_por, 
    id_seguimiento
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

// DELETE - Eliminar un seguimiento permanentemente
async function eliminarSeguimiento(id_seguimiento) {
  const query = 'DELETE FROM seguimientos_adopcion WHERE id_seguimiento = $1 RETURNING *';
  const result = await db.query(query, [id_seguimiento]);
  return result.rows[0];
}

module.exports = {
  getSeguimientos,
  getSeguimientoPorId,
  getSeguimientosPorAdopcion,
  crearSeguimiento,
  agregarFotosSeguimiento,
  actualizarSeguimiento,
  eliminarSeguimiento
};
