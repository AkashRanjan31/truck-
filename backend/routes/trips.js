const express = require('express');
const router = express.Router();
const Trip = require('../models/Trip');
const Truck = require('../models/Truck');
const { authenticate, authorize } = require('../middleware/rbac');
const { detectState } = require('../utils/stateDetector');

// GET /api/trips
router.get('/', authenticate, authorize('super_admin', 'state_admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'state_admin'
      ? { $or: [{ originState: req.user.assignedState._id }, { currentState: req.user.assignedState._id }, { destinationState: req.user.assignedState._id }] }
      : {};
    const trips = await Trip.find(filter)
      .populate('truck', 'truckNumber')
      .populate('driver', 'name phone')
      .populate('originState destinationState currentState', 'name code')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trips — driver or admin starts a trip
router.post('/', authenticate, async (req, res) => {
  try {
    const { truckId, originStateId, destinationStateId, lat, lng } = req.body;
    if (!truckId || !originStateId || !destinationStateId) return res.status(400).json({ error: 'truckId, originStateId, destinationStateId required' });

    const driverId = req.user.role === 'driver' ? req.user._id : req.body.driverId;

    const trip = await Trip.create({
      truck: truckId,
      driver: driverId,
      originState: originStateId,
      destinationState: destinationStateId,
      currentState: originStateId,
      startLocation: { type: 'Point', coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0] },
      stateHistory: [{ state: originStateId, enteredAt: new Date() }],
      createdBy: req.user._id,
    });

    res.status(201).json(await trip.populate('truck driver originState destinationState currentState'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/trips/:id/location — update trip's current state based on GPS
router.patch('/:id/location', authenticate, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (req.user.role === 'driver' && trip.driver.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not your trip' });

    const detectedState = await detectState(lat, lng);
    if (detectedState && detectedState._id.toString() !== trip.currentState?.toString()) {
      // State crossed — close previous, open new
      const lastEntry = trip.stateHistory[trip.stateHistory.length - 1];
      if (lastEntry && !lastEntry.exitedAt) lastEntry.exitedAt = new Date();
      trip.stateHistory.push({ state: detectedState._id, enteredAt: new Date() });
      trip.currentState = detectedState._id;

      req.app.get('io').emit('state_crossed', { tripId: trip._id, newState: detectedState.name });
    }

    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/trips/:id/complete
router.patch('/:id/complete', authenticate, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    if (req.user.role === 'driver' && trip.driver.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Not your trip' });

    trip.status = 'completed';
    trip.endLocation = { type: 'Point', coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0] };
    const last = trip.stateHistory[trip.stateHistory.length - 1];
    if (last && !last.exitedAt) last.exitedAt = new Date();
    await trip.save();
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trips/driver/:driverId — driver sees own trips
router.get('/driver/:driverId', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'driver' && req.user._id.toString() !== req.params.driverId)
      return res.status(403).json({ error: 'Access denied' });

    const trips = await Trip.find({ driver: req.params.driverId })
      .populate('truck', 'truckNumber')
      .populate('originState destinationState currentState', 'name code')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
