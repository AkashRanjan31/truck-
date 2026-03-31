const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');

const getAdminPassword = () => process.env.ADMIN_PASSWORD || 'admin123';

const updateEnv = (newPassword) => {
  let content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('ADMIN_PASSWORD=')) {
    content = content.replace(/ADMIN_PASSWORD=.*/g, `ADMIN_PASSWORD=${newPassword}`);
  } else {
    content += `\nADMIN_PASSWORD=${newPassword}`;
  }
  fs.writeFileSync(envPath, content);
  process.env.ADMIN_PASSWORD = newPassword;
};

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  if (password !== getAdminPassword()) return res.status(401).json({ error: 'Wrong password' });
  res.json({ success: true });
});

// POST /api/admin/change-password
router.post('/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields required' });
  if (currentPassword !== getAdminPassword()) return res.status(401).json({ error: 'Current password is wrong' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });
  updateEnv(newPassword);
  res.json({ success: true });
});

module.exports = router;
