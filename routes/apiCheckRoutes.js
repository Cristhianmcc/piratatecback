/**
 * Ruta de prueba para verificar que la API esté funcionando correctamente
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Ruta para verificar que la API responde
router.get('/check', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'La API de administración está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta para verificar directorios
router.get('/check-dirs', (req, res) => {
  // Verificar directorios importantes
  const dirs = [
    { name: 'uploads', path: path.join(__dirname, '..', 'uploads') },
    { name: 'uploads/thumbnails', path: path.join(__dirname, '..', 'uploads', 'thumbnails') },
    { name: 'uploads/screenshots', path: path.join(__dirname, '..', 'uploads', 'screenshots') },
    { name: 'tmp/uploads', path: path.join(__dirname, '..', 'tmp', 'uploads') },
    { name: 'public', path: path.join(__dirname, '..', 'public') },
    { name: 'public/admin', path: path.join(__dirname, '..', 'public', 'admin') }
  ];
  
  const dirStatus = dirs.map(dir => {
    let exists = false;
    let writable = false;
    
    try {
      exists = fs.existsSync(dir.path);
      if (exists) {
        // Intentar escribir un archivo temporal para verificar permisos
        const testFile = path.join(dir.path, '.test-write-' + Date.now());
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        writable = true;
      } else {
        // Intentar crear el directorio si no existe
        fs.mkdirSync(dir.path, { recursive: true });
        exists = true;
        writable = true;
      }
    } catch (error) {
      console.error(`Error al verificar directorio ${dir.name}:`, error);
    }
    
    return {
      name: dir.name,
      path: dir.path,
      exists,
      writable
    };
  });
  
  res.status(200).json({
    success: true,
    directories: dirStatus
  });
});

module.exports = router;
