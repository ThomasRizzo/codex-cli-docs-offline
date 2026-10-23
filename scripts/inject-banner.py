#!/usr/bin/env python3
"""Offline-mirror top banner (no layout shift). Re-run on every rebuild by the postprocess.

usage: inject-banner.py <mirror root> <storage key> <label> [site.css] [--tz Zone]

* writes <root>/banner.txt = "Offline mirror of <label>, mirrored YYYY-MM-DD"
* into every *.html (except root 404.html) injects, idempotently:
  - right after <head>: inline <style> that reserves the 28px bar (html.ob-on) + site offsets
    from site.css, and a tiny sync <script> that turns reservation off only if the last
    known banner.txt was empty (cached in localStorage[<storage key>])
  - right after <body>: placeholder bar <div id="ob"> + sync <script> that fills it from the
    localStorage cache immediately, then fetches banner.txt (cache:'no-cache', page-relative
    path => works under an IIS sub-path) and updates bar + cache; empty/missing => collapse.
"""
import os, re, sys, json, datetime
args = sys.argv[1:]; tz = 'UTC'
if '--tz' in args: i = args.index('--tz'); tz = args[i+1]; del args[i:i+2]
root, key, label = args[:3]; site_css = open(args[3]).read().strip() if len(args) > 3 else ''
from zoneinfo import ZoneInfo
day = datetime.datetime.now(ZoneInfo(tz)).strftime('%Y-%m-%d')
open(os.path.join(root, 'banner.txt'), 'w').write(f'Offline mirror of {label}, mirrored {day}\n')

H = 28
CSS = ('#ob{display:none}'
  f'html.ob-on{{--ob-h:{H}px;scroll-padding-top:{H}px}}'
  'html.ob-on #ob{display:flex;position:fixed;top:0;left:0;right:0;z-index:2147483000;box-sizing:border-box;'
  f'height:{H}px;margin:0;padding:0 1rem;align-items:center;justify-content:center;gap:.5em;'
  'font:500 12.5px/1 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;'
  'background:#fff4cc;color:#3b2f00;border-bottom:1px solid #e6d58a}'
  '#ob a{color:inherit;text-decoration:underline;font-weight:600}'
  'html.dark #ob,html[data-theme=dark] #ob{background:#3a3000;color:#ffe9a8;border-bottom-color:#5c4d00}'
  '@media (prefers-color-scheme:dark){html:not(.light):not([data-theme=light]) #ob{background:#3a3000;color:#ffe9a8;border-bottom-color:#5c4d00}}'
  '@media print{html.ob-on #ob{display:none}}' + re.sub(r'\s*\n\s*', '', site_css))
K = json.dumps(key)
HEAD = ('<!--ob--><style id="ob-css">' + CSS + '</style><script>(function(){try{if(localStorage.getItem(' + K +
        ')==="")return}catch(e){}document.documentElement.classList.add("ob-on")})()</script><!--/ob-->')
BODY_JS = ('(function(){var K=' + K + ',d=document.documentElement,b=document.getElementById("ob"),u=new URL(b.getAttribute("data-root")+"banner.txt",location.href).href,c=null;'
  'function put(t){b.innerHTML=t;var a=b.querySelectorAll("a[href]");for(var i=0;i<a.length;i++){var h=a[i].getAttribute("href");'
  'if(!/^([a-z][a-z0-9+.-]*:|\\/|#)/i.test(h))a[i].href=new URL(h,u).href}b.title=b.textContent;d.classList.add("ob-on")}'
  'function off(){d.classList.remove("ob-on");b.innerHTML=""}'
  'try{c=localStorage.getItem(K)}catch(e){}if(c)put(c);if(!window.fetch)return;'
  'fetch(u,{cache:"no-cache",credentials:"same-origin"}).then(function(r){return r.ok?r.text():""}).then(function(t){'
  't=(t||"").replace(/^\\uFEFF/,"").trim();if(/^<(!doctype|html)/i.test(t))t="";if(t!==c){t?put(t):off();try{localStorage.setItem(K,t)}catch(e){}}'
  '},function(){if(!c)off()})})()')
RX_OLD = re.compile(r'<!--ob-->.*?<!--/ob-->', re.S)
RX_LEGACY = re.compile(r'<script[^>]*(?:offline-banner\.js|data-offline-shim)[^>]*>\s*</script>')
n = 0
for dp, dns, fns in os.walk(root):
    dns[:] = [d for d in dns if d not in ('.git', 'scripts', '.github', 'hts-cache')]
    for fn in fns:
        if not fn.endswith('.html') or (dp == root and fn == '404.html'): continue
        p = os.path.join(dp, fn)
        s = o = open(p, encoding='utf-8', errors='surrogateescape').read()
        s = RX_LEGACY.sub('', RX_OLD.sub('', s))
        if not re.search(r'<body[^>]*>', s, re.I): continue
        rel = os.path.relpath(root, dp).replace(os.sep, '/') + '/'
        rel = './' if rel == './' else rel
        body = f'<!--ob--><div id="ob" role="note" data-pagefind-ignore data-root="{rel}"></div><script>{BODY_JS}</script><!--/ob-->'
        if re.search(r'<head[^>]*>', s, re.I): s = re.sub(r'(<head(?:\s[^>]*)?>)', lambda m: m.group(1) + HEAD, s, count=1, flags=re.I)
        else: s = HEAD + s
        s = re.sub(r'(<body(?:\s[^>]*)?>)', lambda m: m.group(1) + body, s, count=1, flags=re.I)
        if s != o: open(p, 'w', encoding='utf-8', errors='surrogateescape').write(s); n += 1
print(f'inject-banner: {n} html files updated; banner.txt = {label} {day}')
