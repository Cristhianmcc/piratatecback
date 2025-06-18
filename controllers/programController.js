const Program = require('../models/Program');

// Obtener todos los programas con paginación y filtros
exports.getAllPrograms = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const category = req.query.category;
    
    const filter = {};
    if (category) filter.category = category;
      const [programs, total] = await Promise.all([
      Program.find(filter)
        .sort({ featured: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Program.countDocuments(filter)
    ]);
    
    // Añadir timestamp a URLs de imágenes para evitar caché
    const timestamp = Date.now();
    const processedPrograms = programs.map(program => {
      // Actualizar URL del thumbnail
      if (program.thumbnail) {
        program.thumbnail = program.thumbnail.includes('?') 
          ? `${program.thumbnail.split('?')[0]}?t=${timestamp}` 
          : `${program.thumbnail}?t=${timestamp}`;
      }
      
      // Actualizar URLs de capturas de pantalla
      if (program.screenshots && program.screenshots.length > 0) {
        program.screenshots = program.screenshots.map(screenshot => {
          return screenshot.includes('?') 
            ? `${screenshot.split('?')[0]}?t=${timestamp}` 
            : `${screenshot}?t=${timestamp}`;
        });
      }
      
      return program;
    });
    
    res.status(200).json({
      programs: processedPrograms,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalPrograms: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un programa por ID
exports.getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar si el ID es válido
    if (!id || id === 'undefined' || id === 'null') {
      console.error('ID de programa inválido recibido:', id);
      return res.status(400).json({ message: 'ID de programa inválido' });
    }
    
    // Verificar si el ID tiene formato válido para MongoDB
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      console.error('Formato de ID inválido:', id);
      return res.status(400).json({ message: 'Formato de ID inválido' });
    }
      const program = await Program.findById(id);
    if (!program) {
      return res.status(404).json({ message: 'Programa no encontrado' });
    }
    
    // Convertir a objeto para poder modificar
    const programObj = program.toObject();
    
    // Añadir timestamp a URLs de imágenes para evitar caché
    const timestamp = Date.now();
    
    // Actualizar URL del thumbnail
    if (programObj.thumbnail) {
      programObj.thumbnail = programObj.thumbnail.includes('?') 
        ? `${programObj.thumbnail.split('?')[0]}?t=${timestamp}` 
        : `${programObj.thumbnail}?t=${timestamp}`;
    }
    
    // Actualizar URLs de capturas de pantalla
    if (programObj.screenshots && programObj.screenshots.length > 0) {
      programObj.screenshots = programObj.screenshots.map(screenshot => {
        return screenshot.includes('?') 
          ? `${screenshot.split('?')[0]}?t=${timestamp}` 
          : `${screenshot}?t=${timestamp}`;
      });
    }
    
    res.status(200).json(programObj);
  } catch (error) {
    console.error('Error obteniendo programa por ID:', error);
    res.status(500).json({ error: error.message });
  }
};

// Buscar programas
exports.searchPrograms = async (req, res) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    let filter = {};
    
    // Si hay una consulta de búsqueda
    if (query) {
      // Primero intentamos usar el índice de texto para búsqueda más eficiente
      try {
        const textSearchResults = await Program.find({ $text: { $search: query } })
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit)
          .lean();
        
        // Si encontramos resultados, los devolvemos
        if (textSearchResults.length > 0) {
          const total = await Program.countDocuments({ $text: { $search: query } });
          return res.status(200).json({
            programs: textSearchResults,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalResults: total
          });
        }
      } catch (error) {
        console.log('Búsqueda por texto falló, usando búsqueda regex:', error.message);
      }
      
      // Si la búsqueda de texto no encontró resultados o falló, usar regex para búsqueda más flexible
      filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { categoryName: { $regex: query, $options: 'i' } },
          { developer: { $regex: query, $options: 'i' } }
        ]
      };
    }
    
    // Filtros adicionales
    if (req.query.category) filter.category = req.query.category;
    if (req.query.platform) filter.platform = { $in: [req.query.platform] };
    
    // Ordenamiento
    const sort = {};
    if (query) {
      // Si hay búsqueda por texto, ordenar por relevancia
      sort.score = { $meta: 'textScore' };
    } else {
      // Ordenamiento por defecto
      sort.featured = -1;
      sort.updatedAt = -1;
    }
    
    const [programs, total] = await Promise.all([
      Program.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Program.countDocuments(filter)
    ]);
    
    res.status(200).json({
      programs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener programas destacados
exports.getFeaturedPrograms = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    const programs = await Program.find({ featured: true })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    
    res.status(200).json(programs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener programas por categoría
exports.getProgramsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const [programs, total] = await Promise.all([
      Program.find({ category })
        .sort({ featured: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Program.countDocuments({ category })
    ]);
    
    res.status(200).json({
      programs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalResults: total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Crear un nuevo programa
exports.createProgram = async (req, res) => {
  try {
    // Si hay un archivo subido, establecer la URL de la imagen
    if (req.file) {
      req.body.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }
    
    const program = new Program(req.body);
    const savedProgram = await program.save();
    
    res.status(201).json(savedProgram);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un programa
exports.updateProgram = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Si hay un archivo subido, actualizar la URL de la imagen
    if (req.file) {
      req.body.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
    }
    
    const updatedProgram = await Program.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!updatedProgram) {
      return res.status(404).json({ message: 'Programa no encontrado' });
    }
    
    res.status(200).json(updatedProgram);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un programa
exports.deleteProgram = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedProgram = await Program.findByIdAndDelete(id);
    
    if (!deletedProgram) {
      return res.status(404).json({ message: 'Programa no encontrado' });
    }
    
    res.status(200).json({ message: 'Programa eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
