#!/usr/bin/env bash
# Post-process an HTTrack mirror of learn.chatgpt.com so it is commit-friendly.
#   usage: httrack-postprocess.sh <httrack -O dir> <repo dir>
# 1) moves host dirs (learn.chatgpt.com + asset CDNs) into the repo
# 2) strips HTTrack's per-run timestamp comments (otherwise every page diffs on every run)
# 3) removes HTTrack junk (cache, log, wrapper index, gifs, temp/delayed files, empty dirs)
# 4) fetches the unlinked Markdown twins (<page>.md) for every mirrored HTML page
# 5) runs fix-leftover-links.py (see that file)
set -euo pipefail
OUT=$(realpath "$1"); REPO=$(realpath "$2"); HOST=learn.chatgpt.com
HOSTS="$HOST cdn.openai.com i.ytimg.com i.vimeocdn.com"

# --- junk inside the httrack output ---------------------------------------
find "$OUT" -type f \( -name '*.tmp' -o -name '*.delayed' -o -name '*.readme' \) -delete
find "$OUT" -depth -type d -empty -delete

# --- strip HTTrack comments / injected meta (stable diffs) ------------------
find "$OUT" -type f -name '*.html' -print0 | xargs -0 -r perl -0pi -e '
  s{<!-- Mirrored from [^>]*? by HTTrack Website Copier/[^>]*?-->\n?}{}g;
  s{<!-- Added by HTTrack --><meta http-equiv="content-type" content="text/html;charset=utf-8" /><!-- /Added by HTTrack -->\n?}{}g;
  s{<!-- Created by HTTrack Website Copier/[^>]*?-->\n?}{}g;'

# --- files HTTrack renamed from Content-Disposition --------------------------
# /docs/codex-manual.md is served as application/octet-stream with
# Content-Disposition: filename="codex-manual-markdown" -> HTTrack saves it as
# docs/codex-manual-markdown.html. Restore the real name and fix references.
if [ -f "$OUT/$HOST/docs/codex-manual-markdown.html" ]; then
  mv "$OUT/$HOST/docs/codex-manual-markdown.html" "$OUT/$HOST/docs/codex-manual.md"
  grep -rlZ 'codex-manual-markdown\.html' "$OUT/$HOST" --include='*.html' | xargs -0 -r sed -i 's/codex-manual-markdown\.html/codex-manual.md/g'
fi
# sitemap-index.xml is saved as chatgpt-sitemap-index.xml for the same reason
[ -f "$OUT/$HOST/chatgpt-sitemap-index.xml" ] && [ ! -f "$OUT/$HOST/sitemap-index.xml" ] && cp "$OUT/$HOST/chatgpt-sitemap-index.xml" "$OUT/$HOST/sitemap-index.xml"
# /llms.txt and /llms-full.txt 307 to /docs/...; keep root copies so old links work
for f in llms.txt llms-full.txt; do [ -f "$OUT/$HOST/docs/$f" ] && cp "$OUT/$HOST/docs/$f" "$OUT/$HOST/$f"; done

# --- Markdown twins (not linked from HTML, so HTTrack never sees them) ------
# /docs/foo.html -> /docs/foo.md ; /cookbook/index.html -> /cookbook.md
( cd "$OUT/$HOST"
  find . -name '*.html' ! -path './_*' -print0 | while IFS= read -r -d '' f; do
    grep -q '<TITLE>Page has moved</TITLE>' "$f" && continue      # redirect stubs
    p=${f#./}; p=${p%.html}; p=${p%/index}; [ "$p" = index ] && continue
    [ -f "$p.md" ] || echo "$p"
  done ) | sort -u > /tmp/md-candidates.txt
echo "md twin candidates: $(wc -l < /tmp/md-candidates.txt)"
xargs -P4 -I{} sh -c 'curl -sf --retry 2 --max-time 60 -o "$0/{}.md" "https://'"$HOST"'/{}.md" || rm -f "$0/{}.md"' "$OUT/$HOST" < /tmp/md-candidates.txt || true

# --- relativize leftovers (query links, data-href, CSS url(/..), srcset, deploy skew) ---
python3 "$(dirname "$0")/fix-leftover-links.py" "$OUT/$HOST" "$OUT/hts-cache" --md

# --- move into the repo -----------------------------------------------------
for h in $HOSTS; do
  [ -d "$OUT/$h" ] || continue
  rm -rf "${REPO:?}/$h"; mv "$OUT/$h" "$REPO/$h"
done
echo "=== mirror stats ==="
for h in $HOSTS; do [ -d "$REPO/$h" ] && printf '%-20s %6s files %s\n' "$h" "$(find "$REPO/$h" -type f | wc -l)" "$(du -sh "$REPO/$h" | cut -f1)"; done
find "$REPO/$HOST" -name '*.html' | wc -l | sed 's/^/html pages: /'
