const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['police_harassment', 'extortion', 'unsafe_parking', 'accident_zone', 'poor_road', 'emergency', 'other'],
    required: true,
  },
  description: { type: String, required: true, trim: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  address: { type: String, default: '' },
  photo: { type: String, default: null },
  resolvedPhoto: { type: String, default: null },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  driverName: { type: String, required: true },
  driverPhone: { type: String, default: '' },
  // State routing fields
  homeState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', default: null },
  incidentState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', default: null }, // state where incident occurred (for routing)
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  upvotes: { type: Number, default: 0 },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ driverId: 1, createdAt: -1 });
reportSchema.index({ incidentState: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
