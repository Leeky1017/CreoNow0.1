#!/usr/bin/env bash
set -euo pipefail

if [[ -n "${1:-}" && "${1:-}" != "--help" ]]; then
  echo "Usage: scripts/agent_controlplane_sync.sh" >&2
  exit 2
fi

COMMON_DIR="$(git rev-parse --git-common-dir)"
CONTROLPLANE_ROOT="$(cd "$(dirname "$COMMON_DIR")" && pwd)"
HOOKS_DIR="$CONTROLPLANE_ROOT/.githooks"

if [[ -d "$HOOKS_DIR" ]]; then
  chmod +x "$HOOKS_DIR"/*
  git -C "$CONTROLPLANE_ROOT" config core.hooksPath "$HOOKS_DIR"
fi

DIRTY="$(git -C "$CONTROLPLANE_ROOT" status --porcelain=v1)"
if [[ -n "$DIRTY" ]]; then
  echo "ERROR: controlplane working tree is dirty: $CONTROLPLANE_ROOT" >&2
  echo "----- git status --porcelain=v1 -----" >&2
  echo "$DIRTY" >&2
  echo "------------------------------------" >&2
  echo "Hint: do not edit on controlplane main; move changes into a task worktree (.worktrees/issue-<N>-<slug>)." >&2
  exit 1
fi

git -C "$CONTROLPLANE_ROOT" fetch origin main
git -C "$CONTROLPLANE_ROOT" checkout main
git -C "$CONTROLPLANE_ROOT" pull --ff-only origin main
