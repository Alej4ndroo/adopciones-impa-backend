const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuariosModel');

exports.login = async (req, res) => {
  const { correo_electronico, contrasena } = req.body;

  try {
    const usuario = await Usuario.getUsuarioPorCorreo(correo_electronico);
    if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado' });

    const valido = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valido) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const payload = {
      id_usuario: usuario.id_usuario,
      nombre_rol: usuario.nombre_rol,
      permisos: usuario.permisos || []
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'clave_secreta', { expiresIn: '1d' });

    const datosCompletos = await Usuario.getDatosCompletosPorId(usuario.id_usuario);

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

// --- FUNCIÓN DE RECUPERACIÓN (AHORA COMPLETA) ---
exports.contrasenaOlvidada = async (req, res) => {
  const { email } = req.body;

  try {
    const usuario = await Usuario.getUsuarioPorCorreo(email);

    // Importante: Por seguridad, NUNCA reveles si el correo existe o no.
    // Siempre devuelve un mensaje genérico.
    if (usuario) {
      // 1. Generar un token de reseteo (diferente al de login)
      const resetPayload = { id_usuario: usuario.id_usuario };
      const resetToken = jwt.sign(resetPayload, process.env.RESET_SECRET || 'clave_secreta_reseteo', { expiresIn: '1h' });

      // 2. Enviar el correo electrónico
      // Asegúrate de tener estas variables en tu archivo .env
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST, // ej. "smtp.gmail.com"
        port: process.env.EMAIL_PORT, // ej. 465
        secure: true, // true para puerto 465, false para otros
        auth: {
          user: process.env.EMAIL_USER, // Tu correo
          pass: process.env.EMAIL_PASS, // Tu contraseña de aplicación
        },
      });

      const resetLink = `${process.env.FRONTEND_URL}/resetear-contrasena/${resetToken}`;

      const mailOptions = {
        from: `"Soporte App" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Recuperación de Contraseña',
        html: `
          <p>Hola ${usuario.nombre},</p>
          <p>Hemos recibido una solicitud para reestablecer tu contraseña.</p>
          <p>Haz clic en el siguiente enlace para continuar. Si no lo solicitaste, ignora este correo.</p>
          <a href="${resetLink}" target="_blank">Reestablecer mi contraseña</a>
          <p>El enlace expira en 1 hora.</p>
        `,
      };

      // Intentamos enviar el correo
      try {
        await transporter.sendMail(mailOptions);
        console.log('Correo de recuperación enviado a:', email);
      } catch (emailError) {
        console.error('Error al enviar el correo de recuperación:', emailError);
        // NO enviamos un error al cliente, por seguridad.
      }
    }
    
    // 3. Enviar respuesta exitosa (genérica)
    res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones.' });

  } catch (err) {
    console.error(err);
    // No enviar 500 aquí, seguir con la respuesta genérica por seguridad
    res.status(200).json({ message: 'Si el correo existe, recibirás instrucciones.' });
  }
};