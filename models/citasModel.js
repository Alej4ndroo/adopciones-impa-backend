const db = require('../config/db');

// READ - Obtener todas las citas
async function getCitas() {
  const query = `
    SELECT *,
    json_build_object(
        'id_persona', p.id_persona,
        'calle', p.calle, 
        'ciudad', p.ciudad,
        'usuario', json_build_object(
            'id_usuario', u_a.id_usuario,
            'nombre', u_a.nombre,
            'correo_electronico', u_a.correo_electronico
        )
    ) AS adoptante
    FROM citas c
    LEFT JOIN personas p ON c.id_persona = p.id_persona
    LEFT JOIN usuarios u_a ON p.id_usuario = u_a.id_usuario
    ORDER BY fecha_cita DESC

    
  `;
  const result = await db.query(query);
  return result.rows;
}

// COUNT - Contar citas programadas para el día de hoy
async function countCitasHoy() {
    const query = `
      SELECT COUNT(*)
      FROM citas
      WHERE estado_cita = 'programada'
      AND DATE(fecha_cita) = CURRENT_DATE;
    `;

    const result = await db.query(query);
    return parseInt(result.rows[0].count, 10); 
}

// READ - Obtener citas programadas
async function getCitasProgramadas() {
  const query = `
    SELECT *
    FROM citas
    WHERE estado_cita = 'programada'
    ORDER BY fecha_cita DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener cita por ID
async function getCitaPorId(id_cita) {
  const query = `
    SELECT *
    FROM citas
    WHERE id_cita = $1
  `;
  const result = await db.query(query, [id_cita]);
  return result.rows[0];
}

// CREATE - Crear una nueva cita
async function crearCita(citaData) {
  const {
    id_persona,
    id_mascota = null,
    id_empleado = null,
    tipo_cita,
    fecha_cita,
    estado_cita = 'programada',
    motivo = null,
    observaciones = null,
    costo = 0.00,
    creado_por = null
  } = citaData;

  const query = `
    INSERT INTO citas (
      id_persona, id_mascota, id_empleado, tipo_cita, fecha_cita, 
      estado_cita, motivo, observaciones, costo, creado_por
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    RETURNING *
  `;
  const values = [
    id_persona, id_mascota, id_empleado, tipo_cita, fecha_cita,
    estado_cita, motivo, observaciones, costo, creado_por
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

// UPDATE - Actualizar una cita
async function actualizarCita(id_cita, datosActualizados) {
  const {
    id_persona,
    id_mascota = null,
    id_empleado = null,
    tipo_cita,
    fecha_cita,
    estado_cita,
    motivo,
    observaciones,
    costo
  } = datosActualizados;

  const query = `
    UPDATE citas
    SET id_persona=$1,
        id_mascota=$2,
        id_empleado=$3,
        tipo_cita=$4,
        fecha_cita=$5,
        estado_cita=$6,
        motivo=$7,
        observaciones=$8,
        costo=$9,
        fecha_actualizacion=NOW()
    WHERE id_cita=$10
    RETURNING *
  `;
  const values = [
    id_persona, id_mascota, id_empleado, tipo_cita, fecha_cita,
    estado_cita, motivo, observaciones, costo, id_cita
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

// DELETE - Eliminar una cita
async function eliminarCita(id_cita) {
  const query = `
    DELETE FROM citas
    WHERE id_cita=$1
    RETURNING *
  `;
  const result = await db.query(query, [id_cita]);
  return result.rows[0];
}

// SEARCH - Buscar citas por persona
async function getCitasPorPersona(id_persona) {
  const query = `
    SELECT *
    FROM citas
    WHERE id_persona=$1
    ORDER BY fecha_cita DESC
  `;
  const result = await db.query(query, [id_persona]);
  return result.rows;
}

// SEARCH - Buscar citas por veterinario
async function getCitasPorVeterinario(id_empleado) {
  const query = `
    SELECT *
    FROM citas
    WHERE id_empleado=$1
    ORDER BY fecha_cita DESC
  `;
  const result = await db.query(query, [id_empleado]);
  return result.rows;
}

module.exports = {
  getCitas,
  getCitasProgramadas,
  countCitasHoy,
  getCitaPorId,
  crearCita,
  actualizarCita,
  eliminarCita,
  getCitasPorPersona,
  getCitasPorVeterinario
};
