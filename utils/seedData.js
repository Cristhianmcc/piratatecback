const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Importar el modelo
const Program = require('../models/Program');

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado para seed data'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });

// Datos de prueba
const sampleData = [
  {
    name: "Adobe Photoshop",
    version: "2023.5.0",
    category: "Diseño",
    categoryName: "Diseño",
    description: "Software de edición de imágenes líder en el mercado para profesionales y aficionados.",
    thumbnail: "https://via.placeholder.com/300x200?text=Photoshop",
    rating: 4.8,
    downloads: 150000,
    featured: true,
    platform: ["Windows", "MacOS"]
  },
  {
    name: "Microsoft Office",
    version: "2023",
    category: "Productividad",
    categoryName: "Productividad",
    description: "Suite ofimática completa con Word, Excel, PowerPoint y más para uso personal y empresarial.",
    thumbnail: "https://via.placeholder.com/300x200?text=Office",
    rating: 4.7,
    downloads: 250000,
    featured: true,
    platform: ["Windows", "MacOS"]
  },
  {
    name: "VLC Media Player",
    version: "3.0.18",
    category: "Multimedia",
    categoryName: "Multimedia",
    description: "Reproductor multimedia gratuito y de código abierto que reproduce casi cualquier formato de archivo.",
    thumbnail: "https://via.placeholder.com/300x200?text=VLC",
    rating: 4.9,
    downloads: 500000,
    featured: true,
    platform: ["Windows", "MacOS", "Linux", "Android", "iOS"]
  },
  {
    name: "Visual Studio Code",
    version: "1.77.3",
    category: "Desarrollo",
    categoryName: "Desarrollo",
    description: "Editor de código fuente gratuito, potente y ligero con soporte para cientos de lenguajes.",
    thumbnail: "https://via.placeholder.com/300x200?text=VSCode",
    rating: 4.9,
    downloads: 350000,
    featured: true,
    platform: ["Windows", "MacOS", "Linux"]
  },
];

// Función para sembrar datos de prueba
const seedData = async () => {
  try {
    // Verificar si ya hay datos
    const count = await Program.countDocuments();
    if (count > 0) {
      console.log(`Ya existen ${count} programas en la base de datos.`);
      console.log('¿Deseas reemplazar los datos existentes? (s/n)');
      process.stdin.once('data', async (data) => {
        const input = data.toString().trim().toLowerCase();
        if (input === 's' || input === 'si' || input === 'y' || input === 'yes') {
          await Program.deleteMany({});
          await insertData();
        } else {
          console.log('Operación cancelada. No se han modificado los datos.');
          process.exit(0);
        }
      });
    } else {
      await insertData();
    }
  } catch (error) {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  }
};

const insertData = async () => {
  try {
    await Program.insertMany(sampleData);
    console.log(`¡${sampleData.length} programas insertados con éxito!`);
    process.exit(0);
  } catch (error) {
    console.error('Error al insertar datos:', error);
    process.exit(1);
  }
};

// Ejecutar la función
seedData();
