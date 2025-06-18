const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const fs = require('fs');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const debugApiMiddleware = require('./middlewares/debugApiMiddleware');
const imageMiddleware = require('./middlewares/imageMiddleware');

dotenv.config();

// Conectar a la base de datos
connectDB();

// La creación del administrador por defecto ya no es necesaria
// Se ha ejecutado el script utils/fixAdminAuth.js para crear el administrador
// const { createDefaultAdmin } = require('./utils/createAdmin');
// createDefaultAdmin();

const app = express();

// Configuración CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN.split(',') // En producción, usar los orígenes definidos
    : '*', // En desarrollo, permitir todas las solicitudes
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
  preflightContinue: false,
  allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para permitir acceso a las imágenes desde cualquier origen
app.use((req, res, next) => {
  if (req.url.startsWith('/uploads')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    // Configurar caché agresiva para desarrollo
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  }
  next();
});

// Middleware de diagnóstico para imágenes
app.use(imageMiddleware);

// Servir archivos estáticos de la carpeta de uploads con opciones adicionales
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  etag: false, // Desactivar etags para evitar caché
  lastModified: false, // Desactivar lastModified para evitar caché
  maxAge: 0, // No cachear
  setHeaders: (res, filePath) => {
    // Configurar cabeceras para permitir acceso desde cualquier origen
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    
    // Determinar el tipo MIME correcto basado en la extensión
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg'].includes(ext)) {
      res.set('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.set('Content-Type', 'image/png');
    } else if (ext === '.gif') {
      res.set('Content-Type', 'image/gif');
    } else if (ext === '.svg') {
      res.set('Content-Type', 'image/svg+xml');
    } else if (ext === '.webp') {
      res.set('Content-Type', 'image/webp');
    }
  }
}));

// Servir archivos estáticos de la carpeta pública
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de depuración en modo desarrollo
if (process.env.NODE_ENV === 'development') {
  const debugMiddleware = require('./middlewares/debugMiddleware');
  app.use(debugMiddleware);
}

// Logger para desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Servir archivos estáticos adicionales para admin
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Asegurarnos de que los directorios necesarios existan
const ensureDirectories = require('./middlewares/ensureDirectoriesMiddleware');
app.use(ensureDirectories);

// Redirigir /admin a la página de login o dashboard
app.get('/admin', (req, res) => {
  res.redirect('/admin/login.html');
});

// Rutas API
app.use('/api/programs', require('./routes/programRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
// Añadir middleware de depuración a las rutas de administrador
app.use('/api/admin', debugApiMiddleware);
app.use('/api/admin', require('./routes/adminRoutes'));
// Ruta para verificar el estado de la API
app.use('/api/check', require('./routes/apiCheckRoutes'));

// Rutas de depuración (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use('/api/debug', require('./routes/debugRoutes'));
}

// Ruta básica para probar el servidor
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Pirata Tecnológico funcionando correctamente',
    endpoints: {
      auth: '/api/auth',
      programs: '/api/programs'
    },
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
    },
    env: process.env.NODE_ENV
  });
});

// Middleware para manejo de rutas no encontradas
app.use(notFound);

// Middleware para manejo de errores
app.use(errorHandler);

module.exports = app;

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

module.exports = app;
