#!/usr/bin/env bash
# Post-process an HTTrack mirror of learn.chatgpt.com so it is commit-friendly.
#   usage: httrack-postprocess.sh <httrack -O dir> <repo dir>
set -euo pipefail
OUT=$(realpath "$1"); REPO=$(realpath "$2"); HOST=learn.chatgpt.com
HOSTS="$HOST cdn.openai.com i.ytimg.com i.vimeocdn.com"
echo "postprocess: OUT=$OUT REPO=$REPO"
ls -la "$OUT" | head -30 || true

find "$OUT" -type f \( -name '*.tmp' -o -name '*.delayed' -o -name '*.readme' \) -delete || true
find "$OUT" -depth -type d -empty -delete || true

echo "postprocess: strip HTTrack comments"
# Use xargs (not find -exec): perl s{}{} delimiters contain {}, which breaks find -exec ... +
# Use s||| delimiters to avoid any {} confusion.
find "$OUT" -type f -name '*.html' -print0 | xargs -0 -r -n 50 perl -0pi -e \
  's|<!-- Mirrored from .*? by HTTrack Website Copier/.*?-->\n?||gs; s|<!-- Added by HTTrack --><meta http-equiv="content-type" content="text/html;charset=utf-8" /><!-- /Added by HTTrack -->\n?||gs; s|<!-- Created by HTTrack Website Copier/.*?-->\n?||gs;'

if [ -f "$OUT/$HOST/docs/codex-manual-markdown.html" ]; then
  echo "postprocess: restore docs/codex-manual.md"
  mv "$OUT/$HOST/docs/codex-manual-markdown.html" "$OUT/$HOST/docs/codex-manual.md"
  grep -rlZ 'codex-manual-markdown\.html' "$OUT/$HOST" --include='*.html' 2>/dev/null | xargs -0 -r sed -i 's/codex-manual-markdown\.html/codex-manual.md/g' || true
fi
if [ -f "$OUT/$HOST/chatgpt-sitemap-index.xml" ] && [ ! -f "$OUT/$HOST/sitemap-index.xml" ]; then
  cp "$OUT/$HOST/chatgpt-sitemap-index.xml" "$OUT/$HOST/sitemap-index.xml"
fi
for f in llms.txt llms-full.txt; do
  [ -f "$OUT/$HOST/docs/$f" ] && cp "$OUT/$HOST/docs/$f" "$OUT/$HOST/$f" || true
done

echo "postprocess: fetch .md twins"
( cd "$OUT/$HOST"
  find . -name '*.html' ! -path './_*' -print0 | while IFS= read -r -d '' f; do
    grep -q '<TITLE>Page has moved</TITLE>' "$f" 2>/dev/null && continue || true
    p=${f#./}; p=${p%.html}; p=${p%/index}; [ "$p" = index ] && continue
    [ -f "$p.md" ] || echo "$p"
  done ) | sort -u > /tmp/md-candidates.txt || true
echo "md twin candidates: $(wc -l < /tmp/md-candidates.txt | tr -d ' ')"
if [ -s /tmp/md-candidates.txt ]; then
  while IFS= read -r p; do
    curl -sf --retry 2 --max-time 60 -o "$OUT/$HOST/${p}.md" "https://${HOST}/${p}.md" || rm -f "$OUT/$HOST/${p}.md"
  done < /tmp/md-candidates.txt || true
fi

if [ ! -d "$OUT/$HOST" ]; then
  echo "ERROR: missing $OUT/$HOST after HTTrack" >&2
  find "$OUT" -maxdepth 2 -type d | head -50 >&2 || true
  exit 1
fi

echo "postprocess: fix leftover links"
python3 "$(dirname "$0")/fix-leftover-links.py" "$OUT/$HOST" "$OUT/hts-cache" --md

echo "postprocess: move host dirs into repo"
for h in $HOSTS; do
  [ -d "$OUT/$h" ] || continue
  rm -rf "${REPO:?}/$h"; mv "$OUT/$h" "$REPO/$h"
done
echo "=== mirror stats ==="
for h in $HOSTS; do
  [ -d "$REPO/$h" ] && printf '%-20s %6s files %s\n' "$h" "$(find "$REPO/$h" -type f | wc -l)" "$(du -sh "$REPO/$h" | cut -f1)" || true
done
find "$REPO/$HOST" -name '*.html' | wc -l | sed 's/^/html pages: /'
echo "postprocess: done"
