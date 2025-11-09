/**
 * Running Personal Records (PRs) Loader
 * Dynamically loads and displays Strava running personal records
 */

document.addEventListener('DOMContentLoaded', function() {
  loadPersonalRecords();
});

/**
 * Load personal records from JSON file
 */
async function loadPersonalRecords() {
  try {
    const response = await fetch('data/running_prs.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayPersonalRecords(data);
  } catch (error) {
    console.error('Error loading personal records:', error);
    showError();
  }
}

/**
 * Display all personal records
 */
function displayPersonalRecords(data) {
  // Display overall bests
  displayOverallBest('pr-longest-run', data.overallBests.longestRun);
  displayOverallBest('pr-fastest-pace', data.overallBests.fastestPace);
  displayOverallBest('pr-most-elevation', data.overallBests.mostElevation);

  // Display distance-specific PRs
  displayDistancePR('pr-5k', data.distancePRs['5k']);
  displayDistancePR('pr-10k', data.distancePRs['10k']);
  displayDistancePR('pr-halfMarathon', data.distancePRs.halfMarathon);
  displayDistancePR('pr-30k', data.distancePRs['30k']);
  displayDistancePR('pr-marathon', data.distancePRs.marathon);

  // Display last updated
  displayLastUpdated(data.lastUpdated);
}

/**
 * Display an overall best record
 */
function displayOverallBest(elementId, prData) {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element ${elementId} not found`);
    return;
  }

  if (!prData) {
    element.innerHTML = '<div class="pr-not-achieved">Noch nicht erreicht</div>';
    return;
  }

  const html = `
    <span class="pr-activity-name">${escapeHtml(prData.name)}</span>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Datum</span>
      <span class="pr-stat-value">${formatDate(prData.date)}</span>
    </div>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Distanz</span>
      <span class="pr-stat-value">${prData.distance_km} km</span>
    </div>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Zeit</span>
      <span class="pr-stat-value">${prData.time}</span>
    </div>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Tempo</span>
      <span class="pr-stat-value">${prData.pace}/km</span>
    </div>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Höhenmeter</span>
      <span class="pr-stat-value">${prData.elevation_m} m</span>
    </div>
  `;

  element.innerHTML = html;
  element.classList.add('loaded');
}

/**
 * Display a distance-specific PR
 */
function displayDistancePR(elementId, prData) {
  const element = document.getElementById(elementId);

  if (!element) {
    console.error(`Element ${elementId} not found`);
    return;
  }

  if (!prData) {
    element.innerHTML = '<div class="pr-not-achieved">Noch nicht erreicht</div>';
    return;
  }

  const html = `
    <span class="pr-activity-name">${escapeHtml(prData.name)}</span>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Datum</span>
      <span class="pr-stat-value">${formatDate(prData.date)}</span>
    </div>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Distanz</span>
      <span class="pr-stat-value">${prData.distance_km} km</span>
    </div>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Zeit</span>
      <span class="pr-stat-value">${prData.time}</span>
    </div>
    <div class="pr-stat-row">
      <span class="pr-stat-label">Tempo</span>
      <span class="pr-stat-value">${prData.pace}/km</span>
    </div>
  `;

  element.innerHTML = html;
  element.classList.add('loaded');
}

/**
 * Display last updated timestamp
 */
function displayLastUpdated(timestamp) {
  const element = document.getElementById('pr-last-updated');

  if (!element) return;

  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  element.textContent = formattedDate;
}

/**
 * Format date to German format
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show error message in all PR cards
 */
function showError() {
  const prElements = [
    'pr-longest-run',
    'pr-fastest-pace',
    'pr-most-elevation',
    'pr-5k',
    'pr-10k',
    'pr-halfMarathon',
    'pr-30k',
    'pr-marathon'
  ];

  const errorHtml = '<div class="pr-error">Fehler beim Laden der Daten</div>';

  prElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = errorHtml;
    }
  });

  // Update last updated to show error
  const lastUpdatedElement = document.getElementById('pr-last-updated');
  if (lastUpdatedElement) {
    lastUpdatedElement.textContent = 'Fehler';
  }
}
