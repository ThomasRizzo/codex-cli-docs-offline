/* Offline-mirror site banner for the Codex docs mirror. Source: scripts/offline-banner.js,
   copied to the site root and injected into every HTML page by scripts/inject-banner.py. */
/* ---------- site banner: <site root>/banner.txt (regenerated on every rebuild) ----------
   One line of text or simple inline HTML (e.g. <a href="...">) shown in a thin bar at the
   top of every page. Path is resolved relative to THIS script file, so it works when the
   mirror is served from an IIS sub-path. Missing/empty/unreachable file => no banner. */
(function () {
  'use strict';
  var UP = './';                     /* this script's folder -> site root */
  var me = document.currentScript;
  var base = (me && me.src) || location.href;
  var url;
  try { url = new URL(UP + 'banner.txt', base).href; } catch (e) { return; }
  if (!window.fetch || document.getElementById('offline-site-banner')) return;
  var ID = 'offline-site-banner', moved = [];
  function css() {
    var st = document.createElement('style');
    st.textContent =
      '#' + ID + '{position:fixed;top:0;left:0;right:0;z-index:2147483000;box-sizing:border-box;' +
      'height:28px;margin:0;padding:0 1rem;display:flex;align-items:center;justify-content:center;gap:.5em;' +
      'font:500 12.5px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
      'background:#fff4cc;color:#3b2f00;border-bottom:1px solid #e6d58a}' +
      '#' + ID + ' a{color:inherit;text-decoration:underline;font-weight:600}' +
      'html.dark #' + ID + ',html[data-theme="dark"] #' + ID + '{background:#3a3000;color:#ffe9a8;border-bottom-color:#5c4d00}' +
      '@media (prefers-color-scheme:dark){html:not(.light):not([data-theme="light"]) #' + ID +
      '{background:#3a3000;color:#ffe9a8;border-bottom-color:#5c4d00}}' +
      '@media print{#' + ID + '{display:none}}';
    document.head.appendChild(st);
  }
  /* Push the page down by the bar height and shift every fixed/sticky element that is
     pinned to the top (site headers, sidebars) so nothing is hidden under the bar. */
  function offset(bar) {
    moved.forEach(function (m) { m.el.style.top = m.old; }); moved = [];
    var h = bar.offsetHeight, body = document.body;
    if (body.__obPad == null) body.__obPad = parseFloat(getComputedStyle(body).paddingTop) || 0;
    body.style.paddingTop = (body.__obPad + h) + 'px';
    document.documentElement.style.scrollPaddingTop = h + 'px';
    var all = body.getElementsByTagName('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i]; if (el === bar) continue;
      var cs = getComputedStyle(el);
      if ((cs.position !== 'fixed' && cs.position !== 'sticky') || cs.top === 'auto') continue;
      var t = parseFloat(cs.top); if (isNaN(t) || t < 0 || t > 400) continue;
      if (cs.position === 'sticky') { var a = el.parentElement, inFixed = false;
        while (a && a !== body) { if (getComputedStyle(a).position === 'fixed') { inFixed = true; break; } a = a.parentElement; }
        if (inFixed) continue; }
      moved.push({ el: el, old: el.style.top });
      el.style.top = (t + h) + 'px';
    }
  }
  fetch(url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (r) {
    return r.ok ? r.text() : '';
  }).then(function (txt) {
    txt = (txt || '').replace(/^\uFEFF/, '').trim();
    if (!txt || /^\s*<(!doctype|html)/i.test(txt)) return;   /* empty, or an HTML error page */
    css();
    var bar = document.createElement('div');
    bar.id = ID; bar.setAttribute('role', 'note');
    bar.innerHTML = txt;
    /* relative hrefs in banner.txt are relative to the site root (where banner.txt lives) */
    Array.prototype.forEach.call(bar.querySelectorAll('a[href]'), function (a) {
      var hr = a.getAttribute('href');
      if (!/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(hr)) a.href = new URL(hr, url).href;
    });
    bar.title = bar.textContent;
    document.body.insertBefore(bar, document.body.firstChild);
    offset(bar);
    var tm; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { offset(bar); }, 150); });
  }).catch(function () {});
})();
