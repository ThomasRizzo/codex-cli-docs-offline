(() => {
  // Astro can run the shared head script again when navigating between layouts.
  if (window.__docsThemeController) {
    window.__docsThemeController();
    return;
  }

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const normalizePreference = (value) =>
    value === "light" || value === "dark" ? value : "system";
  let preference = "system";
  let storedPreference;

  function readPreference() {
    try {
      const stored = localStorage.getItem("theme");
      // Preserve an unsaved choice when writes fail but reads still work.
      if (stored !== storedPreference) {
        storedPreference = stored;
        preference = normalizePreference(stored);
      }
    } catch {
      // Keep the in-memory choice while storage is unavailable.
    }
  }

  function applyTheme(target = document) {
    readPreference();
    const theme =
      preference === "system"
        ? systemTheme.matches
          ? "dark"
          : "light"
        : preference;
    target.documentElement.classList.toggle("dark", theme === "dark");
    target.documentElement.dataset.theme = theme;
    target.querySelectorAll("[data-theme-preference]").forEach((input) => {
      input.checked = input.value === preference;
    });
  }

  function refreshTheme() {
    const style = document.createElement("style");
    style.textContent = "* { transition: none !important; }";
    document.head.appendChild(style);
    applyTheme();
    window.getComputedStyle(style).opacity;
    style.remove();
  }

  function closePicker(picker, restoreFocus = false) {
    picker.open = false;
    if (restoreFocus) picker.querySelector("summary")?.focus();
  }

  document.addEventListener("change", (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    if (!input.matches("[data-theme-preference]")) return;
    preference = normalizePreference(input.value);
    try {
      localStorage.setItem("theme", preference);
      storedPreference = preference;
    } catch {
      // Keep the in-memory preference if the browser blocks persistence.
    }
    refreshTheme();
    const picker = input.closest("[data-theme-picker]");
    if (picker) closePicker(picker, true);
  });

  document.addEventListener("click", (event) => {
    document.querySelectorAll("[data-theme-picker][open]").forEach((picker) => {
      if (!picker.contains(event.target)) closePicker(picker);
    });
  });

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") return;
      const picker = document.querySelector("[data-theme-picker][open]");
      if (!picker) return;
      event.preventDefault();
      event.stopPropagation();
      closePicker(picker, true);
    },
    true
  );

  systemTheme.addEventListener("change", () => {
    readPreference();
    if (preference === "system") refreshTheme();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== "theme" && event.key !== null) return;
    storedPreference = event.newValue;
    preference = normalizePreference(event.newValue);
    refreshTheme();
  });
  // The head script already applied the theme. Sync the newly parsed pickers.
  document.addEventListener("DOMContentLoaded", () => applyTheme());
  document.addEventListener("astro:before-swap", (event) => {
    applyTheme(event.newDocument);
  });
  document.addEventListener("astro:after-swap", refreshTheme);
  window.__docsThemeController = refreshTheme;
  refreshTheme();
})();
