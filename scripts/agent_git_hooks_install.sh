#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'HELP'
Usage: scripts/agent_git_hooks_install.sh [<git-worktree-dir>]

Installs repo-managed hooks by setting core.hooksPath to <worktree-root>/.githooks
for the current repo/worktree (or the supplied target path).
HELP
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

TARGET_DIR="${1:-.}"
if ! git -C "$TARGET_DIR" rev-parse --show-toplevel >/dev/null 2>&1; then
  echo "ERROR: not a git worktree: $TARGET_DIR" >&2
  exit 2
fi

WORKTREE_ROOT="$(git -C "$TARGET_DIR" rev-parse --show-toplevel)"
HOOKS_DIR="$WORKTREE_ROOT/.githooks"

if [[ ! -d "$HOOKS_DIR" ]]; then
  echo "ERROR: hooks directory missing: $HOOKS_DIR" >&2
  exit 1
fi

chmod +x "$HOOKS_DIR"/*
git -C "$TARGET_DIR" config core.hooksPath "$HOOKS_DIR"
echo "OK: installed repo hooks for $(git -C "$TARGET_DIR" rev-parse --show-toplevel) -> $HOOKS_DIR"
