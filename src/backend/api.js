const express = require('express');
const path = require('path');
const { getDatabase } = require('./database');
const { extractPhotos } = require('./photo_extractor');
const { consolidateLocations } = require('./consolidator');
const { getAllSettings, setSetting, getSetting, getSyncStatus } = require('./config');

function startBackendServer(port) {
  const app = express();
  app.use(express.json());

  // Serve frontend static files
  app.use(express.static(path.join(__dirname, '../frontend')));

  // GET /timeline - paginated consolidated locations (reverse chronological)
  app.get('/timeline', (req, res) => {
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;

    const db = getDatabase();

    const locations = db.prepare(`
      SELECT * FROM consolidated_locations
      ORDER BY start_date DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM consolidated_locations').get();

    res.json({
      locations,
      total: total.count,
      limit,
      offset,
      hasMore: offset + limit < total.count
    });
  });

  // POST /refresh - extract photos and consolidate
  app.post('/refresh', async (req, res) => {
    try {
      const fullRefresh = req.query.full === 'true';
      const settings = getAllSettings();

      const result = extractPhotos(
        settings.test_mode,
        settings.photo_limit,
        fullRefresh
      );

      consolidateLocations();

      const syncStatus = getSyncStatus();

      res.json({
        success: true,
        ...result,
        syncStatus
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // GET /sync-status
  app.get('/sync-status', (req, res) => {
    const syncStatus = getSyncStatus();
    res.json(syncStatus);
  });

  // GET /settings
  app.get('/settings', (req, res) => {
    res.json(getAllSettings());
  });

  // POST /settings
  app.post('/settings', (req, res) => {
    const { test_mode, photo_limit, home_state, home_country } = req.body;

    if (test_mode !== undefined) {
      setSetting('test_mode', String(test_mode));
    }
    if (photo_limit !== undefined) {
      setSetting('photo_limit', String(photo_limit));
    }
    if (home_state !== undefined) {
      setSetting('home_state', String(home_state));
    }
    if (home_country !== undefined) {
      setSetting('home_country', String(home_country));
    }

    // If home location changed, re-consolidate to apply new grouping
    if (home_state !== undefined || home_country !== undefined) {
      consolidateLocations();
    }

    res.json(getAllSettings());
  });

  // GET /locations/states - unique state+country combos for home location picker
  app.get('/locations/states', (req, res) => {
    const db = getDatabase();
    const states = db.prepare(`
      SELECT DISTINCT state, country
      FROM raw_locations
      ORDER BY country, state
    `).all();
    res.json(states);
  });

  return new Promise((resolve) => {
    const host = '0.0.0.0';
    const server = app.listen(port, host, () => {
      console.log(`Backend server running on http://${host}:${port}`);
      resolve(server);
    });
  });
}

module.exports = startBackendServer;
