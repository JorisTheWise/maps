// ── js/00_utils.js ──
// 1) DEBUG LOGGER SETUP — prints only on localhost/127.0.0.1,
//    and prefixes each call with 🟢/⚠️/❌ [+elapsed ms]
(function(){
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  const noop    = () => {};

  // capture a start timestamp
  const t0 = performance.now();

  function makeLogger(emoji, origFn) {
    return function(...args) {
      const elapsed = Math.round(performance.now() - t0);
      origFn(`${emoji} [+${elapsed}ms]`, ...args);
    };
  }

  if (isLocal) {
    window.dlog  = makeLogger("🟢", console.log.bind(console));
    window.dwarn = makeLogger("⚠️", console.warn.bind(console));
    window.derr  = makeLogger("❌", console.error.bind(console));
  } else {
    window.dlog = window.dwarn = window.derr = noop;
  }
})();

// 1.1) Inject a bit of CSS to hide the scrollbar on the status container
(function(){
  const css = `
    #status-container {
      -ms-overflow-style: none;  /* IE/Edge */
      scrollbar-width: none;     /* Firefox */
    }
    #status-container::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
})();

// 2) QUIET MOZ DEPRECATIONS
if (window.MouseEvent) {
  ["mozPressure","mozInputSource"].forEach(prop => {
    if (!MouseEvent.prototype.hasOwnProperty(prop)) {
      Object.defineProperty(MouseEvent.prototype, prop, {
        get() { return undefined; },
        configurable: true
      });
    }
  });
}

// 3) UTILS LOADED
dlog("🔧 [Utils] 00_utils loaded — setting up display helpers & formatters");

/** Internal: create & show a transient message */
function _showTransient(msg, isError) {
  const container = document.getElementById("status-container");
  if (!container) {
    dwarn("⚠️ [Utils] #status-container element not found");
    return;
  }

  // create message node
  const div = document.createElement("div");
  div.className = "transient-message";
  if (isError) div.classList.add("error");
  div.textContent = msg;
  container.appendChild(div);

  // trigger CSS animation
  requestAnimationFrame(() => div.classList.add("visible"));

  // enforce a maximum number of messages
  const max = parseInt(container.dataset.maxMessages, 10) || 5;
  const all = container.querySelectorAll(".transient-message");
  if (all.length > max) {
    const oldest = all[0];
    oldest.classList.remove("visible");
    oldest.addEventListener("transitionend", () => oldest.remove(), { once: true });
  }

  // schedule auto-remove after 5s
  setTimeout(() => {
    div.classList.remove("visible");
    div.addEventListener("transitionend", () => div.remove(), { once: true });
  }, 5000);
}

/** Show a transient status message. */
function displayStatus(msg) {
  dlog(`✅ [Status] ${msg}`);
  _showTransient(msg, false);
}

/** Show a transient error message. */
function displayError(msg) {
  derr(`❌ [Error] ${msg}`);
  _showTransient(msg, true);
}

/** Clear all outstanding messages immediately. */
function clearMessages() {
  dlog("🧹 [Utils] Clearing all messages");
  const container = document.getElementById("status-container");
  if (container) container.innerHTML = "";
}

/** Copy text to clipboard and show a status. */
function copyToClipboard(text) {
  dlog(`📋 [Clipboard] copying: "${text}"`);
  navigator.clipboard.writeText(text)
    .then(() => {
      dlog("📋 [Clipboard] copy succeeded");
      displayStatus("Copied to clipboard 📋");
    })
    .catch(() => {
      dwarn("⚠️ [Clipboard] copy failed");
      displayError("Failed to copy 🤔");
    });
}

/** Get the current country-format code from the dropdown. */
function getAddressFormat() {
  const cc = document.getElementById("address-format")?.value || "generic";
  dlog(`🌐 [Format] country code: ${cc}`);
  return cc;
}

/** Format a Nominatim place.address into a multi-line postal address. */
function formatAddressByCountry(addr, cc) {
  dlog(`✏️ [Format] formatting for: ${cc}`);
  if (!addr) {
    dwarn("⚠️ [Format] no address object provided");
    return "";
  }
  const lines  = [];
  const company = addr.amenity || addr.building || addr.name;
  const road    = [addr.road, addr.house_number].filter(Boolean).join(" ");
  const city    = addr.city || addr.town || addr.village;
  const pc      = addr.postcode;
  const region  = addr.state;

  if (company) lines.push(company);
  if (road)    lines.push(road);
  cc = cc.toLowerCase();

  switch (cc) {
    case "be":
      if (pc && city) lines.push(`${pc} ${city}`);
      lines.push("BELGIUM 🇧🇪");
      break;
    case "nl":
      if (pc && city) lines.push(`${pc} ${city}`);
      lines.push("THE NETHERLANDS 🇳🇱");
      break;
    case "lu":
      if (pc && city) lines.push(`${pc} ${city}`);
      lines.push("LUXEMBOURG 🇱🇺");
      break;
    case "de":
      if (pc && city) lines.push(`${pc} ${city}`);
      if (region && region !== city) lines.push(region);
      lines.push("GERMANY 🇩🇪");
      break;
    case "fr":
      if (pc && city) lines.push(`${pc} ${city}`);
      lines.push("FRANCE 🇫🇷");
      break;
    case "uk":
      if (road) lines.push(road);
      if (city && pc) lines.push(`${city}, ${pc}`);
      else if (city) lines.push(city);
      lines.push("UNITED KINGDOM 🇬🇧");
      break;
    default:
      if (pc && city)                  lines.push(`${pc} ${city}`);
      if (region && region !== city)   lines.push(region);
      lines.push((addr.country||"").toUpperCase());
  }

  const result = lines.join("\n");
  dlog("✏️ [Format] result:\n" + result);
  return result;
}

/** Format by country based on the dropdown. */
function formatAddressByToggle(place) {
  dlog("🔄 [Format] formatAddressByToggle");
  if (!place.address) {
    dwarn("⚠️ [Format] no place.address — falling back to display_name");
    return place.display_name || "";
  }
  return formatAddressByCountry(place.address, getAddressFormat());
}

/** Update the two text fields in the "Selected Location" card. */
function updateLocationDisplay(address, coords) {
  dlog("🗺️ [Map] updateLocationDisplay →", address, coords);
  document.getElementById("location-address").textContent     = address;
  document.getElementById("location-coordinates").textContent = coords;
  updateSelectedMapLinks();
}

/** Parse “Lat: x, Lon: y” and update the three map-service links. */
function updateSelectedMapLinks() {
  dlog("🔗 [Links] updating map service links");
  const coordEl = document.getElementById("location-coordinates");
  if (!coordEl) {
    dwarn("⚠️ [Links] #location-coordinates not found");
    return;
  }
  const m = coordEl.textContent.match(/Lat:\s*([-\d.]+),\s*Lon:\s*([-\d.]+)/);
  if (!m) {
    dwarn("⚠️ [Links] coordinate parse failed");
    return;
  }
  const [, lat, lon] = m;
  document.getElementById("google-map-link").href = `https://www.google.com/maps?q=${lat},${lon}`;
  document.getElementById("apple-map-link" ).href = `https://maps.apple.com/?ll=${lat},${lon}`;
  document.getElementById("waze-map-link"  ).href = `https://waze.com/ul?ll=${lat},${lon}`;
}

// ── Expose to window ──
window.displayStatus          = displayStatus;
window.displayError           = displayError;
window.clearMessages          = clearMessages;
window.copyToClipboard        = copyToClipboard;
window.getAddressFormat       = getAddressFormat;
window.formatAddressByToggle  = formatAddressByToggle;
window.updateLocationDisplay  = updateLocationDisplay;
window.updateSelectedMapLinks = updateSelectedMapLinks;
