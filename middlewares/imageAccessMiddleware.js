/**
 * Middleware para validar acceso a imágenes y diagnosticar problemas
 */
const fs = require('fs');
const path = require('path');

const imageAccessMiddleware = (req, res, next) => {
  // Solo aplica este middleware a rutas que comienzan con /uploads
  if (!req.url.startsWith('/uploads')) {
    return next();
  }
  
  // Registrar solicitud de imagen
  console.log(`[IMAGEN] Solicitud recibida: ${req.url}`);
  
  // Extraer la ruta del archivo
  const filePath = path.join(__dirname, '..', req.url.split('?')[0]);
  
  // Verificar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.error(`[IMAGEN ERROR] Archivo no encontrado: ${filePath}`);
      
      // Enviar imagen de reemplazo en lugar de 404
      const placeholderPath = path.join(__dirname, '..', 'uploads', 'placeholder.jpg');
      
      // Verificar si existe la imagen de reemplazo
      fs.access(placeholderPath, fs.constants.F_OK, (placeholderErr) => {
        if (placeholderErr) {
          // No hay imagen de reemplazo, enviar 404 personalizado
          return res.status(404).send(`
            <html>
              <body style="display:flex; justify-content:center; align-items:center; height:100vh; text-align:center; font-family:sans-serif;">
                <div>
                  <h2>Imagen no disponible</h2>
                  <p>La imagen solicitada no se encuentra disponible en este momento.</p>
                  <p style="color:#888; font-size:12px;">URL: ${req.url}</p>
                </div>
              </body>
            </html>
          `);
        }
        
        // Enviar imagen de reemplazo
        res.sendFile(placeholderPath);
      });
      return;
    }
    
    // El archivo existe, continuar con la solicitud
    console.log(`[IMAGEN] Archivo encontrado: ${filePath}`);
    next();
  });
};

module.exports = imageAccessMiddleware;
