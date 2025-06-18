/**
 * Utilidad para crear respaldos de la base de datos MongoDB
 * Ejecutar con: node utils/backup.js
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const readline = require('readline');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Crear directorio de respaldos si no existe
const BACKUP_DIR = path.resolve(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Función para formatear la fecha
function getFormattedDate() {
  const date = new Date();
  return date.toISOString()
    .replace(/:/g, '-')
    .replace(/\..+/, '')
    .replace('T', '_');
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

// Crear un respaldo utilizando mongodump
function createMongoDump(dbUri, outputPath) {
  return new Promise((resolve, reject) => {
    // Extraer información de conexión
    const uri = new URL(dbUri);
    const database = uri.pathname.substring(1);
    const auth = uri.username ? `${uri.username}:${uri.password}` : '';
    const host = uri.hostname;
    const port = uri.port || '27017';
    
    // Construir comando mongodump
    let command = 'mongodump';
    
    if (auth) {
      command += ` --username ${uri.username} --password ${uri.password}`;
    }
    
    command += ` --host ${host} --port ${port}`;
    command += ` --db ${database}`;
    command += ` --out ${outputPath}`;
    
    console.log(`Ejecutando: ${command.replace(/--password \S+/, '--password ******')}`);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al ejecutar mongodump: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.warn(`Advertencias: ${stderr}`);
      }
      console.log(`Salida: ${stdout}`);
      resolve(true);
    });
  });
}

// Crear un respaldo usando MongoDB nativo (JSON)
async function createNativeBackup(dbUri, outputPath) {
  try {
    // Conectar a MongoDB
    await mongoose.connect(dbUri);
    console.log('Conectado a MongoDB para respaldo nativo');
    
    // Obtener todas las colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Para cada colección, obtener todos los documentos y guardarlos en un archivo JSON
    for (const collection of collections) {
      const collectionName = collection.name;
      const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
      
      // Crear directorio para la colección
      const collectionDir = path.join(outputPath, collectionName);
      fs.mkdirSync(collectionDir, { recursive: true });
      
      // Guardar documentos en un archivo JSON
      const filePath = path.join(collectionDir, 'documents.json');
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
      
      console.log(`Respaldo de colección ${collectionName} completado: ${documents.length} documentos`);
    }
    
    return true;
  } catch (error) {
    console.error('Error al crear respaldo nativo:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Función principal
async function backup() {
  let rl;
  try {
    console.log('🔄 Utilidad de respaldo de base de datos');
    console.log('=======================================\n');
    
    // Crear interfaz de línea de comandos
    rl = createInterface();
    
    // Obtener la cadena de conexión
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech';
    console.log(`Base de datos: ${dbUri.replace(/:[^:@]+@/, ':***@')}`);
    
    // Crear directorio de respaldo con fecha
    const timestamp = getFormattedDate();
    const backupPath = path.join(BACKUP_DIR, `backup_${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });
    
    console.log('\nOpciones de respaldo:');
    console.log('1. Usar mongodump (requiere que mongodump esté instalado)');
    console.log('2. Usar respaldo nativo (JSON)');
    
    const option = await askQuestion(rl, '\nSelecciona una opción (1-2): ');
    
    let success = false;
    
    if (option === '1') {
      console.log('\nCreando respaldo con mongodump...');
      success = await createMongoDump(dbUri, backupPath);
    } else if (option === '2') {
      console.log('\nCreando respaldo nativo (JSON)...');
      success = await createNativeBackup(dbUri, backupPath);
    } else {
      console.log('\n❌ Opción no válida.');
      return;
    }
    
    if (success) {
      console.log(`\n✅ Respaldo completado en: ${backupPath}`);
      
      // Crear archivo de información
      const infoFile = path.join(backupPath, 'info.txt');
      const infoContent = `Respaldo creado: ${new Date().toISOString()}
Base de datos: ${dbUri.replace(/:[^:@]+@/, ':***@')}
Método: ${option === '1' ? 'mongodump' : 'nativo (JSON)'}
Creado por: Utilidad de respaldo v1.0
`;
      fs.writeFileSync(infoFile, infoContent);
      
      console.log('📝 Archivo de información creado');
    }
  } catch (error) {
    console.error('❌ Error durante el respaldo:', error);
  } finally {
    if (rl) rl.close();
  }
}

// Ejecutar función
backup();
