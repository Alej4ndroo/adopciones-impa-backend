// controllers/loginController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuariosModel'); // tu modelo

// POST /login
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

    res.json({
      token,
      usuario: {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre,
        nombre_rol: usuario.nombre_rol,
        permisos: usuario.permisos || []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en login' });
  }
};
