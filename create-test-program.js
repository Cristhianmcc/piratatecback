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
  createTestProgram();
}).catch(err => {
  console.error('✗ Error al conectar a MongoDB:', err);
  process.exit(1);
});

// Cargar el modelo Program
const Program = require('./models/Program');

// Función para crear un programa de prueba
async function createTestProgram() {
  try {
    console.log('\n=== CREANDO PROGRAMA DE PRUEBA ===\n');
    
    // Verificar si ya existe un programa de prueba
    const existingProgram = await Program.findOne({ name: 'Microsoft Office (Prueba)' });
    
    if (existingProgram) {
      console.log('Ya existe un programa de prueba. Actualizando...');
      
      // Obtener la primera imagen disponible en thumbnails
      const thumbnailsDir = path.join(__dirname, 'uploads', 'thumbnails');
      const thumbnailFiles = fs.readdirSync(thumbnailsDir);
      
      if (thumbnailFiles.length > 0) {
        const timestamp = Date.now();
        const thumbnailFile = thumbnailFiles[0];
        existingProgram.thumbnail = `/uploads/thumbnails/${thumbnailFile}?t=${timestamp}`;
        existingProgram.screenshots = [`/uploads/thumbnails/${thumbnailFile}?t=${timestamp}`];
        
        await existingProgram.save();
        console.log('Programa de prueba actualizado con éxito');
        console.log(`Thumbnail: ${existingProgram.thumbnail}`);
        console.log(`Screenshot: ${existingProgram.screenshots[0]}`);
      } else {
        console.log('No hay imágenes disponibles para actualizar el programa');
      }
    } else {
      // Obtener la primera imagen disponible en thumbnails
      const thumbnailsDir = path.join(__dirname, 'uploads', 'thumbnails');
      const thumbnailFiles = fs.readdirSync(thumbnailsDir);
      
      if (thumbnailFiles.length === 0) {
        console.log('No hay imágenes disponibles para crear el programa de prueba');
        return;
      }
      
      const timestamp = Date.now();
      const thumbnailFile = thumbnailFiles[0];
      
      // Crear un nuevo programa de prueba
      const newProgram = new Program({
        name: 'Microsoft Office (Prueba)',
        description: 'Suite ofimática completa con Word, Excel, PowerPoint y más para uso personal y empresarial.',
        category: 'Productividad',
        version: '2023',
        rating: 4.7,
        downloads: 250000,
        size: '4.2 GB',
        platform: ['Windows', 'MacOS'],
        developer: 'Microsoft',
        license: 'Comercial',
        thumbnail: `/uploads/thumbnails/${thumbnailFile}?t=${timestamp}`,
        screenshots: [`/uploads/thumbnails/${thumbnailFile}?t=${timestamp}`],
        featured: true,
        tags: ['office', 'word', 'excel', 'powerpoint', 'ofimática'],
        requirements: {
          minimal: 'Windows 10 o macOS Catalina, 4GB RAM, 10GB espacio disponible',
          recommended: 'Windows 10 o macOS Monterey, 8GB RAM, SSD con 20GB disponibles'
        },
        features: [
          'Procesador de texto Word',
          'Hojas de cálculo Excel',
          'Presentaciones PowerPoint',
          'Cliente de correo Outlook',
          'Base de datos Access'
        ]
      });
      
      await newProgram.save();
      console.log('Programa de prueba creado con éxito');
      console.log(`Thumbnail: ${newProgram.thumbnail}`);
      console.log(`Screenshot: ${newProgram.screenshots[0]}`);
    }
    
    console.log('\n=== PROCESO COMPLETADO ===');
  } catch (error) {
    console.error('Error al crear programa de prueba:', error);
  } finally {
    mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
}
