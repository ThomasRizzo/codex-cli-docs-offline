#!/usr/bin/env python3
"""Route every remaining external link through the local offline-link.html page.

The intranet blocks all external hosts, so a plain <a href="https://..."> would just hang or
error. After fix-leftover-links.py has localized everything that can be mirrored, this pass
rewrites, in every mirrored HTML page (and CSS url()):
  * navigational href / action / formaction / data-href / data-context-href / iframe src
    pointing at http(s):// or protocol-relative //
      - if the URL is on a mirrored host and the file exists locally, rewrite to that
        relative path (including learn.chatgpt.com/codex/use-cases/<slug> -> use-cases/<slug>.html,
        which is the live site's 308)
      - otherwise -> <relative path to repo root>/offline-link.html?u=<percent-encoded original URL>
        (offline-link.html explains the link is unavailable on this network and shows the URL
        for copying). target="_blank" is kept so behaviour matches the live site.
  * non-navigational <link href> (stylesheet, preconnect, canonical, alternate, ...) and any
    other external src / srcset / poster / data: map to a local file when one exists, otherwise
    remove the value so the browser never tries to reach the internet.
  * CSS url(https://...) on a mirrored host: same mapping; missing targets are emptied.
Idempotent: rewritten hrefs are relative (offline-link.html?u=...), so a second run changes nothing.
usage: rewrite-external-links.py <repo dir>
"""
import os, re, sys, html, collections, urllib.parse as up

REPO = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
SKIP_DIRS = {'.git', '.github', 'scripts', 'hts-cache', 'pagefind', '_offline'}
SKIP_FILES = {'offline-link.html'}
NAV_ATTRS = {'href', 'action', 'formaction', 'xlink:href', 'data-href', 'data-context-href'}
LINK_RESOURCE_REL = re.compile(
    r'\b(stylesheet|icon|shortcut icon|apple-touch-icon|mask-icon|manifest|preload|modulepreload|'
    r'preconnect|dns-prefetch|prefetch|prerender|canonical|alternate|amphtml|edituri|pingback|'
    r'profile|author|publisher)\b',
    re.I,
)
EXT = re.compile(r'^\s*(?:https?:)?//', re.I)
RX_TAG = re.compile(r'<([a-zA-Z][a-zA-Z0-9:-]*)\b([^<>]*)>', re.S)
RX_ATTR = re.compile(
    r'(\s)(href|src|srcset|poster|data|action|formaction|xlink:href|data-href|data-context-href)='
    r'(["\'])(.*?)\3',
    re.I | re.S,
)
RX_CSS = re.compile(r'(url\(\s*([\'"]?))((?:https?:)?//[^)\'"\s]+)((?:[\'"]?)\s*\))', re.I)
stats = collections.Counter()

mirrored_hosts = {
    d for d in os.listdir(REPO)
    if os.path.isdir(os.path.join(REPO, d)) and '.' in d and d not in SKIP_DIRS
}

def already_offline(v):
    return 'offline-link.html?u=' in v.replace('\\', '/')

def local_target(u):
    """absolute URL on a mirrored host -> existing local file or None"""
    if u.netloc not in mirrored_hosts:
        return None
    p = up.unquote(u.path).lstrip('/')
    base = os.path.join(REPO, u.netloc, p)
    for c in (base, base.rstrip('/') + '.html', os.path.join(base, 'index.html')):
        if os.path.isfile(c):
            return c
    # Live site 308s /codex/use-cases/<slug> -> /use-cases/<slug>
    if u.netloc == 'learn.chatgpt.com':
        parts = [x for x in u.path.split('/') if x]
        if len(parts) >= 3 and parts[0] == 'codex' and parts[1] == 'use-cases':
            slug = parts[2]
            for c in (
                os.path.join(REPO, 'learn.chatgpt.com', 'use-cases', slug + '.html'),
                os.path.join(REPO, 'learn.chatgpt.com', 'use-cases', slug, 'index.html'),
            ):
                if os.path.isfile(c):
                    return c
    return None

def offline_link(url, here):
    r = os.path.relpath(os.path.join(REPO, 'offline-link.html'), here).replace(os.sep, '/')
    return f'{r}?u={up.quote(url, safe="")}'

def to_local(url, here, fragment=True):
    u = up.urlsplit(url)
    t = local_target(u)
    if not t:
        return None
    rel = os.path.relpath(t, here).replace(os.sep, '/')
    if fragment and u.fragment:
        rel += '#' + u.fragment
    return rel

def process_html(path):
    here = os.path.dirname(path)
    s = open(path, encoding='utf-8', errors='surrogateescape').read()

    def tag(m):
        name = m.group(1).lower()
        attrs = m.group(2)
        if name in ('svg', 'html') or name.startswith('!'):
            return m.group(0)

        def asub(am):
            a = am.group(2).lower()
            v = html.unescape(am.group(4)).strip()
            if already_offline(v):
                return am.group(0)
            if a == 'srcset':
                parts, changed = [], False
                for raw in v.split(','):
                    bit = raw.strip()
                    if not bit:
                        continue
                    toks = bit.split()
                    url0 = toks[0]
                    rest = ' '.join(toks[1:])
                    if not EXT.match(url0):
                        parts.append(raw.strip())
                        continue
                    url = 'https:' + url0 if url0.startswith('//') else url0
                    loc = to_local(url, here, fragment=False)
                    if loc:
                        parts.append((loc + (' ' + rest if rest else '')).strip())
                        stats['source_srcset_to_local'] += 1
                    else:
                        stats['srcset_ext_removed'] += 1
                    changed = True
                if not changed:
                    return am.group(0)
                return f'{am.group(1)}{am.group(2)}={am.group(3)}{html.escape(",".join(parts), quote=True)}{am.group(3)}'
            if not EXT.match(v):
                return am.group(0)
            url = 'https:' + v if v.startswith('//') else v
            loc = to_local(url, here)
            navigational = a in NAV_ATTRS or (a == 'src' and name == 'iframe')
            if name == 'link' and a == 'href':
                relm = re.search(r'\srel=(["\'])(.*?)\1', attrs, re.I | re.S)
                rel = relm.group(2) if relm else ''
                if rel and LINK_RESOURCE_REL.search(rel):
                    navigational = False
            if loc:
                stats[f'{name}_{a}_to_local'] += 1
                return f'{am.group(1)}{am.group(2)}={am.group(3)}{html.escape(loc, quote=True)}{am.group(3)}'
            if navigational:
                stats[f'{name}_{a}_to_offline_link'] += 1
                return f'{am.group(1)}{am.group(2)}={am.group(3)}{html.escape(offline_link(url, here), quote=True)}{am.group(3)}'
            stats[f'{name}_{a}_ext_resource_removed'] += 1
            return f'{am.group(1)}{am.group(2)}={am.group(3)}{am.group(3)}'

        na = RX_ATTR.sub(asub, attrs)
        return m.group(0) if na == attrs else f'<{m.group(1)}{na}>'

    ns = RX_TAG.sub(tag, s)
    if ns != s:
        open(path, 'w', encoding='utf-8', errors='surrogateescape').write(ns)
        stats['html_changed'] += 1
    stats['html_scanned'] += 1

def process_css(path):
    here = os.path.dirname(path)
    s = open(path, encoding='utf-8', errors='surrogateescape').read()

    def sub(m):
        raw = m.group(3).strip()
        if already_offline(raw) or not EXT.match(raw):
            return m.group(0)
        url = 'https:' + raw if raw.startswith('//') else raw
        loc = to_local(url, here, fragment=False)
        if loc:
            stats['css_url_to_local'] += 1
            return m.group(1) + loc + m.group(4)
        stats['css_url_ext_removed'] += 1
        return m.group(1) + m.group(4)

    ns = RX_CSS.sub(sub, s)
    if ns != s:
        open(path, 'w', encoding='utf-8', errors='surrogateescape').write(ns)
        stats['css_changed'] += 1
    stats['css_scanned'] += 1

for dp, dn, fn in os.walk(REPO):
    dn[:] = [d for d in dn if d not in SKIP_DIRS]
    for n in fn:
        path = os.path.join(dp, n)
        if n.endswith('.html') and n not in SKIP_FILES:
            process_html(path)
        elif n.endswith('.css'):
            process_css(path)

print('rewrite-external-links:', dict(stats))
