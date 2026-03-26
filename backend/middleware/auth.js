const Driver = require('../models/Driver');

const auth = async (req, res, next) => {
  const driverId = req.headers['x-driver-id'];
  if (!driverId) return res.status(401).json({ error: 'Driver ID required' });

  try {
    const driver = await Driver.findById(driverId);
    if (!driver) return res.status(401).json({ error: 'Invalid driver' });
    req.driver = driver;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid driver ID format' });
  }
};

module.exports = auth;
