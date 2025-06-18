const mongoose = require('mongoose');

// Modelo de actividad (creamos un esquema simple aquí para no tener que crear un archivo separado)
const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['create', 'update', 'delete', 'import', 'upload', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Sólo creamos el modelo si no existe ya
let Activity;
try {
  Activity = mongoose.model('Activity');
} catch (e) {
  Activity = mongoose.model('Activity', activitySchema);
}

// Registrar una nueva actividad
exports.logActivity = async (userId, type, message) => {
  try {
    const activity = new Activity({
      userId,
      type,
      message
    });
    
    await activity.save();
    console.log(`Activity logged: ${type} - ${message}`);
    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    return null;
  }
};

// Obtener actividades recientes
exports.getRecentActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username email')
      .lean();
    
    res.status(200).json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Eliminar actividades antiguas
exports.cleanupOldActivity = async () => {
  try {
    // Eliminar actividades de más de 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const result = await Activity.deleteMany({ timestamp: { $lt: thirtyDaysAgo } });
    console.log(`Cleaned up ${result.deletedCount} old activity records`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old activity:', error);
    return 0;
  }
};
