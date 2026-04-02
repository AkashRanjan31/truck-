const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  truckNumber: { type: String, required: true, trim: true, uppercase: true },
  homeState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', default: null },
  currentState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', default: null },
  assignedTruck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', default: null },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  password: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  role: { type: String, default: 'driver' },
}, { timestamps: true });

driverSchema.index({ location: '2dsphere' });

driverSchema.methods.comparePassword = function (plain) {
  if (!this.password) return plain === null || plain === undefined;
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
