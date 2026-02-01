const { getDatabase } = require('./database');

const DEFAULTS = {
  test_mode: 'false',
  photo_limit: '100',
  home_state: '',
  home_country: ''
};

function getSetting(key) {
  const db = getDatabase();
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  return row ? row.value : (DEFAULTS[key] || null);
}

function setSetting(key, value) {
  const db = getDatabase();
  db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, String(value), Date.now());
}

function getAllSettings() {
  return {
    test_mode: getSetting('test_mode') === 'true',
    photo_limit: parseInt(getSetting('photo_limit'), 10) || 100,
    home_state: getSetting('home_state') || '',
    home_country: getSetting('home_country') || ''
  };
}

function getSyncStatus() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM sync_metadata WHERE id = 1').get();
}

module.exports = { getSetting, setSetting, getAllSettings, getSyncStatus };
