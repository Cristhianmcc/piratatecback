const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Program = require('../models/Program');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado para migración de datos'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });

// Función para migrar datos
const migrateData = async () => {
  try {
    // Verificar si ya hay programas en la base de datos
    const existingCount = await Program.countDocuments();
    if (existingCount > 0) {
      console.log(`Ya existen ${existingCount} programas en la base de datos. Saltando migración.`);
      return;
    }

    // Crear datos de prueba
    const programs = [
      {
        name: "Visual Studio Code",
        description: "Editor de código gratuito y de código abierto desarrollado por Microsoft.",
        category: "Desarrollo",
        categoryName: "Desarrollo",
        version: "1.80.0",
        rating: 4.8,
        downloads: 5000000,
        size: "100 MB",
        platform: ["Windows", "MacOS", "Linux"],
        thumbnailUrl: "/img/thumbnails/vscode.png",
        featured: true,
        releaseDate: new Date("2023-05-15"),
        developer: "Microsoft",
        website: "https://code.visualstudio.com",
        license: "MIT"
      },
      {
        name: "Adobe Photoshop",
        description: "Software de edición de imágenes líder en la industria.",
        category: "Diseño",
        categoryName: "Diseño",
        version: "25.0",
        rating: 4.7,
        downloads: 3000000,
        size: "2.5 GB",
        platform: ["Windows", "MacOS"],
        thumbnailUrl: "/img/thumbnails/photoshop.png",
        featured: true,
        releaseDate: new Date("2023-10-20"),
        developer: "Adobe Inc.",
        website: "https://www.adobe.com/products/photoshop.html",
        license: "Comercial"
      },
      {
        name: "OBS Studio",
        description: "Software gratuito y de código abierto para grabación y transmisión en vivo.",
        category: "Multimedia",
        categoryName: "Multimedia",
        version: "30.0",
        rating: 4.5,
        downloads: 2000000,
        size: "80 MB",
        platform: ["Windows", "MacOS", "Linux"],
        thumbnailUrl: "/img/thumbnails/obs.png",
        featured: false,
        releaseDate: new Date("2023-09-01"),
        developer: "OBS Project",
        website: "https://obsproject.com",
        license: "GPL"
      },
      {
        name: "Microsoft Office",
        description: "Suite ofimática completa con Word, Excel, PowerPoint y más.",
        category: "Productividad",
        categoryName: "Productividad",
        version: "2021",
        rating: 4.6,
        downloads: 10000000,
        size: "3 GB",
        platform: ["Windows", "MacOS"],
        thumbnailUrl: "/img/thumbnails/office.png",
        featured: true,
        releaseDate: new Date("2021-01-01"),
        developer: "Microsoft",
        website: "https://www.microsoft.com/es-es/microsoft-365",
        license: "Comercial"
      }
    ];
    
    console.log(`Encontrados ${programs.length} programas para migrar`);
    
    // Insertar programas en la base de datos
    await Program.insertMany(programs);
    
    console.log('Migración completada con éxito');
  } catch (error) {
    console.error('Error durante la migración:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Ejecutar migración
migrateData();
