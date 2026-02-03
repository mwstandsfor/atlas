const { contextBridge, ipcRenderer } = require('electron');

// Expose minimal API to renderer
// Frontend communicates with backend via fetch to localhost:9001
// This preload is kept minimal for future Docker migration
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  
  // Open file dialog for selecting Photos library directory
  selectPhotosLibrary: () => ipcRenderer.invoke('select-photos-library')
});
