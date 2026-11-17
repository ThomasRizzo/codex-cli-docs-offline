/* Offline stand-in for the live ContentModeSelector React island.
   Variant copy is already in the HTML ([data-content-mode-switch]); per-block
   inline scripts show/hide it on `content-mode:set` and on ?surface= / localStorage.
   This hook only makes the "Using:" dropdown work without the unmirrored Astro client. */
(function () {
  if (window.__offlineContentModeBound) return;
  window.__offlineContentModeBound = true;

  var STORAGE_KEY = "oai/docs/contentMode";
  var DEFINITIONS = {
    "codex-surface": {
      title: "Using:",
      key: "codex-surface",
      queryParam: "surface",
      alwaysIncludeQueryParam: true,
      defaultChoice: "app",
      choices: {
        app: { label: "ChatGPT desktop app", description: "Projects, files, and longer tasks on desktop.", icon: "chatgpt-app.webp" },
        web: { label: "ChatGPT web", description: "Chats, projects, and Work in your browser.", icon: "web" },
        cli: { label: "Codex CLI", description: "Codex in your terminal.", icon: "cli" },
        ide: { label: "Codex IDE extension", description: "Codex in your editor.", icon: "vscode.webp" }
      }
    }
  };

  function hostBase() {
    var els = document.querySelectorAll('script[src*="offline-content-mode.js"]');
    var el = els[els.length - 1];
    if (el && el.src) return new URL("../", el.src);
    var ob = document.getElementById("ob");
    var root = (ob && ob.getAttribute("data-root")) || "./";
    return new URL(root + "learn.chatgpt.com/", location.href);
  }

  function iconUrl(file) {
    return new URL("images/codex/surface-icons/" + file, hostBase()).href;
  }

  function svgIcon(kind) {
    if (kind === "cli") {
      return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>';
    }
    return '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" class="h-5 w-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/></svg>';
  }

  function iconHTML(choice) {
    if (!choice || !choice.icon) return "";
    if (choice.icon === "cli" || choice.icon === "web") return svgIcon(choice.icon);
    return '<img src="' + escapeHtml(iconUrl(choice.icon)) + '" alt="" aria-hidden="true" draggable="false" class="h-5 w-5 shrink-0 object-contain">';
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function parseAstroProps(raw) {
    if (!raw) return {};
    try {
      var decoded = raw
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'");
      var data = JSON.parse(decoded);
      function unwrap(v) {
        if (Array.isArray(v) && v.length >= 2 && v[0] === 0) return v[1];
        if (Array.isArray(v) && v.length >= 2 && v[0] === 1) return v[1].map(unwrap);
        return v;
      }
      var out = {};
      Object.keys(data).forEach(function (k) { out[k] = unwrap(data[k]); });
      return out;
    } catch (e) {
      return {};
    }
  }

  function readStore() {
    try {
      var v = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return v && typeof v === "object" ? v : {};
    } catch (e) {
      return {};
    }
  }

  function writeStore(group, value) {
    var v = readStore();
    v[group] = value;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)); } catch (e) {}
  }

  function filterChoices(def, available) {
    var keys = Object.keys(def.choices);
    if (!available || available === "all") return keys;
    if (!Array.isArray(available)) return keys;
    return available.filter(function (k) { return def.choices[k]; });
  }

  function resolveValue(def, availableKeys) {
    var param = def.queryParam || def.key;
    var params = new URLSearchParams(location.search);
    var fromQuery = params.get(param) ?? params.get(def.key);
    if (fromQuery !== null) {
      return availableKeys.indexOf(fromQuery) >= 0 ? fromQuery : (availableKeys.indexOf(def.defaultChoice) >= 0 ? def.defaultChoice : availableKeys[0]);
    }
    var stored = readStore()[def.key];
    if (stored && availableKeys.indexOf(stored) >= 0) return stored;
    return availableKeys.indexOf(def.defaultChoice) >= 0 ? def.defaultChoice : availableKeys[0];
  }

  function setQuery(def, value) {
    var param = def.queryParam || def.key;
    var url = new URL(location.href);
    url.searchParams.delete(def.key);
    if (def.alwaysIncludeQueryParam || value !== def.defaultChoice) url.searchParams.set(param, value);
    else url.searchParams.delete(param);
    history.replaceState({}, "", url.pathname + url.search + url.hash);
  }

  function setMode(def, value, opts) {
    opts = opts || {};
    writeStore(def.key, value);
    setQuery(def, value);
    document.dispatchEvent(new CustomEvent("content-mode:set", { bubbles: true, detail: { group: def.key, value: value } }));
    if (!opts.skipSync) syncTriggers(def.key, value);
  }

  function ensureStyle() {
    if (document.getElementById("offline-content-mode-style")) return;
    var st = document.createElement("style");
    st.id = "offline-content-mode-style";
    st.textContent =
      ".offline-cm-menu{position:absolute;z-index:80;min-width:280px;max-width:min(24rem,calc(100vw - 1.5rem));margin-top:.35rem;" +
      "background:var(--color-surface,Canvas);color:inherit;border:1px solid var(--color-primary-surface,rgba(127,127,127,.25));" +
      "border-radius:14px;box-shadow:0 12px 40px rgba(0,0,0,.16);padding:.35rem;box-sizing:border-box}" +
      ".offline-cm-menu[data-align=end]{right:0;left:auto}" +
      ".offline-cm-option{display:flex;align-items:flex-start;gap:.75rem;width:100%;text-align:left;border:0;background:transparent;" +
      "color:inherit;cursor:pointer;border-radius:10px;padding:.55rem .65rem;font:inherit}" +
      ".offline-cm-option:hover,.offline-cm-option[aria-selected=true]{background:rgba(127,127,127,.12)}" +
      ".offline-cm-option .ocm-label{display:block;font-size:.875rem;font-weight:600;line-height:1.3}" +
      ".offline-cm-option .ocm-desc{display:block;margin-top:.15rem;font-size:.75rem;font-weight:400;line-height:1.35;opacity:.7}" +
      ".offline-cm-wrap{position:relative;display:inline-block;width:100%}" +
      "html.dark .offline-cm-menu,html[data-theme=dark] .offline-cm-menu{box-shadow:0 12px 40px rgba(0,0,0,.45)}";
    document.head.appendChild(st);
  }

  function updateTrigger(island, def, value) {
    var choice = def.choices[value];
    if (!choice) return;
    var trigger = island.querySelector("[role=button][aria-haspopup], [data-state]");
    if (!trigger || trigger.tagName === "DIV" && !trigger.getAttribute("role")) {
      trigger = island.querySelector("._SelectControl_x887o_1") || island.querySelector("[aria-haspopup]");
    }
    if (!trigger) return;
    var text = trigger.querySelector("._TriggerText_x887o_510 span, ._TriggerText_x887o_510") || trigger.querySelector("span span");
    if (text) text.textContent = choice.label;
    var img = trigger.querySelector("._StartIcon_x887o_528, img");
    var svg = trigger.querySelector("._StartIcon_x887o_528, img, svg");
    var html = iconHTML(choice);
    if (img && choice.icon && choice.icon.indexOf(".") >= 0) {
      img.src = iconUrl(choice.icon);
    } else if (html) {
      var hold = trigger.querySelector("[data-offline-cm-icon]");
      if (!hold) {
        hold = document.createElement("span");
        hold.setAttribute("data-offline-cm-icon", "true");
        hold.className = "inline-flex h-5 w-5 shrink-0 items-center justify-center";
        if (img) img.replaceWith(hold);
        else if (svg && svg.tagName.toLowerCase() === "svg" && !svg.closest("._IndicatorWrapper_x887o_520")) svg.replaceWith(hold);
        else trigger.insertBefore(hold, trigger.firstChild);
      }
      hold.innerHTML = html;
    }
  }

  var boundIslands = [];

  function syncTriggers(group, value) {
    boundIslands.forEach(function (rec) {
      if (rec.def.key === group) updateTrigger(rec.island, rec.def, value);
    });
  }

  function closeMenus() {
    document.querySelectorAll(".offline-cm-menu").forEach(function (m) { m.remove(); });
    document.querySelectorAll("[data-offline-cm-open]").forEach(function (el) {
      el.removeAttribute("data-offline-cm-open");
      var t = el.querySelector("[aria-expanded]");
      if (t) t.setAttribute("aria-expanded", "false");
    });
  }

  function openMenu(wrap, island, def, keys, current) {
    closeMenus();
    ensureStyle();
    var menu = document.createElement("div");
    menu.className = "offline-cm-menu";
    menu.setAttribute("role", "listbox");
    var toc = island.closest("[data-content-page-toc-rail], .xl\\:flex");
    if (toc) menu.setAttribute("data-align", "end");
    keys.forEach(function (key) {
      var choice = def.choices[key];
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "offline-cm-option";
      btn.setAttribute("role", "option");
      btn.setAttribute("data-value", key);
      if (key === current) btn.setAttribute("aria-selected", "true");
      btn.innerHTML = iconHTML(choice) +
        '<span class="min-w-0 flex-1"><span class="ocm-label">' + escapeHtml(choice.label) +
        '</span><span class="ocm-desc">' + escapeHtml(choice.description) + "</span></span>";
      btn.addEventListener("click", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        closeMenus();
        setMode(def, key);
      });
      menu.appendChild(btn);
    });
    wrap.appendChild(menu);
    wrap.setAttribute("data-offline-cm-open", "true");
    var trigger = island.querySelector("[aria-expanded], [aria-haspopup]");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
  }

  function bindIsland(island) {
    if (island.dataset.offlineCmBound === "true") return;
    var props = parseAstroProps(island.getAttribute("props") || "");
    var group = props.group || "codex-surface";
    var def = DEFINITIONS[group];
    if (!def) return;
    var keys = filterChoices(def, props.availableChoices);
    if (!keys.length) return;
    island.dataset.offlineCmBound = "true";

    var trigger = island.querySelector("._SelectControl_x887o_1") || island.querySelector("[aria-haspopup]");
    if (!trigger) return;
    var wrap = document.createElement("div");
    wrap.className = "offline-cm-wrap";
    trigger.parentNode.insertBefore(wrap, trigger);
    wrap.appendChild(trigger);

    var rec = { island: island, def: def, keys: keys };
    boundIslands.push(rec);

    var current = resolveValue(def, keys);
    updateTrigger(island, def, current);

    trigger.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (wrap.getAttribute("data-offline-cm-open") === "true") closeMenus();
      else openMenu(wrap, island, def, keys, resolveValue(def, keys));
    });
    trigger.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === " " || ev.key === "ArrowDown") {
        ev.preventDefault();
        openMenu(wrap, island, def, keys, resolveValue(def, keys));
      }
    });
  }

  function bindAll() {
    document.querySelectorAll("astro-island").forEach(function (el) {
      var url = el.getAttribute("component-url") || "";
      var exp = el.getAttribute("component-export") || "";
      var opts = el.getAttribute("opts") || "";
      if (/ContentModeSelector/i.test(url + exp + opts)) bindIsland(el);
    });
  }

  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".offline-cm-wrap")) closeMenus();
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closeMenus();
  });
  document.addEventListener("content-mode:set", function (ev) {
    var d = ev.detail || {};
    if (d.group && d.value) syncTriggers(d.group, d.value);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindAll);
  else bindAll();
  document.addEventListener("astro:page-load", bindAll);
  document.addEventListener("astro:after-swap", bindAll);
})();
