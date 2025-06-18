/**
 * Utilidad para verificar la salud del sistema
 * Ejecutar con: node utils/healthCheck.js
 */

const os = require('os');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { exec } = require('child_process');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Función para verificar si un servicio está en ejecución
function checkServiceRunning(serviceName, processPattern) {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? `tasklist | findstr /i "${processPattern}"`
      : `ps aux | grep -v grep | grep -i "${processPattern}"`;
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve({
          name: serviceName,
          running: false,
          error: error.message
        });
        return;
      }
      
      resolve({
        name: serviceName,
        running: stdout.trim() !== '',
        processes: stdout.trim().split('\n').length
      });
    });
  });
}

// Función para formatear bytes a unidades legibles
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Función para verificar el espacio en disco
function checkDiskSpace() {
  return new Promise((resolve) => {
    const command = process.platform === 'win32'
      ? 'wmic logicaldisk get size,freespace,caption'
      : 'df -h';
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve({
          error: error.message
        });
        return;
      }
      
      resolve({
        output: stdout.trim()
      });
    });
  });
}

// Función para verificar la base de datos
async function checkDatabase() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech';
    
    // Conectar a MongoDB
    await mongoose.connect(dbUri);
    
    // Verificar conexión
    const adminDb = mongoose.connection.db.admin();
    const serverInfo = await adminDb.serverInfo();
    
    // Obtener estadísticas
    const stats = await mongoose.connection.db.stats();
    
    // Obtener colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionStats = [];
    
    // Para cada colección, obtener estadísticas
    for (const collection of collections) {
      const collectionName = collection.name;
      const collectionStats = await mongoose.connection.db.collection(collectionName).stats();
      
      collectionStats.push({
        name: collectionName,
        count: collectionStats.count,
        size: formatBytes(collectionStats.size)
      });
    }
    
    return {
      connected: true,
      version: serverInfo.version,
      collections: collections.length,
      collectionStats,
      dbSize: formatBytes(stats.dataSize),
      storageSize: formatBytes(stats.storageSize),
      indexes: stats.indexes,
      indexSize: formatBytes(stats.indexSize)
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

// Función principal
async function healthCheck() {
  try {
    console.log(`${colors.cyan}🔍 Verificando salud del sistema...${colors.reset}\n`);
    
    // Información del sistema
    console.log(`${colors.blue}Sistema Operativo:${colors.reset} ${os.type()} ${os.release()} (${os.platform()})`);
    console.log(`${colors.blue}Arquitectura:${colors.reset} ${os.arch()}`);
    console.log(`${colors.blue}Hostname:${colors.reset} ${os.hostname()}`);
    console.log(`${colors.blue}Tiempo de actividad:${colors.reset} ${Math.floor(os.uptime() / 3600)} horas`);
    
    // Información de memoria
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsage = Math.round((usedMem / totalMem) * 100);
    
    console.log(`\n${colors.blue}Memoria total:${colors.reset} ${formatBytes(totalMem)}`);
    console.log(`${colors.blue}Memoria utilizada:${colors.reset} ${formatBytes(usedMem)} (${memUsage}%)`);
    
    // Información de CPU
    const cpus = os.cpus();
    console.log(`\n${colors.blue}CPUs:${colors.reset} ${cpus.length} x ${cpus[0].model}`);
    
    // Información de carga
    console.log(`${colors.blue}Carga promedio:${colors.reset} ${os.loadavg().map(load => load.toFixed(2)).join(', ')}`);
    
    // Información de disco
    console.log(`\n${colors.blue}Información de disco:${colors.reset}`);
    const diskSpace = await checkDiskSpace();
    if (diskSpace.error) {
      console.log(`${colors.red}Error al obtener información de disco: ${diskSpace.error}${colors.reset}`);
    } else {
      console.log(diskSpace.output);
    }
    
    // Verificar servicios
    console.log(`\n${colors.blue}Servicios:${colors.reset}`);
    const services = [
      await checkServiceRunning('MongoDB', 'mongod'),
      await checkServiceRunning('Node.js', 'node')
    ];
    
    services.forEach(service => {
      if (service.running) {
        console.log(`${colors.green}✓ ${service.name} está en ejecución (${service.processes} procesos)${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ ${service.name} no está en ejecución${colors.reset}`);
      }
    });
    
    // Verificar base de datos
    console.log(`\n${colors.blue}Base de datos:${colors.reset}`);
    const dbStatus = await checkDatabase();
    
    if (dbStatus.connected) {
      console.log(`${colors.green}✓ Conexión exitosa a MongoDB v${dbStatus.version}${colors.reset}`);
      console.log(`${colors.blue}Colecciones:${colors.reset} ${dbStatus.collections}`);
      console.log(`${colors.blue}Tamaño de base de datos:${colors.reset} ${dbStatus.dbSize}`);
      console.log(`${colors.blue}Tamaño de almacenamiento:${colors.reset} ${dbStatus.storageSize}`);
      console.log(`${colors.blue}Índices:${colors.reset} ${dbStatus.indexes} (${dbStatus.indexSize})`);
      
      console.log(`\n${colors.blue}Estadísticas de colecciones:${colors.reset}`);
      dbStatus.collectionStats.forEach(stats => {
        console.log(`- ${stats.name}: ${stats.count} documentos (${stats.size})`);
      });
    } else {
      console.log(`${colors.red}✗ Error de conexión a MongoDB: ${dbStatus.error}${colors.reset}`);
    }
    
    // Verificar archivos del proyecto
    console.log(`\n${colors.blue}Archivos del proyecto:${colors.reset}`);
    const projectRoot = path.resolve(__dirname, '..');
    
    // Verificar archivos críticos
    const criticalFiles = [
      'package.json',
      '.env',
      'server.js',
      'app.js'
    ];
    
    criticalFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log(`${colors.green}✓ ${file} (${formatBytes(stats.size)})${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ ${file} no encontrado${colors.reset}`);
      }
    });
    
    // Verificar directorio de subidas
    const uploadsDir = path.join(projectRoot, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const uploadStats = fs.statSync(uploadsDir);
      console.log(`${colors.green}✓ Directorio de subidas (${uploadStats.isDirectory() ? 'directorio' : 'archivo'})${colors.reset}`);
      
      // Contar archivos
      if (uploadStats.isDirectory()) {
        const files = fs.readdirSync(uploadsDir);
        console.log(`  - ${files.length} archivos/directorios en uploads/`);
      }
    } else {
      console.log(`${colors.yellow}⚠ Directorio de subidas no encontrado${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✅ Verificación de salud completada${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error durante la verificación de salud:${colors.reset}`, error);
  }
}

// Ejecutar función
healthCheck();
