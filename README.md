# Codex CLI Docs — Offline Mirror

Static offline snapshot of the OpenAI / ChatGPT **Codex** documentation (CLI, IDE, config, and related pages).

## Source

- Primary host: [https://learn.chatgpt.com](https://learn.chatgpt.com)
- Codex tree: [https://learn.chatgpt.com/docs/codex/](https://learn.chatgpt.com/docs/codex/) (especially [CLI](https://learn.chatgpt.com/docs/codex/cli))
- Config docs: [https://learn.chatgpt.com/docs/config-file/](https://learn.chatgpt.com/docs/config-file/)
- Doc map: [https://learn.chatgpt.com/llms.txt](https://learn.chatgpt.com/llms.txt)

Note: `developers.openai.com/codex/*` 308-redirects to `learn.chatgpt.com/docs/codex/*`. This mirror captures the canonical Learn site (Astro static HTML).

## Mirror date

**2026-09-24 13:28 EDT** (America/New_York)

## How to browse offline

1. **Simplest:** open `index.html` in a browser (or `learn.chatgpt.com/docs/codex/cli.html`).
2. **Local server (recommended for relative asset paths):**

```bash
cd codex-cli-docs-offline
python3 -m http.server 8765
```

Then visit http://127.0.0.1:8765/

Markdown twins (`*.md`) sit next to many HTML pages for text-only / LLM ingestion. Also included: `learn.chatgpt.com/llms.txt` and `learn.chatgpt.com/docs/codex-manual.md`.

## What's included

- HTML pages under `/docs/codex/`, `/docs/config-file/`, and related Codex CLI/agent docs
- Page assets: `/_astro/` CSS/JS/fonts, `/js/`, `/images/codex/`, local font copies
- Markdown exports (page `.md` twins + manuals where available)

## Limitations

- This is a **static snapshot**. Live site content will drift over time.
- Full Astro HTML pages include site chrome; links to unmirrored sections (`/api/docs`, `/ads`, etc.) will 404 locally.
- Site-wide nav links to unrelated sections were **not** mirrored and will 404 locally.
- Interactive widgets / JS-only features may degrade without network.
- Prefer `python3 -m http.server` so relative `_astro` CSS paths resolve.
- Re-run the GitHub Action **Build offline Codex docs mirror** (`workflow_dispatch`) to refresh from learn.chatgpt.com.


## Relative URLs (IIS / static hosts)

Absolute `learn.chatgpt.com` (and mapped `developers.openai.com/codex|docs`) links are rewritten to **relative** paths so IIS or any static file host keeps navigation on the local mirror—no outbound URL rewrite module required for Learn links.

After a fresh mirror or local content update, re-run:

```bash
bash scripts/make-urls-relative.sh
# or: python3 scripts/make-urls-relative.py
# optional: --dry-run  /  --root PATH
```

The GitHub Action **Build offline Codex docs mirror** runs this automatically after `wget`.

## License / attribution

Content © OpenAI / ChatGPT Learn documentation. This repository is an unofficial offline mirror for personal/offline reference; it is not affiliated with OpenAI.
