const API_BASE = '';
const PAGE_SIZE = 200;

let currentOffset = 0;
let isLoading = false;
let hasMore = true;
let allLocations = [];

const $loading = document.getElementById('loading');
const $emptyState = document.getElementById('empty-state');
const $timelineContainer = document.getElementById('timeline-container');
const $timeline = document.getElementById('timeline');
const $initialRefreshBtn = document.getElementById('initial-refresh-btn');

async function fetchTimeline(offset = 0, limit = PAGE_SIZE) {
  const res = await fetch(`${API_BASE}/timeline?limit=${limit}&offset=${offset}`);
  return res.json();
}

function showView(view) {
  $loading.classList.add('hidden');
  $emptyState.classList.add('hidden');
  $timelineContainer.classList.add('hidden');

  if (view === 'loading') $loading.classList.remove('hidden');
  else if (view === 'empty') $emptyState.classList.remove('hidden');
  else if (view === 'timeline') $timelineContainer.classList.remove('hidden');
}

function renderTimeline(locations) {
  $timeline.innerHTML = '';

  if (locations.length === 0) {
    showView('empty');
    return;
  }

  showView('timeline');

  let lastYear = null;
  let lastMonth = null;

  // Locations arrive newest-first from API.
  // With flex-direction: row-reverse, first DOM child appears rightmost (newest).
  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    const year = loc.year;
    const month = loc.month;
    const monthName = loc.month_name;

    // Insert year/month headers when they change
    if (year !== lastYear) {
      const header = document.createElement('div');
      header.className = 'timeline-header';
      header.innerHTML = `
        <span class="year-label">${year}</span>
        <span class="month-label">${monthName}</span>
      `;
      $timeline.appendChild(header);
      lastYear = year;
      lastMonth = month;
    } else if (month !== lastMonth) {
      const header = document.createElement('div');
      header.className = 'timeline-month-header';
      header.innerHTML = `<span class="month-label">${monthName}</span>`;
      $timeline.appendChild(header);
      lastMonth = month;
    }

    // Show "City" when city==state (e.g. "Tokyo"), or "City, State" when
    // the city is a specific town within a larger state (e.g. "Kusatsu, Gunma")
    const cityLabel = (!loc.state || loc.city === loc.state)
      ? escapeHtml(loc.city)
      : `${escapeHtml(loc.city)}, ${escapeHtml(loc.state)}`;

    const entry = document.createElement('div');
    entry.className = 'timeline-entry';
    entry.innerHTML = `
      <div class="dot"></div>
      <div class="location-info">
        <div class="city">${cityLabel}</div>
        <div class="country">${escapeHtml(loc.country)}</div>
        <div class="date-range">${escapeHtml(loc.display_date)}</div>
      </div>
    `;
    $timeline.appendChild(entry);
  }

  // Scroll sentinel for infinite scroll
  const sentinel = document.createElement('div');
  sentinel.className = 'scroll-sentinel';
  sentinel.id = 'scroll-sentinel';
  $timeline.appendChild(sentinel);

  setupInfiniteScroll();

  // Scroll to rightmost (newest) on initial load
  if (currentOffset === 0) {
    $timelineContainer.scrollLeft = $timelineContainer.scrollWidth;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function setupInfiniteScroll() {
  const sentinel = document.getElementById('scroll-sentinel');
  if (!sentinel || !hasMore) return;

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore && !isLoading) {
      loadMore();
    }
  }, {
    root: $timelineContainer,
    rootMargin: '400px'
  });

  observer.observe(sentinel);
}

async function loadMore() {
  if (isLoading || !hasMore) return;
  isLoading = true;
  currentOffset += PAGE_SIZE;

  try {
    const data = await fetchTimeline(currentOffset);
    hasMore = data.hasMore;

    if (data.locations.length > 0) {
      // Save scroll position before re-render
      const scrollLeft = $timelineContainer.scrollLeft;
      const oldScrollWidth = $timelineContainer.scrollWidth;

      allLocations = allLocations.concat(data.locations);
      renderTimeline(allLocations);

      // Restore scroll position (new content added to the left)
      const newScrollWidth = $timelineContainer.scrollWidth;
      $timelineContainer.scrollLeft = scrollLeft + (newScrollWidth - oldScrollWidth);
    }
  } catch (err) {
    console.error('Failed to load more:', err);
  } finally {
    isLoading = false;
  }
}

async function loadTimeline() {
  showView('loading');
  currentOffset = 0;
  allLocations = [];
  hasMore = true;

  try {
    const data = await fetchTimeline(0);
    hasMore = data.hasMore;
    allLocations = data.locations;
    renderTimeline(allLocations);
  } catch (err) {
    console.error('Failed to load timeline:', err);
    showView('empty');
  }
}

// Handle initial refresh button
$initialRefreshBtn.addEventListener('click', async () => {
  $initialRefreshBtn.disabled = true;
  $initialRefreshBtn.textContent = 'Syncing...';

  try {
    const res = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      await loadTimeline();
    }
  } catch (err) {
    console.error('Refresh failed:', err);
  } finally {
    $initialRefreshBtn.disabled = false;
    $initialRefreshBtn.textContent = 'Sync Photos';
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTimeline();
});
