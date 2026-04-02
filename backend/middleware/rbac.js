const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');

const JWT_SECRET = process.env.JWT_SECRET || 'truck_secret_key';

// Attach user/driver to req based on JWT
const authenticate = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role === 'driver') {
      const driver = await Driver.findById(decoded.id).populate('homeState currentState');
      if (!driver || !driver.isActive) return res.status(401).json({ error: 'Invalid driver' });
      req.driver = driver;
      req.user = { _id: driver._id, role: 'driver' };
    } else {
      const user = await User.findById(decoded.id).populate('assignedState');
      if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid user' });
      req.user = user;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Role-based access: pass allowed roles
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  next();
};

// State-level filter: attach stateFilter to req for DB queries
const stateFilter = (req, res, next) => {
  if (req.user.role === 'super_admin') {
    req.stateFilter = {}; // no restriction
  } else if (req.user.role === 'state_admin') {
    req.stateFilter = { incidentState: req.user.assignedState._id };
  } else {
    req.stateFilter = { driverId: req.user._id };
  }
  next();
};

const generateToken = (id, role) =>
  jwt.sign({ id, role }, JWT_SECRET, { expiresIn: '30d' });

module.exports = { authenticate, authorize, stateFilter, generateToken };
