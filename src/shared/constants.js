const path = require('path');
const os = require('os');

const PORT = 9001;

const PHOTOS_DB_PATH = path.join(
  os.homedir(),
  'Pictures/Photos Library.photoslibrary/database/Photos.sqlite'
);

const APP_DATA_DIR = path.join(
  os.homedir(),
  'Library/Application Support/photo-timeline'
);

const APP_DB_PATH = path.join(APP_DATA_DIR, 'locations.db');

// Apple's Core Data epoch: January 1, 2001
const APPLE_EPOCH_OFFSET = 978307200;

module.exports = {
  PORT,
  PHOTOS_DB_PATH,
  APP_DATA_DIR,
  APP_DB_PATH,
  APPLE_EPOCH_OFFSET
};
