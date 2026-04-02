const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/Report');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const adminAuth = (req, res, next) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD)
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

// POST /api/reports
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const { type, description, lat, lng, address, driverId, driverName, driverPhone } = req.body;
    const photo = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : null;

    const report = await Report.create({
      type, description,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      address: address || '',
      photo,
      driverId,
      driverName,
      driverPhone: driverPhone || '',
    });

    req.app.get('io').emit('alert_nearby', report);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports — nearby or all
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 50000 } = req.query;
    let query = { status: 'active' };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const reports = await Report.find(query).sort({ createdAt: -1 }).limit(200);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/admin — all reports for admin
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/driver/:driverId
router.get('/driver/:driverId', async (req, res) => {
  try {
    const reports = await Report.find({ driverId: req.params.driverId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/:id
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reports/:id/upvote
router.patch('/:id/upvote', async (req, res) => {
  try {
    const report = await Report.findByIdAndUpdate(req.params.id, { $inc: { upvotes: 1 } }, { new: true });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/reports/:id/resolve — admin only
router.patch('/:id/resolve', adminAuth, upload.single('resolvedPhoto'), async (req, res) => {
  try {
    const update = { status: 'resolved' };
    if (req.file) update.resolvedPhoto = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!report) return res.status(404).json({ error: 'Not found' });

    req.app.get('io').emit('report_resolved', report);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reports/:id — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
