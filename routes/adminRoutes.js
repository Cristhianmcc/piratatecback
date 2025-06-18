const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminMiddleware } = require('../middlewares/adminAuthMiddleware');
const debugApiMiddleware = require('../middlewares/debugApiMiddleware');
// Importar middleware de subida de archivos
const { 
  uploadThumbnail, 
  uploadScreenshots, 
  uploadProgramFile, 
  multerErrorHandler,
  getFileUrl,
  deleteFile
} = require('../middlewares/uploadMiddleware');
const multer = require('multer');

// Configurar almacenamiento temporal para archivos CSV
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'tmp/uploads'); // Asegúrate de que este directorio existe
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const uploadCSV = multer({ 
  storage: csvStorage,
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(csv)$/)) {
      return cb(new Error('Solo se permiten archivos CSV'));
    }
    cb(null, true);
  },
  limits: { fileSize: 10000000 } // 10MB limit
});

// Ruta de autenticación (no requiere estar autenticado)
router.post('/login', debugApiMiddleware, adminController.login);

// Todas las rutas siguientes requieren autenticación de administrador
router.use(adminMiddleware);

// Rutas para gestión de programas
router.get('/programs', adminController.getPrograms);
router.get('/programs/:id', adminController.getProgramById);
router.post('/programs', uploadProgramFile, multerErrorHandler, adminController.createProgram);
router.put('/programs/:id', uploadProgramFile, multerErrorHandler, adminController.updateProgram);
router.delete('/programs/:id', adminController.deleteProgram);

// Obtener controlador de imágenes
const imageController = require('../controllers/imageController');

// Rutas para gestión de imágenes
router.post('/programs/:id/thumbnail', uploadThumbnail, multerErrorHandler, imageController.updateThumbnail);
router.post('/programs/:id/screenshots', uploadScreenshots, multerErrorHandler, imageController.addScreenshots);
router.delete('/screenshots', imageController.deleteScreenshot);
router.post('/programs/:id/download', imageController.registerDownload);

// Ruta para importación CSV
router.post('/import/csv', uploadCSV.single('csv'), adminController.importProgramsFromCSV);

// Estadísticas del dashboard
router.get('/stats/dashboard', adminController.getDashboardStats);

// Actividad del administrador
router.get('/activity', adminController.getRecentActivity);

module.exports = router;
