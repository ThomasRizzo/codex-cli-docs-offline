#!/usr/bin/env python3
"""Rewrite the learn.chatgpt.com links HTTrack leaves behind into relative local paths.

HTTrack already relativizes normal href/src links (and resolves /codex/* 308s to the
canonical page). What it leaves:
  * links carrying a query string it was told not to crawl (?site_locale=en, ?surface=app,
    ?export=pdf, ?team=...)  -> left as https://learn.chatgpt.com/...?...
  * data-href / data-context-href attributes used by the mobile nav JS -> left root-absolute
This script maps those onto local files (query dropped), following the redirects recorded
in hts-cache/new.zip. Unresolvable root-absolute ones become absolute https URLs so they
at least work online instead of 404ing offline. Also relativizes .md/.txt links (optional).

usage: fix-leftover-links.py <site dir: .../learn.chatgpt.com> [hts-cache dir] [--md]
"""
import os, re, sys, struct, zipfile, collections, urllib.parse as up
HOST = 'learn.chatgpt.com'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
SITE = os.path.abspath(args[0]); CACHE = args[1] if len(args) > 1 else None
DO_MD = '--md' in sys.argv

# ---- redirect map from HTTrack cache (Location headers of 30x responses) ----
redir = {}
zp = CACHE and os.path.join(CACHE, 'new.zip')
if zp and os.path.exists(zp):
    z = zipfile.ZipFile(zp); f = open(zp, 'rb')
    for i in z.infolist():
        if not i.filename.startswith('https://' + HOST + '/'): continue
        f.seek(i.header_offset); h = f.read(30); nl, el = struct.unpack('<HH', h[26:30]); f.seek(nl, 1)
        hdr = f.read(el).decode('latin-1', 'replace')
        m = re.search(r'X-StatusCode: 30\d', hdr); loc = re.search(r'\r\nLocation: ([^\r\n]+)', hdr)
        if m and loc:
            src = up.urlsplit(i.filename).path; dst = up.urljoin(i.filename, loc.group(1).strip())
            d = up.urlsplit(dst)
            if d.netloc == HOST: redir[src] = d.path
            else: redir[src] = dst   # off-host (developers.openai.com)
print(f'redirects from cache: {len(redir)}')

def resolve(path):
    """site path (/docs/auth) -> local file (abs fs path) or off-host URL or None"""
    for _ in range(5):
        r = redir.get(path) or redir.get(path.rstrip('/')) or redir.get(path.rstrip('/') + '/')
        if not r: break
        if r.startswith('http'): return r
        path = r
    p = up.unquote(path).lstrip('/')
    base = os.path.join(SITE, p)
    for c in (base, base.rstrip('/') + '.html', os.path.join(base, 'index.html')):
        if p and os.path.isfile(c): return c
    if p == '': return os.path.join(SITE, 'index.html')
    return None

stats = collections.Counter()
import urllib.request
ASSET = re.compile(r'\.(css|js|mjs|png|jpe?g|webp|gif|svg|ico|avif|woff2?|ttf|otf|eot|mp4|webm|vtt|json)$', re.I)
def ensure_local(path):
    """download a same-host asset HTTrack missed (CSS url(), <source srcset>)"""
    p = up.unquote(path.split('?')[0].split('#')[0]).lstrip('/')
    dst = os.path.join(SITE, p)
    if os.path.isfile(dst) or not ASSET.search(p): return os.path.isfile(dst)
    try:
        req = urllib.request.Request('https://' + HOST + '/' + p, headers={'User-Agent': 'offline-mirror-fixer'})
        data = urllib.request.urlopen(req, timeout=60).read()
    except Exception as e:
        stats['asset_fetch_failed'] += 1; return False
    os.makedirs(os.path.dirname(dst), exist_ok=True); open(dst, 'wb').write(data)
    stats['asset_fetched'] += 1; return True
ATTR = re.compile(r'(\s(?:href|src|srcset|data-href|data-context-href)=)(["\'])(https?://' + re.escape(HOST) + r'(?=[/?#"\'])[^"\']*|/(?!/)[^"\']*)\2')
MDLINK = re.compile(r'https?://' + re.escape(HOST) + r'(/[^\s)\]>"\'`]*)')

def fix_value(v, here_dir):
    u = up.urlsplit(v if v.startswith('http') else 'https://' + HOST + v)
    if not u.query and v.startswith('http') and re.match(r'/(api|plugins|apps-sdk)(/|$)', u.path):
        return None                                   # deliberately external
    ensure_local(u.path)
    t = resolve(u.path or '/')
    if t is None:
        return ('https://' + HOST + v) if v.startswith('/') else None
    if t.startswith('http'): return t + (('#' + u.fragment) if u.fragment else '')
    rel = os.path.relpath(t, here_dir).replace(os.sep, '/')
    return rel + (('#' + u.fragment) if u.fragment else '')

for dp, dn, fn in os.walk(SITE):
    for name in fn:
        path = os.path.join(dp, name)
        if name.endswith('.html'):
            s = open(path, encoding='utf-8', errors='surrogateescape').read()
            def sub(m):
                nv = fix_value(m.group(3), dp)
                if nv is None or nv == m.group(3): stats['left'] += 1; return m.group(0)
                stats['rewritten' if not nv.startswith('http') else 'to_absolute'] += 1
                return m.group(1) + m.group(2) + nv + m.group(2)
            ns = ATTR.sub(sub, s)
            if ns != s: open(path, 'w', encoding='utf-8', errors='surrogateescape').write(ns); stats['files'] += 1
        elif name.endswith('.css'):
            s = open(path, encoding='utf-8', errors='surrogateescape').read()
            def csub(m):
                v = m.group(2)
                if v.startswith('//' + HOST): v = 'https:' + v
                if v.startswith('https://' + HOST): v = up.urlsplit(v).path
                if not v.startswith('/') or v.startswith('//'): return m.group(0)
                if not ensure_local(v): return m.group(0)
                stats['css_rewritten'] += 1
                t = os.path.join(SITE, up.unquote(v.split('?')[0].split('#')[0]).lstrip('/'))
                return m.group(1) + os.path.relpath(t, dp).replace(os.sep, '/') + m.group(3)
            ns = re.sub(r'(url\(\s*["\']?)([^)"\'\s]+)(["\']?\s*\))', csub, s)
            if ns != s: open(path, 'w', encoding='utf-8', errors='surrogateescape').write(ns)
        elif DO_MD and name.endswith(('.md', '.txt')):
            s = open(path, encoding='utf-8', errors='surrogateescape').read()
            def msub(m):
                nv = fix_value('https://' + HOST + m.group(1), dp)
                if nv is None or nv.startswith('http'): return m.group(0)
                stats['md_rewritten'] += 1; return nv
            ns = MDLINK.sub(msub, s)
            if ns != s: open(path, 'w', encoding='utf-8', errors='surrogateescape').write(ns)
print(dict(stats))

# ---- deploy skew: _astro assets referenced by pages fetched from an older Vercel
# deployment 404 on the current one. Vercel skew protection still serves them with
# ?dpl=<deployment id>; ids are harvested from the mirror itself.
dpls = set()
for dp, dn, fn in os.walk(SITE):
    for name in fn:
        if name.endswith(('.html', '.css', '.js')):
            dpls.update(re.findall(r'dpl=(dpl_[A-Za-z0-9]+)', open(os.path.join(dp, name), errors='replace').read()))
missing_astro = set()
REF = re.compile(r'(?<![\w-])(?:src|href)="([^"#?]*_astro/[^"#?]+)"')
for dp, dn, fn in os.walk(SITE):
    for name in fn:
        if name.endswith('.html'):
            for r in REF.findall(open(os.path.join(dp, name), errors='replace').read()):
                if r.startswith('http'): continue
                t = os.path.normpath(os.path.join(dp, r))
                if not os.path.exists(t): missing_astro.add(os.path.relpath(t, SITE))
for rel in sorted(missing_astro):
    dst = os.path.join(SITE, rel); ok = False
    for d in sorted(dpls):
        try:
            req = urllib.request.Request(f'https://{HOST}/{rel}?dpl={d}', headers={'User-Agent': 'offline-mirror-fixer'})
            data = urllib.request.urlopen(req, timeout=60).read()
            os.makedirs(os.path.dirname(dst), exist_ok=True); open(dst, 'wb').write(data); ok = True; break
        except Exception:
            pass
    stats['skew_recovered' if ok else 'skew_unrecoverable'] += 1
print('deploy-skew assets:', len(missing_astro), 'dpl ids:', len(dpls), dict(stats))
