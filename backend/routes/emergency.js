const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

// POST /api/emergency — trigger SOS, notify admin + nearby drivers within 5km
router.post('/', async (req, res) => {
  try {
    const { driverId, driverName, truckNumber, phone, lat, lng, address } = req.body;
    if (!lat || !lng || !driverId) return res.status(400).json({ error: 'driverId, lat and lng required' });

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // Find all drivers within 5km excluding the sender
    const nearbyDrivers = await Driver.find({
      _id: { $ne: driverId },
      isActive: true,
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parsedLng, parsedLat] },
          $maxDistance: 5000, // 5km
        },
      },
    }).select('_id name');

    const payload = {
      driverId,
      driverName,
      truckNumber,
      phone,
      lat: parsedLat,
      lng: parsedLng,
      address,
      timestamp: new Date().toISOString(),
      nearbyCount: nearbyDrivers.length,
    };

    const io = req.app.get('io');

    // Broadcast to admin dashboard
    io.emit('emergency_alert', payload);

    // Send targeted SOS to each nearby driver's socket room
    nearbyDrivers.forEach((d) => {
      io.to(`driver_${d._id}`).emit('sos_nearby', payload);
    });

    res.json({ success: true, notified: nearbyDrivers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
