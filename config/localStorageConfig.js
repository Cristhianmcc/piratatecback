const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que los directorios de subida existan
const thumbnailDir = path.join(__dirname, '../public/uploads/thumbnails');
const screenshotDir = path.join(__dirname, '../public/uploads/screenshots');

if (!fs.existsSync(thumbnailDir)) {
  fs.mkdirSync(thumbnailDir, { recursive: true });
}

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Configuración para almacenamiento local
const thumbnailStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, thumbnailDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const screenshotStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, screenshotDir);
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

// Filtro para archivos
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, webp)'));
  }
};

// Middleware para subir thumbnails (miniaturas)
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5000000 } // 5MB
}).single('thumbnail');

// Middleware para subir capturas de pantalla
const uploadScreenshots = multer({
  storage: screenshotStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 10000000 } // 10MB
}).array('screenshots', 10); // Máximo 10 capturas

// Convertir rutas de archivos a URLs
const fileToUrl = (filePath) => {
  if (!filePath) return '';
  // Si ya es una URL (ej. de Cloudinary), devolverla tal cual
  if (filePath.startsWith('http')) return filePath;
  
  // Convertir ruta local a URL relativa para el frontend
  return `/uploads/${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`;
};

module.exports = {
  uploadThumbnail,
  uploadScreenshots,
  fileToUrl,
  // Middleware compuesto para manejar ambos tipos de archivos
  uploadProgramFiles: (req, res, next) => {
    uploadThumbnail(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      // Procesar thumbnail
      if (req.file) {
        req.body.thumbnail = fileToUrl(req.file.path);
      }
      
      uploadScreenshots(req, res, (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        
        // Procesar screenshots
        if (req.files && req.files.length > 0) {
          req.body.screenshots = req.files.map(file => fileToUrl(file.path));
        }
        
        next();
      });
    });
  }
};
