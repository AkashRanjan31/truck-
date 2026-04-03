const express = require('express');
const router = express.Router();
const Driver = require('../models/Driver');

// In-memory SOS store
const sosStore = {};

// Haversine formula — returns distance in km between two lat/lng points
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// POST /api/emergency
router.post('/', async (req, res) => {
  try {
    const { driverId, driverName, truckNumber, phone, lat, lng, address } = req.body;
    if (!lat || !lng || !driverId) return res.status(400).json({ error: 'driverId, lat and lng required' });

    const sosLat = parseFloat(lat);
    const sosLng = parseFloat(lng);

    console.log(`[SOS] Triggered by ${driverName} at lat=${sosLat}, lng=${sosLng}`);

    // Step 1: Try MongoDB $near (requires 2dsphere index and valid coordinates)
    let nearbyDrivers = [];
    try {
      nearbyDrivers = await Driver.find({
        _id: { $ne: driverId },
        isActive: true,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [sosLng, sosLat] },
            $maxDistance: 5000,
          },
        },
      }).select('_id name phone truckNumber location updatedAt');
    } catch (geoErr) {
      console.warn('[SOS] $near query failed, falling back to Haversine:', geoErr.message);
    }

    // Step 2: Haversine fallback — fetch ALL active drivers with a real location and filter manually
    // This handles cases where drivers have [0,0] default or $near fails
    const allDrivers = await Driver.find({
      _id: { $ne: driverId },
      isActive: true,
      locationSet: true,
    }).select('_id name phone truckNumber location lastLocationUpdate');

    console.log(`[SOS] Active drivers with real location in DB: ${allDrivers.length}`);
    allDrivers.forEach((d) => {
      const dLng = d.location?.coordinates?.[0];
      const dLat = d.location?.coordinates?.[1];
      console.log(`[SOS] Driver ${d.name} (${d.truckNumber}) — lat=${dLat}, lng=${dLng}, lastUpdate=${d.lastLocationUpdate}`);
    });

    // Filter by Haversine distance ≤ 5km
    const haversineNearby = allDrivers.filter((d) => {
      const dLng = d.location?.coordinates?.[0];
      const dLat = d.location?.coordinates?.[1];
      if (!dLat || !dLng || (dLat === 0 && dLng === 0)) {
        console.log(`[SOS] Driver ${d.name} skipped — coordinates are zero`);
        return false;
      }
      const dist = haversineKm(sosLat, sosLng, dLat, dLng);
      console.log(`[SOS] Driver ${d.name} — distance: ${dist.toFixed(3)}km — ${dist <= 5 ? 'WITHIN' : 'outside'} 5km`);
      return dist <= 5;
    });

    // Merge $near results with Haversine results (deduplicate by _id)
    const nearbyMap = new Map();
    [...nearbyDrivers, ...haversineNearby].forEach((d) => nearbyMap.set(d._id.toString(), d));
    const finalNearby = Array.from(nearbyMap.values());

    console.log(`[SOS] $near found: ${nearbyDrivers.length}, Haversine found: ${haversineNearby.length}, Final unique: ${finalNearby.length}`);

    const sosId = require('crypto').randomUUID();
    const payload = {
      sosId,
      driverId,
      driverName,
      truckNumber,
      phone,
      lat: sosLat,
      lng: sosLng,
      address,
      timestamp: new Date().toISOString(),
      nearbyCount: finalNearby.length,
      nearbyDrivers: finalNearby.map((d) => ({
        _id: d._id,
        name: d.name,
        truckNumber: d.truckNumber,
        distance: (() => {
          const dLat = d.location?.coordinates?.[1];
          const dLng = d.location?.coordinates?.[0];
          return (dLat && dLng) ? haversineKm(sosLat, sosLng, dLat, dLng).toFixed(2) : null;
        })(),
      })),
      acknowledgedBy: [],
    };

    sosStore[sosId] = payload;

    const io = req.app.get('io');
    io.emit('emergency_alert', payload);

    finalNearby.forEach((d) => {
      io.to(`driver_${d._id}`).emit('sos_nearby', payload);
    });

    res.json({
      success: true,
      sosId,
      notified: finalNearby.length,
      debug: {
        sosLocation: { lat: sosLat, lng: sosLng },
        totalActiveDriversWithLocation: allDrivers.length,
        nearByGeoQuery: nearbyDrivers.length,
        nearByHaversine: haversineNearby.length,
        finalNotified: finalNearby.length,
        drivers: allDrivers.map((d) => {
          const dLat = d.location?.coordinates?.[1];
          const dLng = d.location?.coordinates?.[0];
          const dist = (dLat && dLng) ? haversineKm(sosLat, sosLng, dLat, dLng).toFixed(3) : null;
          return {
            name: d.name,
            truckNumber: d.truckNumber,
            lat: dLat,
            lng: dLng,
            lastLocationUpdate: d.lastLocationUpdate,
            distanceKm: dist,
            withinRadius: dist !== null && parseFloat(dist) <= 5,
          };
        }),
      },
    });
  } catch (err) {
    console.error('[SOS] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/emergency/active
router.get('/active', (req, res) => {
  const active = Object.values(sosStore)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 50);
  res.json(active);
});

// PATCH /api/emergency/:sosId/acknowledge
router.patch('/:sosId/acknowledge', (req, res) => {
  const { sosId } = req.params;
  const { driverId, driverName, truckNumber } = req.body;
  const sos = sosStore[sosId];
  if (!sos) return res.status(404).json({ error: 'SOS not found' });

  const already = sos.acknowledgedBy.find((a) => a.driverId === driverId);
  if (!already) {
    sos.acknowledgedBy.push({ driverId, driverName, truckNumber, acknowledgedAt: new Date().toISOString() });
    const io = req.app.get('io');
    io.emit('sos_acknowledged', { sosId, driverId, driverName, truckNumber, acknowledgedAt: new Date().toISOString() });
  }

  res.json({ success: true, acknowledgedBy: sos.acknowledgedBy });
});

// PATCH /api/emergency/:sosId/resolve
router.patch('/:sosId/resolve', (req, res) => {
  const sos = sosStore[req.params.sosId];
  if (!sos) return res.status(404).json({ error: 'SOS not found' });
  sos.status = 'resolved';
  sos.resolvedAt = new Date().toISOString();
  const io = req.app.get('io');
  io.emit('sos_resolved', { sosId: sos.sosId, resolvedAt: sos.resolvedAt });
  res.json({ success: true });
});

module.exports = router;
