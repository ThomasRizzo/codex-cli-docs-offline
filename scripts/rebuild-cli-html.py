#!/usr/bin/env python3
from pathlib import Path
root=Path("learn.chatgpt.com/docs/codex/_rebuild")
parts=sorted(root.glob("cli.html.part*"))
out=Path("learn.chatgpt.com/docs/codex/cli.html")
data="".join(p.read_text(encoding="utf-8") for p in parts)
out.write_text(data, encoding="utf-8")
print(f"wrote {out} ({len(data)} chars) from {len(parts)} parts")
