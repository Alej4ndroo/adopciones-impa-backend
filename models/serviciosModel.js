const db = require('../config/db');

// Obtener todos los servicios (activos e inactivos)
async function getServicios() {
  try {
    const query = `SELECT * FROM servicios ORDER BY nombre`;
    const result = await db.query(query);
    return result.rows;
  } catch (error) {
    throw new Error(`Error al obtener servicios: ${error.message}`);
  }
}

// Obtener servicio por ID
async function getServicioPorId(id) {
  try {
    const query = `SELECT * FROM servicios WHERE id_servicio = $1`;
    const result = await db.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error al obtener servicio: ${error.message}`);
  }
}

// Crear nuevo servicio
async function crearServicio(datosServicio) {
  const { nombre, descripcion, costo_base, duracion_estimada_min, requiere_mascota } = datosServicio;
  
  try {
    const query = `
      INSERT INTO servicios (
        nombre, 
        descripcion, 
        costo_base, 
        duracion_estimada_min, 
        requiere_mascota
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [nombre, descripcion, costo_base, duracion_estimada_min, requiere_mascota];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error al crear servicio: ${error.message}`);
  }
}

// Actualizar servicio
async function actualizarServicio(id, datosServicio) {
  const { nombre, descripcion, costo_base, duracion_estimada_min, requiere_mascota } = datosServicio;
  
  try {
    const query = `
      UPDATE servicios 
      SET 
        nombre = $2,
        descripcion = $3,
        costo_base = $4,
        duracion_estimada_min = $5,
        requiere_mascota = $6
      WHERE id_servicio = $1
      RETURNING *
    `;
    
    const values = [id, nombre, descripcion, costo_base, duracion_estimada_min, requiere_mascota];
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error al actualizar servicio: ${error.message}`);
  }
}

// Desactivar servicio (soft delete)
async function desactivarServicio(id) {
  try {
    const query = `
      UPDATE servicios 
      SET activo = false 
      WHERE id_servicio = $1
      RETURNING id_servicio, nombre
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error al desactivar servicio: ${error.message}`);
  }
}

// Activar servicio
async function activarServicio(id) {
  try {
    const query = `
      UPDATE servicios 
      SET activo = true 
      WHERE id_servicio = $1
      RETURNING id_servicio, nombre
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error al activar servicio: ${error.message}`);
  }
}

// Buscar servicios por nombre
async function buscarServicioPorNombre(termino) {
  try {
    const query = `
      SELECT * FROM servicios 
      WHERE LOWER(nombre) LIKE LOWER($1) AND activo = true
      ORDER BY nombre
    `;
    const result = await db.query(query, [`%${termino}%`]);
    return result.rows;
  } catch (error) {
    throw new Error(`Error al buscar servicios: ${error.message}`);
  }
}

// Validar si un servicio existe y está activo
async function existeYActivo(id) {
  try {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM servicios 
        WHERE id_servicio = $1 AND activo = true
      ) as existe
    `;
    const result = await db.query(query, [id]);
    return result.rows[0].existe;
  } catch (error) {
    throw new Error(`Error al validar servicio: ${error.message}`);
  }
}

// Obtener estadísticas de servicios
async function obtenerEstadisticas() {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_servicios,
        COUNT(*) FILTER (WHERE activo = true) as servicios_activos,
        COUNT(*) FILTER (WHERE activo = false) as servicios_inactivos,
        AVG(costo_base) as costo_promedio
      FROM servicios
    `;
    const result = await db.query(query);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error al obtener estadísticas: ${error.message}`);
  }
}

module.exports = {
  getServicios,
  getServicioPorId,
  crearServicio,
  actualizarServicio,
  desactivarServicio,
  activarServicio,
  buscarServicioPorNombre,
  existeYActivo,
  obtenerEstadisticas
};
