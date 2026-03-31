const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

// POST /api/drivers/register — always creates a new driver
router.post('/register', async (req, res) => {
  try {
    const { name, phone, truckNumber } = req.body;
    if (!name || !phone || !truckNumber)
      return res.status(400).json({ error: 'All fields required' });

    const existing = await Driver.findOne({ phone });
    if (existing)
      return res.status(409).json({ error: 'Phone already registered', driver: existing });

    const driver = await Driver.create({ name, phone, truckNumber });
    res.status(201).json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drivers/login — find existing driver by phone
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const driver = await Driver.findOne({ phone });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.password && driver.password !== password)
      return res.status(401).json({ error: 'Wrong password' });
    res.json(driver);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/drivers/:id/change-password
router.post('/:id/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'New password required' });
    const driver = await Driver.findById(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.password && driver.password !== currentPassword)
      return res.status(401).json({ error: 'Current password is wrong' });
    driver.password = newPassword;
    await driver.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/drivers — all drivers
router.get('/', async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.json(drivers);
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
    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180)
      return res.status(400).json({ error: 'Invalid coordinates' });
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { location: { type: 'Point', coordinates: [parsedLng, parsedLat] } },
      { new: true }
    );
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(driver);
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

// DELETE /api/drivers/:id
router.delete('/:id', async (req, res) => {
  try {
    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
