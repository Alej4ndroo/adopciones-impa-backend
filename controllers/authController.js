const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuariosModel');
const { ensureNotificacionPerfilIncompleto, ensureNotificacionSeguimiento } = require('../services/notificacionesService');

exports.login = async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  try {
    const usuario = await Usuario.getUsuarioPorCorreo(correo_electronico);
    if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado' });

    const valido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valido) return res.status(401).json({ message: 'Contraseña incorrecta' });

    // Bloquear inicio de sesión si el usuario está inactivo
    if (!usuario.activo) {
      return res.status(403).json({ message: 'Usuario inactivo. Contacta al administrador.' });
    }

    const payload = {
      id_usuario: usuario.id_usuario,
      nombre_rol: usuario.nombre_rol,
      permisos: usuario.permisos || []
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_secreta', { expiresIn: '1d' });

    const datosCompletos = await Usuario.getDatosCompletosPorId(usuario.id_usuario);
    await ensureNotificacionPerfilIncompleto(usuario.id_usuario, datosCompletos?.usuario_completo);
    await ensureNotificacionSeguimiento(usuario.id_usuario);

    res.json({
      token,
      usuario: datosCompletos.usuario_completo
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en login' });
  }
};

exports.registro = async (req, res) => {
  try {
    const { nombre, correo_electronico, contrasena, fecha_nacimiento } = req.body;

    if (!nombre || !correo_electronico || !contrasena || !fecha_nacimiento) {
      return res.status(400).json({ error: "Faltan datos obligatorios." });
    }

    const usuarioExistente = await Usuario.getUsuarioPorCorreo(correo_electronico);

    if (usuarioExistente) {
      return res.status(400).json({ error: "El correo ya está registrado." });
    }

    const datosUsuarioNuevo = {
      nombre,
      fecha_nacimiento,
      correo_electronico,
      contrasena: contrasena,
      id_rol: 4
    };

    const nuevoUsuario = await Usuario.crearUsuario(datosUsuarioNuevo);

    if (!nuevoUsuario || !nuevoUsuario.usuario || !nuevoUsuario.usuario.id_usuario) {
      return res.status(500).json({ error: "No se pudo crear el usuario." });
    }

    const id = nuevoUsuario.usuario.id_usuario;

    const payload = { id };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "clave_secreta", {
      expiresIn: "1d"
    });

    const datosCompletos = await Usuario.getDatosCompletosPorId(id);
    await ensureNotificacionPerfilIncompleto(id, datosCompletos?.usuario_completo);
    await ensureNotificacionSeguimiento(id);

    return res.json({
      token,
      user: datosCompletos.usuario_completo
    });

  } catch (err) {
    console.error("ERROR EN REGISTRO:", err);
    return res.status(500).json({
      ok: false,
      mensaje: "Error interno en el servidor",
      detalle: err.message
    });
  }
};

// --- FUNCIÓN DE RECUPERACIÓN (ahora resetea directamente) ---
exports.contrasenaOlvidada = async (req, res) => {
  const { email, nombre_completo, nueva_contrasena } = req.body;

  if (!email || !nombre_completo || !nueva_contrasena) {
    return res.status(400).json({ message: 'Faltan datos para restablecer la contraseña.' });
  }

  try {
    const usuario = await Usuario.getUsuarioPorCorreo(email);

    if (!usuario) {
      // Respuesta genérica para no filtrar existencia
      return res.status(200).json({ message: 'Contraseña restablecida si los datos son correctos.' });
    }

    // Validar nombre contra el registro (trim/lower para evitar mayúsculas/espacios)
    const nombreDb = (usuario.nombre || '').trim().toLowerCase();
    const nombreReq = (nombre_completo || '').trim().toLowerCase();
    if (nombreDb !== nombreReq) {
      return res.status(400).json({ message: 'Los datos no coinciden.' });
    }

    // Actualizar contraseña
    await Usuario.actualizarUsuario(usuario.id_usuario, { contrasena: nueva_contrasena });

    res.status(200).json({ message: 'Contraseña restablecida con éxito.' });
  } catch (err) {
    console.error('Error al restablecer contraseña:', err);
    res.status(500).json({ message: 'Error al restablecer la contraseña.' });
  }
};
