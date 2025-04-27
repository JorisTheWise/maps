// ── js/30_custom-image.js ──
// 30.00 CUSTOM IMAGE LOADER — drag/drop, URL, reset & logs

(function() {
  dlog("🖼️ [ImageLoader] js/30_custom-image.js loaded");

  let dropZone, fileInput, urlInput, resetBtn;
  const formEl = () => document.getElementById('custom-map-form');
  const imgCt  = () => document.getElementById('customImageContainer');
  const status = () => document.getElementById('status-message');
  const toggle = () => document.getElementById('viewToggle');

  function initCustomImageControls() {
    dlog("🔧 [ImageLoader] initCustomImageControls starting…");

    dropZone  = document.getElementById('dropZone');
    fileInput = document.getElementById('fileInput');
    urlInput  = document.getElementById('customMapUrl');
    resetBtn  = document.getElementById('resetImageMode');

    if (!dropZone || !fileInput || !urlInput || !resetBtn) {
      dwarn("⚠️ [ImageLoader] missing required elements");
      return;
    }

    // hide both until user flips
    formEl().style.display = 'none';
    imgCt().style.display  = 'none';

    // watch the toggle pills to show/hide form
    toggle()?.addEventListener('click', e => {
      const b = e.target.closest('.view-btn');
      if (!b) return;
      if (b.dataset.view === 'image') {
        formEl().style.display = 'flex';
        dlog("🖼️ [ImageLoader] showing form");
      } else {
        resetCustomMap();
      }
    });

    // drag-and-drop
    ['dragenter','dragover'].forEach(ev =>
      dropZone.addEventListener(ev, preventAndHighlight)
    );
    ['dragleave','drop'].forEach(ev =>
      dropZone.addEventListener(ev, removeHighlight)
    );
    dropZone.addEventListener('drop', handleDrop);

    // click to browse
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
      if (e.target.files.length) applyCustomMapFile(e.target.files[0]);
    });

    // URL on Enter
    urlInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustomMapUrl(urlInput.value.trim());
      }
    });

    // reset
    resetBtn.addEventListener('click', resetCustomMap);

    dlog("✋ [ImageLoader] listeners attached");
    dlog("✅ [ImageLoader] initCustomImageControls complete");
  }

  function preventAndHighlight(e) {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.add('drag-over');
  }

  function removeHighlight(e) {
    e.preventDefault(); e.stopPropagation();
    dropZone.classList.remove('drag-over');
  }

  function handleDrop(e) {
    removeHighlight(e);
    const file = e.dataTransfer.files[0];
    if (file) applyCustomMapFile(file);
  }

  function applyCustomMapFile(file) {
    displayStatus('Loading image…');
    dlog("⏳ [ImageLoader] reading file", file.name);
    const reader = new FileReader();
    reader.onload = () => loadImage(reader.result);
    reader.onerror = () => showError('Failed to read file.');
    reader.readAsDataURL(file);
  }

  function applyCustomMapUrl(raw) {
    if (!raw) return showError('Please enter a URL.');
    displayStatus('Loading image…');
    dlog("🔗 [ImageLoader] loading URL", raw);
    loadImage(raw);
  }

  function loadImage(src) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      dlog("✅ [ImageLoader] image loaded");
      displayStatus('Image loaded.');
      formEl().style.display = 'none';
      imgCt().style.display  = 'block';
      imgCt().style.backgroundImage = `url("${src}")`;
    };
    img.onerror = () => showError('Image failed to load.');
    img.src = src;
  }

  function resetCustomMap() {
    dlog("🔄 [ImageLoader] resetCustomMap");
    clearMessages();
    imgCt().style.display = 'none';
    imgCt().style.backgroundImage = '';
    formEl().style.display = 'flex';
    fileInput.value = '';
    urlInput.value  = '';
    displayStatus('Reset to map view.');
    // click the “Map” pill
    document.querySelector('.view-btn[data-view="map"]')?.click();
  }

  // internal helpers
  function displayStatus(msg) {
    if (status()) status().textContent = msg;
  }
  function showError(msg) {
    derr("❌ [ImageLoader]", msg);
    if (typeof window.displayError === 'function') window.displayError(msg);
  }
  function clearMessages() {
    if (typeof window.clearMessages === 'function') window.clearMessages();
  }

  // expose
  window.initCustomImageControls = initCustomImageControls;
  dlog("🚀 [ImageLoader] initCustomImageControls exposed");
})();
