const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Función para crear un usuario administrador por defecto
const createDefaultAdmin = async () => {
  try {    // Verificar si ya existe un admin
    const adminExists = await User.findOne({ isAdmin: true });
    
    if (adminExists) {
      console.log('Un usuario administrador ya existe');
      return;
    }
    
    // Obtener credenciales desde variables de entorno
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@piratatecnologico.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
      // Crear usuario admin
    const admin = new User({
      username: 'admin',
      name: 'Administrador',
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true
    });
    
    await admin.save();
    console.log(`Usuario administrador creado con email: ${adminEmail}`);
  } catch (error) {
    console.error('Error al crear usuario administrador:', error);
  }
};

module.exports = {
  createDefaultAdmin
};
