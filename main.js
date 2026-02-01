const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { PORT } = require('./src/shared/constants');

let mainWindow;
let serverProcess;

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
