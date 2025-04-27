// ── js/40_country.js ──
// 40.00 COUNTRY DROPDOWN & ADDRESS FORMATTING HELPERS

dlog("🌐 [Country] js/40_country.js loaded");

/**
 * Update the “Country” dropdown to the given code (e.g. "be", "fr", etc.).
 * If the code isn’t in the list, we warn instead of silently failing.
 */
function updateCountryDropdown(countryCode) {
  dlog(`🔄 [Country] updateCountryDropdown("${countryCode}")`);
  const sel = document.getElementById('address-format');
  if (!sel) {
    dwarn("⚠️ [Country] <select id=\"address-format\"> not found");
    return;
  }
  if (!countryCode) {
    dwarn("⚠️ [Country] no countryCode provided");
    return;
  }

  const code = countryCode.toLowerCase();
  const match = Array.from(sel.options).find(o => o.value === code);
  if (match) {
    sel.value = code;
    dlog(`✅ [Country] dropdown set to "${code}"`);
  } else {
    dwarn(`⚠️ [Country] value "${code}" not present in dropdown`);
  }
}

/**
 * Wire up the country‐selector so that changing it re‐formats
 * the “Selected Location” card (if we’ve already picked a place).
 */
function initCountryDropdown() {
  dlog("🔧 [Country] initCountryDropdown()");
  const sel = document.getElementById('address-format');
  if (!sel) {
    dwarn("⚠️ [Country] #address-format not found, skipping init");
    return;
  }

  sel.addEventListener('change', () => {
    const newCode = sel.value;
    dlog(`🌍 [Country] user changed country to "${newCode}"`);

    // if we have a place already, re‐format the address & update UI
    if (window.currentPlace && typeof updateLocationDisplay === 'function') {
      const coordsText = document.getElementById('location-coordinates')?.textContent || '';
      const formatted = formatAddressByToggle(window.currentPlace);
      updateLocationDisplay(formatted, coordsText);
      dlog("✅ [Country] Selected Location re-formatted");
    }
  });

  dlog("✅ [Country] initCountryDropdown() complete");
}

// expose for global use
window.updateCountryDropdown = updateCountryDropdown;
window.initCountryDropdown   = initCountryDropdown;
