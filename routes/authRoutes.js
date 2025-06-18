const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rutas públicas
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// Rutas protegidas
router.get('/profile', protect, authController.getUserProfile);
router.put('/profile', protect, authController.updateUserProfile);

module.exports = router;
