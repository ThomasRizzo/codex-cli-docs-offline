#!/usr/bin/env python3
"""Build wget seed list + /codex/* redirect map for the offline Codex mirror.

Sources (all live, so refreshes stay complete):
  * https://learn.chatgpt.com/llms.txt entries (canonical /docs/... + a few top-level pages)
  * sidebar/nav hrefs from hub pages (/codex/* aliases are resolved via their 308s)
Only canonical destinations under /docs/ or the allowed top-level sections are seeded;
docs/codex/... paths are never invented. api/ads/blog/chatgpt marketing are excluded.

Writes: /tmp/urls.txt (seeds) and scripts/codex-redirects.json (alias -> canonical path).
"""
from __future__ import annotations

import http.client
import json
import re
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urljoin, urlsplit

HOST = "learn.chatgpt.com"
BASE = f"https://{HOST}"
TOPLEVEL_OK = ("/resources", "/use-cases", "/videos", "/guides/")
HUBS = ("/docs", "/docs/codex/cli", "/docs/hooks", "/docs/quickstart")
UA = {"User-Agent": "codex-docs-offline-seeder"}


def fetch(path: str) -> str:
    req = urllib.request.Request(BASE + path, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", "replace")


def resolve(path: str, hops: int = 4) -> str | None:
    """Follow redirects with HEAD on HOST only; return final path or None."""
    for _ in range(hops):
        conn = http.client.HTTPSConnection(HOST, timeout=20)
        try:
            conn.request("HEAD", path, headers=UA)
            resp = conn.getresponse()
            loc = resp.getheader("Location")
            status = resp.status
        finally:
            conn.close()
        if status in (301, 302, 303, 307, 308) and loc:
            parts = urlsplit(urljoin(BASE + path, loc))
            if parts.netloc and parts.netloc != HOST:
                return None
            path = parts.path + (f"?{parts.query}" if parts.query else "")
            continue
        return path if status == 200 else None
    return None


def allowed(path: str) -> bool:
    p = urlsplit(path).path
    return p == "/docs" or p.startswith("/docs/") or any(
        p == t.rstrip("/") or p.startswith(t) for t in TOPLEVEL_OK
    )


def main() -> int:
    repo = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
    seeds: set[str] = set()

    def add(path: str) -> None:
        p = urlsplit(path).path.rstrip("/") or "/"
        if not allowed(p) and p not in ("/llms.txt", "/favicon.png"):
            return
        seeds.add(BASE + p)
        if p.endswith(".md"):
            seeds.add(BASE + p[:-3])
        elif not re.search(r"\.[a-z0-9]+$", p):
            seeds.add(BASE + p + ".md")  # markdown twin (404s are harmless)

    llms = fetch("/llms.txt")
    for m in re.findall(r"https://learn\.chatgpt\.com(/[^\s\)\"'<>\]]+)", llms):
        add(m)
    for p in ("/llms.txt", "/favicon.png", "/docs", "/docs/codex", "/docs/codex/cli",
              "/docs/codex/ide", "/docs/llms-full.txt", "/docs/codex-manual.md",
              "/resources", "/use-cases", "/videos"):
        add(p)

    hrefs: set[str] = set()
    for hub in HUBS:
        try:
            html = fetch(hub)
        except Exception as exc:  # noqa: BLE001
            print(f"warn: hub {hub}: {exc}", file=sys.stderr)
            continue
        hrefs.update(h.split("#")[0] for h in re.findall(r'href="(/(?:codex|docs)[^"#]*)"', html))

    redirects: dict[str, str] = {}
    for h in sorted(hrefs):
        if h.startswith("/docs"):
            add(h)
            continue
        final = resolve(h)
        if final and allowed(final):
            redirects[urlsplit(h).path.rstrip("/")] = final
            add(final)

    Path("/tmp/urls.txt").write_text("\n".join(sorted(seeds)) + "\n", encoding="utf-8")
    out = repo / "scripts" / "codex-redirects.json"
    out.write_text(json.dumps(redirects, indent=1, sort_keys=True) + "\n", encoding="utf-8")
    print(f"seeds={len(seeds)} nav_hrefs={len(hrefs)} codex_redirects={len(redirects)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
