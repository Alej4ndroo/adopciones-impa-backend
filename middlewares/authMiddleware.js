// authMiddleware.js

const jwt = require('jsonwebtoken');

// 🔑 CAMBIO CLAVE: Usaremos req.usuario en lugar de req.user
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    // Aseguramos que la cabecera es 'Bearer <token>'
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Formato de token inválido (Debe ser "Bearer <token>")' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.usuario = decoded; 
        
        next();
    } catch (err) {
        console.error('Error al verificar token:', err.message);
        return res.status(403).json({ message: 'Token inválido o expirado' });
    }
};

// Middleware para verificar permisos
exports.checkPermission = (permiso) => {
    return (req, res, next) => {
        // 🔑 CORRECCIÓN: Ahora leemos consistentemente de req.usuario
        // Este middleware DEBE ejecutarse después de verifyToken.
        if (!req.usuario) {
            // Esto solo ocurre si alguien intenta usar checkPermission sin verifyToken antes.
            return res.status(401).json({ message: 'Autenticación requerida antes de verificar permisos.' });
        }

        // Accedemos a la lista de permisos del payload del JWT
        const userPermissions = req.usuario.permisos || [];

        if (userPermissions.includes(permiso)) {
            return next();
        }
        
        console.warn(`Permiso denegado para ${req.usuario.id_usuario} - Permiso: ${permiso}`);
        return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    };
};