// =========================
//  IMPA - Servidor Backend (con JWT)
// =========================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ==== RUTAS ====
const authRouter        = require('./routes/auth');
const homeRouter        = require('./routes/home');
const usuariosRouter    = require('./routes/usuarios');
const empleadosRouter   = require('./routes/empleados');
const mascotasRouter    = require('./routes/mascotas');
const citasRouter       = require('./routes/citas');
const adopcionesRouter  = require('./routes/adopciones');
const consultasRouter   = require('./routes/consultas');
const seguimientosAdopcionRouter = require('./routes/seguimientosAdopcion');
const serviciosRouter   = require('./routes/servicios');
const notificacionesRouter = require('./routes/notificaciones');

// ==== APP ====
const app = express();

// ==================================
// CORS - para conectar con tu frontend React
// ==================================
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://adopcionesimpa.vercel.app',
    'https://adopcionesimpa-git-main-alejandros-projects-eb484e24.vercel.app'
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
app.use('/auth', authRouter);
app.use('/home', homeRouter);
app.use('/usuarios', usuariosRouter);
app.use('/empleados', empleadosRouter);
app.use('/mascotas', mascotasRouter);
app.use('/citas', citasRouter);
app.use('/adopciones', adopcionesRouter);
app.use('/consultas', consultasRouter);
app.use('/seguimientosAdopcion', seguimientosAdopcionRouter);
app.use('/servicios', serviciosRouter);
app.use('/notificaciones', notificacionesRouter);

// ==================================
// RUTA PRINCIPAL
// ==================================
app.get('/', (req, res) => {
  res.json({ mensaje: 'API IMPA funcionando correctamente 🚀' });
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
