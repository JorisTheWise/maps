// ── js/80_stamps.js ──

dlog("🎯 [Stamps] js/80_stamps.js loaded");

window.activateStampMode = window.activateStampMode || function (key) {
  dwarn(`⚠️ [Stamps] activateStampMode("${key}") before init!`);
};

function initStamps() {
  dlog("🔧 [Stamps] initStamps() starting…");

  const map = window.map;
  const container = document.getElementById("mapImageContainer");
  const imgCt = document.getElementById("customImageContainer");
  const STAMP_SIZE = 40;

  if (!map || !container) {
    derr("❌ [Stamps] init failed: missing map or container");
    return;
  }

  let isStampMode = false;
  let currentStampKey = null;
  let currentStampIcon = null;

  // ── activateStampMode ─────────────────────────────────
  function activateStampMode(key) {
    isStampMode = true;
    currentStampKey = key;
    dlog(`🎯 [Stamps] activateStampMode("${key}")`);

    // find the <label data-stamp="…"> for this key
    const bar = document.getElementById("stampBar");
    const label = bar.querySelector(`[data-stamp="${key}"]`);
    if (!label) {
      dwarn(`⚠️ [Stamps] no label for "${key}"`);
      return;
    }

    const img = label.querySelector("img");
    if (!img?.src) {
      dwarn(`⚠️ [Stamps] no image for "${key}"`);
      return;
    }
    currentStampIcon = img.src;

    // inject a scaled cursor rule (if available)…
    if (window.createScaledCursor) {
      window.createScaledCursor(
        currentStampIcon,
        STAMP_SIZE, STAMP_SIZE,
        (dataURL, hot) => {
          document.getElementById("dynamic-cursor-style")?.remove();
          const style = document.createElement("style");
          style.id = "dynamic-cursor-style";
          style.textContent = `
#mapImageContainer.stamp-mode-active,
#mapImageContainer.stamp-mode-active *,
#stampBar.stamp-mode-active,
#stampBar.stamp-mode-active * {
  cursor: url("${dataURL}") ${hot} ${hot}, crosshair !important;
}
          `;
          document.head.appendChild(style);
          container.classList.add("stamp-mode-active");
          document.getElementById("stampBar").classList.add("stamp-mode-active");
          dlog("🎯 [Stamps] custom cursor injected");
        }
      );
    }
    // …or fall back to a simple crosshair
    else {
      dwarn("⚠️ [Stamps] createScaledCursor unavailable → using default crosshair");
      container.classList.add("stamp-mode-active");
      document.getElementById("stampBar").classList.add("stamp-mode-active");
    }
  }
  window.activateStampMode = activateStampMode;

  // ── cancelStampMode ─────────────────────────────────
  function cancelStampMode() {
    isStampMode = false;
    currentStampKey = null;
    currentStampIcon = null;
    container.classList.remove("stamp-mode-active");
    document.getElementById("stampBar").classList.remove("stamp-mode-active");
    document.getElementById("dynamic-cursor-style")?.remove();
    dlog("✖️ [Stamps] mode cancelled");
  }

  // Escape 💥
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && isStampMode) cancelStampMode();
  });
  dlog("🔧 [Stamps] keyboard listener attached");

  // map clicks
  map.on("click", evt => {
    if (!isStampMode) return dlog("🎯 [Stamps] click ignored (not in stamp mode)");
    if (!currentStampIcon) return dwarn("⚠️ [Stamps] click ignored (no icon set)");

    dlog(`📍 [Stamps] map click at ${evt.latlng}`);
    if (currentStampKey === "number") {
      window.placeMarker(evt.latlng, currentStampIcon, "number");
      window.incrementNumber?.();
    } else {
      window.placeMarker(evt.latlng, currentStampIcon, currentStampKey);
    }
    cancelStampMode();
  });
  dlog("🔧 [Stamps] map click listener attached");

  // custom‐image clicks
  imgCt?.addEventListener("click", e => {
    if (!isStampMode || !currentStampIcon) return;
    const { left, top } = imgCt.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    placeStampOnImage(x, y, currentStampIcon);
    cancelStampMode();
    dlog("🎯 [Stamps] placed stamp on custom image");
  });
  dlog("🔧 [Stamps] image click listener attached");

  function placeStampOnImage(x, y, src) {
    const img = document.createElement("img");
    img.src = src;
    Object.assign(img.style, {
      position: "absolute",
      width: `${STAMP_SIZE}px`,
      height: `${STAMP_SIZE}px`,
      left: `${x - STAMP_SIZE / 2}px`,
      top: `${y - STAMP_SIZE / 2}px`
    });
    imgCt.appendChild(img);
  }

  // ── attach toolbar listener exactly once ─────────────────
  const toolbar = document.getElementById("stampBar");
  toolbar.addEventListener("click", e => {
    const slot = e.target.closest("[data-stamp]");
    if (!slot) return;
    activateStampMode(slot.dataset.stamp);
  });
  dlog("🔧 [Stamps] toolbar click listener attached");

  dlog("✅ [Stamps] initStamps() complete");
}

window.initStamps = initStamps;
