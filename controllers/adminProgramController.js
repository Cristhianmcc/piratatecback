const Program = require('../models/Program');
const { cloudinary } = require('../config/cloudinaryConfig');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configuración para almacenamiento local de imágenes
const useLocalStorage = process.env.USE_LOCAL_STORAGE === 'true';
const uploadDir = path.join(__dirname, '../uploads');
const thumbnailsDir = path.join(uploadDir, 'thumbnails');
const screenshotsDir = path.join(uploadDir, 'screenshots');

// Asegurar que los directorios existen
if (useLocalStorage) {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir);
  if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);
}

// Obtener todos los programas con paginación y filtros avanzados para el panel de administración
exports.getAllPrograms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Extraer filtros de la query
    const { category, platform, featured, search, sort } = req.query;
    const exactSearch = req.query.exact === 'true';
    
    // Construir filtros
    const filter = {};
    
    if (category) filter.category = category;
    if (platform) filter.platform = platform;
    if (featured !== undefined) filter.featured = featured === 'true';
    
    // Busqueda avanzada
    if (search) {
      if (exactSearch) {
        // Búsqueda exacta por nombre
        filter.name = search;
      } else {
        // Búsqueda por texto (nombre, descripción, tags)
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $regex: search, $options: 'i' } }
        ];
      }
    }
    
    // Determinar orden
    let sortOption = { featured: -1, updatedAt: -1 };
    
    if (sort) {
      switch (sort) {
        case 'name':
          sortOption = { name: 1 };
          break;
        case 'downloads':
          sortOption = { downloads: -1 };
          break;
        case 'rating':
          sortOption = { rating: -1 };
          break;
        case 'createdAt':
          sortOption = { createdAt: -1 };
          break;
        case 'updateDate':
          sortOption = { updateDate: -1 };
          break;
      }
    }
    
    const [programs, total] = await Promise.all([
      Program.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean(),
      Program.countDocuments(filter)
    ]);
    
    res.status(200).json({
      programs,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error fetching programs:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Crear un nuevo programa
exports.createProgram = async (req, res) => {
  try {
    const programData = req.body;
    
    // Verificar datos obligatorios
    if (!programData.name || !programData.description || !programData.category || !programData.version) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos obligatorios: nombre, descripción, categoría y versión son requeridos' 
      });
    }
    
    // Crear programa
    const newProgram = new Program(programData);
    await newProgram.save();
    
    // Registrar actividad
    logActivity(req.userId, 'create', `Creó el programa "${newProgram.name}"`);
    
    res.status(201).json({ 
      success: true, 
      message: 'Programa creado exitosamente', 
      program: newProgram 
    });
  } catch (error) {
    console.error('Error creating program:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Actualizar un programa existente
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Buscar y actualizar el programa
    const updatedProgram = await Program.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedProgram) {
      return res.status(404).json({ 
        success: false, 
        message: 'Programa no encontrado' 
      });
    }
    
    // Registrar actividad
    logActivity(req.userId, 'update', `Actualizó el programa "${updatedProgram.name}"`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Programa actualizado exitosamente', 
      program: updatedProgram 
    });
  } catch (error) {
    console.error('Error updating program:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Eliminar un programa
exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar programa primero para registrar actividad
    const program = await Program.findById(id);
    
    if (!program) {
      return res.status(404).json({ 
        success: false, 
        message: 'Programa no encontrado' 
      });
    }
    
    // Si el programa tiene imágenes, eliminarlas también
    if (program.thumbnail) {
      try {
        await deleteImage(program.thumbnail);
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
    }
    
    if (program.screenshots && program.screenshots.length > 0) {
      for (const screenshot of program.screenshots) {
        try {
          await deleteImage(screenshot);
        } catch (error) {
          console.error('Error deleting screenshot:', error);
        }
      }
    }
    
    // Eliminar el programa
    await Program.findByIdAndDelete(id);
    
    // Registrar actividad
    logActivity(req.userId, 'delete', `Eliminó el programa "${program.name}"`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Programa eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subir imagen principal (thumbnail)
exports.uploadThumbnail = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el programa existe
    const program = await Program.findById(id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Programa no encontrado' });
    }
    
    // Si no hay archivo, retornar error
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No se ha subido ninguna imagen' });
    }
    
    // Si el programa ya tiene un thumbnail, eliminar el anterior
    if (program.thumbnail) {
      try {
        await deleteImage(program.thumbnail);
      } catch (error) {
        console.error('Error deleting previous thumbnail:', error);
      }
    }
    
    // Subir nueva imagen
    let thumbnailUrl;
    
    if (useLocalStorage) {
      // Para almacenamiento local
      const fileName = `thumbnail_${id}_${Date.now()}${path.extname(req.file.originalname)}`;
      const filePath = path.join(thumbnailsDir, fileName);
      
      fs.writeFileSync(filePath, req.file.buffer);
      thumbnailUrl = `/uploads/thumbnails/${fileName}`;
    } else {
      // Para Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'thumbnails',
        resource_type: 'image'
      });
      
      thumbnailUrl = result.secure_url;
      
      // Eliminar archivo temporal
      fs.unlinkSync(req.file.path);
    }
    
    // Actualizar programa con la nueva URL
    program.thumbnail = thumbnailUrl;
    await program.save();
    
    // Registrar actividad
    logActivity(req.userId, 'upload', `Actualizó la imagen principal de "${program.name}"`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Thumbnail subido exitosamente', 
      program 
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Subir capturas de pantalla
exports.uploadScreenshots = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el programa existe
    const program = await Program.findById(id);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Programa no encontrado' });
    }
    
    // Si no hay archivos, retornar error
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No se han subido imágenes' });
    }
    
    // Subir imágenes
    const screenshotUrls = [];
    
    if (useLocalStorage) {
      // Para almacenamiento local
      for (const file of req.files) {
        const fileName = `screenshot_${id}_${Date.now()}_${screenshotUrls.length}${path.extname(file.originalname)}`;
        const filePath = path.join(screenshotsDir, fileName);
        
        fs.writeFileSync(filePath, file.buffer);
        screenshotUrls.push(`/uploads/screenshots/${fileName}`);
      }
    } else {
      // Para Cloudinary
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'screenshots',
          resource_type: 'image'
        });
        
        screenshotUrls.push(result.secure_url);
        
        // Eliminar archivo temporal
        fs.unlinkSync(file.path);
      }
    }
    
    // Actualizar programa con las nuevas URLs
    if (!program.screenshots) program.screenshots = [];
    program.screenshots = [...program.screenshots, ...screenshotUrls];
    await program.save();
    
    // Registrar actividad
    logActivity(req.userId, 'upload', `Subió ${screenshotUrls.length} capturas para "${program.name}"`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Capturas subidas exitosamente', 
      program 
    });
  } catch (error) {
    console.error('Error uploading screenshots:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Eliminar una captura de pantalla
exports.deleteScreenshot = async (req, res) => {
  try {
    const { programId } = req.body;
    const { screenshot } = req.body;
    
    if (!programId || !screenshot) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan parámetros: programId y screenshot son obligatorios' 
      });
    }
    
    // Verificar si el programa existe
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Programa no encontrado' });
    }
    
    // Buscar la captura en el array
    if (!program.screenshots || !program.screenshots.includes(screenshot)) {
      return res.status(404).json({ success: false, message: 'Captura de pantalla no encontrada' });
    }
    
    // Eliminar la imagen de almacenamiento
    try {
      await deleteImage(screenshot);
    } catch (error) {
      console.error('Error deleting screenshot file:', error);
    }
    
    // Eliminar la URL del array
    program.screenshots = program.screenshots.filter(s => s !== screenshot);
    await program.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Captura eliminada exitosamente', 
      program 
    });
  } catch (error) {
    console.error('Error deleting screenshot:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener estadísticas generales
exports.getStats = async (req, res) => {
  try {
    // Obtener estadísticas generales
    const [
      totalPrograms,
      featuredCount,
      totalDownloads,
      categories
    ] = await Promise.all([
      Program.countDocuments(),
      Program.countDocuments({ featured: true }),
      Program.aggregate([{ $group: { _id: null, total: { $sum: '$downloads' } } }]),
      Program.distinct('category')
    ]);
    
    // Obtener distribución por categoría
    const categoryDistribution = await Program.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Obtener distribución por plataforma
    const platformDistribution = await Program.aggregate([
      { $unwind: '$platform' },
      { $group: { _id: '$platform', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Formatear distribuciones como objetos
    const categoryDist = {};
    categoryDistribution.forEach(item => {
      categoryDist[item._id] = item.count;
    });
    
    const platformDist = {};
    platformDistribution.forEach(item => {
      platformDist[item._id] = item.count;
    });
    
    res.status(200).json({
      totalPrograms,
      featuredCount,
      totalDownloads: totalDownloads.length > 0 ? totalDownloads[0].total : 0,
      categoriesCount: categories.length,
      categoryDistribution: categoryDist,
      platformDistribution: platformDist
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener distribución específica
exports.getDistribution = async (req, res) => {
  try {
    const { type } = req.params;
    let distribution;
    
    if (type === 'category') {
      const categoryDistribution = await Program.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      distribution = {};
      categoryDistribution.forEach(item => {
        distribution[item._id] = item.count;
      });
    } else if (type === 'platform') {
      const platformDistribution = await Program.aggregate([
        { $unwind: '$platform' },
        { $group: { _id: '$platform', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      distribution = {};
      platformDistribution.forEach(item => {
        distribution[item._id] = item.count;
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Tipo de distribución no válido. Use "category" o "platform"' 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      distribution 
    });
  } catch (error) {
    console.error('Error getting distribution:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Limpiar caché del servidor
exports.clearCache = async (req, res) => {
  try {
    // Aquí implementaríamos la limpieza de caché
    // Por ahora solo simularemos que se ha limpiado
    
    // Registrar actividad
    logActivity(req.userId, 'admin', 'Limpió la caché del servidor');
    
    res.status(200).json({ 
      success: true, 
      message: 'Caché limpiada correctamente' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Registrar actividad del usuario
const logActivity = (userId, type, message) => {
  // Aquí implementaríamos el registro de actividad en la base de datos
  // Por ahora solo lo registramos en consola
  console.log(`Activity log [${new Date().toISOString()}]: User ${userId}, Action: ${type}, ${message}`);
};

// Función auxiliar para eliminar imágenes
const deleteImage = async (imageUrl) => {
  // Si es una URL local
  if (imageUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '..', imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }
  
  // Si es una URL de Cloudinary
  if (imageUrl.includes('cloudinary')) {
    // Extraer el public_id de la URL
    const publicId = imageUrl.split('/').slice(-1)[0].split('.')[0];
    const folder = imageUrl.includes('/thumbnails/') ? 'thumbnails' : 'screenshots';
    
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
  }
};
