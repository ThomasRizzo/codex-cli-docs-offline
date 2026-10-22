#!/usr/bin/env python3
"""Site-wide top banner for the offline mirror (rerun on every rebuild; idempotent).

  usage: inject-banner.py <repo/site root> <source-site label>

* writes <root>/banner.txt  ("Offline mirror of <label>, mirrored <UTC date>")
* copies scripts/offline-banner.js to <root>/offline-banner.js
* adds <script src="<relative path>/offline-banner.js" defer> before </body> of every
  .html page under the mirrored host dirs (depth-correct relative path, so the site
  works from an IIS sub-path). The script fetches banner.txt at runtime.
"""
import os, re, shutil, sys, datetime
root = os.path.realpath(sys.argv[1]); label = sys.argv[2]
here = os.path.dirname(os.path.realpath(__file__))
HOSTS = ['learn.chatgpt.com']
with open(os.path.join(root, 'banner.txt'), 'w', encoding='utf-8') as f:
    f.write(f'Offline mirror of {label}, mirrored {datetime.datetime.now(datetime.timezone.utc):%Y-%m-%d}\n')
shutil.copyfile(os.path.join(here, 'offline-banner.js'), os.path.join(root, 'offline-banner.js'))
RX = re.compile(r'<script src="[^"]*offline-banner\.js" defer></script>')
n = skipped = 0
for h in HOSTS:
    for d, _, files in os.walk(os.path.join(root, h)):
        for fn in files:
            if not fn.endswith('.html'): continue
            p = os.path.join(d, fn)
            s = open(p, encoding='utf-8', errors='surrogateescape').read()
            if '</body>' not in s.lower(): skipped += 1; continue
            relp = os.path.relpath(root, d).replace(os.sep, '/')
            tag = f'<script src="{relp}/offline-banner.js" defer></script>'
            s2 = RX.sub('', s)
            i = s2.lower().rfind('</body>')
            s2 = s2[:i] + tag + s2[i:]
            if s2 != s:
                open(p, 'w', encoding='utf-8', errors='surrogateescape').write(s2)
            n += 1
print(f'inject-banner: {n} pages carry the banner script ({skipped} without </body> skipped)')
