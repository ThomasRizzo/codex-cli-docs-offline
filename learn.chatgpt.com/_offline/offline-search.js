/* Offline stand-in for the live Algolia search island.
   Hooks the existing header overlay / mobile search inputs and queries a local
   Pagefind index at ../pagefind/ (next to this file's directory). */
(function () {
  if (window.__offlineSearchBound) return;
  window.__offlineSearchBound = true;

  var DEBOUNCE_MS = 140;
  var MAX_RESULTS = 20;
  var pf = null;
  var pfFailed = false;
  var loading = null;

  function scriptSrc() {
    var els = document.querySelectorAll('script[src*="offline-search.js"]');
    var el = els[els.length - 1];
    if (el && el.src) return el.src;
    var ob = document.getElementById("ob");
    var root = (ob && ob.getAttribute("data-root")) || "./";
    return new URL(root + "learn.chatgpt.com/_offline/offline-search.js", location.href).href;
  }

  function hostBase() {
    return new URL("../", scriptSrc());
  }

  function bundlePath() {
    return new URL("pagefind/", hostBase()).href;
  }

  function loadPagefind() {
    if (pf) return Promise.resolve(pf);
    if (pfFailed) return Promise.reject(new Error("pagefind unavailable"));
    if (loading) return loading;
    var url = new URL("pagefind.js", bundlePath()).href;
    loading = import(url)
      .then(function (mod) {
        return Promise.resolve(mod.options({ bundlePath: bundlePath() })).then(function () {
          pf = mod;
          return pf;
        });
      })
      .catch(function (err) {
        pfFailed = true;
        loading = null;
        throw err;
      });
    return loading;
  }

  function resultHref(raw) {
    // Prefer raw_url (path relative to the Pagefind --site root). The processed
    // `url` field can already be origin-absolute and include /learn.chatgpt.com/,
    // which would double the host dir if we resolved it against hostBase again.
    var url = (raw && (raw.raw_url || raw.url)) || raw || "";
    if (!url) return hostBase().href;
    if (/^(https?:)?\/\//i.test(url) || url.charAt(0) === "#") return url;
    return new URL(String(url).replace(/^\//, ""), hostBase()).href;
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function textOf(v) {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (Array.isArray(v)) return v.filter(Boolean).join(" ");
    return String(v);
  }

  function ensureResultsBox(root) {
    var box = root.querySelector("[data-offline-search-results]");
    if (box) return box;
    box = document.createElement("div");
    box.setAttribute("data-offline-search-results", "true");
    box.className = "offline-search-results min-h-0 flex-1 overflow-auto";
    box.hidden = true;
    var host =
      root.querySelector("[data-site-search-empty-state]")?.parentElement ||
      root.querySelector(".flex.min-h-0.flex-1") ||
      root;
    host.appendChild(box);
    if (!document.getElementById("offline-search-style")) {
      var st = document.createElement("style");
      st.id = "offline-search-style";
      st.textContent =
        ".offline-search-results{padding:0 0 .5rem}" +
        ".offline-search-results ul{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.25rem}" +
        ".offline-search-results a{display:block;padding:.7rem .85rem;border-radius:12px;text-decoration:none;color:inherit;border:1px solid transparent}" +
        ".offline-search-results a:hover,.offline-search-results a[aria-selected='true']{background:var(--color-primary-soft-alpha,rgba(127,127,127,.12))}" +
        ".offline-search-results .os-title{font-weight:600;font-size:.95rem;line-height:1.3}" +
        ".offline-search-results .os-meta{opacity:.65;font-size:.75rem;margin-top:.15rem}" +
        ".offline-search-results .os-excerpt{opacity:.8;font-size:.85rem;margin-top:.25rem;line-height:1.4}" +
        ".offline-search-results .os-excerpt mark{background:transparent;color:inherit;font-weight:600;padding:0}" +
        ".offline-search-status{padding:.7rem .85rem;opacity:.7;font-size:.9rem}";
      document.head.appendChild(st);
    }
    return box;
  }

  function render(root, state) {
    var empty = root.querySelector("[data-site-search-empty-state]");
    var box = ensureResultsBox(root);
    var q = state.query;
    if (!q) {
      box.hidden = true;
      box.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    box.hidden = false;
    if (state.status === "loading") {
      box.innerHTML = '<p class="offline-search-status">Searching…</p>';
      return;
    }
    if (state.status === "error") {
      box.innerHTML =
        '<p class="offline-search-status">Offline search is unavailable in this copy of the mirror.</p>';
      return;
    }
    var results = state.results || [];
    if (!results.length) {
      box.innerHTML =
        '<p class="offline-search-status">No matches yet. Try a different keyword.</p>';
      return;
    }
    var html = ["<ul role='listbox'>"];
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var title = escapeHtml(r.title || r.url);
      var meta = escapeHtml(r.meta || "");
      var excerpt = r.excerpt || "";
      html.push(
        "<li><a href='" +
          escapeHtml(r.href) +
          "' data-offline-search-hit='" +
          i +
          "'" +
          (i === 0 ? " aria-selected='true'" : "") +
          "><div class='os-title'>" +
          title +
          "</div>" +
          (meta ? "<div class='os-meta'>" + meta + "</div>" : "") +
          (excerpt ? "<div class='os-excerpt'>" + excerpt + "</div>" : "") +
          "</a></li>"
      );
    }
    html.push("</ul>");
    box.innerHTML = html.join("");
  }

  function mapResult(raw) {
    var meta = raw.meta || {};
    var title = textOf(meta.title) || textOf(raw.meta?.title) || raw.url;
    var section = textOf(meta.section) || textOf((raw.filters || {}).section);
    var excerpt = raw.excerpt || "";
    // Pagefind excerpts include <mark>; keep those tags only.
    excerpt = excerpt.replace(/<(?!\/?mark\b)[^>]+>/gi, "");
    return {
      href: resultHref(raw),
      title: title,
      meta: section,
      excerpt: excerpt,
    };
  }

  function bindRoot(root) {
    if (!root || root.dataset.offlineSearchBound === "true") return;
    root.dataset.offlineSearchBound = "true";
    var input = root.querySelector("[data-site-search-input]");
    if (!input) return;
    var timer = null;
    var seq = 0;
    var lastQuery = "";

    function scopeOf() {
      return (root.getAttribute("data-scope") || "").trim();
    }

    function run(q) {
      q = (q || "").trim();
      lastQuery = q;
      if (!q) {
        render(root, { query: "", results: [] });
        return;
      }
      var my = ++seq;
      render(root, { query: q, status: "loading" });
      loadPagefind()
        .then(function (mod) {
          var opts = {};
          var scope = scopeOf();
          if (scope) opts.filters = { section: scope };
          return mod.search(q, opts).then(function (res) {
            if (scope && res && res.results && res.results.length === 0) {
              return mod.search(q);
            }
            return res;
          });
        })
        .then(function (res) {
          if (my !== seq) return;
          var hits = (res && res.results) || [];
          return Promise.all(
            hits.slice(0, MAX_RESULTS).map(function (h) {
              return h.data();
            })
          );
        })
        .then(function (rows) {
          if (my !== seq) return;
          render(root, {
            query: q,
            status: "ok",
            results: (rows || []).map(mapResult),
          });
        })
        .catch(function () {
          if (my !== seq) return;
          render(root, { query: q, status: "error" });
        });
    }

    input.addEventListener("input", function () {
      var q = input.value;
      clearTimeout(timer);
      timer = setTimeout(function () {
        run(q);
      }, DEBOUNCE_MS);
    });

    input.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter") return;
      var box = root.querySelector("[data-offline-search-results]");
      var hit = box && box.querySelector("a[data-offline-search-hit]");
      if (hit && hit.href) {
        ev.preventDefault();
        location.href = hit.href;
      }
    });

    root.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-search-query-button]");
      if (!btn) return;
      var q = btn.getAttribute("data-search-query") || btn.textContent || "";
      q = q.trim();
      if (!q) return;
      ev.preventDefault();
      input.value = q;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
  }

  function bindAll() {
    document.querySelectorAll("[data-site-search-root]").forEach(bindRoot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindAll);
  } else {
    bindAll();
  }
  document.addEventListener("astro:page-load", bindAll);
  document.addEventListener("astro:after-swap", bindAll);

  // Warm the index once the overlay opens so the first query is snappy.
  document.addEventListener("click", function (ev) {
    if (ev.target.closest("[data-header-search-button]")) loadPagefind().catch(function () {});
  });
})();
