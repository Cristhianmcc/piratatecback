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
      
      // Corregir thumbnail
      if (program.thumbnail) {
        const originalUrl = program.thumbnail;
        
        // Extraer solo el nombre del archivo
        let filename;
        if (originalUrl.includes('/')) {
          filename = originalUrl.split('/').pop().split('?')[0];
        } else {
          filename = originalUrl.split('?')[0];
        }
        
        // Construir la URL correcta
        const correctUrl = `/uploads/thumbnails/${filename}`;
        
        if (correctUrl !== originalUrl) {
          program.thumbnail = correctUrl;
          updated = true;
          console.log(`Corrigiendo thumbnail de "${program.name}": ${originalUrl} → ${correctUrl}`);
        }
      }
      
      // Corregir screenshots
      if (program.screenshots && program.screenshots.length) {
        const updatedScreenshots = program.screenshots.map(screenshot => {
          const originalUrl = screenshot;
          
          // Extraer solo el nombre del archivo
          let filename;
          if (originalUrl.includes('/')) {
            filename = originalUrl.split('/').pop().split('?')[0];
          } else {
            filename = originalUrl.split('?')[0];
          }
          
          // Construir la URL correcta
          const correctUrl = `/uploads/screenshots/${filename}`;
          
          if (correctUrl !== originalUrl) {
            console.log(`Corrigiendo screenshot de "${program.name}": ${originalUrl} → ${correctUrl}`);
            return correctUrl;
          }
          return screenshot;
        });
        
        // Verificar si se actualizaron los screenshots
        if (JSON.stringify(updatedScreenshots) !== JSON.stringify(program.screenshots)) {
          program.screenshots = updatedScreenshots;
          updated = true;
        }
      }
      
      // Guardar el programa actualizado
      if (updated) {
        await program.save();
        updatedCount++;
      }
    }
    
    console.log(`\n✓ Se actualizaron ${updatedCount} programas`);
    console.log('=== CORRECCIÓN COMPLETA ===');
  } catch (error) {
    console.error('Error al corregir URLs de imágenes:', error);
  } finally {
    mongoose.disconnect();
  }
}
