const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  originState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  destinationState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', required: true },
  currentState: { type: mongoose.Schema.Types.ObjectId, ref: 'State', default: null },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  startLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  endLocation: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  stateHistory: [{
    state: { type: mongoose.Schema.Types.ObjectId, ref: 'State' },
    enteredAt: { type: Date, default: Date.now },
    exitedAt: { type: Date, default: null },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
