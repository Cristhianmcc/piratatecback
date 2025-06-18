const express = require('express');
const router = express.Router();
const debugAuthController = require('../controllers/debugAuthController');

// Ruta de depuración para login
router.post('/debug-login', debugAuthController.debugLogin);

module.exports = router;
