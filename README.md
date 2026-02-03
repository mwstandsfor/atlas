# Photo Timeline (Atlas)

Photo Timeline is a desktop application that extracts location data from Apple Photos.app and displays it in an organized timeline format.

## Features

- Extracts geolocation data from Photos.app photos
- Creates a timeline of where you've been over time
- Organizes locations by country and state
- Allows editing/deleting location entries
- Custom Photos library path configuration
- Test mode for limited processing
- Full rebuild capability

## Prerequisites

- macOS (requires Photos.app)
- Node.js 14 or higher
- Electron 33.4.11 or higher

## Installation

### Option 1: Using npm (recommended)

```bash
# Clone the repository
git clone https://github.com/mwstandsfor/atlas.git
cd atlas

# Install dependencies
npm install

# Install Electron rebuild (required for some native modules)
npx electron-rebuild
```

### Option 2: Using the packaged application

Download the latest release from the GitHub repository and run the pre-built application.

## Running the Application

### Development Mode

```bash
# Start in development mode with hot reloading
npm run dev
```

### Production Mode

```bash
# Start in production mode
npm start
```

### Website Mode (Browser)

```bash
# Start the backend server only
npm run server

# Then open index.html in a browser
# Note: This mode requires Photos.app to be installed on the host machine
```

## Configuration

### Custom Photos Library Path

If your Photos library is stored in a non-standard location, you can configure it:

1. Open the Settings panel (gear icon in the top right)
2. Enter your custom Photos library path in the "Photos Library Path" field
3. The application will use this path for photo extraction

### Other Settings

- **Test Mode**: Limits processing to a small number of photos for testing
- **Photo Limit**: Sets the maximum number of photos to process in test mode
- **Home Location**: Set your home location for grouping purposes

## Project Structure

```
.
├── main.js                 # Electron main process
├── package.json           # Application metadata and scripts
├── preload.js               # Electron preload script
├── src/
│   ├── shared/             # Shared constants and utilities
│   │   └── constants.js     # Application constants (including Photos DB path)
│   ├── frontend/            # Frontend code
│   │   ├── app.js         # Main frontend logic
│   │   ├── detail.js      # Place detail panel logic
│   │   ├── index.html     # Main HTML structure
│   │   ├── places.js      # Places view logic
│   │   ├── settings.js    # Settings panel logic
│   │   └── style.css      # CSS styles
│   └── backend/            # Backend code
│       ├── api.js         # API endpoints
│       ├── config.js      # Configuration management
│       ├── consolidator.js# Location consolidation logic
│       ├── database.js    # Database schema and operations
│       ├── photo_extractor.js# Photos library extraction logic
│       └── server.js      # Server setup
└── .gitignore             # Git ignore file
```

## How It Works

1. The application accesses Photos.app's SQLite database (`Photos.sqlite`) on macOS
2. It extracts geolocation metadata from photos (which Apple embeds in the photo's metadata)
3. Processes this data into meaningful location visits
4. Stores processed data in a local SQLite database
5. Presents the timeline in an organized interface showing where you've been over time

## Troubleshooting

### Photos Library Not Found

If the application cannot find your Photos library:
1. Check that the Photos app is installed and working
2. Verify the default path exists: `~/Pictures/Photos Library.photoslibrary/database/Photos.sqlite`
3. Use the Settings panel to configure a custom Photos library path if needed

### Permission Issues

On macOS, you may need to grant the application permission to access:
- Photos.app database files
- Application Support directory

### Development Issues

If you encounter issues with native modules:
```bash
npx electron-rebuild
```

## License

ISC License

## Contributing

Contributions are welcome! Please submit issues and pull requests to the GitHub repository.
