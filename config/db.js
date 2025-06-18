const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Usar la URL de MongoDB según el entorno
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI no está definida en las variables de entorno');
    }
    
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Manejar errores de conexión después de la conexión inicial
    mongoose.connection.on('error', (err) => {
      console.error(`Error de conexión a MongoDB: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB desconectado');
    });
    
    // Capturar señales de terminación para cerrar correctamente la conexión
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Conexión a MongoDB cerrada por finalización de la aplicación');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    console.log('Asegúrate de tener MongoDB instalado y en ejecución, o usa MongoDB Atlas.');
    console.log('Para instalar MongoDB Community Edition en Windows, visita:');
    console.log('https://www.mongodb.com/try/download/community');
    process.exit(1);
  }
};

module.exports = connectDB;
