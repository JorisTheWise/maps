// ── js/60_calibration.js ──
// 60.00 CALIBRATION MODULE

dlog("📐 [Calibration] js/60_calibration.js loaded");

(function(){
  let calibrationMode = false;
  let awaiting        = null;
  let lastLatLng      = null;
  const pairs         = [];
  const mapMarkers    = [];
  const imgPins       = [];
  let pinsVisible     = true;

  function initCalibration() {
    dlog("🔧 [Calibration] initCalibration()");
    const btnCal    = document.getElementById('btnCalibrate');
    const btnToggle = document.getElementById('btnTogglePins');
    const btnImp    = document.getElementById('importCSV');
    const btnExp    = document.getElementById('exportCSV');
    const imgCt     = document.getElementById('customImageContainer');

    if (btnCal)    btnCal.addEventListener('click', startCalibration);
    if (btnToggle) btnToggle.addEventListener('click', togglePins);
    if (btnImp)    btnImp.addEventListener('click', importCSV);
    if (btnExp)    btnExp.addEventListener('click', exportCSV);

    map.on('click', onMapClick);
    imgCt.addEventListener('click', onImageClick);

    dlog("✅ [Calibration] listeners attached");
  }

  function startCalibration() {
    calibrationMode = true;
    awaiting        = 'map';
    dlog("🚩 [Calibration] started (awaiting map click)");
    displayStatus(`Calibration: click on map for point #${pairs.length + 1}`);
  }

  function onMapClick(e) {
    if (!calibrationMode || awaiting !== 'map') return;
    lastLatLng = e.latlng;
    awaiting   = 'image';
    dlog(`📍 [Calibration] map point at [${lastLatLng.lat},${lastLatLng.lng}]`);
    displayStatus('Map point recorded; now click on image');
  }

  function onImageClick(ev) {
    if (!calibrationMode || awaiting !== 'image') return;
    const rect = ev.currentTarget.getBoundingClientRect();
    const x = ev.clientX - rect.left, y = ev.clientY - rect.top;
    pairs.push({ latlng: lastLatLng, point: { x, y } });
    dlog(`📌 [Calibration] image point at [${x},${y}]`);
    
    const m = L.marker(lastLatLng, {
      icon: L.icon({ iconUrl:'images/stamps/stamp_parking.png', iconSize:[24,24], iconAnchor:[12,12] })
    }).addTo(map);
    mapMarkers.push(m);

    const pin = document.createElement('img');
    pin.src            = 'images/stamps/stamp_parking.png';
    pin.style.position = 'absolute';
    pin.style.width    = '24px';
    pin.style.height   = '24px';
    pin.style.left     = `${x - 12}px`;
    pin.style.top      = `${y - 12}px`;
    ev.currentTarget.appendChild(pin);
    imgPins.push(pin);

    awaiting = 'map';
    displayStatus('Point saved! Click next map point or hit Calibrate again.');
  }

  function togglePins() {
    pinsVisible = !pinsVisible;
    dlog(`👁️ [Calibration] pinsVisible = ${pinsVisible}`);
    mapMarkers.forEach(m => pinsVisible ? m.addTo(map) : map.removeLayer(m));
    imgPins.forEach(pin => pin.style.display = pinsVisible ? 'block' : 'none');
    displayStatus(pinsVisible ? 'Pins shown' : 'Pins hidden');
  }

  function exportCSV() {
    if (!pairs.length) {
      dwarn("⚠️ [Calibration] no points to export");
      return displayError('No calibration points to export.');
    }
    dlog("📤 [Calibration] exporting CSV");
    const lines = ['lat,lon,x,y'];
    pairs.forEach(({latlng, point}) => {
      lines.push([latlng.lat, latlng.lng, point.x, point.y].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'calibration_points.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    displayStatus('Calibration CSV exported.');
  }

  function importCSV() {
    dlog("📥 [Calibration] import CSV triggered");
    const input = document.createElement('input');
    input.type  = 'file';
    input.accept= '.csv,text/csv';
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      dlog(`📂 [Calibration] importing file ${file.name}`);
      const reader = new FileReader();
      reader.onload = () => {
        clearCalibration();
        const rows = reader.result.trim().split(/\r?\n/).slice(1);
        rows.forEach(line => {
          const [lat, lon, x, y] = line.split(',').map(Number);
          if ([lat,lon,x,y].some(isNaN)) return;
          lastLatLng = L.latLng(lat, lon);
          onImageClick({ clientX: x, clientY: y, currentTarget: document.getElementById('customImageContainer') });
        });
        displayStatus('Calibration CSV imported.');
      };
      reader.readAsText(file);
    };
    input.click();
  }

  function clearCalibration() {
    dlog("🧹 [Calibration] clearing all calibration data");
    mapMarkers.forEach(m => map.removeLayer(m));
    imgPins.forEach(pin => pin.remove());
    pairs.length      = 0;
    mapMarkers.length = 0;
    imgPins.length    = 0;
    calibrationMode   = false;
    awaiting          = null;
  }

  window.initCalibration = initCalibration;
  dlog("✅ [Calibration] initCalibration exposed");
})();
