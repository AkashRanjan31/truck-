const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['police_harassment', 'extortion', 'unsafe_parking', 'accident_zone', 'poor_road', 'other'],
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
  status: { type: String, enum: ['active', 'resolved'], default: 'active' },
  resolvedBy: { type: String, enum: ['admin', 'user', null], default: null },
  resolvedAt: { type: Date, default: null },
  userConfirmed: { type: Boolean, default: false },
  userConfirmedAt: { type: Date, default: null },
  upvotes: { type: Number, default: 0 },
}, { timestamps: true });

reportSchema.index({ location: '2dsphere' });
reportSchema.index({ driverId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
