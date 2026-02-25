#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/main_audit_resign.sh [--issue <number>] [--run-log <path>] [options]

Behavior:
  - Rewrites RUN_LOG Main Session Audit field `Reviewed-HEAD-SHA` to current HEAD
  - Creates a RUN_LOG-only signing commit
  - Optionally pushes and runs preflight

Options:
  --issue <number>            Issue number (auto-detected from task/<N>-<slug> by default)
  --run-log <path>            RUN_LOG path override (default: openspec/_ops/task_runs/ISSUE-<N>.md)
  --no-push                   Do not push after signing commit
  --skip-preflight            Do not run preflight after signing commit
  --preflight-mode <mode>     Preflight mode: fast|full (default: fast)
  -h, --help                  Show this help
EOF
}

ISSUE_NUMBER=""
RUN_LOG=""
NO_PUSH="false"
SKIP_PREFLIGHT="false"
PREFLIGHT_MODE="fast"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --issue)
      ISSUE_NUMBER="${2:-}"
      shift 2
      ;;
    --run-log)
      RUN_LOG="${2:-}"
      shift 2
      ;;
    --no-push)
      NO_PUSH="true"
      shift 1
      ;;
    --skip-preflight)
      SKIP_PREFLIGHT="true"
      shift 1
      ;;
    --preflight-mode)
      PREFLIGHT_MODE="${2:-}"
      shift 2
      ;;
    -h|--help)
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

if [[ "$PREFLIGHT_MODE" != "fast" && "$PREFLIGHT_MODE" != "full" ]]; then
  echo "ERROR: --preflight-mode must be fast or full, got: ${PREFLIGHT_MODE}" >&2
  exit 2
fi

if [[ -z "$ISSUE_NUMBER" ]]; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "$BRANCH" =~ ^task/([0-9]+)-([a-z0-9-]+)$ ]]; then
    ISSUE_NUMBER="${BASH_REMATCH[1]}"
  else
    echo "ERROR: --issue is required when branch is not task/<N>-<slug>" >&2
    exit 2
  fi
fi

if [[ -z "$RUN_LOG" ]]; then
  RUN_LOG="openspec/_ops/task_runs/ISSUE-${ISSUE_NUMBER}.md"
fi

if [[ ! -f "$RUN_LOG" ]]; then
  echo "ERROR: RUN_LOG not found: $RUN_LOG" >&2
  exit 1
fi

HEAD_BEFORE="$(git rev-parse HEAD)"

python3 - "$RUN_LOG" "$HEAD_BEFORE" <<'PY'
import pathlib
import re
import sys

run_log = pathlib.Path(sys.argv[1])
reviewed_sha = sys.argv[2]
text = run_log.read_text(encoding="utf-8")
new_text, count = re.subn(
    r"(?m)^- Reviewed-HEAD-SHA:\s*.+$",
    f"- Reviewed-HEAD-SHA: {reviewed_sha}",
    text,
    count=1,
)
if count == 0:
    raise SystemExit(f"ERROR: missing '- Reviewed-HEAD-SHA:' line in {run_log}")
if new_text != text:
    run_log.write_text(new_text, encoding="utf-8")
PY

if git diff --quiet -- "$RUN_LOG"; then
  echo "[SKIP] Reviewed-HEAD-SHA already points to current HEAD: $HEAD_BEFORE"
else
  git add "$RUN_LOG"
  COMMIT_MSG_FILE="$(mktemp)"
  cat >"$COMMIT_MSG_FILE" <<EOF
docs: resign main session audit (#${ISSUE_NUMBER})

Refresh Reviewed-HEAD-SHA to match signing baseline.

Co-authored-by: Codex <noreply@openai.com>
EOF
  git commit -F "$COMMIT_MSG_FILE" -- "$RUN_LOG"
  rm -f "$COMMIT_MSG_FILE"
  echo "[OK] created RUN_LOG signing commit for issue #${ISSUE_NUMBER}"
fi

if [[ "$NO_PUSH" != "true" ]]; then
  git push
  echo "[OK] pushed signing commit"
fi

if [[ "$SKIP_PREFLIGHT" != "true" ]]; then
  scripts/agent_pr_preflight.sh --mode "$PREFLIGHT_MODE"
fi
