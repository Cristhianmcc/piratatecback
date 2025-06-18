const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Usamos bcryptjs porque es lo que usa el controlador de admin
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Función principal
async function fixAdminAuth() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech');
    console.log('Conectado a MongoDB');
    
    // Cargar el modelo de Usuario
    const User = require('../models/User');
    
    // 1. Eliminar usuarios administradores existentes
    const deleteResult = await User.deleteMany({ isAdmin: true });
    console.log(`Se eliminaron ${deleteResult.deletedCount} usuarios administradores existentes`);
    
    // 2. Crear un nuevo usuario administrador con credenciales desde .env
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@piratatecnologico.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // Generar hash de contraseña con bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);
    
    // Crear nuevo usuario administrador
    const newAdmin = new User({
      username: 'admin',
      email: adminEmail,
      password: hashedPassword,
      isAdmin: true
    });
    
    await newAdmin.save();
    console.log('✅ Usuario administrador creado exitosamente:');
    console.log(`   - Email: ${adminEmail}`);
    console.log(`   - Contraseña: ${adminPassword}`);
    console.log(`   - ID: ${newAdmin._id}`);
    
    // 3. Modificar el archivo app.js para comentar la línea que crea el administrador en cada inicio
    console.log('\nIMPORTANTE: Para evitar que aparezca el mensaje "Un usuario administrador ya existe",');
    console.log('comenta o elimina la línea que ejecuta createDefaultAdmin() en app.js');
    console.log('Busca algo como: createDefaultAdmin() y comenta esa línea.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Cerrar conexión
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la función
fixAdminAuth();
