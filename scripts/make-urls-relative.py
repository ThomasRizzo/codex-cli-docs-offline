#!/usr/bin/env python3
"""Materialize from scripts/make-urls-relative.sh embedded payload, then re-exec.

The canonical rewriter source lives in the gzip+base64 PAYLOAD inside
scripts/make-urls-relative.sh (kept in sync for MCP/partial pushes).
"""
from __future__ import annotations

import base64
import gzip
import re
import runpy
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SH = HERE / "make-urls-relative.sh"
text = SH.read_text(encoding="utf-8")
m = re.search(r"PAYLOAD='([^']+)'", text)
if not m:
    sys.stderr.write(f"error: no PAYLOAD in {SH}\n")
    sys.exit(1)
code = gzip.decompress(base64.b64decode(m.group(1)))
Path(__file__).write_bytes(code)
# Re-exec the materialized file with original argv
sys.argv[0] = str(Path(__file__))
runpy.run_path(str(Path(__file__)), run_name="__main__")
