
// 🔍 [Search] js/50_search.js loaded
dlog("🔍 [Search] js/50_search.js loaded");

function initSearch() {
  dlog("🔧 [Search] initSearch()");
  const input = document.getElementById("address-input");
  const list = document.getElementById("autocomplete-list");
  const btn = document.getElementById("search-button");
  const wrapper = input?.closest(".autocomplete-wrapper");
  let controller;

  if (!input || !list || !btn || !wrapper) {
    dwarn("⚠️ [Search] Missing required elements");
    return;
  }

  /** Debounce helper with logging */
  function debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        dlog("⌛ [Search] debounced trigger for:", args[0]);
        fn(...args);
      }, delay);
    };
  }

  /** Clear the autocomplete dropdown */
  function clearList() {
    dlog("🧹 [Search] clearing autocomplete list");
    list.innerHTML = "";
  }

  /** Kick off a Nominatim search */
  async function performSearch(query) {
    clearMessages();
    clearList();

    if (!query.trim()) {
      return displayError("Type something to search 🧐");
    }

    wrapper.classList.add("searching");
    displayStatus("Searching... 🔎");

    if (controller) {
      controller.abort();
      dlog("✂️ [Search] Aborting previous request");
    }
    controller = new AbortController();

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
        { signal: controller.signal, headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error(res.statusText);
      const places = await res.json();

      if (places.length === 0) {
        displayError("No results found 🤷‍♂️");
      } else {
        displayStatus(`Found ${places.length} result${places.length > 1 ? "s" : ""} ✅`);
        dlog("🔎 [Search] populate suggestions");
        places.forEach(place => {
          dlog("🔎 [Search] adding suggestion:", place.display_name);
          const item = document.createElement("li");
          item.textContent = formatAddressByToggle(place);
          item.addEventListener("click", () => selectPlace(place));
          list.appendChild(item);
        });
        dlog("✅ [Search] performSearch() complete — results:", places.length);
      }
    } catch (err) {
      if (err.name === "AbortError") {
        dlog("✂️ [Search] fetch aborted");
      } else {
        derr("❌ [Search] error:", err);
        displayError("Search failed. Check your connection. 🌐");
      }
    } finally {
      wrapper.classList.remove("searching");
    }
  }

  /** Handle user selecting a result */
  function selectPlace(place) {
    clearMessages();
    clearList();
    input.value = place.display_name;
    const formatted = formatAddressByToggle(place);
    updateLocationDisplay(formatted, `Lat: ${place.lat}, Lon: ${place.lon}`);
    dlog("🗺️ [Search] selected:", place.display_name);


    // ———————— PAN THE MAP ——————————
    // assume your Leaflet map instance is in a global `map` variable
    if (typeof map !== 'undefined' && map) {
      // two options: flyTo gives a smooth “glide”
      map.flyTo(
        [parseFloat(place.lat), parseFloat(place.lon)], // lat, lon
        18,                                                // zoom level
        { animate: true, duration: 0.5 }                   // half-second animation
      );

      // OR you can snap immediately with setView:
      // map.setView([ parseFloat(place.lat), parseFloat(place.lon) ], 16);
    }
  }

  // 1) debounce on input
  const onType = debounce(performSearch, 300);
  input.addEventListener("input", () => onType(input.value));

  // 2) click / Enter triggers
  btn.addEventListener("click", () => performSearch(input.value));
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault();
      performSearch(input.value);
    }
  });

  dlog("✅ [Search] initSearch() complete");
}

// expose for global bootstrap
window.initSearch = initSearch;
