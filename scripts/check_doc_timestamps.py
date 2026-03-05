#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path


TIMESTAMP_RE = re.compile(r"^更新时间：\d{4}-\d{2}-\d{2} \d{2}:\d{2}$")


@dataclass(frozen=True)
class CmdResult:
    code: int
    out: str


def run(cmd: list[str], *, cwd: Path) -> CmdResult:
    proc = subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    return CmdResult(code=proc.returncode, out=proc.stdout)


def git_root() -> Path:
    res = run(["git", "rev-parse", "--show-toplevel"], cwd=Path("."))
    if res.code != 0:
        print(res.out, file=sys.stderr)
        raise SystemExit("ERROR: not a git repository (git rev-parse failed)")
    return Path(res.out.strip())


def list_changed_files(repo: Path, *, base: str, head: str) -> list[str]:
    res = run(
        ["git", "diff", "--name-only", "--diff-filter=ACMR", f"{base}..{head}"],
        cwd=repo,
    )
    if res.code != 0:
        print(res.out, file=sys.stderr)
        raise SystemExit(f"ERROR: failed to list changed files: git diff {base}..{head}")

    return [line.strip() for line in res.out.splitlines() if line.strip()]


def is_governed_md(path: str) -> bool:
    if not path.endswith(".md"):
        return False

    if path.startswith("docs/Notion/"):
        return False
    if path.startswith("openspec/changes/archive/"):
        return False

    if re.match(r"^README[^/]*\.md$", path):
        return True
    if path.startswith("docs/"):
        return True
    if path.startswith("openspec/"):
        return True

    return False


def read_first_lines(repo: Path, rel_path: str, *, count: int) -> list[str]:
    abs_path = repo / rel_path
    if not abs_path.is_file():
        return []
    with abs_path.open("r", encoding="utf-8") as fp:
        lines: list[str] = []
        for _ in range(count):
            line = fp.readline()
            if line == "":
                break
            lines.append(line.rstrip("\n"))
        return lines


def validate_timestamp(lines: list[str]) -> bool:
    return any(TIMESTAMP_RE.match(line.strip()) for line in lines[:5])


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(
        description="Gate: governed markdown files must include '更新时间：YYYY-MM-DD HH:mm' within the first 5 lines."
    )
    parser.add_argument("--base", default="origin/main")
    parser.add_argument("--head", default="HEAD")
    parser.add_argument(
        "--files",
        nargs="*",
        default=None,
        help="Explicit file list to validate (overrides diff mode).",
    )
    args = parser.parse_args(argv)

    repo = git_root()

    if args.files is not None and len(args.files) > 0:
        candidates = [p.strip().lstrip("./") for p in args.files if p.strip()]
    else:
        candidates = list_changed_files(repo, base=args.base, head=args.head)

    targets = sorted({p for p in candidates if is_governed_md(p)})
    if not targets:
        print("OK: no governed markdown files to validate")
        return 0

    violations: list[tuple[str, list[str]]] = []
    for rel_path in targets:
        first_lines = read_first_lines(repo, rel_path, count=5)
        if not first_lines:
            # Deleted/renamed away or non-file; ignore.
            continue
        if not validate_timestamp(first_lines):
            violations.append((rel_path, first_lines))

    if not violations:
        print(f"OK: validated timestamps for {len(targets)} governed markdown file(s)")
        return 0

    print("ERROR: missing/invalid doc timestamps. Add the following line within the first 5 lines:")
    print("  更新时间：YYYY-MM-DD HH:mm")
    print("")
    for rel_path, first_lines in violations:
        print(f"- {rel_path}")
        for idx, line in enumerate(first_lines, start=1):
            print(f"  {idx:>2}: {line}")
        print("")

    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

