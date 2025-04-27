// js/90_screenshot.js
dlog("📸 [Screenshot] js/90_screenshot.js loaded");

function initScreenshot() {
  dlog("🔧 [Screenshot] initScreenshot() starting…");
  const btn    = document.getElementById('screenshot-button');
  const loader = document.getElementById('map-loading');
  const mapEl  = document.getElementById('map');

  if (!btn || !mapEl) {
    dwarn("⚠️ [Screenshot] missing #screenshot-button or #map element; skipping setup");
    return;
  }

  btn.addEventListener('click', () => {
    dlog("🖱️ [Screenshot] button clicked");
    clearMessages();
    displayStatus('📸 Taking screenshot…');
    if (loader) loader.style.display = 'flex';

    html2canvas(mapEl, {
      useCORS: true,
      scale: 2,
      backgroundColor: null
    })
    .then(canvas => {
      dlog("🖼️ [Screenshot] canvas rendered");
      if (loader) loader.style.display = 'none';
      return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    })
    .then(blob => {
      if (!blob) {
        derr("❌ [Screenshot] blob creation failed");
        displayError('❌ Failed to create image blob.');
        return;
      }
      dlog("💾 [Screenshot] blob created, triggering download");
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'map_screenshot.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      displayStatus('✅ Screenshot downloaded successfully! 😊');
    })
    .catch(err => {
      if (loader) loader.style.display = 'none';
      derr("❌ [Screenshot] failed:", err);
      displayError('❌ Failed to take screenshot. Please try again. 🤔');
    });
  });

  dlog("✅ [Screenshot] initScreenshot() complete");
}

window.initScreenshot = initScreenshot;
