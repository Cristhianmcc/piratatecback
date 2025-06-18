/**
 * Este middleware crea el directorio temporal para subir archivos si no existe
 */

const fs = require('fs');
const path = require('path');

// Asegurar que el directorio temporal existe
const tmpDir = path.join(__dirname, '..', 'tmp', 'uploads');
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
  console.log(`Directorio temporal creado: ${tmpDir}`);
}

// Asegurar que el directorio de uploads existe
const uploadsDir = path.join(__dirname, '..', 'uploads', 'thumbnails');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Directorio de uploads creado: ${uploadsDir}`);
}

/**
 * Middleware para verificar si existen los directorios necesarios
 */
module.exports = function ensureDirectoriesExist(req, res, next) {
  // Verificar nuevamente en tiempo de ejecución
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  next();
};
