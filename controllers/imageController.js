/**
 * Controladores para gestionar imágenes y capturas de pantalla
 */
const Program = require('../models/Program');
const fs = require('fs');
const path = require('path');
const { getFileUrl, deleteFile } = require('../middlewares/uploadMiddleware');

// Actualizar thumbnail de un programa
const updateThumbnail = async (req, res) => {
  try {
    const programId = req.params.id;
    console.log('Actualizando thumbnail para programa ID:', programId);
    
    // Verificar si hay un archivo subido
    if (!req.file) {
      console.error('No se subió ninguna imagen');
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha subido ninguna imagen' 
      });
    }
    
    console.log('Archivo recibido:', req.file);
    
    // Buscar el programa
    const program = await Program.findById(programId);
    if (!program) {
      console.error('Programa no encontrado con ID:', programId);
      return res.status(404).json({ 
        success: false, 
        message: 'Programa no encontrado' 
      });
    }
      // Si ya existe un thumbnail, eliminar el antiguo
    if (program.thumbnail && program.thumbnail.includes('/uploads/')) {
      try {
        // Extraer solo el nombre del archivo, sin parámetros de consulta
        let oldFilename = program.thumbnail.split('/').pop();
        if (oldFilename.includes('?')) {
          oldFilename = oldFilename.split('?')[0];
        }
        
        console.log('Intentando eliminar archivo anterior:', oldFilename);
        await deleteFile(oldFilename, 'thumbnail');
        console.log(`Thumbnail anterior eliminado: ${oldFilename}`);
      } catch (error) {
        console.error('Error al eliminar thumbnail anterior:', error);
        // Continuamos con la actualización aunque falle la eliminación
      }
    }
    
    // Obtener la ruta del nuevo thumbnail
    const thumbnailUrl = getFileUrl(req.file.filename, 'thumbnail');
    console.log('Nueva URL del thumbnail:', thumbnailUrl);
      // Actualizar el programa
    program.thumbnail = thumbnailUrl;
    program.updatedAt = Date.now();
    await program.save();
    
    // Crear copia del programa para la respuesta
    const responseProgram = program.toObject();
    
    // Invalidar posibles cachés del navegador añadiendo timestamp adicional
    const uniqueTimestamp = Date.now();
    responseProgram.thumbnail = thumbnailUrl.includes('?') 
      ? `${thumbnailUrl}&nocache=${uniqueTimestamp}` 
      : `${thumbnailUrl}?nocache=${uniqueTimestamp}`;
    
    console.log('URL final del thumbnail para respuesta:', responseProgram.thumbnail);
    
    res.status(200).json({
      success: true,
      message: 'Thumbnail actualizado correctamente',
      program: responseProgram
    });
  } catch (error) {
    console.error('Error al actualizar thumbnail:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el thumbnail',
      error: error.message
    });
  }
};

// Agregar capturas de pantalla
const addScreenshots = async (req, res) => {
  try {
    const programId = req.params.id;
    
    // Verificar si hay archivos subidos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se han subido imágenes' 
      });
    }
    
    // Buscar el programa
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ 
        success: false, 
        message: 'Programa no encontrado' 
      });
    }
    
    // Obtener las URLs de las nuevas capturas
    const newScreenshots = req.files.map(file => 
      getFileUrl(file.filename, 'screenshot')
    );
    
    // Agregar las nuevas capturas al programa
    if (!program.screenshots) {
      program.screenshots = [];
    }
    
    program.screenshots = [...program.screenshots, ...newScreenshots];
    program.updatedAt = Date.now();
    await program.save();
    
    res.status(200).json({
      success: true,
      message: 'Capturas de pantalla agregadas correctamente',
      program
    });
  } catch (error) {
    console.error('Error al agregar capturas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar capturas de pantalla',
      error: error.message
    });
  }
};

// Eliminar captura de pantalla
const deleteScreenshot = async (req, res) => {
  try {
    const { programId, screenshot } = req.body;
    
    if (!programId || !screenshot) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere ID del programa y nombre del archivo'
      });
    }
    
    // Buscar el programa
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ 
        success: false, 
        message: 'Programa no encontrado' 
      });
    }
    
    // Verificar si la captura existe
    const screenshotUrl = `/uploads/screenshots/${screenshot}`;
    const screenshotIndex = program.screenshots.findIndex(
      s => s === screenshotUrl || s.endsWith(screenshot)
    );
    
    if (screenshotIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Captura de pantalla no encontrada'
      });
    }
    
    // Eliminar la captura del array
    program.screenshots.splice(screenshotIndex, 1);
    program.updatedAt = Date.now();
    await program.save();
    
    // Intentar eliminar el archivo físico
    try {
      await deleteFile(screenshot, 'screenshot');
      console.log(`Captura eliminada: ${screenshot}`);
    } catch (error) {
      console.error('Error al eliminar archivo físico:', error);
      // Continuamos aunque falle la eliminación del archivo
    }
    
    res.status(200).json({
      success: true,
      message: 'Captura de pantalla eliminada correctamente',
      program
    });
  } catch (error) {
    console.error('Error al eliminar captura:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar captura de pantalla',
      error: error.message
    });
  }
};

// Registrar descarga de programa
const registerDownload = async (req, res) => {
  try {
    const programId = req.params.id;
    
    // Buscar el programa
    const program = await Program.findById(programId);
    if (!program) {
      return res.status(404).json({ 
        success: false, 
        message: 'Programa no encontrado' 
      });
    }
    
    // Incrementar contador de descargas
    program.downloads = (program.downloads || 0) + 1;
    await program.save();
    
    res.status(200).json({
      success: true,
      message: 'Descarga registrada correctamente',
      downloads: program.downloads
    });
  } catch (error) {
    console.error('Error al registrar descarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la descarga',
      error: error.message
    });
  }
};

module.exports = {
  updateThumbnail,
  addScreenshots,
  deleteScreenshot,
  registerDownload
};
