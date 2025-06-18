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
  replaceMissingImages();
}).catch(err => {
  console.error('✗ Error al conectar a MongoDB:', err);
  process.exit(1);
});

// Cargar el modelo Program
const Program = require('./models/Program');

// Función para reemplazar imágenes faltantes
async function replaceMissingImages() {
  try {
    console.log('\n=== REEMPLAZANDO IMÁGENES FALTANTES ===\n');
    
    // Directorios de uploads
    const thumbnailsDir = path.join(__dirname, 'uploads', 'thumbnails');
    const screenshotsDir = path.join(__dirname, 'uploads', 'screenshots');
    
    // Comprobar que existan los placeholders
    const thumbnailPlaceholder = '/uploads/thumbnails/placeholder.svg';
    const screenshotPlaceholder = '/uploads/screenshots/placeholder.svg';
    
    const localThumbnailPath = path.join(__dirname, thumbnailPlaceholder);
    const localScreenshotPath = path.join(__dirname, screenshotPlaceholder);
    
    if (!fs.existsSync(localThumbnailPath)) {
      console.error(`ERROR: El placeholder de thumbnail no existe en ${localThumbnailPath}`);
      console.log('Ejecuta primero el script create-placeholders.js');
      process.exit(1);
    }
    
    if (!fs.existsSync(localScreenshotPath)) {
      console.error(`ERROR: El placeholder de screenshot no existe en ${localScreenshotPath}`);
      console.log('Ejecuta primero el script create-placeholders.js');
      process.exit(1);
    }
    
    // Obtener todos los programas
    const programs = await Program.find({});
    console.log(`Se encontraron ${programs.length} programas en la base de datos.`);
    
    let fixedThumbnails = 0;
    let fixedScreenshots = 0;
    
    // Revisar cada programa
    for (const program of programs) {
      // Verificar thumbnail
      if (program.thumbnail) {
        let localPath;
        if (program.thumbnail.startsWith('/uploads/')) {
          localPath = path.join(__dirname, program.thumbnail.split('?')[0]);
        } else {
          localPath = path.join(thumbnailsDir, program.thumbnail.split('?')[0].split('/').pop());
        }
        
        if (!fs.existsSync(localPath)) {
          console.log(`Thumbnail faltante para "${program.name}": ${program.thumbnail}`);
          
          // Reemplazar con placeholder
          const timestamp = Date.now();
          program.thumbnail = `${thumbnailPlaceholder}?t=${timestamp}`;
          await program.save();
          fixedThumbnails++;
          console.log(`  → Reemplazado con placeholder`);
        }
      } else {
        // No tiene thumbnail, añadir uno
        console.log(`"${program.name}" no tiene thumbnail`);
        const timestamp = Date.now();
        program.thumbnail = `${thumbnailPlaceholder}?t=${timestamp}`;
        await program.save();
        fixedThumbnails++;
        console.log(`  → Añadido placeholder`);
      }
      
      // Verificar screenshots
      if (program.screenshots && program.screenshots.length) {
        let updatedScreenshots = false;
        
        for (let i = 0; i < program.screenshots.length; i++) {
          const screenshot = program.screenshots[i];
          let localPath;
          
          if (screenshot.startsWith('/uploads/')) {
            localPath = path.join(__dirname, screenshot.split('?')[0]);
          } else {
            localPath = path.join(screenshotsDir, screenshot.split('?')[0].split('/').pop());
          }
          
          if (!fs.existsSync(localPath)) {
            console.log(`Screenshot faltante para "${program.name}": ${screenshot}`);
            
            // Reemplazar con placeholder
            const timestamp = Date.now();
            program.screenshots[i] = `${screenshotPlaceholder}?t=${timestamp}`;
            updatedScreenshots = true;
            fixedScreenshots++;
          }
        }
        
        if (updatedScreenshots) {
          await program.save();
          console.log(`  → Screenshots reemplazados con placeholders`);
        }
      } else if (!program.screenshots || program.screenshots.length === 0) {
        // No tiene screenshots, añadir al menos uno
        console.log(`"${program.name}" no tiene screenshots`);
        const timestamp = Date.now();
        program.screenshots = [`${screenshotPlaceholder}?t=${timestamp}`];
        await program.save();
        fixedScreenshots++;
        console.log(`  → Añadido screenshot placeholder`);
      }
    }
    
    console.log(`\n✓ Se reemplazaron ${fixedThumbnails} thumbnails y ${fixedScreenshots} screenshots faltantes`);
    console.log('=== REEMPLAZO COMPLETO ===');
  } catch (error) {
    console.error('Error al reemplazar imágenes:', error);
  } finally {
    mongoose.disconnect();
  }
}
