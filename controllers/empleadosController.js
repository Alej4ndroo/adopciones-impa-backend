// controllers/citasController.js
const Empleado = require('../models/empleadosModel');

// Listar todos los empleados
exports.listar = async (req, res) => {
  try {
    const empleados = await Empleado.getEmpleados();
    res.json(empleados);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener empleados' });
  }
};

// Obtener el perfil del empleado actual
exports.obtener_perfil = async (req, res) => {
  try {
    const empleado = await Empleado.obtenerPerfil( req.usuario.id_usuario );
    res.status(201).json(empleado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener empleado' });
  }
};

// Listar todos los veterinarios
exports.listarVeterinarios = async (req, res) => {
  try {
    const veterinarios = await Empleado.getVeterinarios();
    res.json(veterinarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener veterinarios' });
  }
};

// Crear una nueva cita
exports.crear = async (req, res) => {
  try {
    const nuevoEmpleado = await Empleado.crearEmpleado(req.body);
    res.status(201).json(nuevoEmpleado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear empleado' });
  }
};

// Este es tu controlador anterior, pero corregido
exports.cambiarFotoPerfil = async (req, res) => {
  try {
    // Usamos id_usuario, que SÍ tienes en el token
    const id_usuario = req.usuario.id_usuario; 
    const { foto_perfil_base64 } = req.body;

    if (!foto_perfil_base64) {
      return res.status(400).json({
        error: 'No se proporcionó ninguna imagen (foto_perfil_base64 es requerida).',
      });
    }

    const datosParaActualizar = { foto_perfil_base64 };

    const resultado = await Empleado.actualizarEmpleado(
      id_usuario,
      datosParaActualizar
    );

    if (!resultado || !resultado.perfil) {
      return res.status(404).json({
        error: 'No se pudo actualizar la foto. Usuario no encontrado.',
      });
    }

    res.status(200).json(resultado.perfil);

  } catch (error) {
    console.error('Error al cambiar foto de perfil:', error);
    res.status(500).json({
      error: 'Error interno al actualizar la foto',
    });
  }
};

exports.actualizar_perfil = async (req, res) => {
  try {
    const id_usuario = req.usuario.id_usuario;
    const datosActualizados = req.body;

    // Validar que haya datos para actualizar
    if (!datosActualizados || Object.keys(datosActualizados).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron datos para actualizar' 
      });
    }

    // Campos permitidos para actualizar
    const camposPermitidos = [
      'nombre',
      'correo_electronico',
      'telefono',
      'fecha_nacimiento',
      'calle',
      'colonia',
      'codigo_postal',
      'ciudad',
      'estado',
      'pais',
      'foto_perfil_base64'
    ];

    // Filtrar solo los campos permitidos
    const datosParaActualizar = {};
    for (const campo of camposPermitidos) {
      if (datosActualizados.hasOwnProperty(campo)) {
        datosParaActualizar[campo] = datosActualizados[campo];
      }
    }

    // Verificar que haya al menos un campo permitido para actualizar
    if (Object.keys(datosParaActualizar).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron campos válidos para actualizar' 
      });
    }

    // Actualizar el perfil
    const perfilActualizado = await Empleado.actualizarPerfil(
      id_usuario, 
      datosParaActualizar
    );

    if (!perfilActualizado) {
      return res.status(404).json({ 
        error: 'No se pudo actualizar el perfil' 
      });
    }

    res.status(200).json(resultado.perfil);

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ 
      error: 'Error al actualizar el perfil del usuario' 
    });
  }
};