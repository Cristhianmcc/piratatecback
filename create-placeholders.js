const fs = require('fs');
const path = require('path');

// Función principal
async function createPlaceholders() {
  console.log('\n=== CREANDO IMÁGENES DE REEMPLAZO ===\n');
  
  // Directorios de uploads
  const uploadsDir = path.join(__dirname, 'uploads');
  const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
  const screenshotsDir = path.join(uploadsDir, 'screenshots');
  
  // Asegurar que existan los directorios
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Creado directorio uploads');
  }
  
  if (!fs.existsSync(thumbnailsDir)) {
    fs.mkdirSync(thumbnailsDir, { recursive: true });
    console.log('Creado directorio thumbnails');
  }
  
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
    console.log('Creado directorio screenshots');
  }
  
  // Crear SVG de placeholder para thumbnail
  const thumbnailPlaceholderPath = path.join(thumbnailsDir, 'placeholder.svg');
  const thumbnailContent = createSvgPlaceholder('Imagen no disponible', 'Pirata Tecnológico');
  fs.writeFileSync(thumbnailPlaceholderPath, thumbnailContent);
  console.log(`✓ Creado placeholder de thumbnail: ${thumbnailPlaceholderPath}`);
  
  // También crear versión JPG del placeholder para thumbnail
  const thumbnailJpgPlaceholderPath = path.join(thumbnailsDir, 'placeholder.jpg');
  if (!fs.existsSync(thumbnailJpgPlaceholderPath)) {
    // Buscar cualquier JPG existente para copiar
    const existingJpgs = fs.readdirSync(thumbnailsDir).filter(file => file.endsWith('.jpg'));
    if (existingJpgs.length > 0) {
      fs.copyFileSync(
        path.join(thumbnailsDir, existingJpgs[0]),
        thumbnailJpgPlaceholderPath
      );
      console.log(`✓ Copiado placeholder JPG de thumbnail desde ${existingJpgs[0]}`);
    } else {
      fs.writeFileSync(thumbnailJpgPlaceholderPath, ''); // Archivo vacío como último recurso
      console.log(`✓ Creado placeholder JPG vacío`);
    }
  }
  
  // Crear SVG de placeholder para screenshot
  const screenshotPlaceholderPath = path.join(screenshotsDir, 'placeholder.svg');
  const screenshotContent = createSvgPlaceholder('Captura no disponible', 'Pirata Tecnológico');
  fs.writeFileSync(screenshotPlaceholderPath, screenshotContent);
  console.log(`✓ Creado placeholder de screenshot: ${screenshotPlaceholderPath}`);
  
  // También crear versión JPG del placeholder para screenshot
  const screenshotJpgPlaceholderPath = path.join(screenshotsDir, 'placeholder.jpg');
  if (!fs.existsSync(screenshotJpgPlaceholderPath)) {
    // Buscar cualquier JPG existente para copiar
    const existingJpgs = fs.readdirSync(screenshotsDir).filter(file => file.endsWith('.jpg'));
    if (existingJpgs.length > 0) {
      fs.copyFileSync(
        path.join(screenshotsDir, existingJpgs[0]),
        screenshotJpgPlaceholderPath
      );
      console.log(`✓ Copiado placeholder JPG de screenshot desde ${existingJpgs[0]}`);
    } else {
      // Intentar usar un JPG de los thumbnails
      const thumbnailJpgs = fs.readdirSync(thumbnailsDir).filter(file => file.endsWith('.jpg'));
      if (thumbnailJpgs.length > 0) {
        fs.copyFileSync(
          path.join(thumbnailsDir, thumbnailJpgs[0]),
          screenshotJpgPlaceholderPath
        );
        console.log(`✓ Copiado placeholder JPG de screenshot desde thumbnails/${thumbnailJpgs[0]}`);
      } else {
        fs.writeFileSync(screenshotJpgPlaceholderPath, ''); // Archivo vacío como último recurso
        console.log(`✓ Creado placeholder JPG vacío`);
      }
    }
  }
  
  console.log('\n=== CREACIÓN DE PLACEHOLDERS COMPLETA ===');
  console.log('Los siguientes archivos están disponibles para usar como placeholders:');
  console.log(`- /uploads/thumbnails/placeholder.svg`);
  console.log(`- /uploads/thumbnails/placeholder.jpg`);
  console.log(`- /uploads/screenshots/placeholder.svg`);
  console.log(`- /uploads/screenshots/placeholder.jpg`);
}

// Función para crear un SVG placeholder
function createSvgPlaceholder(text1, text2) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" fill="#f0f0f0"/>
  <rect x="10" y="10" width="580" height="380" stroke="#cccccc" stroke-width="5" fill="none"/>
  <text x="300" y="180" font-family="Arial" font-size="36" text-anchor="middle" fill="#666666" font-weight="bold">${text1}</text>
  <text x="300" y="230" font-family="Arial" font-size="24" text-anchor="middle" fill="#666666">${text2}</text>
</svg>`;
}

// Ejecutar la función
createPlaceholders().catch(err => console.error('Error:', err));
