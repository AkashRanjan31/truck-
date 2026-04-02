const express = require('express');
const router = express.Router();
const Truck = require('../models/Truck');
const { authenticate, authorize } = require('../middleware/rbac');
const { detectState } = require('../utils/stateDetector');

// GET /api/trucks
router.get('/', authenticate, authorize('super_admin', 'state_admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'state_admin'
      ? { $or: [{ currentState: req.user.assignedState._id }, { homeState: req.user.assignedState._id }] }
      : {};
    const trucks = await Truck.find(filter)
      .populate('homeState currentState', 'name code')
      .populate('assignedDriver', 'name phone')
      .sort({ createdAt: -1 });
    res.json(trucks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/trucks — super admin or state admin creates truck
router.post('/', authenticate, authorize('super_admin', 'state_admin'), async (req, res) => {
  try {
    const { truckNumber, homeStateId, assignedDriverId } = req.body;
    if (!truckNumber || !homeStateId) return res.status(400).json({ error: 'truckNumber and homeStateId required' });

    // State admin can only create trucks for their own state
    if (req.user.role === 'state_admin' && homeStateId !== req.user.assignedState._id.toString())
      return res.status(403).json({ error: 'Can only create trucks for your state' });

    const truck = await Truck.create({
      truckNumber,
      homeState: homeStateId,
      currentState: homeStateId,
      assignedDriver: assignedDriverId || null,
      createdBy: req.user._id,
    });
    res.status(201).json(await truck.populate('homeState currentState', 'name code'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/trucks/:id/location — driver updates truck location, auto-detects current state
router.patch('/:id/location', authenticate, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return res.status(400).json({ error: 'Invalid coordinates' });

    // Drivers can only update their own assigned truck
    if (req.user.role === 'driver') {
      const truck = await Truck.findById(req.params.id);
      if (!truck || truck.assignedDriver?.toString() !== req.user._id.toString())
        return res.status(403).json({ error: 'Not your assigned truck' });
    }

    const detectedState = await detectState(parsedLat, parsedLng);
    const update = {
      location: { type: 'Point', coordinates: [parsedLng, parsedLat] },
      ...(detectedState && { currentState: detectedState._id }),
    };

    const truck = await Truck.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('homeState currentState', 'name code');
    if (!truck) return res.status(404).json({ error: 'Truck not found' });

    req.app.get('io').to(`state_${detectedState?._id}`).emit('truck_location', { truckId: truck._id, lat: parsedLat, lng: parsedLng, currentState: detectedState });
    res.json(truck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trucks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id)
      .populate('homeState currentState', 'name code')
      .populate('assignedDriver', 'name phone');
    if (!truck) return res.status(404).json({ error: 'Truck not found' });

    if (req.user.role === 'state_admin') {
      const stateId = req.user.assignedState._id.toString();
      if (truck.homeState?._id.toString() !== stateId && truck.currentState?._id.toString() !== stateId)
        return res.status(403).json({ error: 'Access denied' });
    }
    res.json(truck);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
