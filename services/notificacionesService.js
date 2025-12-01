const Usuarios = require('../models/usuariosModel');
const Adopciones = require('../models/adopcionesModel');
const Notificaciones = require('../models/notificacionesModel');

const PERFIL_INCOMPLETO_TITULO = 'Completa tu perfil';
const FOLLOWUP_MINUTES = parseInt(process.env.FOLLOWUP_MINUTES || '1', 10); // 1 minuto por defecto para pruebas

const parseDirecciones = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (raw && typeof raw === 'object') {
    // Algunos controladores devuelven un objeto único para la dirección principal
    return [raw];
  }
  return [];
};

const hasValor = (valor) => {
  if (!valor) return false;
  if (typeof valor === 'string') return valor.trim().length > 0;
  return true;
};

const buildMensaje = (faltanDireccion, faltanDocs) => {
  const partes = [];
  if (faltanDireccion) {
    partes.push('registrar tu dirección principal');
  }
  if (faltanDocs.length > 0) {
    const docs = faltanDocs.join(', ');
    partes.push(`subir tus documentos (${docs})`);
  }

  const acciones = partes.join(' y ');
  return `Para acceder a todos los servicios es necesario ${acciones}. Puedes hacerlo desde tu perfil.`;
};

async function ensureNotificacionPerfilIncompleto(id_usuario, usuarioExistente = null) {
  if (!id_usuario) return;

  let usuario = usuarioExistente;
  if (!usuario) {
    const datos = await Usuarios.getDatosCompletosPorId(id_usuario);
    usuario = datos?.usuario_completo;
  }

  if (!usuario) return;

  const rolNombre = ((usuario.rol && usuario.rol.nombre_rol) || usuario.nombre_rol || '').toLowerCase();
  const rolId = Number(usuario.id_rol || (usuario.rol && usuario.rol.id_rol));
  const isPersona = rolNombre === 'persona' || rolId === 4;

  if (!isPersona) {
    await Notificaciones.eliminarNotificacionPorTitulo(id_usuario, PERFIL_INCOMPLETO_TITULO);
    return;
  }

  const faltanDocs = [];
  if (!hasValor(usuario.url_ine)) faltanDocs.push('INE');
  if (!hasValor(usuario.url_acta)) faltanDocs.push('Acta de nacimiento');
  if (!hasValor(usuario.url_comprobante)) faltanDocs.push('Comprobante de domicilio');

  let direcciones = parseDirecciones(usuario.direcciones);
  if (!direcciones.length && usuario.direccion && typeof usuario.direccion === 'object') {
    direcciones = [usuario.direccion];
  }
  const faltanDireccion = direcciones.length === 0;

  if (!faltanDireccion && faltanDocs.length === 0) {
    await Notificaciones.eliminarNotificacionPorTitulo(id_usuario, PERFIL_INCOMPLETO_TITULO);
    return;
  }

  const mensaje = buildMensaje(faltanDireccion, faltanDocs);
  await Notificaciones.eliminarNotificacionPorTitulo(id_usuario, PERFIL_INCOMPLETO_TITULO);
  await Notificaciones.crearNotificacion({
    id_usuario,
    tipo_notificacion: 'seguimiento',
    titulo: PERFIL_INCOMPLETO_TITULO,
    mensaje,
  });
}

async function ensureNotificacionSeguimiento(id_usuario) {
  if (!id_usuario || !FOLLOWUP_MINUTES) return;
  try {
    const adopciones = await Adopciones.getAdopcionesAprobadasPorUsuario(id_usuario);
    if (!Array.isArray(adopciones) || !adopciones.length) return;
    const now = Date.now();

    for (const adopcion of adopciones) {
      const baseDate = adopcion.fecha_entrega || adopcion.fecha_solicitud;
      const fecha = baseDate ? new Date(baseDate) : null;
      if (!fecha || Number.isNaN(fecha.getTime())) continue;
      const diffMinutes = (now - fecha.getTime()) / 60000;
      if (diffMinutes < FOLLOWUP_MINUTES) continue;
      const titulo = `Seguimiento adopción`;
      const exists = await Notificaciones.existeNotificacionPorTitulo(id_usuario, titulo);
      if (exists) continue;

      const diasTranscurridos = Math.floor(diffMinutes / 1440);
      await Notificaciones.crearNotificacion({
        id_usuario,
        tipo_notificacion: 'seguimiento',
        titulo,
        mensaje: `Han pasado ${diasTranscurridos > 0 ? `${diasTranscurridos} día(s)` : 'varias horas'} desde tu adopción de ${adopcion.nombre_mascota || 'tu mascota'}. Por favor, realiza el seguimiento correspondiente.`
      });
    }
  } catch (error) {
    console.error('No se pudo verificar seguimientos de adopción:', error);
  }
}

module.exports = {
  ensureNotificacionPerfilIncompleto,
  ensureNotificacionSeguimiento,
};
