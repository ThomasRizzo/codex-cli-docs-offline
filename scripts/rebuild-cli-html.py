#!/usr/bin/env python3
from pathlib import Path
import re
root = Path("learn.chatgpt.com/docs/codex/_rebuild")
parts = sorted(p for p in root.glob("cli.html.part*") if re.fullmatch(r"cli\.html\.part\d+", p.name))
assert len(parts) == 161, f"expected 161 parts, got {len(parts)}"
out = Path("learn.chatgpt.com/docs/codex/cli.html")
data = "".join(p.read_text(encoding="utf-8") for p in parts)
out.write_text(data, encoding="utf-8")
print(f"wrote {out} ({len(data)} chars) from {len(parts)} parts")
