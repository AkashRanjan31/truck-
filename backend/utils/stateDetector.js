const State = require('../models/State');

const detectState = async (lat, lng) => {
  if (!lat || !lng) return null;
  return await State.findOne({
    boundary: {
      $geoIntersects: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      },
    },
  });
};

module.exports = { detectState };
