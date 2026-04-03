/**
 * Migration: backfill_location_set
 *
 * Marks existing drivers who already have valid GPS coordinates with:
 *   locationSet: true
 *   lastLocationUpdate: <now>
 *
 * Safe to run against production — only touches drivers whose
 * location.coordinates are both non-zero and where locationSet is not
 * already true (idempotent).
 *
 * Run once:
 *   node migrations/backfill_location_set.js
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI is not set in .env');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅  Connected to MongoDB:', mongoose.connection.host);

  const collection = mongoose.connection.collection('drivers');

  // Confirm the collection exists
  const collections = await mongoose.connection.db
    .listCollections({ name: 'drivers' })
    .toArray();

  if (collections.length === 0) {
    console.error('❌  Collection "drivers" does not exist. Aborting.');
    process.exit(1);
  }

  // Dry-run count first so we know what will be touched
  const toUpdate = await collection.countDocuments({
    'location.coordinates.0': { $ne: 0 },
    'location.coordinates.1': { $ne: 0 },
    locationSet: { $ne: true },   // skip already-migrated docs (idempotent)
  });

  console.log(`ℹ️   Drivers with valid coordinates not yet backfilled: ${toUpdate}`);

  if (toUpdate === 0) {
    console.log('✅  Nothing to update. Migration already applied or no eligible drivers.');
    return;
  }

  const now = new Date();
  const result = await collection.updateMany(
    {
      'location.coordinates.0': { $ne: 0 },
      'location.coordinates.1': { $ne: 0 },
      locationSet: { $ne: true },
    },
    {
      $set: {
        locationSet: true,
        lastLocationUpdate: now,
      },
    }
  );

  console.log(`✅  Migration complete.`);
  console.log(`    Matched : ${result.matchedCount}`);
  console.log(`    Modified: ${result.modifiedCount}`);
  console.log(`    Timestamp applied: ${now.toISOString()}`);
}

run()
  .catch((err) => {
    console.error('❌  Migration failed:', err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());
