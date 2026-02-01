const API = '';

const $settingsBtn = document.getElementById('settings-btn');
const $settingsPanel = document.getElementById('settings-panel');
const $settingsBackdrop = document.getElementById('settings-backdrop');
const $settingsClose = document.getElementById('settings-close');
const $refreshBtn = document.getElementById('refresh-btn');
const $fullRefreshBtn = document.getElementById('full-refresh-btn');
const $testModeToggle = document.getElementById('test-mode-toggle');
const $photoLimit = document.getElementById('photo-limit');
const $photoLimitRow = document.getElementById('photo-limit-row');
const $homeLocation = document.getElementById('home-location-select');
const $lastSync = document.getElementById('last-sync');
const $photosProcessed = document.getElementById('photos-processed');
const $photosWithLocation = document.getElementById('photos-with-location');
const $totalLocations = document.getElementById('total-locations');

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

$settingsBtn.addEventListener('click', openSettings);
$settingsClose.addEventListener('click', closeSettings);
$settingsBackdrop.addEventListener('click', closeSettings);

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

  // Reload timeline since consolidation changed
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
let limitTimeout;
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

// Refresh button (incremental)
$refreshBtn.addEventListener('click', async () => {
  $refreshBtn.disabled = true;
  $refreshBtn.classList.add('refreshing');

  try {
    const res = await fetch(`${API}/refresh`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await loadSettingsData();
      // Reload timeline in main app
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
