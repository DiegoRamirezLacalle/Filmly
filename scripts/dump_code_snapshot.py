#!/usr/bin/env python3
"""Generate a single Markdown file containing the repository source code.

- Emits a section per file with its workspace-relative path.
- Skips heavy/vendor dirs (db/, node_modules/, .git/, etc.).
- Skips binary files and very large text files.

Usage (from Filmly/):
  python scripts/dump_code_snapshot.py --out CODE_SNAPSHOT.md
"""

from __future__ import annotations

import argparse
import fnmatch
import os
from pathlib import Path


DEFAULT_EXCLUDE_DIRS = {
    ".git",
    ".github",
    "node_modules",
    "db",
    "dist",
    "build",
    ".venv",
    "venv",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".cache",
    "coverage",
    ".next",
    ".turbo",
}

DEFAULT_EXCLUDE_FILES = {
    ".DS_Store",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "CODE_SNAPSHOT.md",
}

# Glob patterns to exclude. These are matched against the workspace-relative POSIX path.
# Keep this conservative: prefer excluding secret-bearing files and generated artifacts.
DEFAULT_EXCLUDE_GLOBS = {
    "**/.env",
    "**/.env.*",
}

ALLOWLIST_GLOBS = {
    "**/.env.example",
    "**/.env.sample",
}

# Extensions that are usually binary or not useful for a code snapshot.
BINARY_EXTS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".tar",
    ".7z",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    ".dat",
    ".mp4",
    ".mov",
    ".avi",
    ".mp3",
    ".wav",
    ".ttf",
    ".otf",
    ".woff",
    ".woff2",
    ".map",
    ".lockb",
    ".wt",
    ".bson",
}

LANG_BY_EXT = {
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".js": "javascript",
    ".jsx": "jsx",
    ".json": "json",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".md": "markdown",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
    ".sh": "bash",
    ".ps1": "powershell",
    ".dockerfile": "dockerfile",
}

FILENAME_LANG = {
    "Dockerfile": "dockerfile",
    "Makefile": "makefile",
}


def looks_binary(path: Path, max_probe_bytes: int = 8192) -> bool:
    suffix = path.suffix.lower()
    if suffix in BINARY_EXTS:
        return True

    try:
        with path.open("rb") as f:
            chunk = f.read(max_probe_bytes)
        # Heuristic: NUL bytes usually indicate binary.
        if b"\x00" in chunk:
            return True
        # If it can't be decoded as UTF-8 (even with replacement), consider it text still;
        # we'll decode with replacement later. This function is just a fast binary check.
        return False
    except OSError:
        return True


def _matches_any_glob(posix_rel: str, patterns: set[str]) -> bool:
    return any(fnmatch.fnmatch(posix_rel, pat) for pat in patterns)


def should_exclude(
    path: Path,
    repo_root: Path,
    exclude_dirs: set[str],
    exclude_files: set[str],
    exclude_globs: set[str],
    allowlist_globs: set[str],
) -> bool:
    rel = path.relative_to(repo_root)
    rel_posix = rel.as_posix()

    # Skip any excluded directory in the relative parts
    for part in rel.parts[:-1]:
        if part in exclude_dirs:
            return True

    if rel.name in exclude_files:
        return True

    if _matches_any_glob(rel_posix, allowlist_globs):
        return False

    if _matches_any_glob(rel_posix, exclude_globs):
        return True

    return False


def detect_lang(path: Path) -> str:
    if path.name in FILENAME_LANG:
        return FILENAME_LANG[path.name]

    ext = path.suffix.lower()
    if path.name.lower().endswith("dockerfile"):
        return "dockerfile"

    return LANG_BY_EXT.get(ext, "")


def iter_files(
    repo_root: Path,
    exclude_dirs: set[str],
    exclude_files: set[str],
    exclude_globs: set[str],
    allowlist_globs: set[str],
) -> list[Path]:
    files: list[Path] = []
    for root, dirs, filenames in os.walk(repo_root):
        root_path = Path(root)

        # prune excluded directories
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for filename in filenames:
            file_path = root_path / filename
            if should_exclude(file_path, repo_root, exclude_dirs, exclude_files, exclude_globs, allowlist_globs):
                continue
            if file_path.is_symlink():
                continue
            if not file_path.is_file():
                continue
            files.append(file_path)

    files.sort(key=lambda p: str(p.relative_to(repo_root)).lower())
    return files


def main() -> int:
    parser = argparse.ArgumentParser(description="Dump repo code to a single Markdown file")
    parser.add_argument("--root", default=".", help="Repo root (default: current directory)")
    parser.add_argument("--out", default="CODE_SNAPSHOT.md", help="Output markdown path")
    parser.add_argument(
        "--max-file-bytes",
        type=int,
        default=250_000,
        help="Skip files larger than this many bytes (default: 250000)",
    )
    args = parser.parse_args()

    repo_root = Path(args.root).resolve()
    out_path = (repo_root / args.out).resolve() if not Path(args.out).is_absolute() else Path(args.out).resolve()

    exclude_dirs = set(DEFAULT_EXCLUDE_DIRS)
    exclude_files = set(DEFAULT_EXCLUDE_FILES)
    exclude_globs = set(DEFAULT_EXCLUDE_GLOBS)
    allowlist_globs = set(ALLOWLIST_GLOBS)

    files = iter_files(repo_root, exclude_dirs, exclude_files, exclude_globs, allowlist_globs)

    lines: list[str] = []
    lines.append("# Filmly — Code Snapshot")
    lines.append("")
    lines.append(f"Root: `{repo_root}`")
    lines.append("")
    lines.append("Notas:")
    lines.append("- Se excluyen carpetas pesadas: `db/`, `node_modules/`, `.git/`, builds/caches.")
    lines.append("- Se excluyen secretos típicos: `.env` (se permiten `.env.sample` y `.env.example`).")
    lines.append("- Se excluyen locks grandes: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`.")
    lines.append(f"- Se omiten binarios y archivos > {args.max_file_bytes} bytes.")
    lines.append("")

    skipped_large: list[str] = []
    skipped_binary: list[str] = []
    skipped_unreadable: list[str] = []

    for path in files:
        rel = path.relative_to(repo_root).as_posix()

        try:
            size = path.stat().st_size
        except OSError:
            skipped_unreadable.append(rel)
            continue

        if size > args.max_file_bytes:
            skipped_large.append(rel)
            continue

        if looks_binary(path):
            skipped_binary.append(rel)
            continue

        try:
            content = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            skipped_unreadable.append(rel)
            continue

        lang = detect_lang(path)
        lines.append("---")
        lines.append("")
        lines.append(f"## {rel}")
        lines.append("")
        if lang:
            lines.append(f"```{lang}")
        else:
            lines.append("```")
        # Ensure file always ends with newline inside the fence
        lines.append(content.rstrip("\n"))
        lines.append("```")
        lines.append("")

    if skipped_large or skipped_binary or skipped_unreadable:
        lines.append("---")
        lines.append("")
        lines.append("# Skipped")
        lines.append("")
        if skipped_large:
            lines.append("## Too large")
            lines.append("")
            for rel in skipped_large:
                lines.append(f"- {rel}")
            lines.append("")
        if skipped_binary:
            lines.append("## Binary")
            lines.append("")
            for rel in skipped_binary:
                lines.append(f"- {rel}")
            lines.append("")
        if skipped_unreadable:
            lines.append("## Unreadable")
            lines.append("")
            for rel in skipped_unreadable:
                lines.append(f"- {rel}")
            lines.append("")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {out_path} ({len(files)} files scanned)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
