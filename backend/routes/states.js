const express = require('express');
const router = express.Router();
const State = require('../models/State');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/rbac');

// GET /api/states — all roles can list states (for dropdowns)
router.get('/', async (req, res) => {
  try {
    const states = await State.find().populate('adminId', 'name email').sort({ name: 1 });
    res.json(states);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/states — super admin only
router.post('/', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name, code, boundary } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code required' });
    const state = await State.create({ name, code, boundary: boundary || undefined });
    res.status(201).json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/states/:id — super admin only
router.patch('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const state = await State.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!state) return res.status(404).json({ error: 'State not found' });
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/states/:id — super admin only
router.delete('/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await State.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/states/:id/assign-admin — assign a state admin to a state
router.post('/:id/assign-admin', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { adminId } = req.body;
    const [state, user] = await Promise.all([
      State.findByIdAndUpdate(req.params.id, { adminId }, { new: true }),
      User.findByIdAndUpdate(adminId, { assignedState: req.params.id }, { new: true }),
    ]);
    if (!state) return res.status(404).json({ error: 'State not found' });
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
