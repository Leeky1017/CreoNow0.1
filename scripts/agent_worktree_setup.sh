#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/agent_worktree_setup.sh <issue-number> <slug> [--no-bootstrap]

Options:
  --no-bootstrap   Skip dependency bootstrap in the new worktree
EOF
}

if [[ $# -lt 2 ]]; then
  usage >&2
  exit 2
fi

N="${1:-}"
SLUG="${2:-}"
BOOTSTRAP="true"
shift 2

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-bootstrap)
      BOOTSTRAP="false"
      shift 1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$N" || -z "$SLUG" ]]; then
  usage >&2
  exit 2
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
if [[ "$(pwd -P)" != "$(cd "$REPO_ROOT" && pwd -P)" ]]; then
  echo "ERROR: run this script from the repo root: $REPO_ROOT" >&2
  exit 2
fi

scripts/agent_controlplane_sync.sh
scripts/agent_git_hooks_install.sh .

if [[ ! "$N" =~ ^[0-9]+$ ]]; then
  echo "ERROR: issue-number must be numeric, got: $N" >&2
  exit 2
fi

if [[ "$SLUG" =~ [^a-z0-9-] ]]; then
  echo "ERROR: slug must be kebab-case (a-z0-9-), got: $SLUG" >&2
  exit 2
fi

BRANCH="task/${N}-${SLUG}"
DIR=".worktrees/issue-${N}-${SLUG}"

mkdir -p .worktrees
git fetch origin main
git worktree add -b "$BRANCH" "$DIR" origin/main
echo "Worktree created: $DIR"
echo "Branch: $BRANCH"
scripts/agent_git_hooks_install.sh "$DIR"

if [[ "$BOOTSTRAP" == "true" ]]; then
  if command -v pnpm >/dev/null 2>&1 && [[ -f "${DIR}/package.json" ]]; then
    echo "Bootstrapping dependencies in ${DIR} ..."
    pnpm -C "$DIR" install --frozen-lockfile
    echo "Bootstrap completed: pnpm install --frozen-lockfile"
  else
    echo "[SKIP] bootstrap: pnpm or package.json not found in ${DIR}"
  fi
fi
