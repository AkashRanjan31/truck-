const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const { generateToken, authenticate, authorize } = require('../middleware/rbac');

// POST /api/auth/admin/login — super_admin or state_admin login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email }).populate('assignedState');
    if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await user.comparePassword(password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user._id, user.role);
    res.json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role, assignedState: user.assignedState } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/driver/register
router.post('/driver/register', async (req, res) => {
  try {
    const { name, phone, truckNumber, homeStateId } = req.body;
    if (!name || !phone || !truckNumber) return res.status(400).json({ error: 'All fields required' });

    const existing = await Driver.findOne({ phone });
    if (existing) return res.status(409).json({ error: 'Phone already registered' });

    const driver = await Driver.create({ name, phone, truckNumber, homeState: homeStateId || null });
    const token = generateToken(driver._id, 'driver');
    res.status(201).json({ token, driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/driver/login
router.post('/driver/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const driver = await Driver.findOne({ phone }).populate('homeState currentState');
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    if (driver.password) {
      const match = await driver.comparePassword(password);
      if (!match) return res.status(401).json({ error: 'Wrong password' });
    }

    const token = generateToken(driver._id, 'driver');
    res.json({ token, driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/super-admin/seed — one-time super admin creation (disable in production)
router.post('/super-admin/seed', async (req, res) => {
  try {
    const exists = await User.findOne({ role: 'super_admin' });
    if (exists) return res.status(409).json({ error: 'Super admin already exists' });

    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const user = await User.create({ name, email, password, role: 'super_admin' });
    const token = generateToken(user._id, user.role);
    res.status(201).json({ token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json(req.user);
});

module.exports = router;
