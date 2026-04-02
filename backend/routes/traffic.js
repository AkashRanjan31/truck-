const express = require('express');
const router = express.Router();
const Report = require('../models/Report');

const GRID_SIZE = 0.009; // ~1km in degrees

// GET /api/traffic/zones
// Groups active reports into ~1km grid cells, returns zone color based on density
router.get('/zones', async (req, res) => {
  try {
    const { lat, lng, radius = 50000 } = req.query;

    let query = { status: 'active' };
    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const reports = await Report.find(query).select('location type upvotes createdAt').limit(500);

    // Cluster reports into grid cells
    const cells = {};
    reports.forEach((r) => {
      const [lng, lat] = r.location.coordinates;
      const cellLat = Math.round(lat / GRID_SIZE) * GRID_SIZE;
      const cellLng = Math.round(lng / GRID_SIZE) * GRID_SIZE;
      const key = `${cellLat.toFixed(4)},${cellLng.toFixed(4)}`;
      if (!cells[key]) cells[key] = { lat: cellLat, lng: cellLng, count: 0, types: [] };
      cells[key].count += 1 + r.upvotes; // upvotes amplify congestion weight
      cells[key].types.push(r.type);
    });

    // Convert to zones with color
    const zones = Object.values(cells).map((cell) => {
      let color, level;
      if (cell.count >= 5) { color = '#e74c3c'; level = 'Heavy'; }
      else if (cell.count >= 3) { color = '#e67e22'; level = 'Moderate'; }
      else { color = '#2ecc71'; level = 'Light'; }

      return {
        lat: cell.lat,
        lng: cell.lng,
        count: cell.count,
        color,
        level,
        types: [...new Set(cell.types)],
      };
    });

    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
