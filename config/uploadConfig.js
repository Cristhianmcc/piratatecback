/**
 * Configuración para manejar la subida de archivos al servidor local
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorios si no existen
const uploadsDir = path.join(__dirname, '..', 'uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const screenshotsDir = path.join(uploadsDir, 'screenshots');
const programFilesDir = path.join(uploadsDir, 'programs');

[uploadsDir, thumbnailsDir, screenshotsDir, programFilesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configuración para almacenamiento de miniaturas
const thumbnailStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, thumbnailsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'thumbnail-' + uniqueSuffix + ext);
  }
});

// Configuración para almacenamiento de capturas de pantalla
const screenshotsStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, screenshotsDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'screenshot-' + uniqueSuffix + ext);
  }
});

// Configuración para almacenamiento de archivos de programa
const programFileStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, programFilesDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'program-' + uniqueSuffix + ext);
  }
});

// Filtros para validar tipos de archivo
const imageFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Solo se permiten archivos de imagen'), false);
  }
  cb(null, true);
};

const programFileFilter = (req, file, cb) => {
  // Aceptar archivos comunes para programas
  if (!file.originalname.match(/\.(zip|rar|exe|msi|dmg|deb|rpm|pkg|7z|iso|appimage)$/i)) {
    return cb(new Error('Formato de archivo no soportado'), false);
  }
  cb(null, true);
};

// Configuración para subida de thumbnail
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).single('thumbnail');

// Configuración para subida de capturas de pantalla
const uploadScreenshots = multer({
  storage: screenshotsStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
}).array('screenshots', 10); // Máximo 10 capturas

// Configuración para subida de archivo de programa
const uploadProgramFile = multer({
  storage: programFileStorage,
  fileFilter: programFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB
}).single('programFile');

// Middleware para subir todos los archivos de programa
const uploadProgramFiles = (req, res, next) => {
  uploadThumbnail(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Error al subir thumbnail: ${err.message}`
      });
    }
    
    uploadScreenshots(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: `Error al subir capturas de pantalla: ${err.message}`
        });
      }
      
      uploadProgramFile(req, res, (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: `Error al subir archivo del programa: ${err.message}`
          });
        }
        
        next();
      });
    });
  });
};

// Función para obtener la URL relativa de un archivo subido
const getFileUrl = (filename, type) => {
  if (!filename) return null;
  
  // Agregar un timestamp para evitar caché
  const timestamp = Date.now();
  
  switch (type) {
    case 'thumbnail':
      return `/uploads/thumbnails/${filename}?t=${timestamp}`;
    case 'screenshot':
      return `/uploads/screenshots/${filename}?t=${timestamp}`;
    case 'program':
      return `/uploads/programs/${filename}?t=${timestamp}`;
    default:
      return `/uploads/${filename}?t=${timestamp}`;
  }
};

// Función para eliminar un archivo
const deleteFile = (filename, type) => {
  if (!filename) return Promise.resolve({ deleted: false, message: 'No filename provided' });
  
  let filePath;
  switch (type) {
    case 'thumbnail':
      filePath = path.join(thumbnailsDir, filename);
      break;
    case 'screenshot':
      filePath = path.join(screenshotsDir, filename);
      break;
    case 'program':
      filePath = path.join(programFilesDir, filename);
      break;
    default:
      filePath = path.join(uploadsDir, filename);
  }
  
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      // Si el archivo no existe, consideramos que ya está eliminado
      if (err) {
        return resolve({ deleted: true, message: 'File did not exist' });
      }
      
      fs.unlink(filePath, (err) => {
        if (err) {
          return reject(err);
        }
        resolve({ deleted: true });
      });
    });
  });
};

module.exports = {
  uploadThumbnail,
  uploadScreenshots,
  uploadProgramFile,
  uploadProgramFiles,
  getFileUrl,
  deleteFile
};
