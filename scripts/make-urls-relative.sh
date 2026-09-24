#!/usr/bin/env bash
# Thin wrapper: rewrite absolute Learn doc URLs to relative paths.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
exec python3 "$ROOT/scripts/make-urls-relative.py" "$@"
