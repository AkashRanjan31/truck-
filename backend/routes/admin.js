const express = require('express');
const router = express.Router();

const adminAuth = (req, res, next) => {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD)
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== process.env.ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Invalid password' });
  res.json({ success: true });
});

// POST /api/admin/change-password
router.post('/change-password', adminAuth, (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 4)
    return res.status(400).json({ error: 'Password must be at least 4 characters' });
  process.env.ADMIN_PASSWORD = newPassword;
  res.json({ success: true });
});

module.exports = router;
