const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pirata_tech')
  .then(async () => {
    console.log('Conectado a MongoDB');
    
    // Obtener el modelo de Usuario
    const User = require('./models/User');
    
    // Mostrar todos los usuarios en la base de datos
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log('No hay usuarios en la base de datos.');
    } else {
      console.log(`Se encontraron ${users.length} usuarios:`);
      users.forEach(user => {
        console.log('==========================================');
        console.log(`ID: ${user._id}`);
        console.log(`Username: ${user.username}`);
        console.log(`Email: ${user.email}`);
        console.log(`Password (hash): ${user.password.substring(0, 20)}...`);
        console.log(`Es Admin: ${user.isAdmin}`);
        if (user.role) console.log(`Role: ${user.role}`);
        console.log('==========================================');
      });
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });
