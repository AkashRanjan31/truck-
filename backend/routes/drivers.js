const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

const adminAuth = (req, res, next) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD)
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

// POST /api/drivers/register
router.post('/register', async (req, res) => {
  try {
    const { name, phone, truckNumber } = req.body;
    if (!name || !phone || !truckNumber)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await Driver.findOne({ phone });
    if (existing) return res.json(existing);

    const driver = await Driver.create({ name, phone, truckNumber });
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drivers/login
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const driver = await Driver.findOne({ phone });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/drivers/:id/location
router.patch('/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng))
      return res.status(400).json({ error: 'Invalid coordinates' });

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      {
        location: { type: 'Point', coordinates: [parsedLng, parsedLat] },
        locationSet: true,
        lastLocationUpdate: new Date(),
      },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers — admin only
router.get('/', adminAuth, async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers/:id
router.get('/:id', async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/drivers/:id — admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/drivers/:id/password
router.patch('/:id/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4)
      return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    if (driver.password) {
      if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
      const match = await driver.comparePassword(currentPassword);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
    }

    driver.password = newPassword;
    await driver.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
