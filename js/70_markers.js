// 📌 [Markers] js/70_markers.js loaded
dlog("📌 [Markers] js/70_markers.js loaded");

// ───── 70.05 INITIALIZATION ─────
function initMarkers() {
  dlog("📌 [Markers] initMarkers() starting…");
  // (Hook up any future custom event listeners here)
  dlog("✅ [Markers] initMarkers() complete");
}
window.initMarkers = initMarkers;

// ───── 70.10 ICON MAPS & HELPERS ─────
const circledNumberURLs = {
  1: 'images/stamps/stamp_01.png', 2: 'images/stamps/stamp_02.png',
  3: 'images/stamps/stamp_03.png', 4: 'images/stamps/stamp_04.png',
  5: 'images/stamps/stamp_05.png', 6: 'images/stamps/stamp_06.png',
  7: 'images/stamps/stamp_07.png', 8: 'images/stamps/stamp_08.png',
  9: 'images/stamps/stamp_09.png', 10: 'images/stamps/stamp_10.png',
  11: 'images/stamps/stamp_11.png', 12: 'images/stamps/stamp_12.png',
  13: 'images/stamps/stamp_13.png', 14: 'images/stamps/stamp_14.png',
  15: 'images/stamps/stamp_15.png', 16: 'images/stamps/stamp_16.png',
  17: 'images/stamps/stamp_17.png', 18: 'images/stamps/stamp_18.png',
  19: 'images/stamps/stamp_19.png', 20: 'images/stamps/stamp_20.png'
};
const iconURLs = {
  'crew-parking': 'images/stamps/stamp_parking.png',
  'crew-entrance': 'images/stamps/stamp_crew_enterance.png',
  'lunch': 'images/stamps/stamp_lunch.png',
  'ob-van': 'images/stamps/stamp_ob_van.png',
  'materiaalwagen': 'images/stamps/stamp_materiaalwagen.png',
  'elektriciteit': 'images/stamps/stamp_elektriciteit.png',
  'internet': 'images/stamps/stamp_internet.png',
  'assembly-point': 'images/stamps/stamp_assembly.png',
  'first-aid': 'images/stamps/stamp_first_aid.png',
  'toilet': 'images/stamps/stamp_toilet.png'
};
const defaultLabels = {
  'crew-parking': 'Crew Parking',
  'crew-entrance': 'Crew Entrance',
  'lunch': 'Lunch',
  'ob-van': 'OB Van',
  'materiaalwagen': 'Materiaalwagen',
  'elektriciteit': 'Elektriciteit',
  'internet': 'Internet',
  'assembly-point': 'Assembly Point',
  'first-aid': 'First Aid',
  'toilet': 'Toilet'
};

function getCircledNumber(n) {
  dlog(`🔢 [Markers] getCircledNumber(${n})`);
  return circledNumberURLs[n] || circledNumberURLs[1];
}
window.getCircledNumber = getCircledNumber;

// ───── 70.20 NUMBER CONTROLS ─────
let currentNumber = 1;
const maxNumber = 20;
window.currentNumber = currentNumber;

function updateNumberDisplay() {
  const img = document.getElementById('numbered-icon');
  if (!img) {
    dwarn("⚠️ [Markers] #numbered-icon not found");
    return;
  }
  img.src = getCircledNumber(currentNumber);
  img.alt = `Number ${currentNumber}`;
  dlog(`🔢 [Markers] Number display updated to ${currentNumber}`);
}

function incrementNumber() {
  currentNumber = currentNumber % maxNumber + 1;
  window.currentNumber = currentNumber;
  updateNumberDisplay();
}
function decrementNumber() {
  if (currentNumber > 1) {
    currentNumber--;
    window.currentNumber = currentNumber;
    updateNumberDisplay();
  }
}
updateNumberDisplay();
window.incrementNumber = incrementNumber;
window.decrementNumber = decrementNumber;

// ───── 70.30 CURSOR SCALER UTILITY ─────
function createScaledCursor(url, width, height, cb) {
  dlog(`🖱️ [Markers] createScaledCursor(${url}, ${width}×${height})`);
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const cnv = document.createElement('canvas');
    cnv.width = width;
    cnv.height = height;
    cnv.getContext('2d').drawImage(img, 0, 0, width, height);
    const dataUrl = cnv.toDataURL();
    // put the cursor “hot-spot” in the middle
    const hot = Math.floor(width / 2);
    cb(cnv.toDataURL(), hot);
    dlog("🖱️ [Markers] Cursor dataURL generated");
  };
  img.onerror = () => dwarn("⚠️ [Markers] createScaledCursor failed to load image");
  img.src = url;
}
window.createScaledCursor = createScaledCursor;

// ───── 70.40 MARKER ICON FACTORIES ─────
function getNormalMarkerIcon(iconUrl) {
  return L.icon({ iconUrl, iconSize: [40, 40], iconAnchor: [20, 20] });
}

function getEditMarkerIcon(originalIconUrl) {
  dlog("✏️ [Markers] getEditMarkerIcon");
  const arrowUrl = iconURLs['assembly-point'];
  return L.divIcon({
    className: 'edit-marker-icon',
    html: `
      <div style="position:relative;width:100px;height:100px">
        <img src="${arrowUrl}"        style="position:absolute;top:0;left:0;width:100px;height:100px;opacity:0.6">
        <img src="${originalIconUrl}" style="position:absolute;top:30px;left:30px;width:40px;height:40px">
      </div>`,
    iconSize: [100, 100],
    iconAnchor: [50, 50]
  });
}

// ───── 70.50 PLACE A MARKER ─────
function placeMarker(latlng, iconUrl, stampType) {
  dlog(`📍 [Markers] placeMarker at ${latlng} with type "${stampType}"`);

  const label = (stampType === 'number')
    ? (prompt('Enter a label for this marker, or leave blank:') || 'Marker')
    : (defaultLabels[stampType] || 'Marker');

  const marker = L.marker(latlng, {
    icon: getNormalMarkerIcon(iconUrl),
    draggable: false
  }).addTo(map);

  marker._customData = { label, notes: '' };
  marker.bindTooltip(label, { permanent: false, direction: 'top', offset: [0, -20] });

  dlog("✅ [Markers] marker placed & tooltip bound");
  addToSavedLocations(marker);
}
window.placeMarker = placeMarker;

// ───── 70.60 SAVED LOCATIONS PANEL ─────
function addToSavedLocations(marker) {
  dlog("📋 [Markers] addToSavedLocations");
  const { lat, lng } = marker.getLatLng();
  const { label, notes } = marker._customData;
  const coords = `Lat: ${lat.toFixed(6)}, Lon: ${lng.toFixed(6)}`;
  const iconUrl = marker.options.icon.options.iconUrl;

  const card = document.createElement('div');
  card.className = 'location-card';
  card.innerHTML = `
    <div class="location-header">
      <div class="icon-badge">
        <img src="${iconUrl}" class="location-icon">
        <div class="location-title">${label}</div>
      </div>
      <div class="actions">
        <i class="fa fa-pencil edit-button" title="Edit"></i>
        <i class="fa fa-trash delete-button" title="Delete"></i>
      </div>
    </div>
    <div class="location-details">
      <hr class="divider">
      <div class="location-row">
        <div class="row-left">
          <i class="fa fa-compass location-icon"></i>
          <div class="row-text">${coords}</div>
        </div>
        <i class="fa fa-files-o copy-icon" title="Copy Coordinates"
           onclick='copyToClipboard("${coords}")'></i>
      </div>
      ${notes ? `
      <div class="location-row">
        <div class="row-left">
          <i class="fa fa-sticky-note location-icon"></i>
          <div class="row-text">${notes}</div>
        </div>
      </div>` : ''}
      <div class="location-row">
        <div class="app-links">
          <a href="https://www.google.com/maps?q=${lat},${lng}" target="_blank">
            <img src="images/location_card_icons/google.png">
          </a>
          <a href="https://maps.apple.com/?ll=${lat},${lng}" target="_blank">
            <img src="images/location_card_icons/mac-os.png">
          </a>
          <a href="https://waze.com/ul?ll=${lat},${lng}" target="_blank">
            <img src="images/location_card_icons/waze.png">
          </a>
        </div>
      </div>
    </div>
  `;
  document.getElementById('saved-locations').appendChild(card);

  // DELETE
  card.querySelector('.delete-button').onclick = () => {
    if (confirm('Delete this marker?')) {
      map.removeLayer(marker);
      card.remove();
      dlog("🗑️ [Markers] Marker deleted");
    }
  };

  // EDIT
  card.querySelector('.edit-button').onclick = () => editMarker(marker, card);
}
window.addToSavedLocations = addToSavedLocations;

// ───── 70.70 MARKER EDITING ─────
function editMarker(marker, card) {
  dlog("✏️ [Markers] editMarker");
  marker.dragging.enable();
  const origIcon = marker.options.icon.options.iconUrl;
  marker.setIcon(getEditMarkerIcon(origIcon));

  const { label, notes } = marker._customData;
  const details = card.querySelector('.location-details');
  details.innerHTML = `
    <div class="edit-form">
      <label>Label:<input type="text" class="edit-label" value="${label}"></label>
      <label>Notes:<textarea class="edit-notes">${notes}</textarea></label>
      <button class="save-button">Save</button>
      <button class="cancel-button">Cancel</button>
    </div>`;

  details.querySelector('.save-button').onclick = () =>
    finalizeEdit(marker, card,
      details.querySelector('.edit-label').value,
      details.querySelector('.edit-notes').value,
      origIcon
    );
  details.querySelector('.cancel-button').onclick = () =>
    cancelEdit(marker, card, origIcon);
}
window.editMarker = editMarker;

function finalizeEdit(marker, card, newLabel, newNotes, origIcon) {
  dlog("💾 [Markers] finalizeEdit");
  marker.dragging.disable();
  marker._customData.label = newLabel;
  marker._customData.notes = newNotes;
  marker.setIcon(getNormalMarkerIcon(origIcon));
  marker.bindTooltip(newLabel, { direction: 'top', offset: [0, -20] });
  dlog("✅ [Markers] edits applied:", newLabel, newNotes);
  card.remove();
  addToSavedLocations(marker);
}

function cancelEdit(marker, card, origIcon) {
  dlog("✖️ [Markers] cancelEdit");
  marker.dragging.disable();
  marker.setIcon(getNormalMarkerIcon(origIcon));
  marker.bindTooltip(marker._customData.label, { direction: 'top', offset: [0, -20] });
  dlog("🔄 [Markers] edit canceled, restored original marker");
  card.remove();
  addToSavedLocations(marker);
}

// ───── 70.80 UTILITY ─────
function copyToClipboard(text) {
  dlog(`📋 [Markers] copyToClipboard: ${text}`);
  navigator.clipboard.writeText(text)
    .then(() => {
      dlog("📋 [Markers] copy succeeded");
      displayStatus('Copied to clipboard.')
    })
    .catch(() => {
      dwarn("⚠️ [Markers] copy failed");
      displayError('Failed to copy.');
    });
}
window.copyToClipboard = copyToClipboard;
