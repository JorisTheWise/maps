// js/theme.js
// 🎨 [Theme] js/theme.js loaded

(function() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) {
    dwarn("⚠️ [Theme] #theme-toggle not found, skipping theme setup");
    return;
  }

  const icon = btn.querySelector("i");
  const txt  = btn.querySelector("span");
  if (!icon || !txt) {
    dwarn("⚠️ [Theme] toggle button missing <i> or <span>");
  }

  function updateButton(theme) {
    if (theme === "dark") {
      icon.classList.replace("fa-sun", "fa-moon");
      txt.textContent = "Dark mode";
    } else {
      icon.classList.replace("fa-moon", "fa-sun");
      txt.textContent = "Light mode";
    }
    dlog(`🌞 [Theme] button now shows ${theme}`);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    updateButton(theme);
  }

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next    = current === "dark" ? "light" : "dark";
    dlog(`🔄 [Theme] toggling to ${next}`);
    applyTheme(next);
  });

  const stored = localStorage.getItem("theme");
  const system = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark" : "light";
  const initial = stored || system;
  dlog(`🌗 [Theme] initial: ${initial} (stored=${stored}, system=${system})`);
  applyTheme(initial);
})();
