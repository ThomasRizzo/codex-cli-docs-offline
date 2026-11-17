#!/usr/bin/env python3
"""Wire a local ContentModeSelector into pages that have the live (unmirrored) island.

The variant copy is already in each page as [data-content-mode-switch] blocks, with an
inline script that shows/hides them on `content-mode:set` and on ?surface= / localStorage.
The React island (ContentModeSelector.react.*.js) is not in the mirror (root-absolute
/_astro URL, deploy-skewed), so the dropdown does nothing offline. This copies
scripts/offline-assets/offline-content-mode.js to learn.chatgpt.com/_offline/ and injects
it into every page that has the selector (idempotent).

usage: inject-offline-content-mode.py <repo dir>
"""
import os, re, sys, shutil, collections

REPO = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
SITE = os.path.join(REPO, 'learn.chatgpt.com')
ASSET = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'offline-assets', 'offline-content-mode.js')
DEST = os.path.join(SITE, '_offline', 'offline-content-mode.js')
SKIP_DIRS = {'.git', '.github', 'scripts', 'hts-cache', 'pagefind', '_offline'}
MARKER_START, MARKER_END = '<!--offline-content-mode-->', '<!--/offline-content-mode-->'
RX_OLD = re.compile(re.escape(MARKER_START) + r'.*?' + re.escape(MARKER_END), re.S)
stats = collections.Counter()

if not os.path.isdir(SITE):
    sys.exit(f'ERROR: missing {SITE}')
if not os.path.isfile(ASSET):
    sys.exit(f'ERROR: missing {ASSET}')

os.makedirs(os.path.dirname(DEST), exist_ok=True)
shutil.copy2(ASSET, DEST)
stats['js_copied'] = 1

for dp, dn, fn in os.walk(SITE):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for n in fn:
        if not n.endswith('.html'):
            continue
        path = os.path.join(dp, n)
        s = open(path, encoding='utf-8', errors='surrogateescape').read()
        if 'ContentModeSelector' not in s and 'data-content-mode-switch' not in s:
            continue
        stats['pages_with_selector'] += 1
        rel = os.path.relpath(DEST, dp).replace(os.sep, '/')
        tag = f'{MARKER_START}<script src="{rel}" defer></script>{MARKER_END}'
        s2 = RX_OLD.sub('', s)
        if re.search(r'</body>', s2, re.I):
            s2 = re.sub(r'</body>', tag + '\n</body>', s2, count=1, flags=re.I)
        else:
            s2 = s2 + '\n' + tag + '\n'
        if s2 != s:
            open(path, 'w', encoding='utf-8', errors='surrogateescape').write(s2)
            stats['hook_injected'] += 1

print('inject-offline-content-mode:', dict(stats))
