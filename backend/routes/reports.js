const express = require('express');
const router = express.Router();
const multer = require('multer');
const Report = require('../models/Report');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/reports
router.post('/', auth, upload.single('photo'), async (req, res, next) => {
  try {
    const { type, description, lat, lng, address } = req.body;
    const photo = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`
      : null;

    const report = await Report.create({
      type,
      description,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      address: address || '',
      photo,
      driverId: req.driver._id,
      driverName: req.driver.name,
      driverPhone: req.driver.phone,
    });

    req.app.get('io').emit('alert_nearby', report);
    res.status(201).json(report);
  } catch (err) { next(err); }
});

// GET /api/reports/admin — all reports (no status filter)
router.get('/admin', async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(500);
    res.json(reports);
  } catch (err) { next(err); }
});

// GET /api/reports/driver/:driverId  ← MUST be before /:id
router.get('/driver/:driverId', async (req, res, next) => {
  try {
    const reports = await Report.find({ driverId: req.params.driverId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) { next(err); }
});

// GET /api/reports?lat=&lng=&radius=
router.get('/', async (req, res, next) => {
  try {
    const { lat, lng, radius = 50000 } = req.query;
    let reports;

    if (lat && lng) {
      reports = await Report.find({
        status: 'active',
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
            $maxDistance: parseInt(radius),
          },
        },
      }).limit(100);
    } else {
      reports = await Report.find({ status: 'active' }).sort({ createdAt: -1 }).limit(100);
    }

    res.json(reports);
  } catch (err) { next(err); }
});

// GET /api/reports/:id
router.get('/:id', async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: 'Not found' });
    res.json(report);
  } catch (err) { next(err); }
});

// PATCH /api/reports/:id/upvote
router.patch('/:id/upvote', async (req, res, next) => {
  try {
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { $inc: { upvotes: 1 } },
      { new: true }
    );
    res.json(report);
  } catch (err) { next(err); }
});

// PATCH /api/reports/:id/resolve
router.patch('/:id/resolve', adminAuth, upload.single('resolvedPhoto'), async (req, res, next) => {
  try {
    const update = { status: 'resolved' };
    if (req.file) {
      update.resolvedPhoto = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }
    const report = await Report.findByIdAndUpdate(req.params.id, update, { new: true });
    req.app.get('io').emit('report_resolved', report);
    res.json(report);
  } catch (err) { next(err); }
});

// DELETE /api/reports/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
