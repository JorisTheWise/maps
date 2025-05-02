<<<<<<< HEAD
/***********************************************
 * 1) MAP INITIALIZATION & Default Location
 ***********************************************/
const STAMP_SIZE = 40; // Always syncs marker + cursor icon size

const map = L.map('map').setView([51.143806, 4.387807], 20);
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
window.streetLayer = streetLayer;

document.addEventListener('DOMContentLoaded', () => {
  updateLocationDisplay(
    "DB Video\nKontichsesteenweg 39\n2630 Aartselaar\nBELGIUM",
    "Lat: 51.143806, Lon: 4.387807"
  );
});

// Map click handler for placing stamps/markers
map.on('click', (evt) => {
  if (!isStampMode) return;
  const stampType = currentStampKey;
  isStampMode = false;
  currentStampKey = null;
  const styleTag = document.getElementById('dynamic-cursor-style');
  if (styleTag) styleTag.remove();

  // Update this line to match the class used in activateStampMode
  document.getElementById('stamp-area').classList.remove('stamp-mode-active');

  if (stampType === 'number') {
    const usedNumber = currentNumber;
    const originalUrl = getCircledNumber(usedNumber);
    incrementNumber();
    placeMarker(evt.latlng, originalUrl, stampType);
    createScaledCursor(originalUrl, STAMP_SIZE, STAMP_SIZE, (cursorUrl) => {
      currentStampIconURL = cursorUrl;
    });
  } else {
    placeMarker(evt.latlng, currentStampIconURL, stampType);
  }
});

/***********************************************
 * 2) AUTOCOMPLETE LOGIC (with debouncing)
 ***********************************************/
const addressInputEl = document.getElementById('address-input');
const autocompleteList = document.getElementById('autocomplete-list');
let currentSuggestions = [];
let currentFocus = -1;
let debounceTimer;

addressInputEl.addEventListener('keyup', function (e) {
  const query = addressInputEl.value.trim();
  clearTimeout(debounceTimer);
  if (!query) {
    autocompleteList.innerHTML = '';
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
    handleKeyNavigation(e);
    return;
  }
  debounceTimer = setTimeout(() => {
    document.getElementById("map-loading").style.display = "flex";
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("map-loading").style.display = "none";
        currentSuggestions = data;
        showAutocompleteSuggestions(data);
      })
      .catch(err => {
        document.getElementById("map-loading").style.display = "none";
        console.error(err);
      });
  }, 300);
});

/***********************************************
 * 2B) SHOW AUTOCOMPLETE SUGGESTIONS
 ***********************************************/
function showAutocompleteSuggestions(data) {
  // clear out old items
  autocompleteList.innerHTML = "";
  currentFocus = -1;

  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.display_name;
    li.addEventListener("click", () => {
      addressInputEl.value = item.display_name;
      autocompleteList.innerHTML = "";
      searchAddressByPlace(item);
    });
    autocompleteList.appendChild(li);
  });
}


function handleKeyNavigation(e) {
  const items = autocompleteList.getElementsByTagName('li');
  if (e.key === 'ArrowDown') {
    currentFocus++;
    highlightItem(items);
  } else if (e.key === 'ArrowUp') {
    currentFocus--;
    highlightItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentFocus > -1 && items[currentFocus]) {
      items[currentFocus].click();
    } else {
      if (addressInputEl.value.trim()) {
        searchAddress(addressInputEl.value.trim());
      }
      autocompleteList.innerHTML = '';
    }
  }
}
function highlightItem(items) {
  if (!items) return;
  removeHighlight(items);
  if (currentFocus >= items.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = items.length - 1;
  items[currentFocus].classList.add('autocomplete-active');
}
function removeHighlight(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove('autocomplete-active');
  }
}
document.addEventListener('click', (e) => {
  if (e.target !== addressInputEl) {
    autocompleteList.innerHTML = '';
  }
});

/***********************************************
 * 3) SEARCH FUNCTIONALITY
 ***********************************************/
const searchBtn = document.getElementById('search-button');
searchBtn.addEventListener('click', () => {
  const inputAddr = addressInputEl.value.trim();
  if (!inputAddr) {
    displayError("Please enter an address.");
    return;
  }
  searchAddress(inputAddr);
});

function searchAddress(query) {
  document.getElementById("map-loading").style.display = "flex";
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(query)}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("map-loading").style.display = "none";
      if (!data || data.length === 0) {
        displayError("Address not found.");
        return;
      }
      searchAddressByPlace(data[0]);
    })
    .catch(err => {
      document.getElementById("map-loading").style.display = "none";
      console.error(err);
      displayError("Error fetching data from Nominatim.");
    });
}

function searchAddressByPlace(place) {
  try {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const shortAddr = formatAddressByToggle(place);
    updateLocationDisplay(shortAddr, `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`);
    map.setView([lat, lon], 20);
    clearMessages();
    window.currentPlace = place;
    if (place.address && place.address.country_code) {
      let cc = place.address.country_code.toLowerCase();
      if (cc === "gb") cc = "uk";
      const allowed = ["be", "nl", "lu", "de", "fr", "uk"];
      const dropdown = document.getElementById('address-format');
      if (allowed.includes(cc)) {
        dropdown.value = cc;
        dropdown.disabled = true;
      } else {
        dropdown.disabled = false;
      }
    } else {
      document.getElementById('address-format').disabled = false;
    }
  } catch (e) {
    console.error(e);
    displayError("Error parsing place data.");
  }
}

/***********************************************
 * 4) COUNTRY SELECT CHANGE
 ***********************************************/
document.getElementById('address-format').addEventListener('change', function () {
  if (!this.disabled && window.currentPlace) {
    const formatted = formatAddressByToggle(window.currentPlace);
    updateLocationDisplay(formatted, document.getElementById('location-coordinates').textContent);
  }
});


/***********************************************
 * 5) INITIALIZATION
 ***********************************************/
document.addEventListener('DOMContentLoaded', () => {
  updateLocationDisplay(
    "DB Video\nKontichsesteenweg 39\n2630 Aartselaar\nBELGIUM",
    "Lat: 51.143806, Lon: 4.387807"
  );
  map.setView([51.143806, 4.387807], 20);
  initializeCustomMapControls();
  initializeFileUpload();
});

/***********************************************
 * 6) STAMP MODE BEHAVIOR & CURSOR HANDLING
 ***********************************************/
function activateStampMode(key) {
  isStampMode = true;
  currentStampKey = key;

  const stampImageElement = document.querySelector(`label[onclick*="${key}"] img`);
  if (!stampImageElement) return;

  const imageUrl = stampImageElement.src;
  currentStampIconURL = imageUrl;

  const size = STAMP_SIZE;
  const hotspot = Math.floor(size / 2);

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    const dataURL = canvas.toDataURL("image/png");

    // Set custom cursor style
    const styleTag = document.createElement("style");
    styleTag.id = "dynamic-cursor-style";
    styleTag.textContent = `
      #stamp-area.stamp-mode-active, 
      #stamp-area.stamp-mode-active * {
        cursor: url("${dataURL}") ${hotspot} ${hotspot}, crosshair !important;
      }
    `;
    document.head.appendChild(styleTag);

    const stampArea = document.getElementById("stamp-area");
    stampArea.classList.add("stamp-mode-active");
  };

  img.onerror = function () {
    console.error("❌ Failed to load stamp image for cursor:", imageUrl);

    // Fallback to crosshair if image loading fails
    const styleTag = document.createElement("style");
    styleTag.id = "dynamic-cursor-style";
    styleTag.textContent = `
      #stamp-area.stamp-mode-active, 
      #stamp-area.stamp-mode-active * {
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(styleTag);

    const stampArea = document.getElementById("stamp-area");
    stampArea.classList.add("stamp-mode-active");
  };
}

// Cancel stamp mode with the Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && isStampMode) {
    isStampMode = false;
    currentStampKey = null;

    const stampArea = document.getElementById("stamp-area");
    stampArea.classList.remove("stamp-mode-active");

    const styleTag = document.getElementById("dynamic-cursor-style");
    if (styleTag) styleTag.remove();
  }
});

/***********************************************
 * 6A) STAMP ON CUSTOM IMAGE (for Image Mode)
 ***********************************************/
document.getElementById('customImageContainer').addEventListener('click', function (e) {
  if (!isStampMode) return;  // Only process if stamp mode is active

  // Disable stamp mode
  isStampMode = false;
  currentStampKey = null;

  // Remove dynamic cursor style if it exists
  const styleTag = document.getElementById('dynamic-cursor-style');
  if (styleTag) styleTag.remove();

  // Remove active class (if added during stamp activation)
  this.classList.remove("stamp-mode-active");

  // Calculate the click coordinates relative to the container
  const rect = this.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Place the stamp on the custom image
  placeStampOnImage(x, y, currentStampIconURL);
});

function placeStampOnImage(x, y, stampUrl) {
  // Create an image element for the stamp
  const stamp = document.createElement("img");
  stamp.src = stampUrl;
  stamp.style.position = "absolute";
  stamp.style.width = STAMP_SIZE + "px";
  stamp.style.height = STAMP_SIZE + "px";
  // Center the stamp at the click location
  stamp.style.left = (x - STAMP_SIZE / 2) + "px";
  stamp.style.top = (y - STAMP_SIZE / 2) + "px";
  // Append the stamp image to the custom image container
  document.getElementById('customImageContainer').appendChild(stamp);
}


/***********************************************
 * 7A) DRAG AND DROP CUSTOM MAP: Event Listeners
 ***********************************************/
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const mapElement = document.getElementById('map');
  const customMapForm = document.getElementById('custom-map-form');
  const customImageContainer = document.getElementById('customImageContainer'); // NEW
  const customMapUrlInput = document.getElementById('customMapUrl');
  const toggleCheckbox = document.getElementById('toggle_map');

  // Make the entire drop zone clickable to open the file browser
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag & Drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) {
      loadCustomMap(files[0]);
    }
  });

  // File input change event: load the selected file
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      loadCustomMap(fileInput.files[0]);
    }
  });

  // URL input: apply image immediately when the input changes
  if (customMapUrlInput) {
    customMapUrlInput.addEventListener('change', () => {
      const url = customMapUrlInput.value.trim();
      if (url !== '') {
        applyCustomMap(url);
      }
    });
  }
  
  /***********************************************
   * 7B) HELPER FUNCTIONS: File & URL Handling and Error Feedback
   ***********************************************/

  // Helper: Load custom map from file
  function loadCustomMap(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      if (toggleCheckbox && toggleCheckbox.checked) {
        // In Image Mode: apply the loaded image to the custom image container
        customImageContainer.style.backgroundImage = `url(${event.target.result})`;
        customImageContainer.style.backgroundSize = 'cover';
        customImageContainer.style.backgroundPosition = 'center';
        customImageContainer.style.display = 'block';
        // Hide the custom map form once an image is loaded
        customMapForm.style.display = 'none';
      } else {
        // Otherwise, update the map element (if needed)
        mapElement.style.backgroundImage = `url(${event.target.result})`;
        mapElement.style.backgroundSize = 'cover';
        mapElement.style.backgroundColor = 'transparent';
      }
    };
    reader.readAsDataURL(file);
  }

  // Helper: Apply custom map from URL
  function applyCustomMap(url) {
    if (!validateImageUrl(url)) {
      showInvalidUrlError("Please enter a valid image URL");
      // Clear the URL field on invalid input
      customMapUrlInput.value = '';
      return; // Stop loading the image
    }
    // Valid URL: clear the URL field
    customMapUrlInput.value = '';
    if (toggleCheckbox && toggleCheckbox.checked) {
      customImageContainer.style.backgroundImage = `url(${url})`;
      customImageContainer.style.backgroundSize = 'cover';
      customImageContainer.style.backgroundPosition = 'center';
      customImageContainer.style.display = 'block';
      customMapForm.style.display = 'none';
    } else {
      mapElement.style.backgroundImage = `url(${url})`;
      mapElement.style.backgroundSize = 'cover';
      mapElement.style.backgroundColor = 'transparent';
    }
  }

  // Helper: Validate image URL (basic check for common image extensions)
  function validateImageUrl(url) {
    const pattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    return pattern.test(url);
  }

  // Helper: Show error feedback by switching icon and placeholder text temporarily
  function showInvalidUrlError(message) {
    const urlIcon = document.getElementById('url-icon');
    const oldClass = urlIcon.className;
    const oldColor = urlIcon.style.color;
    const oldPlaceholder = customMapUrlInput.placeholder;

    // Switch icon to a red "X"
    urlIcon.classList.remove('fa-globe');
    urlIcon.classList.add('fa-times');
    urlIcon.style.color = 'red';

    // Update placeholder text to show error message
    customMapUrlInput.placeholder = message;

    // Revert to original state after 3 seconds
    setTimeout(() => {
      urlIcon.className = oldClass;
      urlIcon.style.color = oldColor;
      customMapUrlInput.placeholder = oldPlaceholder;
    }, 3000);
  }
});


/***********************************************
 * 8) CUSTOM MAP TOGGLE (Map ↔ Image)
 ***********************************************/
document.getElementById('toggle_map').addEventListener('change', function () {
  const mapEl                = document.getElementById('map');
  const searchSection        = document.getElementById('search-section');
  const resetSection         = document.getElementById('reset-section');
  const customMapForm        = document.getElementById('custom-map-form');
  const customImageContainer = document.getElementById('customImageContainer');
  const fileInput            = document.getElementById('fileInput');
  const customMapUrlInput    = document.getElementById('customMapUrl');

  if (this.checked) {
    // IMAGE MODE
    mapEl.style.display         = 'none';
    searchSection.style.display = 'none';  // hide the entire search form
    resetSection.style.display  = 'flex';  // show the reset button

    // if an image is already loaded, show it; otherwise show the form
    if (
      customImageContainer.style.backgroundImage &&
      customImageContainer.style.backgroundImage !== 'none'
    ) {
      customImageContainer.style.display = 'block';
      customMapForm.style.display       = 'none';
    } else {
      customMapForm.style.display       = 'flex';
      customImageContainer.style.display= 'none';
    }
  } else {
    // MAP MODE
    mapEl.style.display         = 'block';
    searchSection.style.display = 'flex';  // restore flex layout for form
    resetSection.style.display  = 'none';  // hide the reset button

    // hide/clear any custom‑map UI
    customMapForm.style.display        = 'none';
    customImageContainer.style.display = 'none';
    customImageContainer.style.backgroundImage = '';
    customMapUrlInput.value            = '';
    fileInput.value                    = '';

    // restore the Leaflet tiles
    if (!map.hasLayer(window.streetLayer)) {
      window.streetLayer.addTo(map);
    }
  }
});



/***********************************************
 * 9) RESET AFTER REFRESH
 ***********************************************/
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('toggle_map');
  toggle.checked = false;

  const mapEl = document.getElementById('map');
  const customMapForm = document.getElementById('custom-map-form');
  mapEl.style.display = 'block';
  customMapForm.style.display = 'none';
  document.getElementById('customMapUrl').value = '';
});


/***********************************************
 * 10) RESET BUTTON CUSTOM MAP MODE
 ***********************************************/
document.getElementById('resetImageMode').addEventListener('click', () => {
  const customImageContainer = document.getElementById('customImageContainer');
  const fileInput = document.getElementById('fileInput');
  const customMapUrlInput = document.getElementById('customMapUrl');
  const customMapForm = document.getElementById('custom-map-form');

  // Remove the custom image
  customImageContainer.style.backgroundImage = '';
  customImageContainer.style.display = 'none';

  // Clear file & URL inputs
  fileInput.value = '';
  customMapUrlInput.value = '';

  // Show the upload form again
  customMapForm.style.display = 'flex';
});



/***********************************************
 * 11) COPY Function
 ***********************************************/
function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log("Copied to clipboard:", text);
      // Optionally, display a temporary tooltip or notification here.
    })
    .catch(err => {
      console.error("Failed to copy:", err);
    });
}

// Attach event listeners for copy icons (for address and coordinates)
document.querySelectorAll('.copy-icon').forEach(icon => {
  icon.addEventListener('click', function(e) {
    e.stopPropagation();
    // Find the closest row containing the text
    const parentRow = this.closest('.location-row');
    if (parentRow) {
      const rowLeft = parentRow.querySelector('.row-left');
      if (rowLeft) {
        const textEl = rowLeft.querySelector('.row-text');
        if (textEl && textEl.innerText.trim() !== "") {
          copyText(textEl.innerText);
        }
      }
    }
  });
});

// Attach event listeners for app link clicks
document.querySelectorAll('.app-links a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent the default anchor behavior
    const url = this.getAttribute('href');
    copyText(url);
    // Then open the link in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  });
});

=======
/***********************************************
 * 1) MAP INITIALIZATION & Default Location
 ***********************************************/
const STAMP_SIZE = 40; // Always syncs marker + cursor icon size

const map = L.map('map').setView([51.143806, 4.387807], 20);
const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);
window.streetLayer = streetLayer;

document.addEventListener('DOMContentLoaded', () => {
  updateLocationDisplay(
    "DB Video\nKontichsesteenweg 39\n2630 Aartselaar\nBELGIUM",
    "Lat: 51.143806, Lon: 4.387807"
  );
});

// Map click handler for placing stamps/markers
map.on('click', (evt) => {
  if (!isStampMode) return;
  const stampType = currentStampKey;
  isStampMode = false;
  currentStampKey = null;
  const styleTag = document.getElementById('dynamic-cursor-style');
  if (styleTag) styleTag.remove();

  // Update this line to match the class used in activateStampMode
  document.getElementById('stamp-area').classList.remove('stamp-mode-active');

  if (stampType === 'number') {
    const usedNumber = currentNumber;
    const originalUrl = getCircledNumber(usedNumber);
    incrementNumber();
    placeMarker(evt.latlng, originalUrl, stampType);
    createScaledCursor(originalUrl, STAMP_SIZE, STAMP_SIZE, (cursorUrl) => {
      currentStampIconURL = cursorUrl;
    });
  } else {
    placeMarker(evt.latlng, currentStampIconURL, stampType);
  }
});

/***********************************************
 * 2) AUTOCOMPLETE LOGIC (with debouncing)
 ***********************************************/
const addressInputEl = document.getElementById('address-input');
const autocompleteList = document.getElementById('autocomplete-list');
let currentSuggestions = [];
let currentFocus = -1;
let debounceTimer;

addressInputEl.addEventListener('keyup', function (e) {
  const query = addressInputEl.value.trim();
  clearTimeout(debounceTimer);
  if (!query) {
    autocompleteList.innerHTML = '';
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
    handleKeyNavigation(e);
    return;
  }
  debounceTimer = setTimeout(() => {
    document.getElementById("map-loading").style.display = "flex";
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("map-loading").style.display = "none";
        currentSuggestions = data;
        showAutocompleteSuggestions(data);
      })
      .catch(err => {
        document.getElementById("map-loading").style.display = "none";
        console.error(err);
      });
  }, 300);
});

/***********************************************
 * 2B) SHOW AUTOCOMPLETE SUGGESTIONS
 ***********************************************/
function showAutocompleteSuggestions(data) {
  // clear out old items
  autocompleteList.innerHTML = "";
  currentFocus = -1;

  data.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item.display_name;
    li.addEventListener("click", () => {
      addressInputEl.value = item.display_name;
      autocompleteList.innerHTML = "";
      searchAddressByPlace(item);
    });
    autocompleteList.appendChild(li);
  });
}


function handleKeyNavigation(e) {
  const items = autocompleteList.getElementsByTagName('li');
  if (e.key === 'ArrowDown') {
    currentFocus++;
    highlightItem(items);
  } else if (e.key === 'ArrowUp') {
    currentFocus--;
    highlightItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (currentFocus > -1 && items[currentFocus]) {
      items[currentFocus].click();
    } else {
      if (addressInputEl.value.trim()) {
        searchAddress(addressInputEl.value.trim());
      }
      autocompleteList.innerHTML = '';
    }
  }
}
function highlightItem(items) {
  if (!items) return;
  removeHighlight(items);
  if (currentFocus >= items.length) currentFocus = 0;
  if (currentFocus < 0) currentFocus = items.length - 1;
  items[currentFocus].classList.add('autocomplete-active');
}
function removeHighlight(items) {
  for (let i = 0; i < items.length; i++) {
    items[i].classList.remove('autocomplete-active');
  }
}
document.addEventListener('click', (e) => {
  if (e.target !== addressInputEl) {
    autocompleteList.innerHTML = '';
  }
});

/***********************************************
 * 3) SEARCH FUNCTIONALITY
 ***********************************************/
const searchBtn = document.getElementById('search-button');
searchBtn.addEventListener('click', () => {
  const inputAddr = addressInputEl.value.trim();
  if (!inputAddr) {
    displayError("Please enter an address.");
    return;
  }
  searchAddress(inputAddr);
});

function searchAddress(query) {
  document.getElementById("map-loading").style.display = "flex";
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(query)}`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      document.getElementById("map-loading").style.display = "none";
      if (!data || data.length === 0) {
        displayError("Address not found.");
        return;
      }
      searchAddressByPlace(data[0]);
    })
    .catch(err => {
      document.getElementById("map-loading").style.display = "none";
      console.error(err);
      displayError("Error fetching data from Nominatim.");
    });
}

function searchAddressByPlace(place) {
  try {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const shortAddr = formatAddressByToggle(place);
    updateLocationDisplay(shortAddr, `Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`);
    map.setView([lat, lon], 20);
    clearMessages();
    window.currentPlace = place;
    if (place.address && place.address.country_code) {
      let cc = place.address.country_code.toLowerCase();
      if (cc === "gb") cc = "uk";
      const allowed = ["be", "nl", "lu", "de", "fr", "uk"];
      const dropdown = document.getElementById('address-format');
      if (allowed.includes(cc)) {
        dropdown.value = cc;
        dropdown.disabled = true;
      } else {
        dropdown.disabled = false;
      }
    } else {
      document.getElementById('address-format').disabled = false;
    }
  } catch (e) {
    console.error(e);
    displayError("Error parsing place data.");
  }
}

/***********************************************
 * 4) COUNTRY SELECT CHANGE
 ***********************************************/
document.getElementById('address-format').addEventListener('change', function () {
  if (!this.disabled && window.currentPlace) {
    const formatted = formatAddressByToggle(window.currentPlace);
    updateLocationDisplay(formatted, document.getElementById('location-coordinates').textContent);
  }
});


/***********************************************
 * 5) INITIALIZATION
 ***********************************************/
document.addEventListener('DOMContentLoaded', () => {
  updateLocationDisplay(
    "DB Video\nKontichsesteenweg 39\n2630 Aartselaar\nBELGIUM",
    "Lat: 51.143806, Lon: 4.387807"
  );
  map.setView([51.143806, 4.387807], 20);
  initializeCustomMapControls();
  initializeFileUpload();
});

/***********************************************
 * 6) STAMP MODE BEHAVIOR & CURSOR HANDLING
 ***********************************************/
function activateStampMode(key) {
  isStampMode = true;
  currentStampKey = key;

  const stampImageElement = document.querySelector(`label[onclick*="${key}"] img`);
  if (!stampImageElement) return;

  const imageUrl = stampImageElement.src;
  currentStampIconURL = imageUrl;

  const size = STAMP_SIZE;
  const hotspot = Math.floor(size / 2);

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageUrl;

  img.onload = function () {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, size, size);
    const dataURL = canvas.toDataURL("image/png");

    // Set custom cursor style
    const styleTag = document.createElement("style");
    styleTag.id = "dynamic-cursor-style";
    styleTag.textContent = `
      #stamp-area.stamp-mode-active, 
      #stamp-area.stamp-mode-active * {
        cursor: url("${dataURL}") ${hotspot} ${hotspot}, crosshair !important;
      }
    `;
    document.head.appendChild(styleTag);

    const stampArea = document.getElementById("stamp-area");
    stampArea.classList.add("stamp-mode-active");
  };

  img.onerror = function () {
    console.error("❌ Failed to load stamp image for cursor:", imageUrl);

    // Fallback to crosshair if image loading fails
    const styleTag = document.createElement("style");
    styleTag.id = "dynamic-cursor-style";
    styleTag.textContent = `
      #stamp-area.stamp-mode-active, 
      #stamp-area.stamp-mode-active * {
        cursor: crosshair !important;
      }
    `;
    document.head.appendChild(styleTag);

    const stampArea = document.getElementById("stamp-area");
    stampArea.classList.add("stamp-mode-active");
  };
}

// Cancel stamp mode with the Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && isStampMode) {
    isStampMode = false;
    currentStampKey = null;

    const stampArea = document.getElementById("stamp-area");
    stampArea.classList.remove("stamp-mode-active");

    const styleTag = document.getElementById("dynamic-cursor-style");
    if (styleTag) styleTag.remove();
  }
});

/***********************************************
 * 6A) STAMP ON CUSTOM IMAGE (for Image Mode)
 ***********************************************/
document.getElementById('customImageContainer').addEventListener('click', function (e) {
  if (!isStampMode) return;  // Only process if stamp mode is active

  // Disable stamp mode
  isStampMode = false;
  currentStampKey = null;

  // Remove dynamic cursor style if it exists
  const styleTag = document.getElementById('dynamic-cursor-style');
  if (styleTag) styleTag.remove();

  // Remove active class (if added during stamp activation)
  this.classList.remove("stamp-mode-active");

  // Calculate the click coordinates relative to the container
  const rect = this.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // Place the stamp on the custom image
  placeStampOnImage(x, y, currentStampIconURL);
});

function placeStampOnImage(x, y, stampUrl) {
  // Create an image element for the stamp
  const stamp = document.createElement("img");
  stamp.src = stampUrl;
  stamp.style.position = "absolute";
  stamp.style.width = STAMP_SIZE + "px";
  stamp.style.height = STAMP_SIZE + "px";
  // Center the stamp at the click location
  stamp.style.left = (x - STAMP_SIZE / 2) + "px";
  stamp.style.top = (y - STAMP_SIZE / 2) + "px";
  // Append the stamp image to the custom image container
  document.getElementById('customImageContainer').appendChild(stamp);
}


/***********************************************
 * 7A) DRAG AND DROP CUSTOM MAP: Event Listeners
 ***********************************************/
document.addEventListener('DOMContentLoaded', () => {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const mapElement = document.getElementById('map');
  const customMapForm = document.getElementById('custom-map-form');
  const customImageContainer = document.getElementById('customImageContainer'); // NEW
  const customMapUrlInput = document.getElementById('customMapUrl');
  const toggleCheckbox = document.getElementById('toggle_map');

  // Make the entire drop zone clickable to open the file browser
  dropZone.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag & Drop events
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) {
      loadCustomMap(files[0]);
    }
  });

  // File input change event: load the selected file
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      loadCustomMap(fileInput.files[0]);
    }
  });

  // URL input: apply image immediately when the input changes
  if (customMapUrlInput) {
    customMapUrlInput.addEventListener('change', () => {
      const url = customMapUrlInput.value.trim();
      if (url !== '') {
        applyCustomMap(url);
      }
    });
  }
  
  /***********************************************
   * 7B) HELPER FUNCTIONS: File & URL Handling and Error Feedback
   ***********************************************/

  // Helper: Load custom map from file
  function loadCustomMap(file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      if (toggleCheckbox && toggleCheckbox.checked) {
        // In Image Mode: apply the loaded image to the custom image container
        customImageContainer.style.backgroundImage = `url(${event.target.result})`;
        customImageContainer.style.backgroundSize = 'cover';
        customImageContainer.style.backgroundPosition = 'center';
        customImageContainer.style.display = 'block';
        // Hide the custom map form once an image is loaded
        customMapForm.style.display = 'none';
      } else {
        // Otherwise, update the map element (if needed)
        mapElement.style.backgroundImage = `url(${event.target.result})`;
        mapElement.style.backgroundSize = 'cover';
        mapElement.style.backgroundColor = 'transparent';
      }
    };
    reader.readAsDataURL(file);
  }

  // Helper: Apply custom map from URL
  function applyCustomMap(url) {
    if (!validateImageUrl(url)) {
      showInvalidUrlError("Please enter a valid image URL");
      // Clear the URL field on invalid input
      customMapUrlInput.value = '';
      return; // Stop loading the image
    }
    // Valid URL: clear the URL field
    customMapUrlInput.value = '';
    if (toggleCheckbox && toggleCheckbox.checked) {
      customImageContainer.style.backgroundImage = `url(${url})`;
      customImageContainer.style.backgroundSize = 'cover';
      customImageContainer.style.backgroundPosition = 'center';
      customImageContainer.style.display = 'block';
      customMapForm.style.display = 'none';
    } else {
      mapElement.style.backgroundImage = `url(${url})`;
      mapElement.style.backgroundSize = 'cover';
      mapElement.style.backgroundColor = 'transparent';
    }
  }

  // Helper: Validate image URL (basic check for common image extensions)
  function validateImageUrl(url) {
    const pattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    return pattern.test(url);
  }

  // Helper: Show error feedback by switching icon and placeholder text temporarily
  function showInvalidUrlError(message) {
    const urlIcon = document.getElementById('url-icon');
    const oldClass = urlIcon.className;
    const oldColor = urlIcon.style.color;
    const oldPlaceholder = customMapUrlInput.placeholder;

    // Switch icon to a red "X"
    urlIcon.classList.remove('fa-globe');
    urlIcon.classList.add('fa-times');
    urlIcon.style.color = 'red';

    // Update placeholder text to show error message
    customMapUrlInput.placeholder = message;

    // Revert to original state after 3 seconds
    setTimeout(() => {
      urlIcon.className = oldClass;
      urlIcon.style.color = oldColor;
      customMapUrlInput.placeholder = oldPlaceholder;
    }, 3000);
  }
});


/***********************************************
 * 8) CUSTOM MAP TOGGLE (Map ↔ Image)
 ***********************************************/
document.getElementById('toggle_map').addEventListener('change', function () {
  const mapEl                = document.getElementById('map');
  const searchSection        = document.getElementById('search-section');
  const resetSection         = document.getElementById('reset-section');
  const customMapForm        = document.getElementById('custom-map-form');
  const customImageContainer = document.getElementById('customImageContainer');
  const fileInput            = document.getElementById('fileInput');
  const customMapUrlInput    = document.getElementById('customMapUrl');

  if (this.checked) {
    // IMAGE MODE
    mapEl.style.display         = 'none';
    searchSection.style.display = 'none';  // hide the entire search form
    resetSection.style.display  = 'flex';  // show the reset button

    // if an image is already loaded, show it; otherwise show the form
    if (
      customImageContainer.style.backgroundImage &&
      customImageContainer.style.backgroundImage !== 'none'
    ) {
      customImageContainer.style.display = 'block';
      customMapForm.style.display       = 'none';
    } else {
      customMapForm.style.display       = 'flex';
      customImageContainer.style.display= 'none';
    }
  } else {
    // MAP MODE
    mapEl.style.display         = 'block';
    searchSection.style.display = 'flex';  // restore flex layout for form
    resetSection.style.display  = 'none';  // hide the reset button

    // hide/clear any custom‑map UI
    customMapForm.style.display        = 'none';
    customImageContainer.style.display = 'none';
    customImageContainer.style.backgroundImage = '';
    customMapUrlInput.value            = '';
    fileInput.value                    = '';

    // restore the Leaflet tiles
    if (!map.hasLayer(window.streetLayer)) {
      window.streetLayer.addTo(map);
    }
  }
});



/***********************************************
 * 9) RESET AFTER REFRESH
 ***********************************************/
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('toggle_map');
  toggle.checked = false;

  const mapEl = document.getElementById('map');
  const customMapForm = document.getElementById('custom-map-form');
  mapEl.style.display = 'block';
  customMapForm.style.display = 'none';
  document.getElementById('customMapUrl').value = '';
});


/***********************************************
 * 10) RESET BUTTON CUSTOM MAP MODE
 ***********************************************/
document.getElementById('resetImageMode').addEventListener('click', () => {
  const customImageContainer = document.getElementById('customImageContainer');
  const fileInput = document.getElementById('fileInput');
  const customMapUrlInput = document.getElementById('customMapUrl');
  const customMapForm = document.getElementById('custom-map-form');

  // Remove the custom image
  customImageContainer.style.backgroundImage = '';
  customImageContainer.style.display = 'none';

  // Clear file & URL inputs
  fileInput.value = '';
  customMapUrlInput.value = '';

  // Show the upload form again
  customMapForm.style.display = 'flex';
});



/***********************************************
 * 11) COPY Function
 ***********************************************/
function copyText(text) {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log("Copied to clipboard:", text);
      // Optionally, display a temporary tooltip or notification here.
    })
    .catch(err => {
      console.error("Failed to copy:", err);
    });
}

// Attach event listeners for copy icons (for address and coordinates)
document.querySelectorAll('.copy-icon').forEach(icon => {
  icon.addEventListener('click', function(e) {
    e.stopPropagation();
    // Find the closest row containing the text
    const parentRow = this.closest('.location-row');
    if (parentRow) {
      const rowLeft = parentRow.querySelector('.row-left');
      if (rowLeft) {
        const textEl = rowLeft.querySelector('.row-text');
        if (textEl && textEl.innerText.trim() !== "") {
          copyText(textEl.innerText);
        }
      }
    }
  });
});

// Attach event listeners for app link clicks
document.querySelectorAll('.app-links a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault(); // Prevent the default anchor behavior
    const url = this.getAttribute('href');
    copyText(url);
    // Then open the link in a new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  });
});

>>>>>>> 4608c60 (chore: CSS refactor for location cards)
