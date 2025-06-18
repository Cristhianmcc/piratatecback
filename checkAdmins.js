const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    // Obtener el modelo de Usuario
    const User = require('./models/User');
    
    // Buscar usuarios administradores
    const admins = await User.find({ isAdmin: true });
    
    console.log('Usuarios administradores encontrados:', admins.length);
    admins.forEach(admin => {
      console.log(`- Username: ${admin.username}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  ID: ${admin._id}`);
      console.log('-------------------------');
    });
    
    // Si no hay usuarios administradores, crear uno
    if (admins.length === 0) {
      console.log('No se encontraron administradores. Creando uno nuevo...');
      
      const bcrypt = require('bcryptjs');
      
      // Obtener credenciales desde variables de entorno o usar valores por defecto
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@piratatecnologico.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      
      // Encriptar contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);
      
      // Crear usuario admin
      const admin = new User({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true
      });
      
      await admin.save();
      console.log(`Usuario administrador creado con email: ${adminEmail}`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });
