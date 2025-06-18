const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    // Obtener el modelo de Usuario
    const User = require('./models/User');
    
    // Buscar el usuario administrador
    const admin = await User.findOne({ email: 'admin@piratatecnologico.com' });
    
    if (!admin) {
      console.log('No se encontró el usuario administrador');
      process.exit(1);
    }
    
    // Establecer nueva contraseña
    const newPassword = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Actualizar contraseña
    admin.password = hashedPassword;
    await admin.save();
    
    console.log('Contraseña actualizada correctamente');
    console.log('Email:', admin.email);
    console.log('Nueva contraseña:', newPassword);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });
