const API = '';

// Default macOS iCloud Photos library path
const DEFAULT_PHOTOS_PATH = '~/Pictures/Photos Library.photoslibrary/database/Photos.sqlite';

// DOM elements (initialized in DOMContentLoaded)
let $settingsBtn;
let $settingsPanel;
let $settingsBackdrop;
let $settingsClose;
let $refreshBtn;
let $fullRefreshBtn;
let $testModeToggle;
let $photoLimit;
let $photoLimitRow;
let $homeLocation;
let $photosLibraryDisplay;
let $photosLibrarySelectBtn;
let $lastSync;
let $photosProcessed;
let $photosWithLocation;
let $totalLocations;

function openSettings() {
  $settingsPanel.classList.remove('hidden');
  $settingsBackdrop.classList.remove('hidden');
  // Trigger reflow for animation
  $settingsPanel.offsetHeight;
  $settingsPanel.classList.add('visible');
  $settingsBackdrop.classList.add('visible');
  loadSettingsData();
}

function closeSettings() {
  $settingsPanel.classList.remove('visible');
  $settingsBackdrop.classList.remove('visible');
  setTimeout(() => {
    $settingsPanel.classList.add('hidden');
    $settingsBackdrop.classList.add('hidden');
  }, 250);
}

// Load settings and sync status
async function loadSettingsData() {
  try {
    const [settingsRes, syncRes, statesRes] = await Promise.all([
      fetch(`${API}/settings`),
      fetch(`${API}/sync-status`),
      fetch(`${API}/locations/states`)
    ]);

    const settings = await settingsRes.json();
    const sync = await syncRes.json();
    const states = await statesRes.json();

    // Populate home location dropdown
    $homeLocation.innerHTML = '<option value="">Not set</option>';
    for (const s of states) {
      const opt = document.createElement('option');
      opt.value = `${s.state}|${s.country}`;
      opt.textContent = s.state === s.country ? s.state : `${s.state}, ${s.country}`;
      $homeLocation.appendChild(opt);
    }

    // Select current home
    if (settings.home_state && settings.home_country) {
      $homeLocation.value = `${settings.home_state}|${settings.home_country}`;
    }

    // Set Photos library path display
    const photosPath = settings.photos_library_path || '';
    if (photosPath) {
      $photosLibraryDisplay.textContent = photosPath;
      $photosLibraryDisplay.title = photosPath;
    } else {
      $photosLibraryDisplay.textContent = 'Default (iCloud Photos)';
      $photosLibraryDisplay.title = DEFAULT_PHOTOS_PATH;
    }

    $testModeToggle.checked = settings.test_mode;
    $photoLimit.value = settings.photo_limit;
    $photoLimitRow.style.display = settings.test_mode ? 'flex' : 'none';

    if (sync.last_sync_time) {
      const date = new Date(sync.last_sync_time);
      $lastSync.textContent = date.toLocaleString();
    } else {
      $lastSync.textContent = 'Never';
    }

    $photosProcessed.textContent = (sync.total_photos_processed || 0).toLocaleString();
    $photosWithLocation.textContent = (sync.photos_with_location || 0).toLocaleString();
    $totalLocations.textContent = (sync.total_locations || 0).toLocaleString();
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// Initialize DOM elements and event listeners
let limitTimeout;

document.addEventListener('DOMContentLoaded', () => {
  $settingsBtn = document.getElementById('settings-btn');
  $settingsPanel = document.getElementById('settings-panel');
  $settingsBackdrop = document.getElementById('settings-backdrop');
  $settingsClose = document.getElementById('settings-close');
  $refreshBtn = document.getElementById('refresh-btn');
  $fullRefreshBtn = document.getElementById('full-refresh-btn');
  $testModeToggle = document.getElementById('test-mode-toggle');
  $photoLimit = document.getElementById('photo-limit');
  $photoLimitRow = document.getElementById('photo-limit-row');
  $homeLocation = document.getElementById('home-location-select');
  $photosLibraryDisplay = document.getElementById('photos-library-display');
  $photosLibrarySelectBtn = document.getElementById('photos-library-select-btn');
  $lastSync = document.getElementById('last-sync');
  $photosProcessed = document.getElementById('photos-processed');
  $photosWithLocation = document.getElementById('photos-with-location');
  $totalLocations = document.getElementById('total-locations');

  // Open/close settings
  if ($settingsBtn) $settingsBtn.addEventListener('click', openSettings);
  if ($settingsClose) $settingsClose.addEventListener('click', closeSettings);
  if ($settingsBackdrop) $settingsBackdrop.addEventListener('click', closeSettings);

  // Home location change
  $homeLocation.addEventListener('change', async () => {
    const val = $homeLocation.value;
    let home_state = '';
    let home_country = '';
    if (val) {
      [home_state, home_country] = val.split('|');
    }

    await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ home_state, home_country })
    });

    if (typeof reloadPlaces === 'function') reloadPlaces();
    if (typeof loadTimeline === 'function') {
      await loadTimeline();
    }
  });

  // Test mode toggle
  $testModeToggle.addEventListener('change', async () => {
    const testMode = $testModeToggle.checked;
    $photoLimitRow.style.display = testMode ? 'flex' : 'none';

    await fetch(`${API}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test_mode: testMode })
    });
  });

  // Photo limit change
  $photoLimit.addEventListener('input', () => {
    clearTimeout(limitTimeout);
    limitTimeout = setTimeout(async () => {
      const limit = parseInt($photoLimit.value, 10);
      if (limit > 0) {
        await fetch(`${API}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo_limit: limit })
        });
      }
    }, 500);
  });

  // Photos library path selection via button
  $photosLibrarySelectBtn.addEventListener('click', async () => {
    if (window.electronAPI && window.electronAPI.selectPhotosLibrary) {
      try {
        const selectedPath = await window.electronAPI.selectPhotosLibrary();
        if (selectedPath) {
          $photosLibraryDisplay.textContent = selectedPath;
          $photosLibraryDisplay.title = selectedPath;

          await fetch(`${API}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photos_library_path: selectedPath })
          });
        }
      } catch (err) {
        console.error('Failed to select Photos library:', err);
      }
    } else {
      const path = prompt('Enter the full path to your Photos.sqlite file:', '');
      if (path) {
        $photosLibraryDisplay.textContent = path;
        $photosLibraryDisplay.title = path;

        await fetch(`${API}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photos_library_path: path })
        });
      }
    }
  });

  // Allow clicking on the path display to reset to default
  $photosLibraryDisplay.addEventListener('click', async () => {
    if (confirm('Reset to default Photos library path?')) {
      $photosLibraryDisplay.textContent = 'Default (iCloud Photos)';
      $photosLibraryDisplay.title = DEFAULT_PHOTOS_PATH;

      await fetch(`${API}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos_library_path: '' })
      });
    }
  });

  // Refresh button (incremental)
  $refreshBtn.addEventListener('click', async () => {
    $refreshBtn.disabled = true;
    $refreshBtn.classList.add('refreshing');

    try {
      const res = await fetch(`${API}/refresh`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadSettingsData();
        if (typeof reloadPlaces === 'function') reloadPlaces();
        if (typeof loadTimeline === 'function') {
          await loadTimeline();
        }
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      $refreshBtn.disabled = false;
      $refreshBtn.classList.remove('refreshing');
    }
  });

  // Full refresh button
  $fullRefreshBtn.addEventListener('click', async () => {
    $fullRefreshBtn.disabled = true;
    $fullRefreshBtn.classList.add('refreshing');

    try {
      const res = await fetch(`${API}/refresh?full=true`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await loadSettingsData();
        if (typeof reloadPlaces === 'function') reloadPlaces();
        if (typeof loadTimeline === 'function') {
          await loadTimeline();
        }
      }
    } catch (err) {
      console.error('Full refresh failed:', err);
    } finally {
      $fullRefreshBtn.disabled = false;
      $fullRefreshBtn.classList.remove('refreshing');
    }
  });
});
