const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para verificar si el usuario está autenticado
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
    }
    
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar al usuario en la base de datos
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    
    // Guardar el usuario en el objeto request para uso posterior
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Por favor autentícate' });
  }
};

// Middleware para verificar si el usuario es administrador
const adminMiddleware = async (req, res, next) => {
  try {
    // Primero verificar que el usuario esté autenticado
    await authMiddleware(req, res, () => {      // Verificar si el usuario es administrador
      if (req.user && req.user.isAdmin) {
        // Agregar información de userId e isAdmin al objeto request
        req.userId = req.user._id;
        req.isAdmin = true;
        next();
      } else {
        res.status(403).json({ message: 'Acceso denegado: No tienes permisos de administrador' });
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Por favor autentícate como administrador' });
  }
};

module.exports = {
  authMiddleware,
  adminMiddleware
};
