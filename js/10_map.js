// ── js/10_map.js ──
// Boots up Leaflet and sets the initial “Selected Location” card.
// Exposes window.mapInit() and window.map.

function mapInit() {
  dlog("🔧 [Map] mapInit() starting…");
  try {
    // 0) Define our “home” location
    const initialCoordsArr = [51.2320986, 5.4231522];
    const initialZoom      = 20;
    const initialAddress   = [
      'EMJ SOCIAL MEDIA TEAM',
      'Toekomstlaan 5',
      '3910 Neerpelt',
      'BELGIUM'
    ].join('\n');
    const initialCoordsText = `Lat: ${initialCoordsArr[0]}, Lon: ${initialCoordsArr[1]}`;

    // 1) Create the map
    const map = L.map('map', {
      center: initialCoordsArr,
      zoom: initialZoom,
      zoomControl: true
    });
    dlog("✅ [Map] created with center", map.getCenter(), "zoom", map.getZoom());

    // 2) Add OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    dlog("🗺️ [Map] tileLayer added");

    // 3) Update the sidebar “Selected Location”
    updateLocationDisplay(initialAddress, initialCoordsText);
    dlog("📋 [Map] sidebar location set →", initialAddress, initialCoordsText);

    // 4) Expose globally
    window.map = map;
    dlog("🚀 [Map] mapInit() complete — window.map ready");

    // 5) Debug: log every click
    map.on('click', e => {
      dlog("📌 [Map] click at", e.latlng);
    });

    // 6) Debug: log zoom changes
    map.on('zoomend', () => {
      dlog("🔎 [Map] zoomLevel:", map.getZoom());
    });

  } catch (err) {
    derr("❌ [Map] init() failed:", err);
  }
}

// Make it available to your bootstrapping (ZZ_init.js)
window.mapInit = mapInit;
