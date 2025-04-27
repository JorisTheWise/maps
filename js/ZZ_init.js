// js/ZZ_init.js
// 🧠 [Bootstrap] js/ZZ_init.js loaded

document.addEventListener('DOMContentLoaded', () => {
  dlog('🟢 DOM ready. Starting initialization...');

  // ── 1) MAP SETUP ──
  try {
    dlog('📍 [Map] Initializing Leaflet map...');
    mapInit(); // from js/10_map.js
  } catch (err) {
    derr('❌ [Map] mapInit failed:', err);
  }

  // ── 2) IMAGE VIEW & UPLOAD SWITCH ──
  try {
    dlog('🖼️ [Image] Initializing image toggle and upload controls...');
    initSwitchCustomImage();   // js/20_switch-custom-image.js
    initCustomImageControls(); // js/30_custom-image.js
    dlog('✅ [Switch] initSwitch & ImageLoader complete');
  } catch (err) {
    derr('❌ [Switch/ImageLoader] Initialization failed:', err);
  }

  // ── 3) SEARCH & COUNTRY ──
  try {
    dlog('🔍 [Search] Initializing address search and country selector...');
    initSearch();          
    initCountryDropdown(); 
    dlog('✅ [Search/Country] init complete');
  } catch (err) {
    derr('❌ [Search/Country] Initialization failed:', err);
  }

  // ── 4) CALIBRATION ──
  try {
    dlog('📐 [Calibration] Initializing pin calibration system...');
    initCalibration(); 
    dlog('✅ [Calibration] init complete');
  } catch (err) {
    derr('❌ [Calibration] Initialization failed:', err);
  }

  // ── 5) MARKERS ──
  try {
    dlog('📌 [Markers] Initializing map markers...');
    initMarkers(); 
    dlog('✅ [Markers] init complete');
  } catch (err) {
    derr('❌ [Markers] Initialization failed:', err);
  }

  // ── 6) STAMPS ──
  try {
    dlog('🎯 [Stamps] Initializing stamp placement system...');
    initStamps();
    dlog('✅ [Stamps] init complete');
  } catch (err) {
    derr('❌ [Stamps] Initialization failed:', err);
  }

  // ── 7) EXPORTS ──
  try {
    dlog('📸 [Export] Initializing screenshot and PDF tools...');
    initScreenshot();
    initPDF();
    dlog('✅ [Export] init complete');
  } catch (err) {
    derr('❌ [Export] Initialization failed:', err);
  }

  dlog('✅ Initialization complete (all modules attempted).');
});
