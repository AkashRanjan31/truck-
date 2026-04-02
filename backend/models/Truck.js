const mongoose = require('mongoose');

const truckSchema = new mongoose.Schema({
  truckNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  homeState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  currentState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', default: null },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

truckSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Truck', truckSchema);
