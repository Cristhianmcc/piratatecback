const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Definir la URL base para las imágenes
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
console.log(`Usando BASE_URL: ${BASE_URL}`);

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✓ Conectado a MongoDB');
  fixImageUrls();
}).catch(err => {
  console.error('✗ Error al conectar a MongoDB:', err);
  process.exit(1);
});

// Importar el modelo Program
const Program = require('./models/Program');

// Función para corregir las URLs de las imágenes
async function fixImageUrls() {
  try {
    console.log('Comenzando la corrección de URLs de imágenes...');

    // 1. Verificar directorios
    const uploadsDir = path.join(__dirname, 'uploads');
    const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
    const screenshotsDir = path.join(uploadsDir, 'screenshots');

    if (!fs.existsSync(thumbnailsDir)) {
      console.log(`Creando directorio: ${thumbnailsDir}`);
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    if (!fs.existsSync(screenshotsDir)) {
      console.log(`Creando directorio: ${screenshotsDir}`);
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    // 2. Obtener todos los programas
    const programs = await Program.find({});
    console.log(`Encontrados ${programs.length} programas en la base de datos.`);

    // 3. Corregir URLs en cada programa
    let updatedCount = 0;
    
    for (const program of programs) {
      let updated = false;
      console.log(`\nAnalizando programa: ${program.name}`);

      // 3.1 Corregir thumbnail
      if (program.thumbnail) {
        // Extraer nombre del archivo
        let filename;
        if (program.thumbnail.includes('/')) {
          filename = program.thumbnail.split('/').pop().split('?')[0];
        } else {
          filename = program.thumbnail.split('?')[0];
        }
        
        // Crear nueva URL con BASE_URL explícito
        const newThumbnailUrl = `${BASE_URL}/uploads/thumbnails/${filename}?t=${Date.now()}`;
        
        console.log(`Thumbnail actual: ${program.thumbnail}`);
        console.log(`Nuevo thumbnail: ${newThumbnailUrl}`);
        
        // Verificar si el archivo existe físicamente
        const thumbnailPath = path.join(thumbnailsDir, filename);
        const thumbnailExists = fs.existsSync(thumbnailPath);
        console.log(`El archivo existe físicamente: ${thumbnailExists ? 'SÍ' : 'NO'}`);

        // Actualizar la URL independientemente de si el archivo existe
        // (esto asegura que al menos la URL esté bien formada)
        program.thumbnail = newThumbnailUrl;
        updated = true;
      } else {
        console.log('No tiene thumbnail.');
      }

      // 3.2 Corregir screenshots
      if (program.screenshots && program.screenshots.length > 0) {
        const updatedScreenshots = [];
        
        for (let i = 0; i < program.screenshots.length; i++) {
          const screenshot = program.screenshots[i];
          
          // Extraer nombre del archivo
          let filename;
          if (screenshot.includes('/')) {
            filename = screenshot.split('/').pop().split('?')[0];
          } else {
            filename = screenshot.split('?')[0];
          }
          
          // Crear nueva URL con BASE_URL explícito
          const newScreenshotUrl = `${BASE_URL}/uploads/screenshots/${filename}?t=${Date.now()}`;
          
          console.log(`Screenshot ${i+1} actual: ${screenshot}`);
          console.log(`Nuevo screenshot ${i+1}: ${newScreenshotUrl}`);
          
          // Verificar si el archivo existe físicamente
          const screenshotPath = path.join(screenshotsDir, filename);
          const screenshotExists = fs.existsSync(screenshotPath);
          console.log(`El archivo existe físicamente: ${screenshotExists ? 'SÍ' : 'NO'}`);
          
          // Añadir a la lista actualizada
          updatedScreenshots.push(newScreenshotUrl);
        }
        
        // Actualizar los screenshots
        program.screenshots = updatedScreenshots;
        updated = true;
      } else {
        console.log('No tiene screenshots.');
      }

      // 4. Guardar cambios si hubo actualizaciones
      if (updated) {
        await program.save();
        console.log('✓ Programa actualizado.');
        updatedCount++;
      } else {
        console.log('✓ No se requieren cambios.');
      }
    }

    console.log(`\n=== Resumen ===`);
    console.log(`Total de programas: ${programs.length}`);
    console.log(`Programas actualizados: ${updatedCount}`);
    console.log(`\nProceso completado. Las URLs ahora usan explícitamente la base URL: ${BASE_URL}`);
  } catch (error) {
    console.error('Error al corregir URLs de imágenes:', error);
  } finally {
    mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}
