const adminAuth = (req, res, next) => {
  const password = req.headers['x-admin-password'];
  if (!password || password !== process.env.ADMIN_PASSWORD)
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

module.exports = adminAuth;
