const mongoose = require('mongoose');

const stateSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  // GeoJSON polygon boundary for point-in-polygon detection
  boundary: {
    type: { type: String, default: 'Polygon' },
    coordinates: { type: [[[Number]]], default: [] },
  },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

stateSchema.index({ boundary: '2dsphere' });

module.exports = mongoose.model('State', stateSchema);
