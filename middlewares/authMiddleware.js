const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rutas
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Verificar si hay token en los headers y si empieza con Bearer
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      // Obtener el token sin el "Bearer"
      token = req.headers.authorization.split(' ')[1];
    }

    // Verificar si el token existe
    if (!token) {
      return res.status(401).json({ message: 'No autorizado, no hay token' });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscar el usuario por el id del token decodificado y excluir la contraseña
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'No autorizado, token inválido' });
    }

    // Añadir el usuario al objeto req para usarlo en las rutas protegidas
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'No autorizado, token inválido' });
  }
};

// Middleware para verificar roles de administrador
exports.isAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'No autorizado como administrador' });
  }
};
