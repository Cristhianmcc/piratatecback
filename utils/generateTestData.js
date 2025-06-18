/**
 * Utilidad para generar datos de prueba para la base de datos
 * Ejecutar con: node utils/generateTestData.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Program = require('../models/Program');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { logActivity } = require('../controllers/activityController');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Categorías de programas
const categories = [
  'Desarrollo', 
  'Diseño', 
  'Multimedia', 
  'Productividad', 
  'Seguridad', 
  'Comunicación',
  'Utilidades', 
  'Juegos', 
  'Educación', 
  'Negocios'
];

// Plataformas
const platforms = [
  ['Windows'],
  ['MacOS'],
  ['Linux'],
  ['Windows', 'MacOS'],
  ['Windows', 'Linux'],
  ['MacOS', 'Linux'],
  ['Windows', 'MacOS', 'Linux'],
  ['Android'],
  ['iOS'],
  ['Android', 'iOS']
];

// Licencias
const licenses = [
  'GPL', 
  'MIT', 
  'Apache', 
  'Comercial', 
  'Freeware', 
  'Shareware',
  'Propietario', 
  'Código abierto', 
  'Freemium'
];

// Desarrolladores
const developers = [
  'Microsoft', 
  'Adobe', 
  'Google', 
  'Apple', 
  'Oracle', 
  'IBM',
  'Canonical', 
  'Mozilla', 
  'Epic Games', 
  'Unity Technologies',
  'JetBrains', 
  'Electronic Arts', 
  'Valve', 
  'Blizzard', 
  'Activision'
];

// Función para generar un número aleatorio entre min y max
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para generar un elemento aleatorio de un array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Función para generar una fecha aleatoria entre dos fechas
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Función para generar datos de un programa aleatorio
function generateRandomProgram() {
  const category = randomItem(categories);
  const developer = randomItem(developers);
  const platform = randomItem(platforms);
  const version = `${randomInt(1, 20)}.${randomInt(0, 9)}.${randomInt(0, 9)}`;
  
  return {
    name: `${developer} ${category} Pro ${version}`,
    description: `Software de ${category.toLowerCase()} desarrollado por ${developer}.`,
    category: category,
    categoryName: category,
    version: version,
    rating: (randomInt(30, 50) / 10),
    downloads: randomInt(1000, 5000000),
    size: `${randomInt(10, 5000)} MB`,
    platform: platform,
    thumbnailUrl: `/img/thumbnails/placeholder.png`,
    featured: Math.random() > 0.8, // 20% de probabilidad de ser destacado
    releaseDate: randomDate(new Date(2020, 0, 1), new Date()),
    developer: developer,
    website: `https://www.${developer.toLowerCase().replace(/\s+/g, '')}.com/${category.toLowerCase()}`,
    license: randomItem(licenses)
  };
}

// Función para generar datos de usuario aleatorio
function generateRandomUser(isAdmin = false) {
  const firstName = randomItem(['Juan', 'María', 'Pedro', 'Ana', 'Carlos', 'Sofía', 'Luis', 'Elena']);
  const lastName = randomItem(['García', 'Rodríguez', 'López', 'Martínez', 'Pérez', 'González', 'Sánchez']);
  const username = `${firstName.toLowerCase()}${randomInt(100, 999)}`;
  
  return {
    name: `${firstName} ${lastName}`,
    username: username,
    email: `${username}@example.com`,
    password: 'password123',
    isAdmin: isAdmin
  };
}

// Función principal
async function generateTestData() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech');
    console.log('Conectado a MongoDB');
    
    // Preguntar al usuario qué datos desea generar
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('\nOpciones disponibles:');
    console.log('1. Generar usuarios de prueba');
    console.log('2. Generar programas de prueba');
    console.log('3. Generar ambos');
    
    readline.question('\nSelecciona una opción (1-3): ', async (option) => {
      readline.close();
      
      let count;
      let adminId;
      
      // Generar usuarios si se seleccionó la opción 1 o 3
      if (option === '1' || option === '3') {
        count = option === '3' ? 10 : parseInt(process.argv[2]) || 10;
        console.log(`\nGenerando ${count} usuarios de prueba...`);
        
        // Verificar si ya existe un usuario administrador
        const existingAdmin = await User.findOne({ isAdmin: true });
        
        if (!existingAdmin) {
          // Crear un usuario administrador
          const adminData = generateRandomUser(true);
          adminData.username = 'admin';
          adminData.email = 'admin@example.com';
          adminData.password = await bcrypt.hash('admin123', 10);
          
          const admin = new User(adminData);
          await admin.save();
          
          adminId = admin._id;
          
          console.log('✅ Usuario administrador creado:');
          console.log(`   - Usuario: ${admin.username}`);
          console.log(`   - Email: ${admin.email}`);
          console.log(`   - Contraseña: admin123`);
        } else {
          adminId = existingAdmin._id;
          console.log('ℹ️ Ya existe un usuario administrador');
        }
        
        // Generar usuarios normales
        const users = [];
        for (let i = 0; i < count; i++) {
          const userData = generateRandomUser();
          userData.password = await bcrypt.hash(userData.password, 10);
          users.push(userData);
        }
        
        // Insertar usuarios
        const result = await User.insertMany(users);
        console.log(`✅ ${result.length} usuarios creados`);
        
        // Registrar actividad
        if (adminId) {
          await logActivity(
            adminId,
            'admin',
            `Generados ${result.length} usuarios de prueba`
          );
        }
      }
      
      // Generar programas si se seleccionó la opción 2 o 3
      if (option === '2' || option === '3') {
        count = option === '3' ? 20 : parseInt(process.argv[2]) || 20;
        console.log(`\nGenerando ${count} programas de prueba...`);
        
        const programs = [];
        for (let i = 0; i < count; i++) {
          programs.push(generateRandomProgram());
        }
        
        // Insertar programas
        const result = await Program.insertMany(programs);
        console.log(`✅ ${result.length} programas creados`);
        
        // Registrar actividad
        if (adminId) {
          await logActivity(
            adminId,
            'admin',
            `Generados ${result.length} programas de prueba`
          );
        }
      }
      
      console.log('\nDatos de prueba generados correctamente');
      
      // Desconectar de la base de datos
      await mongoose.disconnect();
      console.log('Desconectado de MongoDB');
    });
    
  } catch (error) {
    console.error('Error durante la generación de datos:', error);
    await mongoose.disconnect();
  }
}

// Ejecutar función
generateTestData();
