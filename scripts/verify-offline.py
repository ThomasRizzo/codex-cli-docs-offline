#!/usr/bin/env python3
"""Fail the build if any mirrored page still has a raw external http(s) link.
Checks href/src/srcset/poster/action/formaction/data-href/data-context-href in every .html,
and url() in every .css:
  * external http(s):// or // values are only allowed as offline-link.html?u=... targets
  * those offline-link.html targets must exist on disk (relative path, query stripped)
Pre-existing missing relative files (unmirrored assets, HTTrack junk) are reported as
warnings and do not fail the build.
usage: verify-offline.py <repo dir>
"""
import os, re, sys, html, urllib.parse as up

REPO = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
SKIP_DIRS = {'.git', '.github', 'scripts', 'hts-cache', 'pagefind', '_offline'}
RX = re.compile(
    r'\s(href|src|srcset|poster|action|formaction|data-href|data-context-href)=(["\'])(.*?)\2',
    re.I | re.S,
)
RXCSS = re.compile(r'url\(\s*["\']?([^)"\']+)')
RXDATA = re.compile(r'url\(\s*(["\']|&quot;)data:.*?\1\s*\)', re.S)
bad, warn, n = [], [], 0

def exists(v, here):
    p = up.unquote(v.split('#')[0].split('?')[0])
    if not p:
        return True
    t = os.path.normpath(os.path.join(REPO, p.lstrip('/')) if p.startswith('/') else os.path.join(here, p))
    if os.path.isdir(t):
        t = os.path.join(t, 'index.html')
    return os.path.exists(t)

def check(v, here, f, attr):
    v = html.unescape(v).strip()
    if not v or v.startswith(('#', 'data:', 'mailto:', 'tel:', 'javascript:')):
        return
    if re.match(r'(https?:)?//', v, re.I):
        bad.append((f, 'external', v[:200]))
        return
    if re.match(r'[a-z][a-z0-9+.-]*:', v, re.I):
        return
    if 'offline-link.html' in v.split('?')[0].replace('\\', '/'):
        if not exists(v, here):
            bad.append((f, 'missing offline-link.html', v[:200]))
        return
    if not exists(v, here):
        warn.append((f, 'missing', v[:200]))

for dp, dn, fn in os.walk(REPO):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for name in fn:
        f = os.path.join(dp, name)
        rf = os.path.relpath(f, REPO)
        if name.endswith('.html'):
            n += 1
            s = open(f, encoding='utf-8', errors='replace').read()
            s = re.sub(r'<svg\b.*?</svg>', '', s, flags=re.S)
            for m in RX.finditer(s):
                if m.group(1).lower() == 'srcset':
                    for part in m.group(3).split(','):
                        if part.strip():
                            check(part.strip().split()[0], dp, rf, 'srcset')
                else:
                    check(m.group(3), dp, rf, m.group(1))
            for m in RXCSS.finditer(RXDATA.sub('', s)):
                check(m.group(1), dp, rf, 'css')
        elif name.endswith('.css'):
            for m in RXCSS.finditer(RXDATA.sub('', open(f, encoding='utf-8', errors='replace').read())):
                check(m.group(1), dp, rf, 'css')

print(f'verify-offline: {n} html files, {len(bad)} problems, {len(warn)} missing-relative warnings')
for b in bad[:50]:
    print('  ', *b)
if len(bad) > 50:
    print(f'  ... {len(bad) - 50} more')
if warn:
    print(f'  (first 10 warnings)')
    for w in warn[:10]:
        print('  ', *w)
sys.exit(1 if bad else 0)
