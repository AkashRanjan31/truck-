const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

// POST /api/drivers/register — MUST be before /:id routes
router.post('/register', async (req, res) => {
  try {
    const { name, phone, truckNumber } = req.body;
    if (!name || !phone || !truckNumber)
      return res.status(400).json({ error: 'All fields required' });

    let driver = await Driver.findOne({ phone });
    if (driver) {
      driver.name = name;
      driver.truckNumber = truckNumber;
      await driver.save();
      return res.json(driver);
    }

    driver = await Driver.create({ name, phone, truckNumber });
    res.status(201).json(driver);
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
    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } },
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
    await Driver.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
