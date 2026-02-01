const express = require('express');
const path = require('path');
const { getDatabase } = require('./database');
const { extractPhotos } = require('./photo_extractor');
const { consolidateLocations } = require('./consolidator');
const { getAllSettings, setSetting, getSetting, getSyncStatus } = require('./config');

function startBackendServer(port) {
  const app = express();
  app.use(express.json());

  // Serve frontend static files (no caching during development)
  app.use(express.static(path.join(__dirname, '../frontend'), {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
      res.set('Cache-Control', 'no-store');
    }
  }));

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

  // GET /places - unique places grouped by country > state
  app.get('/places', (req, res) => {
    const db = getDatabase();
    // Get all entries with IDs for edit/delete
    const rows = db.prepare(`
      SELECT id, city, state, country
      FROM consolidated_locations
      ORDER BY country, state, city
    `).all();

    // Group: country > state > unique cities (with IDs for each)
    const byCountry = {};
    const cityKey = (city, state, country) => `${city}|${state}|${country}`;
    const cityIds = {};  // cityKey -> [id, id, ...]

    for (const row of rows) {
      const key = cityKey(row.city, row.state, row.country);
      if (!cityIds[key]) cityIds[key] = [];
      cityIds[key].push(row.id);

      if (!byCountry[row.country]) byCountry[row.country] = {};
      if (!byCountry[row.country][row.state]) byCountry[row.country][row.state] = new Set();
      byCountry[row.country][row.state].add(row.city);
    }

    const countries = Object.entries(byCountry)
      .map(([country, states]) => {
        const stateList = Object.entries(states)
          .map(([state, citySet]) => {
            const cities = [...citySet].sort().map(city => ({
              city,
              ids: cityIds[cityKey(city, state, country)]
            }));
            return { state, cities };
          })
          .sort((a, b) => b.cities.length - a.cities.length);
        const placeCount = stateList.reduce((sum, s) => sum + s.cities.length, 0);
        return { country, states: stateList, placeCount };
      })
      .sort((a, b) => b.placeCount - a.placeCount);

    const uniquePlaces = Object.keys(cityIds).length;
    const totalCountries = countries.length;
    res.json({ countries, totalPlaces: uniquePlaces, totalCountries });
  });

  // PATCH /places/:id - edit a consolidated location's city name
  app.patch('/places/:id', (req, res) => {
    const db = getDatabase();
    const { city } = req.body;
    if (!city || typeof city !== 'string') {
      return res.status(400).json({ error: 'city is required' });
    }
    const result = db.prepare('UPDATE consolidated_locations SET city = ?, updated_at = ? WHERE id = ?')
      .run(city.trim(), Date.now(), req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'not found' });
    }
    res.json({ success: true });
  });

  // DELETE /places/:id - delete a consolidated location entry
  app.delete('/places/:id', (req, res) => {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM consolidated_locations WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'not found' });
    }
    // Update total_locations in sync_metadata
    const count = db.prepare('SELECT COUNT(*) as count FROM consolidated_locations').get();
    db.prepare('UPDATE sync_metadata SET total_locations = ? WHERE id = 1').run(count.count);
    res.json({ success: true });
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
