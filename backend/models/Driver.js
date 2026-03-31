const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    truckNumber: { type: String, required: true, trim: true, uppercase: true },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    password: { type: String, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

driverSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Driver', driverSchema);
