const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

async function verifyAdminPassword() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech');
    console.log('Conectado a MongoDB');
      // Cargar el modelo de Usuario
    const User = require('../models/User');
    
    // Encontrar el usuario administrador
    const plainPassword = 'admin123';
    const admin = await User.findOne({ email: 'admin@piratatecnologico.com' });
    
    if (!admin) {
      console.log('No se encontró un administrador con el email admin@piratatecnologico.com');
      return;
    }
    
    console.log('Administrador encontrado:', {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      isAdmin: admin.isAdmin,
      passwordHash: admin.password.substring(0, 20) + '...' // Mostrar parte del hash por seguridad
    });
    
    // Verificar la contraseña usando directamente bcryptjs
    console.log('\nVerificando contraseña con bcryptjs.compare()...');
    const isValidWithBcryptjs = await bcrypt.compare(plainPassword, admin.password);
    console.log('¿Contraseña válida con bcryptjs?:', isValidWithBcryptjs);
    
    // Verificar la contraseña usando el método del modelo
    console.log('\nVerificando contraseña con el método matchPassword()...');
    const isValidWithMethod = await admin.matchPassword(plainPassword);
    console.log('¿Contraseña válida con matchPassword?:', isValidWithMethod);
    
    // Si ninguno de los métodos funciona, vamos a actualizar la contraseña
    if (!isValidWithBcryptjs && !isValidWithMethod) {
      console.log('\n⚠️ La contraseña no se pudo verificar. Creando nuevo hash...');
      
      // Generar nuevo hash
      const salt = await bcrypt.genSalt(10);
      const newHash = await bcrypt.hash(plainPassword, salt);
      
      // Actualizar la contraseña
      admin.password = newHash;
      await admin.save();
      
      console.log('✅ Contraseña actualizada correctamente con nuevo hash bcryptjs');
      console.log('Nuevo hash:', newHash.substring(0, 20) + '...');
      
      // Verificar de nuevo
      const isValidAfterUpdate = await bcrypt.compare(plainPassword, admin.password);
      console.log('¿Contraseña válida después de actualizar?:', isValidAfterUpdate);
    }
  } catch (error) {
    console.error('Error al verificar la contraseña:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar la función
verifyAdminPassword();
