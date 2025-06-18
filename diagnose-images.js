const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pirata', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✓ Conectado a MongoDB');
  diagnoseImages();
}).catch(err => {
  console.error('✗ Error al conectar a MongoDB:', err);
  process.exit(1);
});

// Cargar el modelo Program
const Program = require('./models/Program');

// Función para diagnosticar las imágenes
async function diagnoseImages() {
  try {
    console.log('\n=== DIAGNÓSTICO DE IMÁGENES ===\n');
    
    // Obtener todos los programas
    const programs = await Program.find({});
    console.log(`Se encontraron ${programs.length} programas en la base de datos.`);
    
    // Verificar las imágenes de cada programa
    for (const program of programs) {
      console.log(`\n--- Programa: ${program.name} ---`);
      
      // Verificar thumbnail
      if (program.thumbnail) {
        console.log(`Thumbnail: ${program.thumbnail}`);
        
        // Extraer la ruta local del thumbnail
        let localPath;
        if (program.thumbnail.startsWith('/uploads/')) {
          localPath = path.join(__dirname, program.thumbnail);
        } else {
          localPath = path.join(__dirname, 'uploads', program.thumbnail.split('/uploads/').pop());
        }
        
        // Limpiar parámetros de consulta si existen
        if (localPath.includes('?')) {
          localPath = localPath.split('?')[0];
        }
        
        // Verificar si el archivo existe
        const thumbnailExists = fs.existsSync(localPath);
        console.log(`  → Archivo existe: ${thumbnailExists ? 'SÍ' : 'NO'}`);
        console.log(`  → Ruta local: ${localPath}`);
      } else {
        console.log('No tiene thumbnail');
      }
      
      // Verificar screenshots
      if (program.screenshots && program.screenshots.length) {
        console.log(`\nScreenshots (${program.screenshots.length}):`);
        for (let i = 0; i < program.screenshots.length; i++) {
          const screenshot = program.screenshots[i];
          console.log(`[${i+1}] ${screenshot}`);
          
          // Extraer la ruta local del screenshot
          let localPath;
          if (screenshot.startsWith('/uploads/')) {
            localPath = path.join(__dirname, screenshot);
          } else {
            localPath = path.join(__dirname, 'uploads', screenshot.split('/uploads/').pop());
          }
          
          // Limpiar parámetros de consulta si existen
          if (localPath.includes('?')) {
            localPath = localPath.split('?')[0];
          }
          
          // Verificar si el archivo existe
          const screenshotExists = fs.existsSync(localPath);
          console.log(`  → Archivo existe: ${screenshotExists ? 'SÍ' : 'NO'}`);
          console.log(`  → Ruta local: ${localPath}`);
        }
      } else {
        console.log('\nNo tiene screenshots');
      }
    }
    
    console.log('\n=== DIAGNÓSTICO COMPLETO ===');
  } catch (error) {
    console.error('Error al diagnosticar imágenes:', error);
  } finally {
    mongoose.disconnect();
  }
}
