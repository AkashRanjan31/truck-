const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  // GeoJSON polygon boundary for point-in-polygon detection (optional)
  boundary: { type: mongoose.Schema.Types.Mixed, default: null },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

// Only index boundary when it exists
stateSchema.index({ boundary: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('State', stateSchema);
