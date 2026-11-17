# learn.chatgpt.com — Offline Mirror

Static offline snapshot of the whole [learn.chatgpt.com](https://learn.chatgpt.com) site (Codex docs, config reference, use cases, cookbook, blog, and related pages), plus a few CDN assets the pages need offline.

## What's in the tree

| Path | Role |
|------|------|
| `index.html` | Splash page → `learn.chatgpt.com/index.html` |
| `offline-link.html` | Target for every external link: "not available on this network" + copyable original URL (`?u=<url>`) |
| `learn.chatgpt.com/` | HTTrack whole-site mirror (HTML + `.md` twins + `_astro` assets) |
| `learn.chatgpt.com/pagefind/` | Local Pagefind search index (wired into the existing header search UI) |
| `learn.chatgpt.com/_offline/` | Offline search hook (`offline-search.js`) |
| `cdn.openai.com/` | Shared fonts referenced as `../cdn.openai.com/...` |
| `i.ytimg.com/`, `i.vimeocdn.com/` | Video thumbnails |
| `web.config` | IIS default document + extra MIME maps |
| `scripts/` | Post-process run on every rebuild (link fix-up, external-link rewrite, Pagefind, banner) |
| `.github/workflows/assemble-mirror.yml` | Full rebuild Action (`workflow_dispatch`) — re-crawls the live site |
| `.github/workflows/postprocess-only.yml` | **Postprocess only (no re-scrape)**: rewrite external links + rebuild search on the already-committed mirror |

## How to browse offline

1. Open `index.html`, or
2. Prefer a local static server so relative `_astro` paths resolve cleanly:

```bash
cd codex-cli-docs-offline
python3 -m http.server 8765
```

Then visit http://127.0.0.1:8765/

## Site banner (`banner.txt`)

Every page shows a thin one-line bar at the top whose content comes from **`banner.txt` at the
site root** (the folder IIS serves, next to `web.config` / `index.html`).

* Each rebuild (`scripts/inject-banner.py`, run by the GitHub Action) rewrites it with
  `Offline mirror of learn.chatgpt.com, mirrored <YYYY-MM-DD>` (crawl date, UTC).
* It may contain **simple inline HTML**, e.g.
  `Internal copy &mdash; see <a href="https://intranet.example/ai-policy">AI usage policy</a> and <a href="https://intranet.example/docs">internal docs</a>`.
  Keep it to one line of inline markup (links, `<b>`, `<code>`); `<script>` does not run.
  Relative `href`s (e.g. `policies/ai.html`) are resolved against the site root.
* To customise it, **edit the deployed copy on IIS** – no rebuild needed; the change shows on
  the next page load (`web.config` sends `Cache-Control: no-cache` for `banner.txt`, and the
  loader fetches it with `cache: 'no-cache'`).
* **A rebuild overwrites `banner.txt`.** When you redeploy a new build, keep your edited copy
  (copy it aside first, or exclude `banner.txt` from the deploy/robocopy, e.g. `/XF banner.txt`).
* Empty, missing or unreachable `banner.txt` ⇒ no banner at all.
* How it loads (no layout shift): every rebuild runs `scripts/inject-banner.py`, which writes the
  default `banner.txt` and injects into **every HTML page** (idempotently, between `<!--ob-->` markers)
  a small inline `<style>` + script in `<head>` that reserves the 28px bar *before first paint*
  (body padding and the site's fixed header/sidebar offsets, from `scripts/banner-site.css`), and a
  placeholder bar `<div id="ob">` at the top of `<body>`. An inline script fills it immediately from
  the last-seen text cached in `localStorage["offline-banner:codex-cli-docs-offline"]`, then fetches `banner.txt`
  (`cache: 'no-cache'`, page-relative path, so it works under an IIS sub-path) and updates bar + cache
  if the text changed. If `banner.txt` is empty/missing the reserved space collapses once, and later
  visits don't reserve it at all. Colours follow the page's light/dark mode.

## IIS notes

Point the site root at the **repo root** (not `learn.chatgpt.com/`). Keep `web.config` so:

- `index.html` is the default document
- `.md`, `.woff2`, `.webp`, `.vtt`, `.webm`, `.jsonl`, `.ts`, `.py`, `.yml` get sensible MIME types

Links are already relative (HTTrack + `scripts/fix-leftover-links.py`). External URLs (including `/api`, `/plugins`, and `/apps-sdk`, which 308 off-host to `developers.openai.com` and are excluded from the crawl) are rewritten to `offline-link.html?u=<original URL>`. No IIS outbound URL Rewrite module is required for Learn navigation.

## How the mirror is built

GitHub Action **Build offline learn.chatgpt.com mirror** (`assemble-mirror.yml`, `workflow_dispatch` only):

1. Build `seeds.txt` from site root + sitemap + `llms.txt` (and a few machine-readable files).
2. Run **HTTrack** with host-preserving names (`-N "%h%p/%n.%t"`), no query-string crawl explosion, and exclusions for `/api`, `/plugins`, `/apps-sdk`.
3. Post-process (`scripts/httrack-postprocess.sh`):
   - `fix-leftover-links.py`: strip HTTrack junk/timestamps, rename `codex-manual-markdown` → `docs/codex-manual.md`, fetch unlinked `.md` twins, relativize leftover absolute / `data-href` / CSS `url(/_astro/…)` links, recover `_astro` files lost to Vercel deploy skew via `?dpl=`.
   - `rewrite-external-links.py`: every remaining external navigational `href` (and `data-href` / iframe `src`) → `offline-link.html?u=<url>`; unmirrorable external `src`/`srcset` removed. Absolute links on a mirrored host that resolve to a local file stay local (including `/codex/use-cases/<slug>` → `use-cases/<slug>.html`).
   - `build-offline-search.py`: rebuild a local **Pagefind** index and hook it into the existing header search overlay (the live site uses a remote Algolia island, which cannot run offline).
   - `verify-offline.py`: fails the build if any raw `https://` link remains (other than via `offline-link.html`).
4. Commit and push the refreshed tree with `GITHUB_TOKEN`.

### Re-run the full scrape

1. Open https://github.com/ThomasRizzo/codex-cli-docs-offline/actions/workflows/assemble-mirror.yml
2. **Run workflow** → branch `main`
3. Wait for success (often ~30–90+ minutes; timeout is 360 minutes), then `git pull`

### Postprocess only (no re-scrape)

To refresh external-link rewrites and the offline search index without crawling the live site:

1. Open https://github.com/ThomasRizzo/codex-cli-docs-offline/actions/workflows/postprocess-only.yml
2. **Run workflow** → branch `main`

## Exclusions (not mirrored; links go to `offline-link.html`)

- `learn.chatgpt.com/api*`
- `learn.chatgpt.com/plugins*`
- `learn.chatgpt.com/apps-sdk*`
- Query-string page facets (`?team=`, `?site_locale=`, `?surface=`, `?export=`) — combinatorial; assets with `?v=` / `?dpl=` are still allowed
- Other off-site hosts (GitHub, YouTube, `developers.openai.com`, …)

## Limitations

- Static snapshot; live content drifts.
- Interactive / network-only widgets may degrade offline.
- Excluded off-host sections open the local "not available on this network" page, which shows the original URL for copying.
- Site search is a local Pagefind index of the mirrored HTML, hooked into the existing header search box. It does not call Algolia. Results are limited to pages in this snapshot.

## License / attribution

Content © OpenAI / ChatGPT Learn documentation. Unofficial offline mirror for personal/offline reference; not affiliated with OpenAI.
