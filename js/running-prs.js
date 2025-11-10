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
  displayDistancePR('pr-50k', data.distancePRs['50k']);

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
    'pr-marathon',
    'pr-50k'
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

/**
 * Load and populate run selector dropdown
 */
async function loadRunSelector() {
  try {
    const response = await fetch('data/strava_activities.json');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const activities = await response.json();
    const runs = activities.filter(activity => activity.type === 'Run');

    const selector = document.getElementById('run-selector');

    if (!selector) return;

    // Clear loading option
    selector.innerHTML = '';

    // Add runs to dropdown
    runs.forEach((run, index) => {
      const option = document.createElement('option');
      option.value = index;
      const date = new Date(run.start_date_local).toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long'
      });
      const distance = (run.distance / 1000).toFixed(2);
      option.textContent = `${run.name} - ${date} (${distance} km)`;
      selector.appendChild(option);
    });

    // Load first run by default
    if (runs.length > 0) {
      displayRunDetails(runs[0]);
    }

    // Add event listener for dropdown change
    selector.addEventListener('change', (e) => {
      const selectedIndex = parseInt(e.target.value);
      if (!isNaN(selectedIndex) && runs[selectedIndex]) {
        displayRunDetails(runs[selectedIndex]);
      }
    });

    // Add arrow rotation on focus/blur
    const arrow = document.querySelector('.dropdown-arrow');
    if (arrow) {
      selector.addEventListener('focus', () => {
        arrow.classList.add('open');
      });
      selector.addEventListener('blur', () => {
        arrow.classList.remove('open');
      });
      selector.addEventListener('click', () => {
        arrow.classList.toggle('open');
      });
    }

  } catch (error) {
    console.error('Error loading run selector:', error);
    const selector = document.getElementById('run-selector');
    if (selector) {
      selector.innerHTML = '<option value="">Fehler beim Laden</option>';
    }
  }
}

/**
 * Display detailed run information
 */
function displayRunDetails(run) {
  const detailsContainer = document.getElementById('latest-run-details');

  if (!detailsContainer) return;

  const date = new Date(run.start_date_local).toLocaleDateString('de-DE', {
    year: 'numeric',
    month: 'long'
  });

  const distance = (run.distance / 1000).toFixed(2);
  const pace = formatPaceFromSpeed(run.average_speed);
  const time = formatTime(run.moving_time);
  const elevationGain = Math.round(run.total_elevation_gain || 0);
  const elevationHigh = Math.round(run.elev_high || 0);
  const elevationLow = Math.round(run.elev_low || 0);

  // Heart rate data
  const avgHR = run.has_heartrate ? Math.round(run.average_heartrate) : null;
  const maxHR = run.has_heartrate ? Math.round(run.max_heartrate) : null;

  const html = `
    <div class="card rounded-lg p-6 md:p-8 shadow-xl run-details-card">
      <h4 class="text-2xl md:text-3xl font-bold text-white mb-2">${escapeHtml(run.name)}</h4>
      <p class="text-gray-400 mb-6 flex items-center">
        <i class="fas fa-calendar-alt mr-2"></i>${date}
      </p>

      <!-- Map Container -->
      <div class="mb-6 rounded-lg overflow-hidden map-container" style="height: 300px; background: linear-gradient(135deg, #1f2937 0%, #0f1419 100%);">
        <div id="run-map" style="width: 100%; height: 100%; border-radius: 0.5rem;"></div>
      </div>

      <!-- Main Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-route"></i>
          </div>
          <div class="stat-label">Distanz</div>
          <div class="stat-value">${distance} <span class="stat-unit">km</span></div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-label">Zeit</div>
          <div class="stat-value">${time}</div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-tachometer-alt"></i>
          </div>
          <div class="stat-label">Tempo</div>
          <div class="stat-value">${pace}<span class="stat-unit">/km</span></div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-label">Höhenmeter</div>
          <div class="stat-value">${elevationGain} <span class="stat-unit">m</span></div>
        </div>
      </div>

      <!-- Heart Rate & Elevation Details -->
      <div class="grid grid-cols-1 ${avgHR && maxHR ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6 mb-6">
        ${avgHR && maxHR ? `
          <div class="detail-card">
            <h5 class="detail-title">
              <i class="fas fa-heartbeat text-pink-500 mr-2"></i>
              Herzfrequenz
            </h5>
            <div class="space-y-4">
              <div class="hr-stat-row">
                <span class="hr-label">Durchschnitt</span>
                <span class="hr-value">${avgHR} <span class="text-sm text-gray-400">bpm</span></span>
              </div>
              <div class="hr-stat-row">
                <span class="hr-label">Maximum</span>
                <span class="hr-value max">${maxHR} <span class="text-sm text-gray-400">bpm</span></span>
              </div>

              <!-- Heart Rate Gauge -->
              <div class="hr-gauge-container">
                <svg class="hr-gauge" viewBox="0 0 200 120">
                  <defs>
                    <linearGradient id="hrGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
                      <stop offset="50%" style="stop-color:#f59e0b;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
                    </linearGradient>
                  </defs>
                  <!-- Background arc -->
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#374151" stroke-width="12" stroke-linecap="round"/>
                  <!-- Colored arc -->
                  <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#hrGradient)" stroke-width="12" stroke-linecap="round" stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * avgHR / maxHR)}"/>
                  <!-- Needle -->
                  <line x1="100" y1="100" x2="${100 + 70 * Math.cos(Math.PI - (Math.PI * avgHR / maxHR))}" y2="${100 - 70 * Math.sin(Math.PI - (Math.PI * avgHR / maxHR))}" stroke="#e94560" stroke-width="3" stroke-linecap="round"/>
                  <circle cx="100" cy="100" r="6" fill="#e94560"/>
                  <!-- Labels -->
                  <text x="20" y="115" fill="#9ca3af" font-size="12">0</text>
                  <text x="170" y="115" fill="#9ca3af" font-size="12">${maxHR}</text>
                  <text x="100" y="50" fill="#ffffff" font-size="24" font-weight="bold" text-anchor="middle">${avgHR}</text>
                  <text x="100" y="70" fill="#9ca3af" font-size="12" text-anchor="middle">bpm</text>
                </svg>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="detail-card">
          <h5 class="detail-title">
            <i class="fas fa-chart-area text-green-500 mr-2"></i>
            Höhenprofil
          </h5>
          <div class="space-y-3 mb-4">
            <div class="elev-stat-row">
              <span class="elev-icon">⬆️</span>
              <span class="elev-label">Höchster Punkt</span>
              <span class="elev-value">${elevationHigh} m</span>
            </div>
            <div class="elev-stat-row">
              <span class="elev-icon">⬇️</span>
              <span class="elev-label">Tiefster Punkt</span>
              <span class="elev-value">${elevationLow} m</span>
            </div>
            <div class="elev-stat-row highlight">
              <span class="elev-icon">📈</span>
              <span class="elev-label">Gesamt Anstieg</span>
              <span class="elev-value">${elevationGain} m</span>
            </div>
          </div>

          <!-- Elevation Visualization -->
          <div class="elevation-viz">
            <svg viewBox="0 0 300 100" class="w-full">
              <defs>
                <linearGradient id="elevGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.8" />
                  <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.2" />
                </linearGradient>
              </defs>
              <!-- Simple mountain visualization -->
              <path d="M0,100 L0,${100 - (elevationLow / elevationHigh * 60)} L75,${100 - (elevationGain / elevationHigh * 80)} L150,${100 - (elevationHigh / elevationHigh * 90)} L225,${100 - (elevationGain / elevationHigh * 70)} L300,${100 - (elevationLow / elevationHigh * 60)} L300,100 Z" fill="url(#elevGradient)" stroke="#10b981" stroke-width="2"/>
              <line x1="0" y1="100" x2="300" y2="100" stroke="#374151" stroke-width="1"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- Additional Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${run.average_cadence ? `
          <div class="extra-stat-card">
            <div class="extra-stat-icon">👟</div>
            <div class="extra-stat-label">Schrittfrequenz</div>
            <div class="extra-stat-value">${Math.round(run.average_cadence)} <span class="text-xs text-gray-400">spm</span></div>
          </div>
        ` : ''}

        ${run.average_temp ? `
          <div class="extra-stat-card">
            <div class="extra-stat-icon">🌡️</div>
            <div class="extra-stat-label">Temperatur</div>
            <div class="extra-stat-value">${Math.round(run.average_temp)}°C</div>
          </div>
        ` : ''}

        ${run.max_speed ? `
          <div class="extra-stat-card">
            <div class="extra-stat-icon">⚡</div>
            <div class="extra-stat-label">Max. Geschw.</div>
            <div class="extra-stat-value">${formatPaceFromSpeed(run.max_speed)}<span class="text-xs text-gray-400">/km</span></div>
          </div>
        ` : ''}

        ${run.device_name ? `
          <div class="extra-stat-card">
            <div class="extra-stat-icon">📱</div>
            <div class="extra-stat-label">Gerät</div>
            <div class="extra-stat-value text-sm">${escapeHtml(run.device_name)}</div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  detailsContainer.innerHTML = html;

  // Initialize map after HTML is rendered
  if (run.map && run.map.summary_polyline) {
    setTimeout(() => initializeRunMap(run), 100);
  }
}

/**
 * Initialize Leaflet map with run route
 */
function initializeRunMap(run) {
  const mapElement = document.getElementById('run-map');

  if (!mapElement || !run.map || !run.map.summary_polyline) return;

  try {
    // Decode polyline
    const coordinates = polyline.decode(run.map.summary_polyline);

    // Create interactive map with zoom and pan enabled
    const map = L.map('run-map', {
      zoomControl: false,  // Hide default +/- buttons
      scrollWheelZoom: true,  // Enable mouse wheel zoom on desktop
      dragging: true,  // Enable dragging/panning
      touchZoom: true,  // Enable pinch-to-zoom on mobile
      doubleClickZoom: true,  // Enable double-click zoom
      boxZoom: true,  // Enable shift+drag zoom
      keyboard: true,  // Enable keyboard navigation
      attributionControl: false
    });

    // Add a minimal grid background instead of map tiles
    const canvas = L.canvas({ padding: 0.5 });

    // Create a simple canvas layer for background with resize handling
    const CanvasLayer = L.Layer.extend({
      onAdd: function(map) {
        const canvas = L.DomUtil.create('canvas');
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        this._map = map;
        this._canvas = canvas;
        this._ctx = canvas.getContext('2d');

        this._reset();
        map.on('moveend zoom resize', this._reset, this);

        map.getPanes().mapPane.appendChild(canvas);
      },
      onRemove: function(map) {
        map.off('moveend zoom resize', this._reset, this);
        map.getPanes().mapPane.removeChild(this._canvas);
      },
      _reset: function() {
        const size = this._map.getSize();
        const canvas = this._canvas;
        const ctx = this._ctx;

        // Set canvas size with device pixel ratio for crisp rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size.x * dpr;
        canvas.height = size.y * dpr;
        ctx.scale(dpr, dpr);

        // Create radial gradient for more immersive background
        const centerX = size.x / 2;
        const centerY = size.y / 2;
        const radius = Math.max(size.x, size.y);

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, '#1f2937');
        gradient.addColorStop(0.5, '#1a1a2e');
        gradient.addColorStop(1, '#0f1419');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size.x, size.y);

        // Add animated dot pattern
        ctx.fillStyle = 'rgba(233, 69, 96, 0.05)';
        for (let x = 0; x < size.x; x += 40) {
          for (let y = 0; y < size.y; y += 40) {
            ctx.beginPath();
            ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Add subtle diagonal lines for depth
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.lineWidth = 1;
        for (let i = -size.y; i < size.x + size.y; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + size.y, size.y);
          ctx.stroke();
        }
      }
    });

    new CanvasLayer().addTo(map);

    // Convert coordinates to Leaflet format [lat, lng]
    const latLngs = coordinates.map(coord => [coord[0], coord[1]]);

    // Add route polyline
    const routeLine = L.polyline(latLngs, {
      color: '#e94560',
      weight: 4,
      opacity: 0.8,
      smoothFactor: 1
    }).addTo(map);

    // Add start marker
    L.circleMarker(latLngs[0], {
      radius: 8,
      fillColor: '#10b981',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map).bindPopup('<b>Start</b>');

    // Add end marker
    L.circleMarker(latLngs[latLngs.length - 1], {
      radius: 8,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(map).bindPopup('<b>Ziel</b>');

    // Fit map to route
    map.fitBounds(routeLine.getBounds(), { padding: [30, 30] });

    // Ensure map fills container properly (especially important for mobile)
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

  } catch (error) {
    console.error('Error rendering map:', error);
    mapElement.innerHTML = '<div class="text-gray-500 text-center py-8 flex items-center justify-center h-full"><i class="fas fa-map-marked-alt mr-2"></i>Karte konnte nicht geladen werden</div>';
  }
}

/**
 * Format pace from average speed (m/s)
 */
function formatPaceFromSpeed(avgSpeed) {
  if (!avgSpeed || avgSpeed === 0) return '--:--';
  const paceSecondsPerKm = 1000 / avgSpeed;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.round(paceSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format time from seconds
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Load run selector when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadRunSelector();
});
