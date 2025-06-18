// Middleware para imprimir información de depuración
const debugMiddleware = (req, res, next) => {
  console.log('=============== DEBUG REQUEST ===============');
  console.log('URL:', req.originalUrl);
  console.log('Método:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  console.log('===========================================');
  next();
};

module.exports = debugMiddleware;
