const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pirata', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✓ Conectado a MongoDB');
  fixImageUrls();
}).catch(err => {
  console.error('✗ Error al conectar a MongoDB:', err);
  process.exit(1);
});

// Cargar el modelo Program
const Program = require('./models/Program');

// Función para corregir las URLs de imágenes
async function fixImageUrls() {
  try {
    console.log('\n=== CORRIGIENDO URLS DE IMÁGENES ===\n');
    
    // Obtener todos los programas
    const programs = await Program.find({});
    console.log(`Se encontraron ${programs.length} programas en la base de datos.`);
    
    let updatedCount = 0;
    
    // Corregir las URLs de cada programa
    for (const program of programs) {
      let updated = false;

      console.log(`\nAnalizando programa: ${program.name}`);
      
      // Verificar y corregir el thumbnail
      if (program.thumbnail) {
        // Normalizar la URL del thumbnail
        const originalThumbnail = program.thumbnail;
        
        // Extraer el nombre del archivo
        let filename;
        if (originalThumbnail.includes('/')) {
          filename = originalThumbnail.split('/').pop();
        } else {
          filename = originalThumbnail;
        }
        
        // Eliminar parámetros de consulta si existen
        if (filename.includes('?')) {
          filename = filename.split('?')[0];
        }
        
        // Verificar si el archivo existe físicamente
        const thumbnailPath = path.join(__dirname, 'uploads', 'thumbnails', filename);
        const fileExists = fs.existsSync(thumbnailPath);
        
        console.log(`  Thumbnail: ${originalThumbnail}`);
        console.log(`    → Nombre archivo: ${filename}`);
        console.log(`    → Ruta completa: ${thumbnailPath}`);
        console.log(`    → Archivo existe: ${fileExists ? 'SÍ' : 'NO'}`);
        
        // Si el archivo no existe, buscar alternativas
        if (!fileExists) {
          console.log('    → Buscando archivos alternativos...');
          
          // Listar todos los archivos en la carpeta thumbnails
          const thumbnailFiles = fs.readdirSync(path.join(__dirname, 'uploads', 'thumbnails'));
          
          if (thumbnailFiles.length > 0) {
            // Usar el primer archivo disponible
            const alternativeFile = thumbnailFiles[0];
            const newThumbnail = `/uploads/thumbnails/${alternativeFile}?t=${Date.now()}`;
            
            console.log(`    → Reemplazando con: ${alternativeFile}`);
            
            program.thumbnail = newThumbnail;
            updated = true;
          } else {
            // No hay archivos alternativos, usar un placeholder
            console.log('    → No hay archivos alternativos disponibles');
            program.thumbnail = null;
            updated = true;
          }
        } else {
          // El archivo existe, asegurar que la URL es correcta
          const correctThumbnail = `/uploads/thumbnails/${filename}?t=${Date.now()}`;
          
          if (correctThumbnail !== originalThumbnail) {
            console.log(`    → Actualizando URL: ${correctThumbnail}`);
            program.thumbnail = correctThumbnail;
            updated = true;
          } else {
            console.log('    → URL ya es correcta');
          }
        }
      } else {
        console.log('  No tiene thumbnail');
        
        // Asignar un thumbnail de los disponibles
        const thumbnailFiles = fs.readdirSync(path.join(__dirname, 'uploads', 'thumbnails'));
        
        if (thumbnailFiles.length > 0) {
          // Usar el primer archivo disponible
          const alternativeFile = thumbnailFiles[0];
          const newThumbnail = `/uploads/thumbnails/${alternativeFile}?t=${Date.now()}`;
          
          console.log(`    → Asignando thumbnail: ${alternativeFile}`);
          
          program.thumbnail = newThumbnail;
          updated = true;
        }
      }
      
      // Verificar y corregir screenshots
      if (program.screenshots && program.screenshots.length > 0) {
        console.log('  Screenshots:');
        
        const updatedScreenshots = [];
        
        for (let i = 0; i < program.screenshots.length; i++) {
          const originalScreenshot = program.screenshots[i];
          
          // Extraer el nombre del archivo
          let filename;
          if (originalScreenshot.includes('/')) {
            filename = originalScreenshot.split('/').pop();
          } else {
            filename = originalScreenshot;
          }
          
          // Eliminar parámetros de consulta si existen
          if (filename.includes('?')) {
            filename = filename.split('?')[0];
          }
          
          // Verificar si el archivo existe físicamente
          const screenshotPath = path.join(__dirname, 'uploads', 'screenshots', filename);
          const fileExists = fs.existsSync(screenshotPath);
          
          console.log(`    [${i+1}] ${originalScreenshot}`);
          console.log(`      → Nombre archivo: ${filename}`);
          console.log(`      → Archivo existe: ${fileExists ? 'SÍ' : 'NO'}`);
          
          if (fileExists) {
            // El archivo existe, asegurar que la URL es correcta
            const correctScreenshot = `/uploads/screenshots/${filename}?t=${Date.now()}`;
            updatedScreenshots.push(correctScreenshot);
            
            if (correctScreenshot !== originalScreenshot) {
              console.log(`      → Actualizando URL: ${correctScreenshot}`);
              updated = true;
            }
          } else {
            // El archivo no existe, intentar usar un thumbnail como screenshot
            console.log('      → Archivo no existe, usando thumbnail como alternativa');
            
            if (program.thumbnail) {
              const thumbFilename = program.thumbnail.split('/').pop().split('?')[0];
              const thumbPath = `/uploads/thumbnails/${thumbFilename}?t=${Date.now()}`;
              updatedScreenshots.push(thumbPath);
              console.log(`      → Usando thumbnail: ${thumbPath}`);
              updated = true;
            } else {
              // No hay thumbnail, buscar cualquier imagen disponible
              const thumbnailFiles = fs.readdirSync(path.join(__dirname, 'uploads', 'thumbnails'));
              
              if (thumbnailFiles.length > 0) {
                const alternativeFile = thumbnailFiles[0];
                const alternativePath = `/uploads/thumbnails/${alternativeFile}?t=${Date.now()}`;
                updatedScreenshots.push(alternativePath);
                console.log(`      → Usando imagen alternativa: ${alternativePath}`);
                updated = true;
              } else {
                // No hay imágenes disponibles, omitir esta screenshot
                console.log('      → No hay imágenes disponibles, omitiendo');
              }
            }
          }
        }
        
        // Actualizar las screenshots si es necesario
        if (updated) {
          program.screenshots = updatedScreenshots;
        }
      } else {
        // No tiene screenshots, usar thumbnail como screenshot
        if (program.thumbnail) {
          const thumbFilename = program.thumbnail.split('/').pop().split('?')[0];
          const thumbPath = `/uploads/thumbnails/${thumbFilename}?t=${Date.now()}`;
          program.screenshots = [thumbPath];
          console.log('  No tiene screenshots, usando thumbnail como screenshot');
          updated = true;
        } else {
          // No hay thumbnail, buscar cualquier imagen disponible
          const thumbnailFiles = fs.readdirSync(path.join(__dirname, 'uploads', 'thumbnails'));
          
          if (thumbnailFiles.length > 0) {
            const alternativeFile = thumbnailFiles[0];
            const alternativePath = `/uploads/thumbnails/${alternativeFile}?t=${Date.now()}`;
            program.screenshots = [alternativePath];
            console.log(`  No tiene screenshots ni thumbnail, usando imagen alternativa`);
            updated = true;
          }
        }
      }
      
      // Guardar el programa si se actualizó
      if (updated) {
        await program.save();
        updatedCount++;
        console.log(`  ✓ Programa actualizado`);
      } else {
        console.log(`  ✓ No se requieren cambios`);
      }
    }
    
    console.log(`\n=== RESUMEN ===`);
    console.log(`Total de programas: ${programs.length}`);
    console.log(`Programas actualizados: ${updatedCount}`);
    
    console.log('\n=== PROCESO COMPLETADO ===');
  } catch (error) {
    console.error('Error al corregir URLs de imágenes:', error);
  } finally {
    mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}
