const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const { PORT } = require('./src/shared/constants');

let mainWindow;
let serverProcess;

// Default iCloud Photos library path for macOS
const DEFAULT_PHOTOS_LIBRARY_PATH = path.join(
  os.homedir(),
  'Pictures/Photos Library.photoslibrary/database/Photos.sqlite'
);

function findSystemNode() {
  // Find the system Node.js (not Electron's bundled one)
  try {
    const nodePath = execSync('which node', { encoding: 'utf8' }).trim();
    return nodePath;
  } catch {
    return 'node';
  }
}

function startBackend() {
  return new Promise((resolve) => {
    const nodePath = findSystemNode();
    const serverScript = path.join(__dirname, 'src/backend/server.js');

    serverProcess = spawn(nodePath, [serverScript], {
      env: {
        ...process.env,
        PORT: String(PORT),
        ELECTRON_RUN_AS_NODE: undefined
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    serverProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[server]', msg.trim());
      if (msg.includes('running on')) {
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('[server]', data.toString().trim());
    });

    serverProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      resolve(); // Don't block window creation
    });

    // Timeout fallback
    setTimeout(resolve, 5000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler for selecting Photos library directory
ipcMain.handle('select-photos-library', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Photos Library',
    defaultPath: path.join(os.homedir(), 'Pictures'),
    properties: ['openDirectory'],
    filters: [
      { name: 'Photos Libraries', extensions: ['photoslibrary'] }
    ],
    buttonLabel: 'Select Library'
  });

  if (!result.canceled && result.filePaths.length > 0) {
    // Construct the path to the Photos.sqlite database
    const libraryPath = result.filePaths[0];
    const databasePath = path.join(libraryPath, 'database/Photos.sqlite');
    return databasePath;
  }
  
  return null;
});

app.whenReady().then(async () => {
  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
});

