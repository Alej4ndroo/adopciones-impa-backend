const db = require('../config/db');

// READ - Obtener todas las citas con información completa
async function getCitas() {
  const query = `
    SELECT 
      c.*,
      json_build_object(
        'id_usuario', u.id_usuario,
        'nombre', u.nombre,
        'correo_electronico', u.correo_electronico,
        'telefono', u.telefono
      ) AS usuario,
      json_build_object(
        'id_mascota', m.id_mascota,
        'nombre', m.nombre,
        'especie', m.especie,
        'raza', m.raza
      ) AS mascota,
      json_build_object(
        'id_empleado', e.id_empleado,
        'numero_empleado', e.numero_empleado,
        'nombre', u_emp.nombre,
        'especialidad', e.especialidad
      ) AS empleado,
      json_build_object(
        'id_servicio', s.id_servicio,
        'nombre', s.nombre,
        'descripcion', s.descripcion,
        'costo_base', s.costo_base
      ) AS servicio
    FROM citas c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
    LEFT JOIN empleados e ON c.id_empleado = e.id_empleado
    LEFT JOIN usuarios u_emp ON e.id_usuario = u_emp.id_usuario
    LEFT JOIN servicios s ON c.id_servicio = s.id_servicio
    ORDER BY c.fecha_cita DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// COUNT - Contar citas programadas para el día de hoy
async function countCitasHoy() {
  const query = `
    SELECT COUNT(*)::INTEGER as count
    FROM citas
    WHERE estado_cita = 'programada'
    AND DATE(fecha_cita) = CURRENT_DATE
  `;
  const result = await db.query(query);
  return result.rows[0].count;
}

// READ - Obtener citas programadas
async function getCitasProgramadas() {
  const query = `
    SELECT 
      c.*,
      u.nombre AS usuario_nombre,
      m.nombre AS mascota_nombre,
      s.nombre AS servicio_nombre
    FROM citas c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
    LEFT JOIN servicios s ON c.id_servicio = s.id_servicio
    WHERE c.estado_cita = 'programada'
    ORDER BY c.fecha_cita ASC
  `;
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener TODAS las citas por id_usuario
async function getCitasPorUsuario(id_usuario) {
  const query = `
    SELECT 
      c.*,
      json_build_object(
        'id_usuario', u.id_usuario,
        'nombre', u.nombre,
        'correo_electronico', u.correo_electronico,
        'telefono', u.telefono
      ) AS usuario,
      json_build_object(
        'id_mascota', m.id_mascota,
        'nombre', m.nombre,
        'especie', m.especie,
        'raza', m.raza
      ) AS mascota,
      json_build_object(
        'id_empleado', e.id_empleado,
        'numero_empleado', e.numero_empleado,
        'nombre', u_emp.nombre,
        'especialidad', e.especialidad
      ) AS empleado,
      json_build_object(
        'id_servicio', s.id_servicio,
        'nombre', s.nombre,
        'descripcion', s.descripcion,
        'costo_base', s.costo_base
      ) AS servicio
    FROM citas c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
    LEFT JOIN empleados e ON c.id_empleado = e.id_empleado
    LEFT JOIN usuarios u_emp ON e.id_usuario = u_emp.id_usuario
    LEFT JOIN servicios s ON c.id_servicio = s.id_servicio
    WHERE c.id_usuario = $1 
    ORDER BY c.fecha_cita DESC
  `;
  const result = await db.query(query, [id_usuario]);
  return result.rows;
}

// CREATE - Crear una nueva cita
async function crearCita(citaData) {
  const {
    id_usuario,
    id_mascota = null,
    id_empleado = null,
    id_servicio = null,
    fecha_cita,
    estado_cita = 'programada',
    motivo = null,
    observaciones = null,
    costo = 0.00,
    creado_por = null
  } = citaData;

  const query = `
    INSERT INTO citas (
      id_usuario, id_mascota, id_empleado, id_servicio, fecha_cita, 
      estado_cita, motivo, observaciones, costo, creado_por
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;
  const values = [
    id_usuario, id_mascota, id_empleado, id_servicio, fecha_cita,
    estado_cita, motivo, observaciones, costo, creado_por
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

// UPDATE - Actualizar una cita
async function actualizarCita(id_cita, datosActualizados) {
  const {
    id_usuario,
    id_mascota = null,
    id_empleado = null,
    id_servicio = null,
    fecha_cita,
    estado_cita,
    motivo,
    observaciones,
    costo
  } = datosActualizados;

  const query = `
    UPDATE citas
    SET 
      id_usuario = $1,
      id_mascota = $2,
      id_empleado = $3,
      id_servicio = $4,
      fecha_cita = $5,
      estado_cita = $6,
      motivo = $7,
      observaciones = $8,
      costo = $9
    WHERE id_cita = $10
    RETURNING *
  `;
  const values = [
    id_usuario, id_mascota, id_empleado, id_servicio, fecha_cita,
    estado_cita, motivo, observaciones, costo, id_cita
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

// DELETE - Eliminar una cita
async function eliminarCita(id_cita) {
  const query = `
    DELETE FROM citas
    WHERE id_cita = $1
    RETURNING *
  `;
  const result = await db.query(query, [id_cita]);
  return result.rows[0];
}

// SEARCH - Buscar citas por empleado (veterinario/recepcionista)
async function getCitasPorEmpleado(id_empleado) {
  const query = `
    SELECT 
      c.*,
      u.nombre AS usuario_nombre,
      u.telefono AS usuario_telefono,
      m.nombre AS mascota_nombre,
      s.nombre AS servicio_nombre
    FROM citas c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
    LEFT JOIN servicios s ON c.id_servicio = s.id_servicio
    WHERE c.id_empleado = $1
    ORDER BY c.fecha_cita DESC
  `;
  const result = await db.query(query, [id_empleado]);
  return result.rows;
}

// SEARCH - Buscar citas por mascota
async function getCitasPorMascota(id_mascota) {
  const query = `
    SELECT 
      c.*,
      u.nombre AS usuario_nombre,
      s.nombre AS servicio_nombre,
      u_emp.nombre AS empleado_nombre
    FROM citas c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN servicios s ON c.id_servicio = s.id_servicio
    LEFT JOIN empleados e ON c.id_empleado = e.id_empleado
    LEFT JOIN usuarios u_emp ON e.id_usuario = u_emp.id_usuario
    WHERE c.id_mascota = $1
    ORDER BY c.fecha_cita DESC
  `;
  const result = await db.query(query, [id_mascota]);
  return result.rows;
}

// SEARCH - Buscar citas por rango de fechas
async function getCitasPorRangoFechas(fecha_inicio, fecha_fin) {
  const query = `
    SELECT 
      c.*,
      u.nombre AS usuario_nombre,
      m.nombre AS mascota_nombre,
      s.nombre AS servicio_nombre,
      u_emp.nombre AS empleado_nombre
    FROM citas c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
    LEFT JOIN servicios s ON c.id_servicio = s.id_servicio
    LEFT JOIN empleados e ON c.id_empleado = e.id_empleado
    LEFT JOIN usuarios u_emp ON e.id_usuario = u_emp.id_usuario
    WHERE DATE(c.fecha_cita) BETWEEN $1 AND $2
    ORDER BY c.fecha_cita ASC
  `;
  const result = await db.query(query, [fecha_inicio, fecha_fin]);
  return result.rows;
}

// SEARCH - Buscar citas por estado
async function getCitasPorEstado(estado_cita) {
  const query = `
    SELECT 
      c.*,
      u.nombre AS usuario_nombre,
      m.nombre AS mascota_nombre,
      s.nombre AS servicio_nombre
    FROM citas c
    LEFT JOIN usuarios u ON c.id_usuario = u.id_usuario
    LEFT JOIN mascotas m ON c.id_mascota = m.id_mascota
    LEFT JOIN servicios s ON c.id_servicio = s.id_servicio
    WHERE c.estado_cita = $1
    ORDER BY c.fecha_cita DESC
  `;
  const result = await db.query(query, [estado_cita]);
  return result.rows;
}

module.exports = {
  getCitas,
  getCitasProgramadas,
  countCitasHoy,
  getCitasPorUsuario,
  crearCita,
  actualizarCita,
  eliminarCita,
  getCitasPorEmpleado,
  getCitasPorMascota,
  getCitasPorRangoFechas,
  getCitasPorEstado
};