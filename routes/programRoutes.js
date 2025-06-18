const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const { protect, isAdmin } = require('../middlewares/authMiddleware');
const { uploadThumbnail, multerErrorHandler } = require('../middlewares/uploadMiddleware');

// Rutas públicas
router.get('/', programController.getAllPrograms);
router.get('/search', programController.searchPrograms);
router.get('/featured', programController.getFeaturedPrograms);
router.get('/category/:category', programController.getProgramsByCategory);
router.get('/:id', programController.getProgramById);

// Rutas protegidas (solo admin)
router.post(
  '/', 
  protect, 
  isAdmin, 
  uploadThumbnail,
  multerErrorHandler,
  programController.createProgram
);

router.put(
  '/:id', 
  protect, 
  isAdmin, 
  uploadThumbnail,
  multerErrorHandler,
  programController.updateProgram
);

router.delete('/:id', protect, isAdmin, programController.deleteProgram);

module.exports = router;
