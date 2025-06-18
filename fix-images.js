/**
 * Script para diagnosticar y resolver problemas con las imágenes
 * Ejecutar con: node fix-images.js
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { createCanvas } = require('canvas'); // Requiere instalar: npm install canvas

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pirata', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✓ Conectado a MongoDB');
  runDiagnostic();
}).catch(err => {
  console.error('✗ Error al conectar a MongoDB:', err);
  process.exit(1);
});

// Importar modelo de programas
const Program = require('./models/Program');

// Rutas de directorios
const uploadsDir = path.join(__dirname, 'uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const screenshotsDir = path.join(uploadsDir, 'screenshots');

// Función principal de diagnóstico
async function runDiagnostic() {
  console.log('\n==== DIAGNÓSTICO DE IMÁGENES ====\n');
  
  try {
    // 1. Verificar directorios
    console.log('1. Verificando directorios...');
    await ensureDirectoriesExist();
    
    // 2. Verificar placeholder
    console.log('\n2. Verificando imagen placeholder...');
    await ensurePlaceholderExists();
    
    // 3. Verificar archivos en la base de datos
    console.log('\n3. Verificando imágenes en la base de datos...');
    await verifyDatabaseImages();
    
    // 4. Verificar archivos huérfanos
    console.log('\n4. Verificando imágenes huérfanas...');
    await findOrphanedImages();
    
    console.log('\n==== DIAGNÓSTICO COMPLETADO ====');
    console.log('Las imágenes deberían funcionar correctamente ahora.\n');
    
  } catch (error) {
    console.error('\n✗ Error durante el diagnóstico:', error);
  } finally {
    // Cerrar conexión a la base de datos
    mongoose.connection.close();
  }
}

// Asegurar que los directorios necesarios existen
async function ensureDirectoriesExist() {
  const dirs = [uploadsDir, thumbnailsDir, screenshotsDir];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      console.log(`  Creando directorio: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  
  console.log('  ✓ Todos los directorios necesarios existen');
}

// Asegurar que existe una imagen placeholder
async function ensurePlaceholderExists() {
  const placeholderPath = path.join(uploadsDir, 'placeholder.jpg');
  
  if (fs.existsSync(placeholderPath)) {
    console.log('  ✓ Imagen placeholder existe');
    return;
  }
  
  // Intentar encontrar una imagen existente para usar como placeholder
  const thumbnails = fs.readdirSync(thumbnailsDir);
  
  if (thumbnails.length > 0) {
    // Usar la primera imagen como placeholder
    const firstImage = path.join(thumbnailsDir, thumbnails[0]);
    fs.copyFileSync(firstImage, placeholderPath);
    console.log(`  ✓ Placeholder creado usando imagen existente: ${thumbnails[0]}`);
  } else {
    // Generar un placeholder usando canvas
    await generatePlaceholder(placeholderPath);
    console.log('  ✓ Placeholder generado automáticamente');
  }
}

// Generar una imagen placeholder usando canvas
async function generatePlaceholder(outputPath) {
  const width = 300;
  const height = 200;
  
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  // Fondo gris claro
  ctx.fillStyle = '#f2f2f2';
  ctx.fillRect(0, 0, width, height);
  
  // Borde
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 2;
  ctx.strokeRect(5, 5, width - 10, height - 10);
  
  // Texto
  ctx.fillStyle = '#666666';
  ctx.font = 'bold 24px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Imagen no disponible', width/2, height/2 - 15);
  
  ctx.font = '16px Arial';
  ctx.fillText('Pirata Tecnológico', width/2, height/2 + 20);
  
  // Guardar la imagen
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(outputPath, buffer);
}

// Verificar imágenes en la base de datos
async function verifyDatabaseImages() {
  const programs = await Program.find({});
  console.log(`  Encontrados ${programs.length} programas en la base de datos`);
  
  let thumbnailIssues = 0;
  let screenshotIssues = 0;
  let fixedThumbnails = 0;
  let fixedScreenshots = 0;
  
  for (const program of programs) {
    // Verificar thumbnail
    if (program.thumbnail) {
      const filename = program.thumbnail.split('/').pop().split('?')[0];
      const thumbnailPath = path.join(thumbnailsDir, filename);
      
      if (!fs.existsSync(thumbnailPath)) {
        thumbnailIssues++;
        console.log(`  ✗ Thumbnail no encontrado para: ${program.name}`);
        
        // Intentar encontrar una imagen con nombre similar
        const similarImage = findSimilarImage(thumbnailsDir, filename);
        if (similarImage) {
          program.thumbnail = `/uploads/thumbnails/${similarImage}`;
          await program.save();
          console.log(`    → Corregido con imagen similar: ${similarImage}`);
          fixedThumbnails++;
        } else {
          program.thumbnail = '/uploads/placeholder.jpg';
          await program.save();
          console.log('    → Establecido a imagen placeholder');
          fixedThumbnails++;
        }
      }
    }
    
    // Verificar screenshots
    if (program.screenshots && program.screenshots.length > 0) {
      const validScreenshots = [];
      
      for (const screenshot of program.screenshots) {
        const filename = screenshot.split('/').pop().split('?')[0];
        const screenshotPath = path.join(screenshotsDir, filename);
        
        if (!fs.existsSync(screenshotPath)) {
          screenshotIssues++;
          console.log(`  ✗ Screenshot no encontrado: ${filename} (${program.name})`);
        } else {
          validScreenshots.push(screenshot);
        }
      }
      
      // Si hubo screenshots inválidos, actualizar el programa
      if (validScreenshots.length !== program.screenshots.length) {
        program.screenshots = validScreenshots;
        await program.save();
        fixedScreenshots += (program.screenshots.length - validScreenshots.length);
        console.log(`    → Se eliminaron ${program.screenshots.length - validScreenshots.length} screenshots inválidos`);
      }
    }
  }
  
  // Resumen
  console.log(`\n  Resumen de problemas:`);
  console.log(`    - Thumbnails con problemas: ${thumbnailIssues}`);
  console.log(`    - Screenshots con problemas: ${screenshotIssues}`);
  console.log(`    - Thumbnails corregidos: ${fixedThumbnails}`);
  console.log(`    - Screenshots corregidos: ${fixedScreenshots}`);
}

// Encontrar imágenes huérfanas
async function findOrphanedImages() {
  const programs = await Program.find({});
  
  // Recopilar todas las imágenes referenciadas en la base de datos
  const referencedThumbnails = new Set();
  const referencedScreenshots = new Set();
  
  programs.forEach(program => {
    if (program.thumbnail) {
      const filename = program.thumbnail.split('/').pop().split('?')[0];
      referencedThumbnails.add(filename);
    }
    
    if (program.screenshots && program.screenshots.length > 0) {
      program.screenshots.forEach(screenshot => {
        const filename = screenshot.split('/').pop().split('?')[0];
        referencedScreenshots.add(filename);
      });
    }
  });
  
  // Verificar thumbnails huérfanos
  const existingThumbnails = fs.readdirSync(thumbnailsDir);
  const orphanedThumbnails = existingThumbnails.filter(
    file => !referencedThumbnails.has(file) && file !== 'placeholder.jpg'
  );
  
  console.log(`  Thumbnails huérfanos: ${orphanedThumbnails.length}`);
  
  // Verificar screenshots huérfanos
  const existingScreenshots = fs.readdirSync(screenshotsDir);
  const orphanedScreenshots = existingScreenshots.filter(
    file => !referencedScreenshots.has(file)
  );
  
  console.log(`  Screenshots huérfanos: ${orphanedScreenshots.length}`);
  
  // Registrar archivos huérfanos
  if (orphanedThumbnails.length > 0 || orphanedScreenshots.length > 0) {
    console.log('\n  Los siguientes archivos no están referenciados en la base de datos:');
    
    if (orphanedThumbnails.length > 0) {
      console.log('    Thumbnails:');
      orphanedThumbnails.forEach(file => {
        console.log(`    - ${file}`);
      });
    }
    
    if (orphanedScreenshots.length > 0) {
      console.log('    Screenshots:');
      orphanedScreenshots.forEach(file => {
        console.log(`    - ${file}`);
      });
    }
  }
}

// Encontrar una imagen con nombre similar
function findSimilarImage(directory, filename) {
  const files = fs.readdirSync(directory);
  
  if (files.length === 0) return null;
  
  // Si hay al menos un archivo, devolver el primero
  // En una implementación más sofisticada, podríamos buscar similitudes en el nombre
  return files[0];
}
