# learn.chatgpt.com — Offline Mirror

Static offline snapshot of the whole [learn.chatgpt.com](https://learn.chatgpt.com) site (Codex docs, config reference, use cases, cookbook, blog, and related pages), plus a few CDN assets the pages need offline.

## What's in the tree

| Path | Role |
|------|------|
| `index.html` | Splash page → `learn.chatgpt.com/index.html` |
| `learn.chatgpt.com/` | HTTrack whole-site mirror (HTML + `.md` twins + `_astro` assets) |
| `cdn.openai.com/` | Shared fonts referenced as `../cdn.openai.com/...` |
| `i.ytimg.com/`, `i.vimeocdn.com/` | Video thumbnails |
| `web.config` | IIS default document + extra MIME maps |
| `scripts/` | Thin post-process after HTTrack (`httrack-postprocess.sh`, `fix-leftover-links.py`) |
| `.github/workflows/assemble-mirror.yml` | Rebuild Action (`workflow_dispatch`) |

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

Links are already relative (HTTrack + `scripts/fix-leftover-links.py`). No IIS outbound URL Rewrite module is required for Learn navigation. Paths under `/api`, `/plugins`, and `/apps-sdk` stay absolute `https://learn.chatgpt.com/...` on purpose — they 308 off-host to `developers.openai.com` and are excluded from the mirror.

## How the mirror is built

GitHub Action **Build offline learn.chatgpt.com mirror** (`assemble-mirror.yml`, `workflow_dispatch` only):

1. Build `seeds.txt` from site root + sitemap + `llms.txt` (and a few machine-readable files).
2. Run **HTTrack** with host-preserving names (`-N "%h%p/%n.%t"`), no query-string crawl explosion, and exclusions for `/api`, `/plugins`, `/apps-sdk`.
3. Thin post-process (`scripts/httrack-postprocess.sh` + `fix-leftover-links.py`): strip HTTrack junk/timestamps, rename `codex-manual-markdown` → `docs/codex-manual.md`, fetch unlinked `.md` twins, relativize leftover absolute / `data-href` / CSS `url(/_astro/…)` links, recover `_astro` files lost to Vercel deploy skew via `?dpl=`.
4. Commit and push the refreshed tree with `GITHUB_TOKEN`.

### Re-run the Action

1. Open https://github.com/ThomasRizzo/codex-cli-docs-offline/actions/workflows/assemble-mirror.yml
2. **Run workflow** → branch `main`
3. Wait for success (often ~30–90+ minutes; timeout is 150 minutes), then `git pull`

## Exclusions (left absolute / not mirrored)

- `learn.chatgpt.com/api*`
- `learn.chatgpt.com/plugins*`
- `learn.chatgpt.com/apps-sdk*`
- Query-string page facets (`?team=`, `?site_locale=`, `?surface=`, `?export=`) — combinatorial; assets with `?v=` / `?dpl=` are still allowed

## Limitations

- Static snapshot; live content drifts.
- Interactive / network-only widgets may degrade offline.
- Excluded off-host sections stay online-only links.

## License / attribution

Content © OpenAI / ChatGPT Learn documentation. Unofficial offline mirror for personal/offline reference; not affiliated with OpenAI.
