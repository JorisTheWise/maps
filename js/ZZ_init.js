// js/ZZ_init.js
// 🧠 [Bootstrap] Consolidated and testable initialization module

/**
 * Initializes all application modules in sequence with robust logging and error handling.
 * @returns {Promise<void>} Resolves when all initialization tasks are complete.
 */
async function initAll() {
  dlog('🟢 initAll invoked. Starting initialization sequence...');

  // 1️⃣ Core initialization tasks
  const initTasks = [
    { name: '🗺️ [Map]',        fn: mapInit },
    { name: '🖼️ [Image]',      fn: () => { initSwitchCustomImage(); initCustomImageControls(); } },
    { name: '🔍/🌐 [Search/Country]', fn: () => { initSearch(); initCountryDropdown(); } },
    { name: '📐 [Calibration]', fn: initCalibration },
    { name: '📌 [Markers]',    fn: initMarkers },
    { name: '🎯 [Stamps]',     fn: initStamps }
  ];

  for (const { name, fn } of initTasks) {
    try {
      dlog(`🔧 ${name} Initializing...`);
      await Promise.resolve(fn());
      dlog(`✅ ${name} init complete`);
    } catch (err) {
      derr(`❌ ${name} Initialization failed:`, err);
    }
  }

  // 2️⃣ Export tools setup
  try {
    dlog('📸 [Screenshot] Initializing screenshot tool...');
    initScreenshot();

    // Guard against missing PDF library or function
    if (typeof initPDF === 'function') {
      dlog('📄 [PDF] initPDF detected, initializing...');
      await Promise.resolve(initPDF());
      dlog('✅ [PDF] init complete');
    } else {
      dlog('⚠️ [PDF] initPDF not found, skipping PDF setup');
    }

    dlog('✅ [Export] All export init complete');
  } catch (err) {
    derr('❌ [Export] Initialization failed:', err);
  }

  dlog('✅ initAll sequence complete.');
}

// Automatically bootstrap on DOMContentLoaded
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initAll);
}

/* The End */
