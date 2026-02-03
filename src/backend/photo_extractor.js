const Database = require('better-sqlite3');
const bplist = require('bplist-parser');
const path = require('path');
const os = require('os');
const fs = require('fs');
const { PHOTOS_DB_PATH, APPLE_EPOCH_OFFSET } = require('../shared/constants');
const { getDatabase } = require('./database');
const { getSetting } = require('./config');

const PHOTOS_QUERY = `
  SELECT
    a.ZUUID as uuid,
    a.ZDATECREATED as date_created,
    b.ZREVERSELOCATIONDATA as location_data
  FROM ZASSET a
  JOIN ZADDITIONALASSETATTRIBUTES b ON b.ZASSET = a.Z_PK
  WHERE a.ZTRASHEDSTATE = 0
  ORDER BY a.ZDATECREATED DESC
`;

function openPhotosDatabase() {
  // Check if user has configured a custom Photos library path
  const customPhotosPath = getSetting('photos_library_path');
  
  let photosDbPath;
  if (customPhotosPath && fs.existsSync(customPhotosPath)) {
    photosDbPath = customPhotosPath;
  } else {
    // Use default path if no custom path is set or it doesn't exist
    photosDbPath = PHOTOS_DB_PATH;
  }
  
  if (!fs.existsSync(photosDbPath)) {
    throw new Error(`Photos database not found at: ${photosDbPath}`);
  }
  
  return new Database(photosDbPath, { readonly: true });
}

function parseLocationBlob(blob) {
  if (!blob) return null;

  try {
    const parsed = bplist.parseBuffer(blob);
    const objects = parsed[0]['$objects'];

    // Extract place info entries
    const places = [];
    for (const obj of objects) {
      if (obj && typeof obj === 'object' && obj.placeType !== undefined && obj.name !== undefined) {
        const name = objects[obj.name.UID];
        const placeType = objects[obj.placeType.UID];
        if (typeof name === 'string' && typeof placeType === 'number') {
          places.push({ name, placeType, area: obj.area || 0 });
        }
      }
    }

    if (places.length === 0) return null;

    // placeType hierarchy:
    // 1 = country, 2 = state/prefecture, 3 = county/gun
    // 4 = city/ward/town, 6 = neighborhood, 8 = POI/island
    // 12 = street, 17 = address
    const country = places.find(p => p.placeType === 1);

    // For city: prefer type 4 (city/town/ward) as it gives the best
    // town-level granularity (e.g. "Kusatsu" not "Gunma", "Shibuya" not "Tokyo").
    // Fall back to type 6 (neighborhood), then type 2 (state/prefecture).
    const cityLevel = places
      .filter(p => p.placeType === 4)
      .sort((a, b) => a.area - b.area);

    const neighborhoodLevel = places
      .filter(p => p.placeType === 6)
      .sort((a, b) => a.area - b.area);

    const stateLevel = places
      .filter(p => p.placeType === 2)
      .sort((a, b) => a.area - b.area);

    const city = cityLevel[0] || neighborhoodLevel[0] || stateLevel[0];
    const state = stateLevel[0];

    if (!city || !country) return null;

    return {
      city: city.name,
      state: state ? state.name : city.name,
      country: country.name
    };
  } catch (e) {
    return null;
  }
}

function coreDataTimestampToDate(timestamp) {
  const unixTimestamp = (timestamp + APPLE_EPOCH_OFFSET) * 1000;
  return new Date(unixTimestamp);
}

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function extractPhotos(testMode = false, photoLimit = 100, fullRefresh = false) {
  const photosDb = openPhotosDatabase();
  const appDb = getDatabase();

  try {
    // Get all photos from Photos.app
    let allPhotos = photosDb.prepare(PHOTOS_QUERY).all();

    if (testMode) {
      allPhotos = allPhotos.slice(0, photoLimit);
    }

    if (fullRefresh) {
      // Clear existing data for full refresh
      appDb.exec(`
        DELETE FROM raw_locations;
        DELETE FROM processed_photos;
        DELETE FROM consolidated_locations;
      `);
    }

    // Get already processed UUIDs
    const processedSet = new Set(
      appDb.prepare('SELECT photo_uuid FROM processed_photos').all()
        .map(row => row.photo_uuid)
    );

    // Filter to new photos only
    const newPhotos = allPhotos.filter(p => !processedSet.has(p.uuid));

    if (newPhotos.length === 0) {
      return { processedCount: 0, withLocation: 0, total: allPhotos.length };
    }

    // Batch insert using transactions
    const insertProcessed = appDb.prepare(`
      INSERT OR IGNORE INTO processed_photos (photo_uuid, processed_at, has_location)
      VALUES (?, ?, ?)
    `);

    const insertLocation = appDb.prepare(`
      INSERT INTO raw_locations (photo_uuid, timestamp, city, state, country, date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    let withLocation = 0;
    const now = Date.now();

    const batchInsert = appDb.transaction((photos) => {
      for (const photo of photos) {
        const location = parseLocationBlob(photo.location_data);
        const hasLocation = location !== null;

        // Insert processed record first (foreign key parent)
        insertProcessed.run(photo.uuid, now, hasLocation ? 1 : 0);

        if (hasLocation) {
          withLocation++;
          const date = coreDataTimestampToDate(photo.date_created);
          insertLocation.run(
            photo.uuid,
            photo.date_created,
            location.city,
            location.state,
            location.country,
            formatDateString(date),
            now
          );
        }
      }
    });

    batchInsert(newPhotos);

    // Update sync metadata
    const stats = appDb.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN has_location = 1 THEN 1 ELSE 0 END) as with_location
      FROM processed_photos
    `).get();

    const locationCount = appDb.prepare('SELECT COUNT(*) as count FROM consolidated_locations').get();

    appDb.prepare(`
      UPDATE sync_metadata SET
        last_sync_time = ?,
        total_photos_processed = ?,
        photos_with_location = ?,
        total_locations = ?
      WHERE id = 1
    `).run(now, stats.total, stats.with_location, locationCount.count);

    return {
      processedCount: newPhotos.length,
      withLocation,
      total: allPhotos.length
    };
  } finally {
    photosDb.close();
  }
}

module.exports = { extractPhotos, parseLocationBlob };
