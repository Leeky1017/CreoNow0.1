#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'HELP'
Usage: scripts/agent_task_begin.sh <issue-number> <slug> [--no-bootstrap]

Fail-closed entrypoint for task work. It will:
  1. verify GitHub delivery capabilities (gh-only fail-closed entrypoint)
  2. install repo-managed git hooks on the controlplane root
  3. sync controlplane main to latest origin/main
  4. create and bootstrap the task worktree
  5. install repo-managed git hooks inside the new worktree
HELP
}

if [[ $# -lt 2 ]]; then
  usage >&2
  exit 2
fi

N="$1"
SLUG="$2"
shift 2

EXTRA_ARGS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-bootstrap)
      EXTRA_ARGS+=("$1")
      shift
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

CAPABILITIES_JSON="$(python3 scripts/agent_github_delivery.py capabilities)"
echo "$CAPABILITIES_JSON"
SELECTED_CHANNEL="$(printf "%s" "$CAPABILITIES_JSON" | python3 -c 'import json,sys; print(json.load(sys.stdin)["selected_channel"])')"
if [[ "$SELECTED_CHANNEL" != "gh" ]]; then
  echo "ERROR: scripts/agent_task_begin.sh currently requires selected_channel=gh; got: $SELECTED_CHANNEL" >&2
  echo "Hint: use repo docs + worktree scripts manually when only MCP is available." >&2
  exit 1
fi
ISSUE_STATE="$(gh issue view "$N" --json state --jq .state)"
if [[ "$ISSUE_STATE" != "OPEN" ]]; then
  echo "ERROR: issue #$N must be OPEN before creating a task worktree (got: $ISSUE_STATE)" >&2
  exit 1
fi
scripts/agent_git_hooks_install.sh .
scripts/agent_controlplane_sync.sh
scripts/agent_worktree_setup.sh "$N" "$SLUG" "${EXTRA_ARGS[@]}"
WORKTREE_DIR=".worktrees/issue-${N}-${SLUG}"
scripts/agent_git_hooks_install.sh "$WORKTREE_DIR"
echo "NEXT: cd $WORKTREE_DIR"
