#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/independent_review_record.sh --issue <N> --author <agent> --reviewer <agent> [options]

Options:
  --issue <N>           Issue number (required)
  --author <agent>      Author agent identity, e.g. codex (required)
  --reviewer <agent>    Reviewer agent identity, e.g. claude (required)
  --decision <value>    PASS or FAIL (default: PASS)
  --pr-url <url>        Optional PR URL
  --reviewed-sha <sha>  Reviewed code commit SHA (default: current HEAD before review-record commit)
EOF
}

ISSUE_NUMBER=""
AUTHOR_AGENT=""
REVIEWER_AGENT=""
DECISION="PASS"
PR_URL=""
REVIEWED_SHA=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --issue)
      ISSUE_NUMBER="${2:-}"
      shift 2
      ;;
    --author)
      AUTHOR_AGENT="${2:-}"
      shift 2
      ;;
    --reviewer)
      REVIEWER_AGENT="${2:-}"
      shift 2
      ;;
    --decision)
      DECISION="${2:-}"
      shift 2
      ;;
    --pr-url)
      PR_URL="${2:-}"
      shift 2
      ;;
    --reviewed-sha)
      REVIEWED_SHA="${2:-}"
      shift 2
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

if [[ -z "$ISSUE_NUMBER" || -z "$AUTHOR_AGENT" || -z "$REVIEWER_AGENT" ]]; then
  usage >&2
  exit 2
fi

if [[ ! "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
  echo "ERROR: --issue must be numeric, got: ${ISSUE_NUMBER}" >&2
  exit 2
fi

DECISION="$(echo "$DECISION" | tr '[:lower:]' '[:upper:]')"
if [[ "$DECISION" != "PASS" && "$DECISION" != "FAIL" ]]; then
  echo "ERROR: --decision must be PASS or FAIL, got: ${DECISION}" >&2
  exit 2
fi

if [[ -z "$REVIEWED_SHA" ]]; then
  REVIEWED_SHA="$(git rev-parse HEAD)"
fi

if [[ ! "$REVIEWED_SHA" =~ ^[0-9a-fA-F]{40}$ ]]; then
  echo "ERROR: --reviewed-sha must be a 40-hex commit sha, got: ${REVIEWED_SHA}" >&2
  exit 2
fi

UPDATED_AT="$(date '+%Y-%m-%d %H:%M')"
OUT_PATH="openspec/_ops/reviews/ISSUE-${ISSUE_NUMBER}.md"

mkdir -p "openspec/_ops/reviews"

cat > "$OUT_PATH" <<EOF
# ISSUE-${ISSUE_NUMBER} Independent Review

更新时间：${UPDATED_AT}

- Issue: #${ISSUE_NUMBER}
- PR: ${PR_URL}
- Author-Agent: ${AUTHOR_AGENT}
- Reviewer-Agent: ${REVIEWER_AGENT}
- Reviewed-HEAD-SHA: ${REVIEWED_SHA}
- Decision: ${DECISION}

## Scope

- TODO: describe reviewed scope

## Findings

- TODO: add findings with severity and file references

## Verification

- TODO: list verification commands and outcomes
EOF

echo "OK: wrote ${OUT_PATH}"
