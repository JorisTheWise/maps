// ── js/20_switch-custom-image.js ──
// Hooks up the Map ↔ Image switch, toggles views, and logs every step.

dlog("🔀 [Switch] js/20_switch-custom-image.js loaded");

function initSwitchCustomImage() {
  dlog("🔧 [Switch] initSwitchCustomImage starting…");

  // 20.10 CACHE DOM ELEMENTS
  const switchEl = document.getElementById('switch-toggle');
  const mapEl = document.getElementById('map');
  const form = document.getElementById('custom-map-form');
  const imgCt = document.getElementById('customImageContainer');
  const searchSection = document.getElementById('search-section');
  const resetSection = document.getElementById('reset-section');
  const stampBar = document.getElementById('stampBar');
  const uploadZone = document.querySelector('.file-upload-area');
  const urlWrapper = document.querySelector('.url-input-area');
  const mapSection = document.querySelector('.map-section');
  const loading = document.getElementById('map-loading');

  if (!switchEl || !mapEl || !form || !imgCt || !searchSection || !resetSection || !stampBar || !uploadZone || !urlWrapper || !mapSection) {
    dwarn("⚠️ [Switch] Missing one or more required DOM elements");
    return;
  }

  // 20.20 showUserMessage()
  function showUserMessage(text, duration = 3000) {
    let msg = document.getElementById('user-message');
    if (!msg) {
      msg = document.createElement('div');
      msg.id = 'user-message';
      document.body.appendChild(msg);
    }
    msg.innerHTML = text;
    msg.classList.add('visible');
    clearTimeout(msg._timeout);
    msg._timeout = setTimeout(() => msg.classList.remove('visible'), duration);
    dlog("💬 [Message]", text.replace(/<[^>]+>/g, ''));
  }

  // 20.30 setView(mode)
  function setView(mode) {
    dlog(`🔄 [Switch] switching to ${mode.toUpperCase()} view…`);

    // pill highlight
    switchEl.querySelectorAll('.switch-btn').forEach(b => b.classList.remove('active'));
    const btn = switchEl.querySelector(`.switch-btn[data-view="${mode}"]`);
    if (btn) btn.classList.add('active');

    // add a class on the switch container so we can target IMAGE-mode specifically
    switchEl.classList.toggle('map-mode',  mode === 'map');
    switchEl.classList.toggle('image-mode', mode === 'image');

    if (mode === 'map') {
      // MAP MODE
      dlog("🗺️ [View] MAP mode activated");
      form.style.display = 'none';
      imgCt.style.display = 'none';
      resetSection.style.display = 'none';
      mapSection.style.display = 'block';
      mapEl.style.display = 'block';
      searchSection.style.display = 'block';
      uploadZone.style.display = 'none';
      urlWrapper.style.display = 'none';
      stampBar.style.display = 'flex';
      if (loading) loading.style.display = 'none';

      showUserMessage('<i class="fas fa-hand-pointer"></i>&nbsp;Click below to select your stamp');

      // redraw map
      setTimeout(() => {
        if (window.map && typeof window.map.invalidateSize === 'function') {
          window.map.invalidateSize();
          window.map.setView(window.map.getCenter(), window.map.getZoom(), { animate: false });
          dlog("🔄 [Map] invalidateSize & recenter complete");
        }
      }, 100);

    } else {
      // IMAGE MODE
      dlog("🖼️ [View] IMAGE mode activated");
      mapEl.style.display = 'none';
      searchSection.style.display = 'none';
      stampBar.style.display = 'none';
      form.style.display = 'flex';
      resetSection.style.display = 'flex';
      uploadZone.style.display = 'block';
      urlWrapper.style.display = 'block';
      mapSection.style.display = 'block';

      showUserMessage('🖼️ Drop an image or enter a URL to begin.');
    }
  }

  // 20.40 Observe image-container to enable stamps
  new MutationObserver(() => {
    if (getComputedStyle(imgCt).display === 'block') {
      dlog("🖍️ [Stamp] Image loaded — stamps enabled");
      stampBar.style.display = 'flex';
      showUserMessage('✅ Custom image loaded. You can now place stamps.');
    }
  }).observe(imgCt, { attributes: true, attributeFilter: ['style'] });

  // 20.50 Wire up switch buttons
  switchEl.addEventListener('click', e => {
    const b = e.target.closest('.switch-btn');
    if (b) setView(b.dataset.view);
  });

  // 20.60 Start in MAP mode
  setView('map');
  dlog("✅ [Switch] initSwitchCustomImage complete");
}

// Expose for bootstrap
window.initSwitchCustomImage = initSwitchCustomImage;
