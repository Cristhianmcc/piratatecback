const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que los directorios existen
const uploadsDir = path.join(__dirname, '../uploads');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const screenshotsDir = path.join(uploadsDir, 'screenshots');
const programsDir = path.join(uploadsDir, 'programs');

// Crear directorios si no existen
[uploadsDir, thumbnailsDir, screenshotsDir, programsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Directorio creado: ${dir}`);
  }
});

// Configuración de almacenamiento para imágenes de thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, thumbnailsDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único para el archivo basado en timestamp y programa ID
    const programId = req.params.id ? req.params.id.substring(0, 8) : '';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `thumbnail-${programId}-${uniqueSuffix}${ext}`);
  }
});

// Configuración de almacenamiento para capturas de pantalla
const screenshotsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, screenshotsDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único para el archivo
    const programId = req.params.id ? req.params.id.substring(0, 8) : '';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `screenshot-${programId}-${uniqueSuffix}${ext}`);
  }
});

// Configuración de almacenamiento para archivos de programa
const programStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, programsDir);
  },
  filename: (req, file, cb) => {
    // Preservar el nombre original del archivo pero añadiendo timestamp
    const uniqueSuffix = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    cb(null, `program-${uniqueSuffix}${ext}`);
  }
});

// Filtro para asegurar que solo se suben imágenes
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

// Filtro para archivos de programa
const programFilter = (req, file, cb) => {
  const allowedExtensions = ['.zip', '.rar', '.exe', '.dmg', '.deb', '.rpm', '.msi', '.apk', '.ipa'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de archivo no permitido. Use ZIP, RAR, EXE, DMG, DEB, RPM, MSI, APK o IPA'), false);
  }
};

// Middleware para subir imagen de thumbnail
exports.uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: imageFilter
}).single('thumbnail');

// Middleware para subir múltiples capturas de pantalla
exports.uploadScreenshots = multer({
  storage: screenshotsStorage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB máximo por archivo
    files: 10 // Máximo 10 archivos
  },
  fileFilter: imageFilter
}).array('screenshots', 10);

// Middleware para subir archivo del programa
exports.uploadProgramFile = multer({
  storage: programStorage,
  limits: { fileSize: 2000 * 1024 * 1024 }, // 2GB máximo
  fileFilter: programFilter
}).single('programFile');

// Función para obtener URL relativa del archivo
exports.getFileUrl = (filename, type) => {
  if (!filename) return null;
  
  // Timestamp para evitar caché
  const timestamp = Date.now();
  
  // Extraer nombre de archivo si se pasó una ruta completa
  if (filename.includes('/')) {
    filename = filename.split('/').pop();
  }
  if (filename.includes('\\')) {
    filename = filename.split('\\').pop();
  }
  
  // Limpiar parámetros de consulta existentes
  if (filename.includes('?')) {
    filename = filename.split('?')[0];
  }
  
  // Obtener URL base del servidor
  const baseUrl = process.env.BASE_URL || 'http://localhost:8080';
  console.log(`[getFileUrl] Usando BASE_URL: ${baseUrl} para ${filename}`);
  
  switch (type) {
    case 'thumbnail':
      return `${baseUrl}/uploads/thumbnails/${filename}?t=${timestamp}`;
    case 'screenshot':
      return `${baseUrl}/uploads/screenshots/${filename}?t=${timestamp}`;
    case 'program':
      return `${baseUrl}/uploads/programs/${filename}`;
    default:
      return `${baseUrl}/uploads/${filename}?t=${timestamp}`;
  }
};

// Función para eliminar un archivo
exports.deleteFile = async (filename, type) => {
  if (!filename) return { deleted: false, message: 'No se proporcionó nombre de archivo' };
  
  let filePath;
  switch (type) {
    case 'thumbnail':
      filePath = path.join(thumbnailsDir, filename);
      break;
    case 'screenshot':
      filePath = path.join(screenshotsDir, filename);
      break;
    case 'program':
      filePath = path.join(programsDir, filename);
      break;
    default:
      filePath = path.join(uploadsDir, filename);
  }
  
  return new Promise((resolve, reject) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.log(`El archivo ${filePath} no existe`);
        resolve({ deleted: false, message: 'Archivo no encontrado' });
        return;
      }
      
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error(`Error al eliminar archivo ${filePath}:`, err);
          reject(err);
          return;
        }
        
        console.log(`Archivo eliminado: ${filePath}`);
        resolve({ deleted: true, message: 'Archivo eliminado correctamente' });
      });
    });
  });
};

// Manejo de errores de multer
exports.multerErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Error de multer
    console.error('Error de Multer:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false,
        message: 'El archivo es demasiado grande. Verifique los límites de tamaño.'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Demasiados archivos. Máximo 10 capturas de pantalla.'
      });
    } else {
      return res.status(400).json({ 
        success: false,
        message: `Error en la subida: ${err.message}` 
      });
    }
  } else if (err) {
    // Otro tipo de error
    console.error('Error al subir archivo:', err);
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
  
  next();
};
