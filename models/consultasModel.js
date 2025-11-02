const db = require('../config/db'); // Pool de pg

// READ - Obtener todas las consultas
async function getConsultas() {
  const query = `
    SELECT 
      c.id_consulta,
      c.id_expediente,
      c.fecha_consulta,
      c.motivo,
      c.sintomas,
      c.diagnostico,
      c.tratamiento,
      c.recomendaciones,
      c.peso_kg,
      c.temperatura_c,
      c.costo,
      c.proxima_cita,
      c.fecha_creacion,
      json_build_object(
        'id_empleado', e.id_empleado,
        'numero_empleado', e.numero_empleado,
        'cedula_profesional', e.cedula_profesional,
        'especialidad', e.especialidad,
        'usuario', json_build_object(
          'id_usuario', ue.id_usuario,
          'nombre', ue.nombre,
          'correo_electronico', ue.correo_electronico,
          'telefono', ue.telefono
        )
      ) AS empleado,
      json_build_object(
        'id_expediente', exp.id_expediente,
        'observaciones', exp.observaciones,
        'fecha_creacion', exp.fecha_creacion,
        'mascota', json_build_object(
          'id_mascota', m.id_mascota,
          'nombre', m.nombre,
          'especie', m.especie,
          'raza', m.raza,
          'edad_en_meses', m.edad_en_meses,
          'sexo', m.sexo
        )
      ) AS expediente,
      json_build_object(
        'id_usuario', uc.id_usuario,
        'nombre', uc.nombre
      ) AS creado_por
    FROM consultas_veterinarias c
    LEFT JOIN empleados e ON c.id_empleado = e.id_empleado
    LEFT JOIN usuarios ue ON e.id_usuario = ue.id_usuario
    LEFT JOIN expedientes_veterinarios exp ON c.id_expediente = exp.id_expediente
    LEFT JOIN mascotas m ON exp.id_mascota = m.id_mascota
    LEFT JOIN usuarios uc ON c.creado_por = uc.id_usuario
    ORDER BY c.fecha_consulta DESC
  `;
  const result = await db.query(query);
  return result.rows;
}

// READ - Obtener una consulta por ID
async function getConsultaPorId(id_consulta) {
  const query = `
    SELECT 
      c.id_consulta,
      c.id_expediente,
      c.fecha_consulta,
      c.motivo,
      c.sintomas,
      c.diagnostico,
      c.tratamiento,
      c.recomendaciones,
      c.peso_kg,
      c.temperatura_c,
      c.costo,
      c.proxima_cita,
      c.fecha_creacion,
      json_build_object(
        'id_empleado', e.id_empleado,
        'numero_empleado', e.numero_empleado,
        'cedula_profesional', e.cedula_profesional,
        'especialidad', e.especialidad,
        'usuario', json_build_object(
          'id_usuario', ue.id_usuario,
          'nombre', ue.nombre,
          'correo_electronico', ue.correo_electronico,
          'telefono', ue.telefono
        )
      ) AS empleado,
      json_build_object(
        'id_expediente', exp.id_expediente,
        'observaciones', exp.observaciones,
        'fecha_creacion', exp.fecha_creacion,
        'mascota', json_build_object(
          'id_mascota', m.id_mascota,
          'nombre', m.nombre,
          'especie', m.especie,
          'raza', m.raza,
          'edad_en_meses', m.edad_en_meses,
          'sexo', m.sexo,
        )
      ) AS expediente,
      json_build_object(
        'id_usuario', uc.id_usuario,
        'nombre', uc.nombre
      ) AS creado_por
    FROM consultas_veterinarias c
    LEFT JOIN empleados e ON c.id_empleado = e.id_empleado
    LEFT JOIN usuarios ue ON e.id_usuario = ue.id_usuario
    LEFT JOIN expedientes_veterinarios exp ON c.id_expediente = exp.id_expediente
    LEFT JOIN mascotas m ON exp.id_mascota = m.id_mascota
    LEFT JOIN usuarios uc ON c.creado_por = uc.id_usuario
    WHERE c.id_consulta = $1
  `;
  const result = await db.query(query, [id_consulta]);
  return result.rows[0];
}

// READ - Obtener consultas por expediente
async function getConsultasPorExpediente(id_expediente) {
  const query = `
    SELECT 
      c.id_consulta,
      c.id_expediente,
      c.fecha_consulta,
      c.motivo,
      c.sintomas,
      c.diagnostico,
      c.tratamiento,
      c.recomendaciones,
      c.peso_kg,
      c.temperatura_c,
      c.costo,
      c.proxima_cita,
      c.fecha_creacion,
      json_build_object(
        'id_empleado', e.id_empleado,
        'numero_empleado', e.numero_empleado,
        'cedula_profesional', e.cedula_profesional,
        'especialidad', e.especialidad,
        'usuario', json_build_object(
          'id_usuario', ue.id_usuario,
          'nombre', ue.nombre,
          'correo_electronico', ue.correo_electronico,
          'telefono', ue.telefono
        )
      ) AS empleado,
      json_build_object(
        'id_expediente', exp.id_expediente,
        'observaciones', exp.observaciones,
        'fecha_creacion', exp.fecha_creacion,
        'mascota', json_build_object(
          'id_mascota', m.id_mascota,
          'nombre', m.nombre,
          'especie', m.especie,
          'raza', m.raza,
          'edad_en_meses', m.edad_en_meses,
          'sexo', m.sexo
        )
      ) AS expediente,
      json_build_object(
        'id_usuario', uc.id_usuario,
        'nombre', uc.nombre
      ) AS creado_por
    FROM consultas_veterinarias c
    LEFT JOIN empleados e ON c.id_empleado = e.id_empleado
    LEFT JOIN usuarios ue ON e.id_usuario = ue.id_usuario
    LEFT JOIN expedientes_veterinarios exp ON c.id_expediente = exp.id_expediente
    LEFT JOIN mascotas m ON exp.id_mascota = m.id_mascota
    LEFT JOIN usuarios uc ON c.creado_por = uc.id_usuario
    WHERE c.id_expediente = $1
    ORDER BY c.fecha_consulta DESC
  `;
  const result = await db.query(query, [id_expediente]);
  return result.rows;
}

// CREATE - Crear una nueva consulta
async function crearConsulta(consultaData) {
  const { 
    id_expediente,
    id_empleado = null,
    fecha_consulta,
    motivo = null,
    sintomas = null,
    diagnostico = null,
    tratamiento = null,
    recomendaciones = null,
    peso_kg = null,
    temperatura_c = null,
    costo = 0.00,
    proxima_cita = null,
    creado_por = null
  } = consultaData;

  const query = `
    INSERT INTO consultas_veterinarias (
      id_expediente, id_empleado, fecha_consulta, motivo, sintomas,
      diagnostico, tratamiento, recomendaciones, peso_kg, temperatura_c,
      costo, proxima_cita, creado_por
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `;
  const values = [
    id_expediente,
    id_empleado,
    fecha_consulta,
    motivo,
    sintomas,
    diagnostico,
    tratamiento,
    recomendaciones,
    peso_kg,
    temperatura_c,
    costo,
    proxima_cita,
    creado_por
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

// UPDATE - Actualizar una consulta existente
async function actualizarConsulta(id_consulta, datosActualizados) {
  const { 
    id_empleado,
    fecha_consulta,
    motivo,
    sintomas,
    diagnostico,
    tratamiento,
    recomendaciones,
    peso_kg,
    temperatura_c,
    costo,
    proxima_cita
  } = datosActualizados;

  const query = `
    UPDATE consultas_veterinarias
    SET 
      id_empleado = $1,
      fecha_consulta = $2,
      motivo = $3,
      sintomas = $4,
      diagnostico = $5,
      tratamiento = $6,
      recomendaciones = $7,
      peso_kg = $8,
      temperatura_c = $9,
      costo = $10,
      proxima_cita = $11
    WHERE id_consulta = $12
    RETURNING *
  `;
  const values = [
    id_empleado,
    fecha_consulta,
    motivo,
    sintomas,
    diagnostico,
    tratamiento,
    recomendaciones,
    peso_kg,
    temperatura_c,
    costo,
    proxima_cita,
    id_consulta
  ];
  const result = await db.query(query, values);
  return result.rows[0];
}

// DELETE - Eliminar una consulta permanentemente
async function eliminarConsulta(id_consulta) {
  const query = 'DELETE FROM consultas_veterinarias WHERE id_consulta = $1 RETURNING *';
  const result = await db.query(query, [id_consulta]);
  return result.rows[0];
}

module.exports = {
  getConsultas,
  getConsultaPorId,
  getConsultasPorExpediente,
  crearConsulta,
  actualizarConsulta,
  eliminarConsulta
};