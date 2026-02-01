const $placesContainer = document.getElementById('places-container');
const $places = document.getElementById('places');

let placesLoaded = false;
let placesData = null;

// Context menu state
let $contextMenu = null;
let contextTarget = null;
let longPressTimer = null;

function initContextMenu() {
  if ($contextMenu) return;

  $contextMenu = document.createElement('div');
  $contextMenu.className = 'places-context-menu hidden';
  $contextMenu.innerHTML = `
    <button class="context-menu-item" data-action="edit">
      <span class="material-icons">edit</span>
      <span>Rename</span>
    </button>
    <button class="context-menu-item context-menu-danger" data-action="delete">
      <span class="material-icons">delete</span>
      <span>Remove</span>
    </button>
  `;
  document.body.appendChild($contextMenu);

  $contextMenu.querySelector('[data-action="edit"]').addEventListener('click', () => {
    if (contextTarget) startEditPlace(contextTarget.el, contextTarget.place);
    hideContextMenu();
  });

  $contextMenu.querySelector('[data-action="delete"]').addEventListener('click', () => {
    if (contextTarget) deletePlace(contextTarget.el, contextTarget.place);
    hideContextMenu();
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if ($contextMenu && !$contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  document.addEventListener('scroll', hideContextMenu, true);
}

function showContextMenu(x, y, itemEl, place) {
  initContextMenu();
  contextTarget = { el: itemEl, place };

  $contextMenu.classList.remove('hidden');
  // Position, then adjust if overflowing
  $contextMenu.style.left = x + 'px';
  $contextMenu.style.top = y + 'px';

  const rect = $contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth - 8) {
    $contextMenu.style.left = (window.innerWidth - rect.width - 8) + 'px';
  }
  if (rect.bottom > window.innerHeight - 8) {
    $contextMenu.style.top = (y - rect.height) + 'px';
  }
}

function hideContextMenu() {
  if ($contextMenu) {
    $contextMenu.classList.add('hidden');
  }
  contextTarget = null;
}

async function loadPlaces() {
  if (placesLoaded) return;

  try {
    const res = await fetch('/places');
    placesData = await res.json();
    renderPlaces(placesData);
    placesLoaded = true;
  } catch (err) {
    console.error('Failed to load places:', err);
  }
}

function reloadPlaces() {
  placesLoaded = false;
  if (currentView === 'places') {
    loadPlaces().then(() => showView('places'));
  }
}

function renderPlaces(data) {
  $places.innerHTML = '';

  if (data.countries.length === 0) return;

  const summary = document.createElement('div');
  summary.className = 'places-summary';
  summary.innerHTML = `
    <span class="places-total">${data.totalPlaces} places</span>
    <span class="places-divider">&middot;</span>
    <span class="places-countries">${data.totalCountries} countries</span>
  `;
  $places.appendChild(summary);

  for (const group of data.countries) {
    const countrySection = document.createElement('div');
    countrySection.className = 'places-country';

    const countryHeader = document.createElement('div');
    countryHeader.className = 'places-country-header';
    countryHeader.innerHTML = `
      <span class="places-country-name">${escapeHtml(group.country)}</span>
      <span class="places-country-count">${group.placeCount}</span>
    `;
    countrySection.appendChild(countryHeader);

    for (const stateGroup of group.states) {
      const stateSection = document.createElement('div');
      stateSection.className = 'places-state-section';

      if (stateGroup.state !== group.country) {
        const stateHeader = document.createElement('div');
        stateHeader.className = 'places-state-header';
        stateHeader.innerHTML = `
          <span class="places-state-name">${escapeHtml(stateGroup.state)}</span>
          <span class="places-state-count">${stateGroup.cities.length}</span>
        `;
        stateSection.appendChild(stateHeader);
      }

      const list = document.createElement('div');
      list.className = 'places-list';

      for (const place of stateGroup.cities) {
        const item = document.createElement('div');
        item.className = 'places-item';
        item.textContent = place.city;

        // Right-click (desktop)
        item.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          showContextMenu(e.clientX, e.clientY, item, place);
        });

        // Long-press (mobile)
        item.addEventListener('touchstart', (e) => {
          longPressTimer = setTimeout(() => {
            const touch = e.touches[0];
            showContextMenu(touch.clientX, touch.clientY, item, place);
          }, 500);
        }, { passive: true });

        item.addEventListener('touchend', () => clearTimeout(longPressTimer));
        item.addEventListener('touchmove', () => clearTimeout(longPressTimer));

        list.appendChild(item);
      }

      stateSection.appendChild(list);
      countrySection.appendChild(stateSection);
    }

    $places.appendChild(countrySection);
  }
}

function startEditPlace(itemEl, place) {
  hideContextMenu();
  const currentName = place.city;
  itemEl.textContent = '';
  itemEl.classList.add('editing');

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'places-edit-input';
  input.value = currentName;

  const saveBtn = document.createElement('button');
  saveBtn.className = 'places-edit-btn places-edit-save';
  saveBtn.innerHTML = '<span class="material-icons">check</span>';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'places-edit-btn';
  cancelBtn.innerHTML = '<span class="material-icons">close</span>';

  async function save() {
    const newName = input.value.trim();
    if (!newName || newName === currentName) {
      cancel();
      return;
    }
    for (const id of place.ids) {
      await fetch(`/places/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: newName })
      });
    }
    await refreshAll();
  }

  function cancel() {
    itemEl.classList.remove('editing');
    itemEl.innerHTML = '';
    itemEl.textContent = currentName;
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') save();
    if (e.key === 'Escape') cancel();
  });

  saveBtn.addEventListener('click', save);
  cancelBtn.addEventListener('click', cancel);

  itemEl.appendChild(input);
  itemEl.appendChild(saveBtn);
  itemEl.appendChild(cancelBtn);
  input.focus();
  input.select();
}

async function deletePlace(itemEl, place) {
  itemEl.classList.add('deleting');

  for (const id of place.ids) {
    await fetch(`/places/${id}`, { method: 'DELETE' });
  }

  await refreshAll();
}

async function refreshAll() {
  placesLoaded = false;
  const res = await fetch('/places');
  placesData = await res.json();
  renderPlaces(placesData);
  if (typeof loadTimeline === 'function') {
    loadTimeline();
  }
}
