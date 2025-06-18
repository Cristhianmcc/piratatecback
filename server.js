const app = require('./app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en modo ${process.env.NODE_ENV} en el puerto ${PORT}`);
});
