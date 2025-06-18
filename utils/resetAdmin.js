const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const readline = require('readline');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Cargar controlador de actividad
let activityController;
try {
  activityController = require('../controllers/activityController');
} catch (error) {
  console.log('No se pudo cargar el controlador de actividad, se omitirá el registro de actividades');
}

// Crear interfaz de línea de comandos
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// Función para preguntar al usuario
function askQuestion(rl, question) {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
}

async function resetAdmin() {
  let rl;
  try {
    console.log('🔧 Utilidad de restablecimiento de administrador');
    console.log('==============================================');
    
    console.log('\nConectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech');
    console.log('✅ Conectado a MongoDB');
    
    // Mostrar cadena de conexión (sin contraseñas)
    const connectionString = mongoose.connection.client.s.url;
    console.log('URL de conexión:', connectionString.replace(/:([^:@]+)@/, ':***@'));
    
    // Cargar modelo de usuario
    const User = mongoose.models.User || require('../models/User');
    
    // Crear interfaz de línea de comandos
    rl = createInterface();
    
    console.log('\nOpciones disponibles:');
    console.log('1. Crear un nuevo administrador (conservando los existentes)');
    console.log('2. Restablecer contraseña de un administrador existente');
    console.log('3. Eliminar todos los usuarios y crear un nuevo administrador');
    
    const option = await askQuestion(rl, '\nSelecciona una opción (1-3): ');
    
    // Valores predeterminados
    let username = 'admin';
    let email = 'admin@admin.com';
    let password = 'admin123';
    
    if (option === '1') {
      // Crear un nuevo administrador
      username = await askQuestion(rl, 'Nombre de usuario (admin): ') || username;
      email = await askQuestion(rl, 'Email (admin@admin.com): ') || email;
      password = await askQuestion(rl, 'Contraseña (admin123): ') || password;
      
      // Verificar si ya existe
      const existingUser = await User.findOne({ $or: [{ username }, { email }] });
      if (existingUser) {
        console.log('\n❌ Error: Ya existe un usuario con ese nombre de usuario o email.');
        return;
      }
      
      // Crear hash de contraseña
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);
      
      // Crear nuevo usuario administrador
      const newAdmin = new User({
        username,
        email,
        password: hashedPassword,
        isAdmin: true
      });
      
      await newAdmin.save();
      
      console.log('\n✅ Usuario administrador creado exitosamente:');
      console.log(`   - ID: ${newAdmin._id}`);
      console.log(`   - Usuario: ${newAdmin.username}`);
      console.log(`   - Email: ${newAdmin.email}`);
      
      // Registrar actividad si está disponible
      if (activityController && activityController.logActivity) {
        await activityController.logActivity(
          newAdmin._id,
          'admin',
          'Nuevo usuario administrador creado mediante la utilidad resetAdmin'
        );
      }
      
    } else if (option === '2') {
      // Restablecer contraseña de administrador existente
      const userIdentifier = await askQuestion(rl, 'Ingresa el email o nombre de usuario: ');
      
      // Buscar el usuario
      const user = await User.findOne({ 
        $or: [
          { email: userIdentifier },
          { username: userIdentifier }
        ]
      });
      
      if (!user) {
        console.log('\n❌ Error: No se encontró ningún usuario con ese email o nombre de usuario.');
        return;
      }
      
      if (!user.isAdmin) {
        const makeAdmin = await askQuestion(rl, 'Este usuario no es administrador. ¿Quieres convertirlo en administrador? (s/n): ');
        if (makeAdmin.toLowerCase() === 's' || makeAdmin.toLowerCase() === 'si') {
          user.isAdmin = true;
        } else {
          console.log('\nOperación cancelada.');
          return;
        }
      }
      
      // Obtener nueva contraseña
      password = await askQuestion(rl, 'Nueva contraseña (admin123): ') || password;
      
      // Crear hash de contraseña
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);
      
      // Actualizar contraseña
      user.password = hashedPassword;
      await user.save();
      
      console.log('\n✅ Contraseña restablecida exitosamente para:');
      console.log(`   - Usuario: ${user.username}`);
      console.log(`   - Email: ${user.email}`);
      
      // Registrar actividad si está disponible
      if (activityController && activityController.logActivity) {
        await activityController.logActivity(
          user._id,
          'admin',
          'Contraseña de administrador restablecida mediante la utilidad resetAdmin'
        );
      }
      
    } else if (option === '3') {
      // Confirmar eliminación
      const confirm = await askQuestion(rl, '⚠️ ADVERTENCIA: Esta acción eliminará TODOS los usuarios. ¿Estás seguro? (escribe "CONFIRMAR" para continuar): ');
      
      if (confirm !== 'CONFIRMAR') {
        console.log('\nOperación cancelada.');
        return;
      }
      
      // Eliminar todos los usuarios
      console.log('\nEliminando todos los usuarios existentes...');
      const deleteResult = await User.deleteMany({});
      console.log(`${deleteResult.deletedCount} usuarios eliminados`);
      
      // Obtener datos del nuevo administrador
      username = await askQuestion(rl, 'Nombre de usuario (admin): ') || username;
      email = await askQuestion(rl, 'Email (admin@admin.com): ') || email;
      password = await askQuestion(rl, 'Contraseña (admin123): ') || password;
      
      // Crear hash de contraseña
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(password, salt);
      
      // Crear nuevo usuario administrador
      const newAdmin = new User({
        username,
        email,
        password: hashedPassword,
        isAdmin: true
      });
      
      await newAdmin.save();
      
      console.log('\n✅ Usuario administrador creado exitosamente:');
      console.log(`   - ID: ${newAdmin._id}`);
      console.log(`   - Usuario: ${newAdmin.username}`);
      console.log(`   - Email: ${newAdmin.email}`);
      
      // Registrar actividad si está disponible
      if (activityController && activityController.logActivity) {
        await activityController.logActivity(
          newAdmin._id,
          'admin',
          'Todos los usuarios fueron eliminados y se creó un nuevo administrador mediante resetAdmin'
        );
      }
    } else {
      console.log('\n❌ Opción no válida.');
      return;
    }
    
    console.log('\n🔐 Para iniciar sesión usa:');
    console.log(`   Email: ${email}`);
    console.log(`   Contraseña: ${password}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (rl) rl.close();
    await mongoose.disconnect();
    console.log('\nDesconectado de MongoDB');
  }
}

// Ejecutar función
resetAdmin();
