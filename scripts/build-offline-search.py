#!/usr/bin/env python3
"""Build a local Pagefind index and wire it into the existing header search UI.

The live site's search is a remote Algolia island (AlgoliaSearch.react, data-site-search-provider
="algolia") which cannot run on the intranet. Pages already carry data-pagefind-filter="section:…"
and the overlay uses pagefind-* class names, so a local Pagefind index slots in cleanly.

This script, run on the final repo tree:
  1. Marks junk HTTrack stubs so Pagefind ignores them, and tags <main> as data-pagefind-body
     so nav/header/drawer aren't indexed (idempotent).
  2. Runs `python3 -m pagefind` over learn.chatgpt.com/ (output: learn.chatgpt.com/pagefind/).
  3. Copies scripts/offline-assets/offline-search.js to learn.chatgpt.com/_offline/ and injects
     a <script> into every page that has the header search UI.

usage: build-offline-search.py <repo dir>
"""
import os, re, sys, shutil, subprocess, collections

REPO = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
HOST = 'learn.chatgpt.com'
SITE = os.path.join(REPO, HOST)
SCRIPTS = os.path.dirname(os.path.abspath(__file__))
ASSET = os.path.join(SCRIPTS, 'offline-assets', 'offline-search.js')
DEST_JS = os.path.join(SITE, '_offline', 'offline-search.js')
SKIP_DIRS = {'.git', '.github', 'scripts', 'hts-cache', 'pagefind', '_offline'}
MARKER_START, MARKER_END = '<!--offline-search-->', '<!--/offline-search-->'
JUNK_PATH = re.compile(r'(?:^|/)(?:_https_|_data_image|_astro)/')
MOVED = re.compile(r'Page has moved', re.I)
RX_OLD = re.compile(re.escape(MARKER_START) + r'.*?' + re.escape(MARKER_END), re.S)
stats = collections.Counter()

if not os.path.isdir(SITE):
    sys.exit(f'ERROR: missing {SITE}')
if not os.path.isfile(ASSET):
    sys.exit(f'ERROR: missing {ASSET}')

def is_junk(path, html):
    rel = os.path.relpath(path, SITE).replace(os.sep, '/')
    if JUNK_PATH.search('/' + rel):
        return True
    if MOVED.search(html) and len(html) < 4000:
        return True
    return False

# ---- 1. mark pages ----
RX_MAIN = re.compile(r'<main\b(?![^>]*\bdata-pagefind-body\b)([^>]*)>', re.I)
RX_HTML = re.compile(r'<html\b([^>]*)>', re.I)
RX_BODY = re.compile(r'<body\b([^>]*)>', re.I)

for dp, dn, fn in os.walk(SITE):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for n in fn:
        if not n.endswith('.html'):
            continue
        path = os.path.join(dp, n)
        s = open(path, encoding='utf-8', errors='surrogateescape').read()
        orig = s
        if is_junk(path, s):
            if 'data-pagefind-ignore' not in s[:2000]:
                if RX_HTML.search(s):
                    s = RX_HTML.sub(lambda m: f'<html{m.group(1)} data-pagefind-ignore="true">', s, count=1)
                elif RX_BODY.search(s):
                    s = RX_BODY.sub(lambda m: f'<body{m.group(1)} data-pagefind-ignore="true">', s, count=1)
                stats['junk_ignored'] += 1
        else:
            if RX_MAIN.search(s):
                s = RX_MAIN.sub(lambda m: f'<main data-pagefind-body{m.group(1)}>', s, count=1)
                stats['main_marked'] += 1
        if s != orig:
            open(path, 'w', encoding='utf-8', errors='surrogateescape').write(s)
            stats['html_marked'] += 1

# ---- 2. Pagefind ----
# Drop a previous index so a no-re-scrape run is a clean rebuild (idempotent output).
out_dir = os.path.join(SITE, 'pagefind')
if os.path.isdir(out_dir):
    shutil.rmtree(out_dir)

def install_pagefind():
    # Prefer a current 1.x; fall back to whatever pip can install.
    for spec in ('pagefind[extended]==1.4.0', 'pagefind[extended]'):
        cmd = [sys.executable, '-m', 'pip', 'install', '-q', '--disable-pip-version-check', spec]
        r = subprocess.run(cmd)
        if r.returncode == 0:
            return
        cmd.append('--break-system-packages')
        r = subprocess.run(cmd)
        if r.returncode == 0:
            return
    sys.exit('ERROR: could not install pagefind')

print('build-offline-search: installing pagefind (if needed)')
install_pagefind()
print('build-offline-search: indexing', SITE)
cmd = [
    sys.executable, '-m', 'pagefind',
    '--site', SITE,
    '--output-subdir', 'pagefind',
    '--exclude-selectors', '#header, #drawer, #header-search-overlay, #ob, script, style, noscript, nav',
    '--verbose',
]
r = subprocess.run(cmd)
if r.returncode != 0:
    sys.exit(f'ERROR: pagefind failed with {r.returncode}')
if not os.path.isfile(os.path.join(out_dir, 'pagefind.js')):
    sys.exit(f'ERROR: pagefind did not write {out_dir}/pagefind.js')

# ---- 3. inject hook ----
os.makedirs(os.path.dirname(DEST_JS), exist_ok=True)
shutil.copy2(ASSET, DEST_JS)
stats['js_copied'] = 1

for dp, dn, fn in os.walk(SITE):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for n in fn:
        if not n.endswith('.html'):
            continue
        path = os.path.join(dp, n)
        s = open(path, encoding='utf-8', errors='surrogateescape').read()
        if 'data-site-search-root' not in s and 'header-search-overlay' not in s:
            continue
        rel = os.path.relpath(DEST_JS, dp).replace(os.sep, '/')
        tag = f'{MARKER_START}<script src="{rel}" defer></script>{MARKER_END}'
        s2 = RX_OLD.sub('', s)
        if re.search(r'</body>', s2, re.I):
            s2 = re.sub(r'</body>', tag + '\n</body>', s2, count=1, flags=re.I)
        else:
            s2 = s2 + '\n' + tag + '\n'
        if s2 != s:
            open(path, 'w', encoding='utf-8', errors='surrogateescape').write(s2)
            stats['hook_injected'] += 1

print('build-offline-search:', dict(stats))
print('  pagefind dir:', out_dir, 'files', sum(len(fs) for _, _, fs in os.walk(out_dir)))
