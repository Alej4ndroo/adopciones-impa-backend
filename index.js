// =========================
//  IMPA - Servidor Backend (con JWT)
// =========================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ==== MODELOS ====
const Empleados = require('./models/empleadosModel');
const Personas = require('./models/personasModel');

// ==== RUTAS ====
const loginRouter       = require('./routes/login');
const perfilRouter      = require('./routes/perfil');
const homeRouter        = require('./routes/home');
const usuariosRouter    = require('./routes/usuarios');
const personasRouter    = require('./routes/personas');
const empleadosRouter   = require('./routes/empleados');
const mascotasRouter    = require('./routes/mascotas');
const citasRouter       = require('./routes/citas');
const adopcionesRouter  = require('./routes/adopciones');
const consultasRouter   = require('./routes/consultas');
const seguimientosAdopcionRouter = require('./routes/seguimientosAdopcion');
const serviciosRouter   = require('./routes/servicios');

// ==== MIDDLEWARE DE AUTENTICACIÓN ====
const { verifyToken } = require('./middlewares/authMiddleware');

// ==== APP ====
const app = express();

// ==================================
// CORS - para conectar con tu frontend React
// ==================================
app.use(cors({
  origin: 'http://localhost:5173', // Cambia si tu frontend usa otro puerto o dominio
  credentials: true
}));

// ==================================
// CONFIGURACIÓN GENERAL
// ==================================
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('public')); // Archivos estáticos (si los tienes)

// ==================================
// RUTAS
// ==================================
app.use('/login', loginRouter);
app.use('/perfil', perfilRouter);
app.use('/home', homeRouter);
app.use('/usuarios', usuariosRouter);
app.use('/personas', personasRouter);
app.use('/empleados', empleadosRouter);
app.use('/mascotas', mascotasRouter);
app.use('/citas', citasRouter);
app.use('/adopciones', adopcionesRouter);
app.use('/consultas', consultasRouter);
app.use('/seguimientosAdopcion', seguimientosAdopcionRouter);
app.use('/servicios', serviciosRouter);

// ==================================
// RUTA PRINCIPAL
// ==================================
app.get('/', (req, res) => {
  res.json({ mensaje: 'API IMPA funcionando correctamente 🚀' });
});

// ==================================
// ESTADO DE USUARIO (con token JWT)
// ==================================
app.get('/user-status', verifyToken, async (req, res) => {
  try {
    const { id_usuario, nombre_rol, permisos = [] } = req.usuario;
    const ES_ROL_EMPLEADO = rol => ['admin', 'director', 'veterinario'].includes(rol);

    const datosCompletos = ES_ROL_EMPLEADO(nombre_rol)
      ? await Empleados.getEmpleadoPorUsuarioId(id_usuario)
      : await Personas.getPersonaPorUsuarioId(id_usuario);

    if (!datosCompletos) {
      return res.status(404).json({
        loggedIn: false,
        error: 'No se encontraron datos del usuario'
      });
    }

    const { usuarios = {}, ...datosAdicionales } = datosCompletos;
    const { contrasena, ...usuarioSinPass } = usuarios;

    const usuarioCompleto = {
      ...usuarioSinPass,
      ...datosAdicionales,
      foto_perfil_base64: usuarios.foto_perfil_base64,
      permisos
    };

    res.json({
      loggedIn: true,
      usuario: usuarioCompleto
    });
  } catch (error) {
    console.error('Error en /user-status:', error);
    res.status(500).json({ loggedIn: false, error: 'Error al obtener datos del usuario' });
  }
});

// ==================================
// LOGOUT (solo borrando el token en frontend)
// ==================================
app.post('/logout', (req, res) => {
  // En JWT no se destruye sesión, solo se elimina el token en frontend
  res.json({ success: true, message: 'Token invalidado en cliente.' });
});

// ==================================
// SERVIDOR
// ==================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend corriendo en http://localhost:${PORT}`)
);
