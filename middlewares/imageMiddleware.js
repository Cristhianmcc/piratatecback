/**
 * Middleware de diagnóstico para imágenes
 * Este middleware registra información sobre acceso a imágenes y maneja errores
 */
const fs = require('fs');
const path = require('path');

module.exports = function(req, res, next) {
  // Solo procesar solicitudes de imágenes
  if (!req.url.startsWith('/uploads/')) {
    return next();
  }
  
  // Extraer la ruta del archivo solicitado
  let filePath = path.join(__dirname, '..', req.url.split('?')[0]);
  
  console.log(`[IMAGEN] Solicitud: ${req.url}`);
  console.log(`[IMAGEN] Ruta local: ${filePath}`);
  
  // Verificar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`[IMAGEN] ❌ No encontrado: ${filePath}`);
      
      // Determinar tipo de imagen
      let placeholderPath;
      if (req.url.includes('/thumbnails/')) {
        placeholderPath = path.join(__dirname, '..', 'uploads', 'thumbnails', 'placeholder.jpg');
        if (!fs.existsSync(placeholderPath)) {
          // Si no existe el placeholder.jpg, buscar cualquier otra imagen
          try {
            const thumbnailFiles = fs.readdirSync(path.join(__dirname, '..', 'uploads', 'thumbnails'));
            if (thumbnailFiles.length > 0) {
              placeholderPath = path.join(__dirname, '..', 'uploads', 'thumbnails', thumbnailFiles[0]);
            }
          } catch (error) {
            console.error('[IMAGEN] Error al buscar imágenes alternativas:', error);
          }
        }
      } else if (req.url.includes('/screenshots/')) {
        placeholderPath = path.join(__dirname, '..', 'uploads', 'screenshots', 'placeholder.jpg');
        if (!fs.existsSync(placeholderPath)) {
          // Si no existe el placeholder.jpg, buscar cualquier otra imagen
          try {
            const screenshotFiles = fs.readdirSync(path.join(__dirname, '..', 'uploads', 'screenshots'));
            if (screenshotFiles.length > 0) {
              placeholderPath = path.join(__dirname, '..', 'uploads', 'screenshots', screenshotFiles[0]);
            } else {
              // Si no hay screenshots, usar un thumbnail como alternativa
              const thumbnailFiles = fs.readdirSync(path.join(__dirname, '..', 'uploads', 'thumbnails'));
              if (thumbnailFiles.length > 0) {
                placeholderPath = path.join(__dirname, '..', 'uploads', 'thumbnails', thumbnailFiles[0]);
              }
            }
          } catch (error) {
            console.error('[IMAGEN] Error al buscar imágenes alternativas:', error);
          }
        }
      } else {
        placeholderPath = path.join(__dirname, '..', 'uploads', 'placeholder.jpg');
      }
      
      // Verificar si existe el placeholder
      if (placeholderPath && fs.existsSync(placeholderPath)) {
        console.log(`[IMAGEN] ✅ Usando placeholder: ${placeholderPath}`);
        res.sendFile(placeholderPath);
      } else {
        console.log('[IMAGEN] ❌ No se encontró ninguna imagen alternativa');
        res.status(404).send('Imagen no encontrada');
      }
    } else {
      console.log(`[IMAGEN] ✅ Encontrado: ${filePath}`);
      next();
    }
  });
};
