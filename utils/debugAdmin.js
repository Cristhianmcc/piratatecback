const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

async function debugAdmin() {
  try {
    console.log('Conectando a MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech');
    console.log('Conectado a MongoDB');

    // Cargar modelo de usuario
    const User = require('../models/User');
    
    // Buscar todos los usuarios administradores
    console.log('Buscando administradores existentes...');
    const admins = await User.find({ isAdmin: true });
    
    if (admins.length === 0) {
      console.log('No se encontraron administradores en la base de datos.');
    } else {
      console.log(`Se encontraron ${admins.length} administradores:`);
      
      for (const admin of admins) {
        console.log('----------------------------------------');
        console.log(`ID: ${admin._id}`);
        console.log(`Username: ${admin.username}`);
        console.log(`Email: ${admin.email}`);
        console.log(`Password Hash: ${admin.password}`);
        console.log(`isAdmin: ${admin.isAdmin}`);
        
        // Probar la contraseña
        try {
          const isValidPassword = await bcryptjs.compare('admin123', admin.password);
          console.log(`¿Contraseña 'admin123' válida?: ${isValidPassword ? 'SÍ ✅' : 'NO ❌'}`);
          
          if (!isValidPassword) {
            // Intentar con contraseña sin hash (para depuración)
            const isPlainText = admin.password === 'admin123';
            console.log(`¿La contraseña está almacenada sin hash?: ${isPlainText ? 'SÍ ❌' : 'NO ✅'}`);
          }
        } catch (error) {
          console.error('Error al comprobar la contraseña:', error.message);
        }
      }
    }
    
    // Probar la creación del hash
    console.log('\n== Prueba de creación de hash ==');
    const testPassword = 'admin123';
    try {
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(testPassword, salt);
      console.log(`Password original: ${testPassword}`);
      console.log(`Hash generado: ${hashedPassword}`);
      
      // Verificar que el hash funciona
      const isValid = await bcryptjs.compare(testPassword, hashedPassword);
      console.log(`Verificación del hash: ${isValid ? 'Funciona ✅' : 'Falla ❌'}`);
    } catch (error) {
      console.error('Error al crear hash:', error);
    }
    
    // Obtener la versión de los paquetes
    console.log('\n== Versiones de paquetes ==');
    console.log(`bcryptjs: ${require('bcryptjs/package.json').version}`);
    try {
      console.log(`bcrypt: ${require('bcrypt/package.json').version}`);
    } catch (error) {
      console.log('bcrypt: No instalado');
    }
    
    // Crear un nuevo usuario de prueba
    console.log('\n== Creando usuario de prueba ==');
    const testUser = new User({
      username: 'testadmin',
      email: 'test@piratatecnologico.com',
      password: 'test123',
      isAdmin: true
    });
    
    try {
      await testUser.save();
      console.log('Usuario de prueba guardado');
      
      // Buscar el usuario recién creado
      const savedUser = await User.findOne({ username: 'testadmin' });
      console.log('Usuario guardado:', savedUser);
      
      // Probar la contraseña
      const isValid = await bcryptjs.compare('test123', savedUser.password);
      console.log(`¿Contraseña correcta?: ${isValid ? 'SÍ ✅' : 'NO ❌'}`);
      
      // Limpiar
      await User.deleteOne({ username: 'testadmin' });
      console.log('Usuario de prueba eliminado');
    } catch (error) {
      console.error('Error al guardar usuario de prueba:', error);
    }
    
    // Resetear administrador
    console.log('\n== Reseteando administrador ==');
    
    // Eliminar todos los administradores existentes
    const deleteResult = await User.deleteMany({ isAdmin: true });
    console.log(`${deleteResult.deletedCount} administradores eliminados`);
    
    // Crear contraseña hasheada manualmente para evitar middleware
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('admin123', salt);
    
    // Crear nuevo usuario administrador
    const newAdmin = new User({
      username: 'admin',
      email: 'admin@piratatecnologico.com',
      password: hashedPassword,
      isAdmin: true
    });
    
    await newAdmin.save();
    console.log('Nuevo administrador creado:');
    console.log(`- Username: ${newAdmin.username}`);
    console.log(`- Email: ${newAdmin.email}`);
    console.log(`- Contraseña: admin123`);
    
    // Verificar que la contraseña funciona
    const savedAdmin = await User.findOne({ username: 'admin' });
    const passwordValid = await bcryptjs.compare('admin123', savedAdmin.password);
    console.log(`¿Contraseña validada correctamente?: ${passwordValid ? 'SÍ ✅' : 'NO ❌'}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar la función
debugAdmin();
