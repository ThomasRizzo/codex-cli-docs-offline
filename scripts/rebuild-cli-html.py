#!/usr/bin/env python3
"""Assemble cli.html from _rebuild parts (raw or base64)."""
from pathlib import Path
import base64
import re

root = Path("learn.chatgpt.com/docs/codex/_rebuild")
parts = sorted(root.glob("cli.html.part*"))
# ignore non-part junk like .mcp-probe
parts = [p for p in parts if re.fullmatch(r"cli\.html\.part\d+", p.name)]
assert len(parts) == 33, f"expected 33 parts, got {len(parts)}: {[p.name for p in parts]}"

chunks = []
for p in parts:
    text = p.read_text(encoding="utf-8")
    # Detect base64: mostly b64 alphabet and optional newlines
    compact = "".join(text.split())
    is_b64 = (
        len(compact) >= 16
        and all(c.isalnum() or c in "+/=" for c in compact)
        and not compact.lstrip().startswith("<!")
        and not compact.lstrip().startswith("<html")
    )
    if is_b64:
        chunks.append(base64.b64decode(compact).decode("utf-8"))
    else:
        chunks.append(text)

out = Path("learn.chatgpt.com/docs/codex/cli.html")
data = "".join(chunks)
out.write_text(data, encoding="utf-8")
print(f"wrote {out} ({len(data)} chars) from {len(parts)} parts")
