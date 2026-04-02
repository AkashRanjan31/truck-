const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const Report = require('../models/Report');
const Truck = require('../models/Truck');
const Trip = require('../models/Trip');
const { authenticate, authorize } = require('../middleware/rbac');

// POST /api/admin/state-admins — super admin creates a state admin
router.post('/state-admins', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name, email, password, assignedStateId } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const user = await User.create({
      name, email, password,
      role: 'state_admin',
      assignedState: assignedStateId || null,
    });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, assignedState: user.assignedState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/state-admins — super admin lists all state admins
router.get('/state-admins', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const admins = await User.find({ role: 'state_admin' }).populate('assignedState', 'name code').select('-password');
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/state-admins/:id — super admin updates state admin
router.patch('/state-admins/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Admin not found' });
    Object.assign(user, rest);
    if (password) user.password = password;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, assignedState: user.assignedState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/admin/state-admins/:id — super admin deletes state admin
router.delete('/state-admins/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/dashboard — super admin full system stats
router.get('/dashboard', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const [drivers, reports, trucks, trips, stateAdmins] = await Promise.all([
      Driver.countDocuments(),
      Report.countDocuments(),
      Truck.countDocuments(),
      Trip.countDocuments({ status: 'active' }),
      User.countDocuments({ role: 'state_admin' }),
    ]);
    res.json({ drivers, reports, trucks, activeTrips: trips, stateAdmins });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/drivers — super admin sees all, state admin sees own state
router.get('/drivers', authenticate, authorize('super_admin', 'state_admin'), async (req, res) => {
  try {
    const filter = req.user.role === 'state_admin'
      ? { $or: [{ currentState: req.user.assignedState._id }, { homeState: req.user.assignedState._id }] }
      : {};
    const drivers = await Driver.find(filter).populate('homeState currentState', 'name code').sort({ createdAt: -1 });
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
