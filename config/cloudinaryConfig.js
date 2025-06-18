const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración para las miniaturas (thumbnails)
const thumbnailStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pirata/thumbnails',
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
    transformation: [
      { width: 300, height: 300, crop: 'fill', quality: 'auto:good' }
    ]
  }
});

// Configuración para las capturas de pantalla
const screenshotStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'pirata/screenshots',
    allowed_formats: ['jpg', 'png', 'webp', 'jpeg'],
    transformation: [
      { width: 1280, height: 720, crop: 'fit', quality: 'auto:good' }
    ]
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

// Middleware para subir thumbnails
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

module.exports = {
  cloudinary,
  uploadThumbnail,
  uploadScreenshots,
  // Middleware para manejar ambos tipos de archivos
  uploadProgramFiles: (req, res, next) => {
    uploadThumbnail(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      uploadScreenshots(req, res, (err) => {
        if (err) {
          return res.status(400).json({ error: err.message });
        }
        next();
      });
    });
  }
};
