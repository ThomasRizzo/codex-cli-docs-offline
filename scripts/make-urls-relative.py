#!/usr/bin/env python3
"""Rewrite absolute Learn / OpenAI doc URLs to relative paths for offline hosting.

Stdlib only. Idempotent: absolute site URLs become relative; already-relative
links are left alone. Run from repo root or via scripts/make-urls-relative.sh.
"""

from __future__ import annotations

import argparse
import html as html_lib
import os
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

MIRROR_DIR = "learn.chatgpt.com"
PROCESS_SUFFIXES = {".html", ".md", ".css", ".js", ".txt"}

# Absolute Learn host
LEARN_URL_RE = re.compile(
    r"https?://learn\.chatgpt\.com(?P<path>/[^\s\"'<>)\]]*)?",
    re.IGNORECASE,
)

# developers.openai.com/codex/... or /docs/... (maps into Learn tree)
DEVELOPERS_URL_RE = re.compile(
    r"https?://developers\.openai\.com(?P<path>/(?:codex|docs)(?:/[^\s\"\'<>)\]]*)?)",
    re.IGNORECASE,
)

# Root-absolute paths in HTML-like attributes
ATTR_ROOT_RE = re.compile(
    r"""(?P<prefix>\b(?:href|src|action|poster|data-href|data-src|data-url)\s*=\s*)"""
    r"""(?P<q>["'])(?P<path>/(?!/)[^\"']*)(?P=q)""",
    re.IGNORECASE,
)

# Markdown link with root-absolute target: ](/path)
MD_ROOT_RE = re.compile(r"(?P<prefix>\]\()(?P<path>/(?!/)[^)\s]*)\)")

# CSS url(...) with absolute Learn host or root-absolute site asset
CSS_URL_RE = re.compile(
    r"""(?P<prefix>url\(\s*)(?P<q>["']?)(?P<target>https?://learn\.chatgpt\.com[^\"')\s]*|/(?!/)[^\"')\s]*)(?P=q)(?P<suffix>\s*\))""",
    re.IGNORECASE,
)

ASSET_PREFIXES = ("/_astro/", "/js/", "/fonts/", "/images/")
ASSET_EXACT = {"/favicon.png", "/llms.txt", "/OpenAI_Developers.svg"}

# Live /codex/{name} 308s to top-level /{name} (not /docs/...).
TOPLEVEL_FROM_CODEX = frozenset({"resources", "use-cases", "videos"})


def split_path_query_fragment(raw: str) -> tuple[str, str]:
    """Return (path_for_lookup, fragment_suffix including '#' or ''). Drop query."""
    raw = raw.strip()
    if not raw:
        return "/", ""
    # Handle HTML entities in mangled wget URLs before urlsplit
    unescaped = html_lib.unescape(raw)
    parts = urlsplit(unescaped if "://" in unescaped else f"http://dummy.local{unescaped}")
    path = unquote(parts.path or "/")
    fragment = f"#{parts.fragment}" if parts.fragment else ""
    return path, fragment


def demangle_path(path: str) -> str:
    """Fix wget --convert-links artifacts like /docs/\"/images/foo.svg\"."""
    path = html_lib.unescape(path)
    # /docs/"/images/..." or /docs/'/images/...'
    m = re.match(r'^/docs/["\'](/[^"\']+)["\']$', path)
    if m:
        return m.group(1)
    # leftover quotes inside path
    if '"' in path or "'" in path:
        m2 = re.search(r'(/(?:_astro|js|fonts|images)/[^"\']+)', path)
        if m2:
            return m2.group(1)
    return path


def has_extension(path: str) -> bool:
    name = path.rsplit("/", 1)[-1]
    return "." in name and not name.startswith(".")


def candidate_relpaths(url_path: str) -> list[str]:
    """Ordered candidate paths relative to learn.chatgpt.com/."""
    path = demangle_path(url_path)
    if not path.startswith("/"):
        path = "/" + path
    path = path.rstrip("/") or "/"

    cands: list[str] = []

    def add(*items: str) -> None:
        for item in items:
            item = item.lstrip("/")
            if item not in cands:
                cands.append(item)

    if path == "/":
        add("index.html", "docs/codex.html", "docs/codex/cli.html")
        return cands

    if path in ASSET_EXACT or path.startswith(ASSET_PREFIXES):
        add(path.lstrip("/"))
        return cands

    if path == "/codex" or path.startswith("/codex/"):
        if path == "/codex":
            # Live /codex → /docs; keep docs/codex* as historical local anchors.
            add(
                "docs.html",
                "docs/index.html",
                "docs/codex.html",
                "docs/codex/index.html",
                "docs/codex/cli.html",
                "codex.html",
                "codex/index.html",
            )
            return cands
        rest = path[len("/codex/") :]
        rest = rest.rstrip("/")
        top = rest.split("/", 1)[0]
        # Live redirects: /codex/resources → /resources, etc.
        if top in TOPLEVEL_FROM_CODEX:
            if has_extension(rest):
                add(rest, f"docs/{rest}", f"docs/codex/{rest}", f"codex/{rest}")
            else:
                add(
                    f"{rest}.html",
                    rest,
                    f"{rest}/index.html",
                    f"{rest}.md",
                    f"docs/{rest}.html",
                    f"docs/{rest}",
                    f"docs/{rest}/index.html",
                    f"docs/codex/{rest}.html",
                    f"docs/codex/{rest}",
                    f"docs/codex/{rest}/index.html",
                    f"codex/{rest}.html",
                    f"codex/{rest}",
                )
            return cands
        # Otherwise: try docs/codex/* first when present (cli/ide still live there),
        # then canonical docs/{rest} (most /codex/X → /docs/X).
        if has_extension(rest):
            add(f"docs/codex/{rest}", f"docs/{rest}", f"codex/{rest}")
        else:
            add(
                f"docs/codex/{rest}.html",
                f"docs/{rest}.html",
                f"docs/codex/{rest}",
                f"docs/codex/{rest}/index.html",
                f"docs/{rest}",
                f"docs/{rest}/index.html",
                f"codex/{rest}.html",
                f"codex/{rest}",
                f"docs/codex/{rest}.md",
                f"docs/{rest}.md",
            )
        return cands

    if path == "/docs" or path.startswith("/docs/"):
        if path == "/docs":
            add("docs/codex.html", "docs/index.html", "docs.html", "docs")
            return cands
        rest = path[len("/docs/") :]
        rest = rest.rstrip("/")
        if not rest:
            add("docs/codex.html", "docs/index.html", "docs.html", "docs")
            return cands
        if has_extension(rest):
            add(f"docs/{rest}", f"docs/{rest}.html" if not rest.endswith((".html", ".md", ".txt")) else f"docs/{rest}")
            # also try without double extensions
            add(f"docs/{rest}")
        else:
            add(
                f"docs/{rest}.html",
                f"docs/{rest}.md",
                f"docs/{rest}",
                f"docs/{rest}/index.html",
            )
        return cands

    # developers.openai.com/codex/... already normalized to /codex/... by caller
    # Other site paths (/api/docs, /use-cases, /chatgpt, /learn, ...)
    rest = path.lstrip("/")
    if has_extension(rest):
        add(rest)
    else:
        add(f"{rest}.html", rest, f"{rest}/index.html", f"{rest}.md")
    return cands


def preferred_missing(url_path: str) -> str:
    """Path under mirror to emit when no local file exists.

    For /codex/* aliases, prefer live redirect targets:
    - /codex/resources|use-cases|videos → top-level {rest}.html
    - most /codex/X → docs/{rest}.html (NOT docs/codex/{rest}.html, which 404s live)
    Existence checks still try docs/codex/* first via candidate_relpaths.
    """
    path = demangle_path(url_path)
    if not path.startswith("/"):
        path = "/" + path
    path = path.rstrip("/") or "/"

    if path == "/codex":
        return "docs.html"
    if path.startswith("/codex/"):
        rest = path[len("/codex/") :].rstrip("/")
        top = rest.split("/", 1)[0]
        if top in TOPLEVEL_FROM_CODEX:
            return rest if has_extension(rest) else f"{rest}.html"
        return rest if has_extension(rest) else f"docs/{rest}.html"

    cands = candidate_relpaths(url_path)
    return cands[0] if cands else url_path.lstrip("/")


def resolve_target(mirror_root: Path, url_path: str) -> tuple[Path, bool]:
    """Return (absolute target path, exists)."""
    for rel in candidate_relpaths(url_path):
        target = mirror_root / rel
        if target.is_file():
            return target, True
        # Allow directory with index.html
        if target.is_dir():
            idx = target / "index.html"
            if idx.is_file():
                return idx, True
    pref = preferred_missing(url_path)
    return mirror_root / pref, False


def to_relative(from_file: Path, target: Path) -> str:
    rel = os.path.relpath(target, start=from_file.parent)
    return Path(rel).as_posix()


def developers_path_to_learn(path: str) -> str:
    """Map /codex/... or /docs/... from developers.openai.com into Learn URL paths."""
    path = path or "/"
    if path.startswith("/codex"):
        # /codex -> /docs/codex, /codex/cli -> try /codex/cli (handled by candidates)
        return path
    if path.startswith("/docs"):
        return path
    return path


class Rewriter:
    def __init__(self, root: Path, dry_run: bool = False) -> None:
        self.root = root.resolve()
        self.mirror = self.root / MIRROR_DIR
        self.dry_run = dry_run
        self.files_changed = 0
        self.replacements = 0
        self.missing = 0

    def rewrite_url_path(self, from_file: Path, url_path: str) -> str:
        path, fragment = split_path_query_fragment(url_path)
        path = demangle_path(path)
        target, exists = resolve_target(self.mirror, path)
        if not exists:
            self.missing += 1
        return to_relative(from_file, target) + fragment

    def replace_learn_url(self, from_file: Path, match: re.Match[str]) -> str:
        path = match.group("path") or "/"
        self.replacements += 1
        return self.rewrite_url_path(from_file, path)

    def replace_developers_url(self, from_file: Path, match: re.Match[str]) -> str:
        path = match.group("path") or "/"
        # Only map codex/docs; regex already restricts
        mapped = developers_path_to_learn(path)
        self.replacements += 1
        return self.rewrite_url_path(from_file, mapped)

    def replace_attr_root(self, from_file: Path, match: re.Match[str]) -> str:
        path = match.group("path")
        q = match.group("q")
        new = self.rewrite_url_path(from_file, path)
        self.replacements += 1
        return f"{match.group('prefix')}{q}{new}{q}"

    def replace_md_root(self, from_file: Path, match: re.Match[str]) -> str:
        path = match.group("path")
        # Skip pure external-looking or empty
        new = self.rewrite_url_path(from_file, path)
        self.replacements += 1
        return f"{match.group('prefix')}{new})"

    def replace_css_url(self, from_file: Path, match: re.Match[str]) -> str:
        target = match.group("target")
        q = match.group("q") or ""
        if target.lower().startswith("http://learn.chatgpt.com") or target.lower().startswith(
            "https://learn.chatgpt.com"
        ):
            parts = urlsplit(html_lib.unescape(target))
            path = parts.path or "/"
            fragment = f"#{parts.fragment}" if parts.fragment else ""
            new = self.rewrite_url_path(from_file, path) + fragment
        elif target.startswith("/"):
            new = self.rewrite_url_path(from_file, target)
        else:
            return match.group(0)
        self.replacements += 1
        # Prefer preserving quote style; unquoted url() is fine with relative paths
        if q:
            return f"{match.group('prefix')}{q}{new}{q}{match.group('suffix')}"
        return f"{match.group('prefix')}{new}{match.group('suffix')}"

    def process_text(self, from_file: Path, text: str) -> str:
        # Order: CSS url() first (handles quoted absolute + root), then absolute hosts,
        # then attribute root-absolute, then markdown root-absolute.
        # Absolute host rewrites also cover Markdown [text](https://learn...).

        def css_sub(m: re.Match[str]) -> str:
            return self.replace_css_url(from_file, m)

        text = CSS_URL_RE.sub(css_sub, text)

        def learn_sub(m: re.Match[str]) -> str:
            return self.replace_learn_url(from_file, m)

        text = LEARN_URL_RE.sub(learn_sub, text)

        def dev_sub(m: re.Match[str]) -> str:
            return self.replace_developers_url(from_file, m)

        text = DEVELOPERS_URL_RE.sub(dev_sub, text)

        def attr_sub(m: re.Match[str]) -> str:
            return self.replace_attr_root(from_file, m)

        text = ATTR_ROOT_RE.sub(attr_sub, text)

        # Markdown root-absolute — only in .md/.txt to avoid breaking JS comparisons
        if from_file.suffix.lower() in {".md", ".txt"}:
            def md_sub(m: re.Match[str]) -> str:
                return self.replace_md_root(from_file, m)

            text = MD_ROOT_RE.sub(md_sub, text)

        return text

    def process_file(self, path: Path) -> None:
        try:
            original = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            try:
                original = path.read_text(encoding="utf-8", errors="surrogateescape")
            except OSError as exc:
                print(f"skip (read error): {path}: {exc}", file=sys.stderr)
                return
        except OSError as exc:
            print(f"skip (read error): {path}: {exc}", file=sys.stderr)
            return

        before_rep = self.replacements
        before_miss = self.missing
        updated = self.process_text(path, original)
        file_reps = self.replacements - before_rep
        # missing is global; fine

        if updated != original:
            self.files_changed += 1
            if not self.dry_run:
                path.write_text(updated, encoding="utf-8")

    def iter_files(self) -> list[Path]:
        if not self.mirror.is_dir():
            print(f"error: mirror not found: {self.mirror}", file=sys.stderr)
            return []
        files: list[Path] = []
        for dirpath, dirnames, filenames in os.walk(self.mirror):
            # skip .git if somehow nested
            dirnames[:] = [d for d in dirnames if d != ".git"]
            for name in filenames:
                p = Path(dirpath) / name
                if p.suffix.lower() in PROCESS_SUFFIXES:
                    files.append(p)
        return sorted(files)

    def run(self) -> int:
        files = self.iter_files()
        if not files:
            print("No files to process.")
            return 1
        for f in files:
            self.process_file(f)
        mode = "dry-run " if self.dry_run else ""
        print(
            f"{mode}done: files_changed={self.files_changed} "
            f"replacements={self.replacements} missing_targets={self.missing} "
            f"files_scanned={len(files)}"
        )
        return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root",
        type=Path,
        default=None,
        help="Repo root (parent of learn.chatgpt.com/). Default: parent of scripts/ or cwd.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Report changes without writing.")
    args = parser.parse_args(argv)

    if args.root is not None:
        root = args.root
    else:
        # Prefer repo root: parent of scripts/ when this file lives in scripts/
        here = Path(__file__).resolve()
        if here.parent.name == "scripts":
            root = here.parent.parent
        else:
            root = Path.cwd()

    if not (root / MIRROR_DIR).is_dir():
        # fall back to cwd
        if (Path.cwd() / MIRROR_DIR).is_dir():
            root = Path.cwd()
        else:
            print(f"error: {MIRROR_DIR}/ not found under {root}", file=sys.stderr)
            return 1

    return Rewriter(root, dry_run=args.dry_run).run()


if __name__ == "__main__":
    sys.exit(main())
