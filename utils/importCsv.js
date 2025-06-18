/**
 * Utilidad para importar datos desde un archivo CSV a la base de datos
 * Ejecutar con: node utils/importCsv.js <ruta-al-archivo-csv>
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Program = require('../models/Program');
const { logActivity } = require('../controllers/activityController');

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Función para convertir cadenas a booleanos
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();
    return lowercased === 'true' || lowercased === 'yes' || lowercased === 'si' || lowercased === '1';
  }
  return Boolean(value);
}

// Función para convertir cadenas a fechas
function parseDate(value) {
  if (!value || value === '') return null;
  
  // Intentar parsear la fecha
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Si falla, devolver null
  return null;
}

// Función para convertir cadenas a arrays
function parseArray(value) {
  if (Array.isArray(value)) return value;
  
  if (typeof value === 'string') {
    // Si la cadena ya está en formato JSON, intentar parsearlo
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        return JSON.parse(value);
      } catch (e) {
        // Si falla el JSON.parse, continuar con los otros métodos
      }
    }
    
    // Dividir por comas y limpiar espacios
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }
  
  return [];
}

// Función para normalizar campos
function normalizeFields(row) {
  const normalized = {};
  
  // Mapeo de nombres de campo (original -> normalizado)
  const fieldMapping = {
    'nombre': 'name',
    'name': 'name',
    'descripcion': 'description',
    'description': 'description',
    'categoria': 'category',
    'category': 'category',
    'nombre_categoria': 'categoryName',
    'category_name': 'categoryName',
    'version': 'version',
    'calificacion': 'rating',
    'rating': 'rating',
    'descargas': 'downloads',
    'downloads': 'downloads',
    'tamano': 'size',
    'size': 'size',
    'plataforma': 'platform',
    'platform': 'platform',
    'imagen': 'thumbnailUrl',
    'thumbnail': 'thumbnailUrl',
    'thumbnail_url': 'thumbnailUrl',
    'destacado': 'featured',
    'featured': 'featured',
    'fecha_lanzamiento': 'releaseDate',
    'release_date': 'releaseDate',
    'desarrollador': 'developer',
    'developer': 'developer',
    'sitio_web': 'website',
    'website': 'website',
    'licencia': 'license',
    'license': 'license'
  };
  
  // Recorrer cada campo en la fila original
  Object.keys(row).forEach(key => {
    const normalizedKey = fieldMapping[key.toLowerCase()] || key;
    
    // Normalizar valores según el tipo de campo
    let value = row[key];
    
    if (normalizedKey === 'rating' || normalizedKey === 'downloads') {
      value = parseFloat(value) || 0;
    } else if (normalizedKey === 'featured') {
      value = parseBoolean(value);
    } else if (normalizedKey === 'releaseDate') {
      value = parseDate(value);
    } else if (normalizedKey === 'platform') {
      value = parseArray(value);
    }
    
    normalized[normalizedKey] = value;
  });
  
  return normalized;
}

// Función principal
async function importCsv() {
  if (process.argv.length < 3) {
    console.error('Error: Debes proporcionar la ruta al archivo CSV');
    console.log('Uso: node utils/importCsv.js <ruta-al-archivo-csv>');
    process.exit(1);
  }
  
  const csvFilePath = process.argv[2];
  
  if (!fs.existsSync(csvFilePath)) {
    console.error(`Error: El archivo ${csvFilePath} no existe`);
    process.exit(1);
  }
  
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech');
    console.log('Conectado a MongoDB');
    
    console.log(`Importando datos desde ${csvFilePath}...`);
    
    const results = [];
    let rowCount = 0;
    
    // Leer archivo CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          rowCount++;
          const normalizedRow = normalizeFields(row);
          results.push(normalizedRow);
        })
        .on('end', () => {
          console.log(`CSV procesado: ${rowCount} filas encontradas`);
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });
    
    if (results.length === 0) {
      console.log('No se encontraron datos para importar');
      return;
    }
    
    console.log(`Procesando ${results.length} programas...`);
    
    // Contadores para estadísticas
    let inserted = 0;
    let updated = 0;
    let failed = 0;
    const errors = [];
    
    // Procesar cada programa
    for (const programData of results) {
      try {
        // Comprobar si el programa ya existe (por nombre y versión)
        const existingProgram = await Program.findOne({
          name: programData.name,
          version: programData.version
        });
        
        if (existingProgram) {
          // Actualizar programa existente
          Object.assign(existingProgram, programData);
          await existingProgram.save();
          updated++;
        } else {
          // Crear nuevo programa
          const newProgram = new Program(programData);
          await newProgram.save();
          inserted++;
        }
      } catch (error) {
        failed++;
        errors.push({
          program: programData.name,
          error: error.message
        });
      }
    }
    
    console.log('\nResultados de la importación:');
    console.log(`✅ Programas insertados: ${inserted}`);
    console.log(`🔄 Programas actualizados: ${updated}`);
    console.log(`❌ Programas fallidos: ${failed}`);
    
    if (errors.length > 0) {
      console.log('\nErrores:');
      errors.forEach(error => {
        console.log(`- ${error.program}: ${error.error}`);
      });
    }
    
    // Registrar actividad
    try {
      const adminUser = await mongoose.model('User').findOne({ isAdmin: true });
      if (adminUser) {
        await logActivity(
          adminUser._id,
          'import',
          `Importación de CSV: ${inserted} insertados, ${updated} actualizados, ${failed} fallidos`
        );
      }
    } catch (error) {
      console.warn('No se pudo registrar la actividad:', error.message);
    }
    
    console.log('\nImportación completada');
    
  } catch (error) {
    console.error('Error durante la importación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

// Ejecutar función
importCsv();
