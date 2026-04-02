const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/Report');
const { authenticate, authorize, stateFilter } = require('../middleware/rbac');
const { detectState } = require('../utils/stateDetector');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/reports — driver submits report, incidentState auto-detected from GPS
router.post('/', authenticate, authorize('driver'), upload.single('photo'), async (req, res) => {
  try {
    const { type, description, lat, lng, address } = req.body;
    const photo = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : null;

    const incidentState = await detectState(parseFloat(lat), parseFloat(lng));

    const report = await Report.create({
      type, description,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      address: address || '',
      photo,
      driverId: req.driver._id,
      driverName: req.driver.name,
      driverPhone: req.driver.phone,
      homeState: req.driver.homeState || null,
      incidentState: incidentState?._id || null,
    });

    // Emit to the state room where incident occurred
    const io = req.app.get('io');
    io.emit('alert_nearby', report);
    if (incidentState) io.to(`state_${incidentState._id}`).emit('state_alert', report);

    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports — state-filtered for admins, own reports for drivers
router.get('/', authenticate, stateFilter, async (req, res) => {
  try {
    const { lat, lng, radius = 50000 } = req.query;
    let query = { ...req.stateFilter, status: 'active' };

    if (lat && lng && req.user.role === 'driver') {
      query = {
        ...req.stateFilter,
        status: 'active',
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      };
    }

    const reports = await Report.find(query)
      .populate('incidentState homeState', 'name code')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/driver/:driverId
router.get('/driver/:driverId', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'driver' && req.user._id.toString() !== req.params.driverId)
      return res.status(403).json({ error: 'Access denied' });

    const reports = await Report.find({ driverId: req.params.driverId })
      .populate('incidentState homeState', 'name code')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('incidentState homeState', 'name code');
    if (!report) return res.status(404).json({ error: 'Not found' });

    if (req.user.role === 'driver' && report.driverId.toString() !== req.user._id.toString())
      return res.status(403).json({ error: 'Access denied' });

    if (req.user.role === 'state_admin') {
      const stateId = req.user.assignedState._id.toString();
      if (report.incidentState?._id.toString() !== stateId)
        return res.status(403).json({ error: 'Access denied' });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reports/:id/upvote
router.patch('/:id/upvote', authenticate, async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reports/:id/resolve — state admin or super admin only
router.patch('/:id/resolve', authenticate, authorize('super_admin', 'state_admin'), upload.single('resolvedPhoto'), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });

    if (req.user.role === 'state_admin') {
      const stateId = req.user.assignedState._id.toString();
      if (report.incidentState?.toString() !== stateId)
        return res.status(403).json({ error: 'Not in your state' });
    }

    const update = { status: 'resolved', resolvedBy: req.user._id };
    if (req.file) update.resolvedPhoto = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const updated = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    req.app.get('io').emit('report_resolved', updated);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reports/:id — super admin only
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
