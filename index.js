// =========================
//  IMPA - Servidor Backend (con JWT)
// =========================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ==== MODELOS ====
const Usuario = require('./models/usuariosModel');

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
  origin: [
    'http://localhost:5173',
    'https://adopciones-impa-frontend.vercel.app',
    'https://adopciones-impa-frontend-git-main-alejandros-projects-eb484e24.vercel.app'
  ],
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
// ==================================
// ESTADO DE USUARIO (con token JWT)
// ==================================
app.get('/user-status', verifyToken, async (req, res) => {
  try {
    const { id_usuario } = req.usuario;

    const datos = await Usuario.getDatosCompletosPorId(id_usuario);

    // 3. Verificamos si el usuario existe
    if (!datos || !datos.usuario_completo) {
      return res.status(404).json({
        loggedIn: false,
        error: 'No se encontraron datos del usuario'
      });
    }

    const usuarioCompleto = datos.usuario_completo;

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
