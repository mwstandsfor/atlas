const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { APP_DATA_DIR, APP_DB_PATH } = require('../shared/constants');

let db = null;

function getDatabase() {
  if (db) return db;

  // Ensure data directory exists
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });

  db = new Database(APP_DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  initializeSchema();
  return db;
}

function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS processed_photos (
      photo_uuid TEXT PRIMARY KEY,
      processed_at INTEGER,
      has_location INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS raw_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_uuid TEXT,
      timestamp INTEGER,
      city TEXT,
      state TEXT,
      country TEXT,
      date TEXT,
      created_at INTEGER,
      FOREIGN KEY (photo_uuid) REFERENCES processed_photos(photo_uuid)
    );

    CREATE TABLE IF NOT EXISTS consolidated_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT,
      state TEXT,
      country TEXT,
      start_date TEXT,
      end_date TEXT,
      year INTEGER,
      month INTEGER,
      month_name TEXT,
      display_date TEXT,
      days_stayed INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      last_sync_time INTEGER,
      total_photos_processed INTEGER DEFAULT 0,
      total_locations INTEGER DEFAULT 0,
      photos_with_location INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_raw_locations_date ON raw_locations(date);
    CREATE INDEX IF NOT EXISTS idx_consolidated_start ON consolidated_locations(start_date);
    CREATE INDEX IF NOT EXISTS idx_consolidated_year_month ON consolidated_locations(year, month);

    INSERT OR IGNORE INTO sync_metadata (id, last_sync_time, total_photos_processed, total_locations, photos_with_location)
    VALUES (1, NULL, 0, 0, 0);
  `);
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDatabase, closeDatabase };
