const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');
const { authenticate, authorize } = require('../middleware/rbac');
const { detectState } = require('../utils/stateDetector');

// GET /api/drivers — admin only, state-filtered
router.get('/', authenticate, authorize('super_admin', 'state_admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'state_admin'
      ? { $or: [{ currentState: req.user.assignedState._id }, { homeState: req.user.assignedState._id }] }
      : {};
    const drivers = await Driver.find(filter)
      .populate('homeState currentState', 'name code')
      .sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/drivers/:id/location — driver updates own location, auto-detects state
router.patch('/:id/location', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'driver' && req.user._id.toString() !== req.params.id)
      return res.status(403).json({ error: 'Can only update your own location' });

    const { lat, lng } = req.body;
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return res.status(400).json({ error: 'Invalid coordinates' });

    const detectedState = await detectState(parsedLat, parsedLng);
    const update = {
      location: { type: 'Point', coordinates: [parsedLng, parsedLat] },
      ...(detectedState && { currentState: detectedState._id }),
    };

    const driver = await Driver.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('homeState currentState', 'name code');
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (detectedState) {
      req.app.get('io').to(`state_${detectedState._id}`).emit('driver_location', {
        driverId: driver._id, name: driver.name, truckNumber: driver.truckNumber,
        lat: parsedLat, lng: parsedLng, currentState: detectedState.name,
      });
    }
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers/:id — driver sees own, admins see based on state
router.get('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'driver' && req.user._id.toString() !== req.params.id)
      return res.status(403).json({ error: 'Access denied' });

    const driver = await Driver.findById(req.params.id).populate('homeState currentState', 'name code');
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (req.user.role === 'state_admin') {
      const stateId = req.user.assignedState._id.toString();
      if (driver.homeState?._id.toString() !== stateId && driver.currentState?._id.toString() !== stateId)
        return res.status(403).json({ error: 'Access denied' });
    }
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/drivers/:id — super admin only
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
