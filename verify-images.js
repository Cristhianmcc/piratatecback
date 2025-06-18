const fs = require('fs');
const path = require('path');

// Función principal
async function verifyImages() {
  console.log('=== Verificando archivos de imágenes ===');
  
  // Directorios
  const uploadsDir = path.join(__dirname, 'uploads');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  const screenshotsDir = path.join(uploadsDir, 'screenshots');
  
  // Verificar estructura de directorios
  if (!fs.existsSync(uploadsDir)) {
    console.log('Creando directorio uploads...');
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  if (!fs.existsSync(thumbnailsDir)) {
    console.log('Creando directorio thumbnails...');
    fs.mkdirSync(thumbnailsDir, { recursive: true });
  }
  
  if (!fs.existsSync(screenshotsDir)) {
    console.log('Creando directorio screenshots...');
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }
  
  // Crear placeholder de ejemplo si no hay imágenes
  const createPlaceholder = (dir, name) => {
    // Buscar si hay al menos un archivo en el directorio
    const files = fs.readdirSync(dir);
    if (files.length === 0) {
      console.log(`No se encontraron imágenes en ${dir}`);
      console.log(`Creando imagen placeholder de ejemplo...`);
      
      // Crear una imagen SVG como placeholder
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#f0f0f0"/>
        <rect x="5" y="5" width="290" height="190" stroke="#cccccc" stroke-width="2" fill="none"/>
        <text x="150" y="90" font-family="Arial" font-size="16" text-anchor="middle" fill="#666666">Imagen no disponible</text>
        <text x="150" y="120" font-family="Arial" font-size="14" text-anchor="middle" fill="#666666">Pirata Tecnológico</text>
      </svg>`;
      
      fs.writeFileSync(path.join(dir, `${name}-placeholder.svg`), svgContent);
      console.log(`Creado: ${name}-placeholder.svg`);
    } else {
      console.log(`Se encontraron ${files.length} archivos en ${dir}`);
    }
  };
  
  // Crear placeholders si es necesario
  createPlaceholder(thumbnailsDir, 'thumbnail');
  createPlaceholder(screenshotsDir, 'screenshot');
  
  // Verificar permisos
  console.log('\nVerificando permisos de directorios...');
  try {
    // Intentar escribir un archivo temporal para verificar permisos
    const testFile = path.join(thumbnailsDir, '.test-write-permissions');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✓ Permisos de escritura OK');
  } catch (error) {
    console.error('❌ Error: No hay permisos de escritura en el directorio uploads');
    console.error('Ejecuta el siguiente comando para arreglar los permisos:');
    console.error('icacls "uploads" /grant Everyone:(OI)(CI)F /T');
  }
  
  // Listar los archivos encontrados
  console.log('\n=== Archivos disponibles ===');
  console.log('\nThumbnails:');
  fs.readdirSync(thumbnailsDir).forEach(file => {
    console.log(`- ${file}`);
  });
  
  console.log('\nScreenshots:');
  fs.readdirSync(screenshotsDir).forEach(file => {
    console.log(`- ${file}`);
  });
  
  console.log('\n=== Verificación completa ===');
  console.log('Instrucciones:');
  console.log('1. Reinicia tu servidor Node.js');
  console.log('2. En tu navegador, usa Ctrl+F5 para recargar sin caché');
  console.log('3. Las imágenes ahora deberían mostrarse correctamente con la URL base: http://localhost:8080');
}

// Ejecutar la función
verifyImages().catch(console.error);
