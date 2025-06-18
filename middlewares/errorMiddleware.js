/**
 * Middleware para manejar errores de forma centralizada
 */

// Manejador de errores para errores de desarrollo (muestra más detalles)
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    // Solo enviar detalles técnicos en desarrollo
    details: process.env.NODE_ENV === 'development' ? {
      name: err.name,
      code: err.code
    } : undefined
  });
};

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
