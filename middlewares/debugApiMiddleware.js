const debugApiMiddleware = (req, res, next) => {
  console.log('=============== DEBUG API REQUEST ===============');
  console.log('URL:', req.originalUrl);
  console.log('Método:', req.method);
  console.log('Headers:', req.headers);
  
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', req.body);
  }
  
  // Guarda el método original de envío de respuesta
  const originalSend = res.send;
  
  // Sobrescribe el método de envío para interceptar y registrar la respuesta
  res.send = function(body) {
    console.log('Respuesta:', typeof body === 'object' ? body : 'No es un objeto JSON');
    console.log('===========================================');
    
    // Llama al método original
    originalSend.apply(res, arguments);
  };
  
  next();
};

module.exports = debugApiMiddleware;
