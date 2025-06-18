const User = require('../models/User');
const bcrypt = require('bcryptjs'); // Usamos bcryptjs en lugar de bcrypt

const debugLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Mostrar información de depuración
    console.log('=============== DEBUG LOGIN ===============');
    console.log('Email proporcionado:', email);
    console.log('Password proporcionado:', password);
    
    // Buscar usuario por email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('Usuario no encontrado con el email:', email);
      return res.status(401).json({ message: 'Credenciales incorrectas - usuario no encontrado' });
    }
    
    console.log('Usuario encontrado:', {
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    });
    
    // Verificar contraseña
    console.log('Hash de contraseña almacenado:', user.password);
    console.log('Contraseña proporcionada:', password);
    
    try {
      console.log('Intentando comparar contraseñas con bcryptjs...');
      const isPasswordValidJS = await bcrypt.compare(password, user.password);
      console.log('Resultado bcryptjs:', isPasswordValidJS);
      
      // Intento alternativo si fue creado con bcrypt en lugar de bcryptjs
      try {
        const bcryptOriginal = require('bcrypt');
        console.log('Intentando comparar contraseñas con bcrypt original...');
        const isPasswordValidOriginal = await bcryptOriginal.compare(password, user.password);
        console.log('Resultado bcrypt original:', isPasswordValidOriginal);
      } catch (bcryptErr) {
        console.log('Error al intentar con bcrypt original:', bcryptErr.message);
      }
      
      if (!isPasswordValidJS) {
        console.log('Contraseña incorrecta');
        return res.status(401).json({ message: 'Credenciales incorrectas - contraseña incorrecta' });
      }
    } catch (compareErr) {
      console.error('Error al comparar contraseñas:', compareErr);
      return res.status(500).json({ message: 'Error al verificar credenciales', error: compareErr.message });
    }
    
    // Verificar si es admin
    if (!user.isAdmin) {
      console.log('Usuario no es administrador');
      return res.status(403).json({ message: 'No tienes permisos de administrador' });
    }
    
    console.log('Autenticación exitosa, generando token...');
    
    // Crear un token simple para pruebas
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    
    console.log('Token generado exitosamente');
    console.log('=======================================');
    
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error en el proceso de login:', error);
    res.status(500).json({ message: 'Error en el servidor', error: error.message });
  }
};

module.exports = {
  debugLogin
};
