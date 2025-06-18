const User = require('../models/User');
const Program = require('../models/Program');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { cloudinary } = require('../config/cloudinaryConfig');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const activityController = require('./activityController');

// Login para administradores
const login = async (req, res) => {
  try {
    console.log('---- INTENTO DE LOGIN DE ADMINISTRADOR ----');
    const { email, password } = req.body;
    console.log('Email recibido:', email);
    
    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Usuario no encontrado con este email:', email);
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
    
    console.log('Usuario encontrado:', {
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin
    });
    
    // Verificar si es admin
    if (!user.isAdmin) {
      console.log('Usuario no tiene permisos de administrador');
      return res.status(403).json({ success: false, message: 'No tienes permisos de administrador' });
    }
      // Verificar contraseña directamente con bcryptjs
    console.log('Verificando contraseña...');
    let isPasswordValid;
    
    try {
      // Usar bcryptjs directamente en lugar del método del modelo
      isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Contraseña ingresada:', password);
      console.log('Hash almacenado:', user.password);
      console.log('Resultado de validación de contraseña:', isPasswordValid);
    } catch (error) {
      console.error('Error al validar contraseña:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al validar contraseña',
        error: error.message
      });
    }
    
    if (!isPasswordValid) {
      console.log('Contraseña incorrecta para usuario:', user.email);
      return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
    
    // Generar token
    console.log('Generando token JWT...');
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET || 'tu_super_secreto_para_jwt_pirata_tech_2025',
      { expiresIn: '8h' }
    );
    
    console.log('Login exitoso para usuario:', user.email);
    
    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        name: user.name || user.username,
        email: user.email,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Error general en login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor', 
      error: error.message 
    });
  }
};

// Obtener todos los programas con paginación y filtros avanzados
const getPrograms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Extraer filtros de la query
    const { category, platform, featured, search, sort, exact } = req.query;
    
    // Construir filtros
    const filter = {};
    
    if (category) filter.category = category;
    if (platform) filter.platform = platform;
    if (featured !== undefined) filter.featured = featured === 'true';
    
    // Busqueda avanzada
    if (search) {
      if (exact === 'true') {
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
    
    // Registrar actividad
    await logActivity(req.userId, 'admin', `Consultó lista de programas (${programs.length} resultados)`);
    
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

// Obtener un programa por ID
const getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar si el ID es válido
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ success: false, message: 'ID de programa no válido' });
    }
    
    const program = await Program.findById(id).lean();
    
    if (!program) {
      return res.status(404).json({ success: false, message: 'Programa no encontrado' });
    }
    
    res.status(200).json({ success: true, program });
  } catch (error) {
    console.error('Error fetching program by ID:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Crear un nuevo programa
const createProgram = async (req, res) => {
  try {
    const programData = req.body;
    
    // Verificar datos obligatorios
    if (!programData.name || !programData.description || !programData.category || !programData.version) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos obligatorios: nombre, descripción, categoría y versión son requeridos' 
      });
    }
    
    // Procesar archivos si los hay
    if (req.files) {
      // Procesar thumbnail
      if (req.files.thumbnail) {
        const thumbnail = req.files.thumbnail[0];
        programData.thumbnail = thumbnail.path.replace('public', '');
      }
      
      // Procesar screenshots
      if (req.files.screenshots) {
        programData.screenshots = req.files.screenshots.map(screenshot => 
          screenshot.path.replace('public', '')
        );
      }
    }
    
    // Crear programa
    const newProgram = new Program(programData);
    await newProgram.save();
    
    // Registrar actividad
    await logActivity(req.userId, 'create', `Creó el programa "${newProgram.name}"`);
    
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
const updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Procesar archivos si los hay
    if (req.files) {
      // Procesar thumbnail
      if (req.files.thumbnail) {
        const thumbnail = req.files.thumbnail[0];
        updateData.thumbnail = thumbnail.path.replace('public', '');
      }
      
      // Procesar screenshots
      if (req.files.screenshots) {
        // Si ya hay screenshots, añadir a los existentes
        const program = await Program.findById(id);
        if (program && program.screenshots) {
          updateData.screenshots = [
            ...program.screenshots,
            ...req.files.screenshots.map(screenshot => screenshot.path.replace('public', ''))
          ];
        } else {
          updateData.screenshots = req.files.screenshots.map(screenshot => 
            screenshot.path.replace('public', '')
          );
        }
      }
    }
    
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
    await logActivity(req.userId, 'update', `Actualizó el programa "${updatedProgram.name}"`);
    
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
const deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar programa primero para registrar actividad y eliminar imágenes
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
        // Manejar tanto URLs de cloudinary como locales
        if (program.thumbnail.includes('cloudinary')) {
          // Extraer el public_id de la URL de Cloudinary
          const parts = program.thumbnail.split('/');
          const filename = parts[parts.length - 1];
          const publicId = filename.split('.')[0]; 
          await cloudinary.uploader.destroy(`thumbnails/${publicId}`);
        } else {
          // Eliminar archivo local
          const localPath = path.join(__dirname, '../public', program.thumbnail);
          if (fs.existsSync(localPath)) {
            fs.unlinkSync(localPath);
          }
        }
      } catch (error) {
        console.error('Error deleting thumbnail:', error);
      }
    }
    
    if (program.screenshots && program.screenshots.length > 0) {
      for (const screenshot of program.screenshots) {
        try {
          if (screenshot.includes('cloudinary')) {
            // Extraer el public_id de la URL de Cloudinary
            const parts = screenshot.split('/');
            const filename = parts[parts.length - 1];
            const publicId = filename.split('.')[0]; 
            await cloudinary.uploader.destroy(`screenshots/${publicId}`);
          } else {
            // Eliminar archivo local
            const localPath = path.join(__dirname, '../public', screenshot);
            if (fs.existsSync(localPath)) {
              fs.unlinkSync(localPath);
            }
          }
        } catch (error) {
          console.error('Error deleting screenshot:', error);
        }
      }
    }
    
    // Eliminar el programa
    await Program.findByIdAndDelete(id);
    
    // Registrar actividad
    await logActivity(req.userId, 'delete', `Eliminó el programa "${program.name}"`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Programa eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error deleting program:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Eliminar una screenshot específica
const deleteScreenshot = async (req, res) => {
  try {
    const { programId, screenshot } = req.body;
    
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
      // Manejar tanto URLs de cloudinary como locales
      if (screenshot.includes('cloudinary')) {
        // Extraer el public_id de la URL de Cloudinary
        const parts = screenshot.split('/');
        const filename = parts[parts.length - 1];
        const publicId = filename.split('.')[0]; 
        await cloudinary.uploader.destroy(`screenshots/${publicId}`);
      } else {
        // Eliminar archivo local
        const localPath = path.join(__dirname, '../public', screenshot);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
    } catch (error) {
      console.error('Error deleting screenshot file:', error);
    }
    
    // Eliminar la URL del array
    program.screenshots = program.screenshots.filter(s => s !== screenshot);
    await program.save();
    
    // Registrar actividad
    await logActivity(req.userId, 'delete', `Eliminó una captura de pantalla del programa "${program.name}"`);
    
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

// Importar programas desde CSV
const importProgramsFromCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ningún archivo CSV' });
    }
    
    const results = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Procesar resultados y crear programas
        for (const row of results) {
          try {
            // Transformar datos de acuerdo al modelo
            const programData = {
              name: row.name,
              description: row.description || '',
              fullDescription: row.fullDescription || row.description || '',
              category: row.category,
              version: row.version,
              platform: row.platform?.split(',').map(p => p.trim()) || [],
              developer: row.developer,
              license: row.license,
              size: row.size,
              releaseDate: row.releaseDate ? new Date(row.releaseDate) : new Date(),
              tags: row.tags?.split(',').map(t => t.trim()) || [],
              thumbnail: row.thumbnail || '',
              downloadLink: row.downloadLink || ''
            };
            
            // Procesar requisitos si existen
            if (row.requirements_minimal || row.requirements_recommended) {
              programData.requirements = {
                minimal: row.requirements_minimal || '',
                recommended: row.requirements_recommended || ''
              };
            }
            
            const program = new Program(programData);
            await program.save();
          } catch (error) {
            errors.push({ row, error: error.message });
          }
        }
        
        // Eliminar el archivo CSV temporal
        fs.unlinkSync(req.file.path);
        
        res.json({ 
          imported: results.length - errors.length,
          total: results.length,
          errors: errors.length > 0 ? errors : [] 
        });
      });
  } catch (error) {
    // Eliminar el archivo CSV temporal si existe
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Error al importar programas', error: error.message });
  }
};

// Obtener estadísticas del panel
const getDashboardStats = async (req, res) => {
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
    
    // Registrar actividad
    await logActivity(req.userId, 'admin', 'Consultó estadísticas del dashboard');
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Función de utilidad para registrar actividad
const logActivity = async (userId, type, message) => {
  try {
    return await activityController.logActivity(userId, type, message);
  } catch (error) {
    console.error('Error al registrar actividad:', error);
  }
};

// Obtener actividades recientes
const getRecentActivity = async (req, res) => {
  return await activityController.getRecentActivity(req, res);
};

module.exports = {
  login,
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  deleteProgram,
  deleteScreenshot,
  importProgramsFromCSV,
  getDashboardStats,
  logActivity,
  getRecentActivity
};
