const mongoose = require('mongoose');

const programSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },
  description: { type: String, required: true },
  fullDescription: { type: String }, // Descripción detallada con formato HTML
  category: { 
    type: String, 
    required: true, 
    enum: ['Productividad', 'Diseño', 'Seguridad', 'Multimedia', 'Desarrollo', 'Juegos', 'Utilidades', 'Internet', 'Comunicación', 'Educación', 'Negocios', 'Fotografía', 'Sistema', 'Otros'],
    index: true 
  },
  categoryName: { type: String }, // Para mantener compatibilidad con el frontend
  version: { type: String, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  downloads: { type: Number, default: 0 },
  size: { type: String },
  platform: { 
    type: [String], 
    enum: ['Windows', 'MacOS', 'Linux', 'Android', 'iOS'],
    index: true 
  },
  releaseDate: { type: Date },
  updateDate: { type: Date, default: Date.now },
  developer: { type: String },
  license: { type: String },
  website: { type: String }, // Sitio web oficial del programa
  thumbnail: { type: String }, // URL de la imagen en miniatura (Cloudinary)
  screenshots: [{ type: String }], // Array de URLs de capturas de pantalla (Cloudinary)
  downloadLink: { type: String }, // Enlace de descarga directo
  mirrors: [{ 
    name: { type: String },
    url: { type: String }
  }], // Enlaces alternativos
  featured: { type: Boolean, default: false, index: true },
  tags: [{ type: String, index: true }],
  requirements: {
    minimal: { type: mongoose.Schema.Types.Mixed }, // Puede ser string o array
    recommended: { type: mongoose.Schema.Types.Mixed } // Puede ser string o array
  },
  features: [{ type: String }], // Características principales
}, { timestamps: true });

// Índices compuestos para búsquedas frecuentes
programSchema.index({ category: 1, featured: 1 });
programSchema.index({ name: 'text', description: 'text', tags: 'text' });

// Pre-save hook para asegurar que categoryName y category coincidan
programSchema.pre('save', function(next) {
  this.categoryName = this.category;
  next();
});

module.exports = mongoose.model('Program', programSchema);
