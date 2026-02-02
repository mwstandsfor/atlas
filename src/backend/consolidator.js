const { getDatabase } = require('./database');
const { getSetting } = require('./config');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

function formatDateRange(startDate, endDate) {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  if (startDate === endDate) {
    return `${start.day} ${SHORT_MONTHS[start.month - 1]}`;
  }

  const sameMonth = start.month === end.month && start.year === end.year;
  const sameYear = start.year === end.year;

  if (sameMonth) {
    return `${SHORT_MONTHS[start.month - 1]} ${start.day}-${end.day}`;
  }

  if (sameYear) {
    return `${start.day} ${SHORT_MONTHS[start.month - 1]} - ${end.day} ${SHORT_MONTHS[end.month - 1]}`;
  }

  return `${start.day} ${SHORT_MONTHS[start.month - 1]} ${start.year} - ${end.day} ${SHORT_MONTHS[end.month - 1]} ${end.year}`;
}

function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return { year, month, day };
}

function daysBetween(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

// Pick the best display name for a consolidated group.
// Strategy:
// - Count how many photos each city has
// - If one city has >=80% of photos, use that city name (you were mostly there)
// - Otherwise, use the state name (you were moving around the metro area)
// This naturally handles: "Kusatsu" (100% Kusatsu in Gunma) vs "Tokyo" (mix of wards)
function pickDisplayCity(cityNames, stateName) {
  const unique = [...new Set(cityNames)];
  if (unique.length === 1) {
    return unique[0];
  }

  // Count frequency of each city
  const counts = {};
  for (const name of cityNames) {
    counts[name] = (counts[name] || 0) + 1;
  }

  // Find the dominant city
  const total = cityNames.length;
  let maxCity = null;
  let maxCount = 0;
  for (const [city, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      maxCity = city;
    }
  }

  // If one city has 80%+ of photos, use it
  if (maxCount / total >= 0.8) {
    return maxCity;
  }

  return stateName;
}

function consolidateLocations() {
  const db = getDatabase();
  const now = Date.now();

  // Get all raw location rows with state info, ordered by date
  const rawRows = db.prepare(`
    SELECT date, city, state, country
    FROM raw_locations
    ORDER BY date ASC
  `).all();

  if (rawRows.length === 0) return;

  // For each date+state+country combo, collect all the city names seen
  const dayStateMap = new Map();
  for (const row of rawRows) {
    const key = `${row.date}|${row.state}|${row.country}`;
    if (!dayStateMap.has(key)) {
      dayStateMap.set(key, {
        date: row.date,
        state: row.state,
        country: row.country,
        cities: []
      });
    }
    dayStateMap.get(key).cities.push(row.city);
  }

  // Sort entries chronologically
  const dayEntries = [...dayStateMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  // Clear existing consolidated data
  db.exec('DELETE FROM consolidated_locations');

  // Check for home location setting
  const homeState = getSetting('home_state') || '';
  const homeCountry = getSetting('home_country') || '';
  const hasHome = homeState && homeCountry;

  // For home location, split day entries into per-city entries so we get
  // city-level granularity (e.g. "Meguro" vs "Shibuya" within Tokyo).
  // For non-home locations, keep state-level grouping as before.
  let expandedEntries = [];
  for (const entry of dayEntries) {
    const isHome = hasHome && entry.state === homeState && entry.country === homeCountry;
    if (isHome) {
      const byCityName = {};
      for (const city of entry.cities) {
        if (!byCityName[city]) byCityName[city] = [];
        byCityName[city].push(city);
      }
      for (const [city, cities] of Object.entries(byCityName)) {
        expandedEntries.push({
          date: entry.date,
          state: entry.state,
          country: entry.country,
          cities: cities,
          homeCity: city
        });
      }
    } else {
      expandedEntries.push(entry);
    }
  }

  expandedEntries.sort((a, b) => a.date.localeCompare(b.date));

  // Merge consecutive entries:
  // - Non-home: merge by state+country (as before)
  // - Home: merge by city+state+country (city-level granularity)
  const consolidated = [];
  let current = null;

  for (const entry of expandedEntries) {
    const isHome = hasHome && entry.state === homeState && entry.country === homeCountry;
    const sameGroup = current &&
      current.state === entry.state &&
      current.country === entry.country &&
      (!isHome || current.homeCity === entry.homeCity);

    if (sameGroup) {
      current.end_date = entry.date;
      current.cities.push(...entry.cities);
    } else {
      if (current) consolidated.push(current);
      current = {
        state: entry.state,
        country: entry.country,
        start_date: entry.date,
        end_date: entry.date,
        cities: [...entry.cities],
        homeCity: entry.homeCity || null
      };
    }
  }
  if (current) consolidated.push(current);

  // Insert consolidated entries
  const insert = db.prepare(`
    INSERT INTO consolidated_locations
      (city, state, country, start_date, end_date, year, month, month_name, display_date, days_stayed, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const batchInsert = db.transaction((entries) => {
    for (const entry of entries) {
      const isHome = hasHome && entry.state === homeState && entry.country === homeCountry;
      // For home location, use the per-city name; for travel, use pickDisplayCity
      const displayCity = isHome && entry.homeCity
        ? entry.homeCity
        : pickDisplayCity(entry.cities, entry.state);
      const startParsed = parseLocalDate(entry.start_date);
      const days = daysBetween(entry.start_date, entry.end_date) + 1;
      const displayDate = formatDateRange(entry.start_date, entry.end_date);

      insert.run(
        displayCity,
        entry.state,
        entry.country,
        entry.start_date,
        entry.end_date,
        startParsed.year,
        startParsed.month,
        MONTH_NAMES[startParsed.month - 1],
        displayDate,
        days,
        now,
        now
      );
    }
  });

  batchInsert(consolidated);

  // Update total_locations in sync_metadata
  const count = db.prepare('SELECT COUNT(*) as count FROM consolidated_locations').get();
  db.prepare('UPDATE sync_metadata SET total_locations = ? WHERE id = 1').run(count.count);
}

module.exports = { consolidateLocations, formatDateRange };
