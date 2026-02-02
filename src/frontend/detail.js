const $detailPanel = document.getElementById('detail-panel');
const $detailBackdrop = document.getElementById('detail-backdrop');
const $detailClose = document.getElementById('detail-close');
const $detailCity = document.getElementById('detail-city');
const $detailRegion = document.getElementById('detail-region');
const $detailVisits = document.getElementById('detail-visits');
const $detailDays = document.getElementById('detail-days');
const $detailVisitList = document.getElementById('detail-visit-list');
const $detailMapLink = document.getElementById('detail-map-link');

let detailOpen = false;

function openPlaceDetail(city, state, country) {
  // Set header immediately
  $detailCity.textContent = city;
  $detailRegion.textContent = (!state || state === country)
    ? country
    : `${state}, ${country}`;

  // Google Maps link
  const query = `${city}, ${state}, ${country}`;
  $detailMapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  $detailVisits.textContent = '-';
  $detailDays.textContent = '-';
  $detailVisitList.innerHTML = '';

  // Show panel
  $detailPanel.classList.remove('hidden');
  $detailBackdrop.classList.remove('hidden');
  $detailPanel.offsetHeight; // reflow
  $detailPanel.classList.add('visible');
  $detailBackdrop.classList.add('visible');
  detailOpen = true;

  // Fetch data
  const params = new URLSearchParams({ city, state, country });
  fetch(`/place-detail?${params}`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      $detailVisits.textContent = data.totalVisits;
      $detailDays.textContent = data.totalDays;
      renderVisitList(data.visits);
    })
    .catch(err => {
      console.error('Failed to load place detail:', err);
      $detailVisits.textContent = '0';
      $detailDays.textContent = '0';
    });
}

function renderVisitList(visits) {
  $detailVisitList.innerHTML = '';

  for (const visit of visits) {
    const row = document.createElement('div');
    row.className = 'detail-visit';

    const dateEl = document.createElement('span');
    dateEl.className = 'detail-visit-date';
    dateEl.textContent = visit.display_date;

    const yearEl = document.createElement('span');
    yearEl.className = 'detail-visit-year';
    yearEl.textContent = visit.year;
    dateEl.appendChild(yearEl);

    const daysEl = document.createElement('span');
    daysEl.className = 'detail-visit-days';
    daysEl.textContent = visit.days_stayed === 1 ? '1 day' : `${visit.days_stayed} days`;

    row.appendChild(dateEl);
    row.appendChild(daysEl);
    $detailVisitList.appendChild(row);
  }
}

function closePlaceDetail() {
  if (!detailOpen) return;
  detailOpen = false;
  $detailPanel.classList.remove('visible');
  $detailBackdrop.classList.remove('visible');
  setTimeout(() => {
    $detailPanel.classList.add('hidden');
    $detailBackdrop.classList.add('hidden');
  }, 250);
}

$detailClose.addEventListener('click', closePlaceDetail);
$detailBackdrop.addEventListener('click', (e) => {
  if (e.target === $detailBackdrop) closePlaceDetail();
});
