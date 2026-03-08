#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/agent_pr_automerge_and_sync.sh [--pr <number>] [--no-create] [--no-sync] [options]

Behavior:
  - Expects current branch name: task/<N>-<slug>
  - Runs preflight: scripts/agent_pr_preflight.sh (unless --skip-preflight)
    - If preflight fails: creates/keeps PR as draft and waits by default
  - Ensures a PR exists (creates one unless --no-create)
  - Keeps auto-merge disabled by default; only enables it when --enable-auto-merge is passed
  - --enable-auto-merge requires a designated audit comment with FINAL-VERDICT + ACCEPT
  - Syncs local controlplane main to origin/main (unless --no-sync)

Options:
  --skip-preflight           Skip preflight entirely
  --enable-auto-merge        Explicitly enable auto-merge after audit-pass comment is present
  --force                   Proceed even if preflight fails
  --no-wait-preflight        Fail fast if preflight fails (still creates draft PR)
  --wait-interval <seconds>  Preflight polling interval (default: 60)
  --wait-timeout <seconds>   Preflight wait timeout, 0 means forever (default: 0)
  --merge-interval <seconds> Merge status polling interval (default: 10)
  --merge-timeout <seconds>  Merge wait timeout, 0 means forever (default: 1800)
  --no-merge-comment         Do not comment on PR when merge is blocked
EOF
}

PR_NUMBER=""
NO_CREATE="false"
NO_SYNC="false"
SKIP_PREFLIGHT="false"
ENABLE_AUTO_MERGE="false"
FORCE="false"
WAIT_PREFLIGHT="true"
WAIT_INTERVAL_SECONDS="60"
WAIT_TIMEOUT_SECONDS="0"
MERGE_INTERVAL_SECONDS="10"
MERGE_TIMEOUT_SECONDS="1800"
MERGE_COMMENT="true"
GH_RETRY_BASE_SECONDS="2"
GH_RETRY_MAX_SECONDS="30"
GH_RETRY_MAX_ATTEMPTS="5"
GH_LAST_TRANSIENT="false"

json_get() {
  local field="$1"
  local payload
  payload="$(cat)"
  JSON_PAYLOAD="$payload" python3 - "$field" <<'PY2'
import json
import os
import sys

payload = json.loads(os.environ["JSON_PAYLOAD"])
value = payload[sys.argv[1]]
if value is None:
    raise SystemExit(0)
if isinstance(value, bool):
    print(str(value).lower(), end="")
else:
    print(value, end="")
PY2
}

require_gh_channel() {
  local capabilities_json selected_channel blocker reason
  capabilities_json="$(python3 scripts/agent_github_delivery.py capabilities --channel "${CODEX_GITHUB_CHANNEL:-auto}")"
  selected_channel="$(json_get selected_channel <<<"$capabilities_json")"
  blocker="$(json_get blocker <<<"$capabilities_json" || true)"
  reason="$(json_get reason <<<"$capabilities_json")"

  if [[ "$selected_channel" == "gh" ]]; then
    return 0
  fi

  echo "ERROR: selected GitHub delivery channel is ${selected_channel:-none}; this shell entrypoint only supports gh." >&2
  if [[ -n "$blocker" ]]; then
    echo "INFO: blocker=${blocker}" >&2
  fi
  echo "INFO: ${reason}" >&2
  echo "HINT: if GitHub MCP is available, use scripts/agent_github_delivery.py pr-payload / comment-payload with GitHub MCP tools for PR and comment operations." >&2
  exit 1
}

build_pr_payload() {
  local issue_number="$1"
  local raw_title="$2"
  local summary="${AGENT_PR_SUMMARY:-${raw_title}}"
  local user_impact="${AGENT_PR_USER_IMPACT:-See linked issue #${issue_number} and verification evidence for concrete impact.}"
  local worst_case="${AGENT_PR_WORST_CASE:-The task remains blocked on manual GitHub handoff in mixed agent environments.}"
  local rollback_ref="${AGENT_PR_ROLLBACK_REF:-git revert <merge-commit>}"

  python3 scripts/agent_github_delivery.py pr-payload     --issue-number "$issue_number"     --title "$raw_title"     --summary "$summary"     --user-impact "$user_impact"     --worst-case "$worst_case"     --rollback-ref "$rollback_ref"
}

comment_pr_with_kind() {
  local pr_number="$1"
  local kind="$2"
  local pr_url="$3"
  local merge_state="${4:-}"
  local review_decision="${5:-}"
  local timeout_seconds="${6:-}"
  local -a command=(python3 scripts/agent_github_delivery.py comment-payload --kind "$kind" --pr-url "$pr_url")
  local payload body

  if [[ -n "$merge_state" ]]; then
    command+=(--merge-state "$merge_state")
  fi
  if [[ -n "$review_decision" ]]; then
    command+=(--review-decision "$review_decision")
  fi
  if [[ -n "$timeout_seconds" ]]; then
    command+=(--timeout-seconds "$timeout_seconds")
  fi

  payload="$("${command[@]}")"
  body="$(json_get body <<<"$payload")"
  comment_pr "$pr_number" "$body"
}

require_audit_pass_comment() {
  local pr_number="$1"
  local pr_url="$2"
  local comments_json audit_payload audit_pass

  comments_json="$(run_gh_with_retry gh pr view "$pr_number" --json comments --jq '.comments | map(.body // "")')"
  audit_payload="$(python3 scripts/agent_github_delivery.py audit-pass --comments-json "$comments_json")"
  audit_pass="$(json_get audit_pass <<<"$audit_payload")"

  if [[ "$audit_pass" == "true" ]]; then
    return 0
  fi

  echo "ERROR: PR #${pr_number} has no audit-pass comment (`FINAL-VERDICT` + `ACCEPT`); designated audit must finish before auto-merge." >&2
  comment_pr_with_kind "$pr_number" "audit-required" "$pr_url"
  exit 1
}

is_transient_gh_error() {
  local output="$1"
  grep -qiE "TLS handshake timeout|i/o timeout|connection reset by peer|context deadline exceeded|unexpected EOF|temporary failure" <<<"$output"
}

run_gh_with_retry() {
  local output=""
  local rc=0
  local attempt=0
  local sleep_seconds="$GH_RETRY_BASE_SECONDS"
  GH_LAST_TRANSIENT="false"

  while true; do
    set +e
    output="$("$@" 2>&1)"
    rc=$?
    set -e
    if [[ $rc -eq 0 ]]; then
      if [[ -n "$output" ]]; then
        printf '%s' "$output"
      fi
      return 0
    fi

    if ! is_transient_gh_error "$output"; then
      echo "$output" >&2
      return "$rc"
    fi

    GH_LAST_TRANSIENT="true"
    attempt=$((attempt + 1))
    echo "WARN: transient GitHub error (attempt ${attempt}/${GH_RETRY_MAX_ATTEMPTS}): $output" >&2
    if (( attempt >= GH_RETRY_MAX_ATTEMPTS )); then
      echo "WARN: retries exhausted for: $*" >&2
      return "$rc"
    fi

    sleep "$sleep_seconds"
    sleep_seconds=$((sleep_seconds * 2))
    if (( sleep_seconds > GH_RETRY_MAX_SECONDS )); then
      sleep_seconds="$GH_RETRY_MAX_SECONDS"
    fi
  done
}

emit_transient_ci_snapshot() {
  local pr_number="$1"
  local head_sha=""
  set +e
  head_sha="$(run_gh_with_retry gh pr view "$pr_number" --json headRefOid --jq '.headRefOid' 2>/dev/null)"
  local head_rc=$?
  set -e
  if [[ $head_rc -ne 0 || -z "$head_sha" ]]; then
    echo "INFO: transient fallback: unable to resolve PR head SHA for #${pr_number}" >&2
    return 0
  fi

  set +e
  local runs_output=""
  runs_output="$(run_gh_with_retry gh run list --limit 30 --json name,status,conclusion,headSha --jq '.[] | select(.headSha == "'"$head_sha"'") | [.name, .status, (.conclusion // "null")] | @tsv' 2>/dev/null)"
  local runs_rc=$?
  set -e
  if [[ $runs_rc -ne 0 ]]; then
    echo "INFO: transient fallback: gh run list unavailable for #${pr_number}" >&2
    return 0
  fi
  if [[ -z "$runs_output" ]]; then
    echo "INFO: transient fallback: no run snapshot available for #${pr_number} head=${head_sha}" >&2
    return 0
  fi

  echo "INFO: transient fallback snapshot for PR #${pr_number} head=${head_sha}" >&2
  while IFS=$'\t' read -r run_name run_status run_conclusion; do
    [[ -z "$run_name" ]] && continue
    echo "INFO: run=${run_name} status=${run_status} conclusion=${run_conclusion} transient=true" >&2
  done <<<"$runs_output"
}

watch_checks_with_resilience() {
  local pr_number="$1"
  set +e
  run_gh_with_retry gh pr checks "$pr_number" --watch > /dev/null
  local rc=$?
  set -e
  if [[ $rc -eq 0 ]]; then
    return 0
  fi
  if [[ "$GH_LAST_TRANSIENT" == "true" ]]; then
    echo "INFO: gh pr checks interrupted by transient network errors (transient=true)." >&2
    emit_transient_ci_snapshot "$pr_number"
    return 0
  fi
  return "$rc"
}

comment_pr() {
  local pr_number="$1"
  local body="$2"
  if [[ "$MERGE_COMMENT" != "true" ]]; then
    return 0
  fi
  run_gh_with_retry gh pr comment "$pr_number" --body "$body" >/dev/null || true
}

rebase_onto_origin_main() {
  if [[ -n "$(git status --porcelain=v1)" ]]; then
    echo "ERROR: working tree must be clean before auto-rebase" >&2
    exit 1
  fi
  git fetch origin main
  git rebase origin/main
  git push --force-with-lease
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr)
      PR_NUMBER="${2:-}"
      shift 2
      ;;
    --no-create)
      NO_CREATE="true"
      shift 1
      ;;
    --no-sync)
      NO_SYNC="true"
      shift 1
      ;;
    --skip-preflight)
      SKIP_PREFLIGHT="true"
      shift 1
      ;;
    --enable-auto-merge)
      ENABLE_AUTO_MERGE="true"
      shift 1
      ;;
    --force)
      FORCE="true"
      shift 1
      ;;
    --no-wait-preflight)
      WAIT_PREFLIGHT="false"
      shift 1
      ;;
    --wait-interval)
      WAIT_INTERVAL_SECONDS="${2:-}"
      shift 2
      ;;
    --wait-timeout)
      WAIT_TIMEOUT_SECONDS="${2:-}"
      shift 2
      ;;
    --merge-interval)
      MERGE_INTERVAL_SECONDS="${2:-}"
      shift 2
      ;;
    --merge-timeout)
      MERGE_TIMEOUT_SECONDS="${2:-}"
      shift 2
      ;;
    --no-merge-comment)
      MERGE_COMMENT="false"
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

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
REPO_ROOT="$(git rev-parse --show-toplevel)"
COMMON_DIR="$(git rev-parse --git-common-dir)"
CONTROLPLANE_ROOT="$(cd "$(dirname "$COMMON_DIR")" && pwd -P)"
if [[ "$(cd "$REPO_ROOT" && pwd -P)" == "$CONTROLPLANE_ROOT" ]]; then
  echo "ERROR: run this script from an isolated task worktree, not the controlplane root: $CONTROLPLANE_ROOT" >&2
  exit 2
fi
if [[ ! "$BRANCH" =~ ^task/([0-9]+)-([a-z0-9-]+)$ ]]; then
  echo "ERROR: branch must be task/<N>-<slug>, got: $BRANCH" >&2
  exit 2
fi

ISSUE_NUMBER="${BASH_REMATCH[1]}"
SLUG="${BASH_REMATCH[2]}"

require_gh_channel

PREFLIGHT_RC=0
if [[ "$SKIP_PREFLIGHT" != "true" ]]; then
  set +e
  scripts/agent_pr_preflight.sh
  PREFLIGHT_RC=$?
  set -e
fi

if [[ -z "$PR_NUMBER" ]]; then
  PR_NUMBER="$(run_gh_with_retry gh pr list --head "$BRANCH" --json number --jq '.[0].number' 2>/dev/null || true)"
fi

if [[ -z "$PR_NUMBER" ]]; then
  if [[ "$NO_CREATE" == "true" ]]; then
    echo "ERROR: no PR found for branch $BRANCH and --no-create set" >&2
    exit 1
  fi

  TITLE="$(git log -1 --pretty=%s)"
  PR_PAYLOAD="$(build_pr_payload "$ISSUE_NUMBER" "$TITLE")"
  TITLE="$(json_get title <<<"$PR_PAYLOAD")"
  BODY="$(json_get body <<<"$PR_PAYLOAD")"

  DRAFT_FLAG=""
  if [[ $PREFLIGHT_RC -ne 0 && "$FORCE" != "true" ]]; then
    DRAFT_FLAG="--draft"
  fi

  PR_URL="$(run_gh_with_retry gh pr create --base main --head "$BRANCH" $DRAFT_FLAG --title "$TITLE" --body "$BODY")"
  PR_NUMBER="${PR_URL##*/}"
fi

if [[ "$SKIP_PREFLIGHT" != "true" ]]; then
  set +e
  scripts/agent_pr_preflight.sh
  PREFLIGHT_RC=$?
  set -e
fi

if [[ $PREFLIGHT_RC -ne 0 && "$FORCE" != "true" ]]; then
  if [[ "$WAIT_PREFLIGHT" != "true" ]]; then
    echo "ERROR: preflight reported issues (exit ${PREFLIGHT_RC})." >&2
    echo "       Resolve/coordinate then re-run, or use --force / --skip-preflight." >&2
    exit 1
  fi

  echo "Preflight blocked (exit ${PREFLIGHT_RC}); waiting until it becomes OK (exit 0)." >&2
  echo "Tip: Ctrl-C to stop waiting; PR stays as draft." >&2

  START_TS="$(date +%s)"
  while true; do
    set +e
    scripts/agent_pr_preflight.sh
    PREFLIGHT_RC=$?
    set -e

    if [[ $PREFLIGHT_RC -eq 0 ]]; then
      break
    fi

    if [[ "$WAIT_TIMEOUT_SECONDS" != "0" ]]; then
      NOW_TS="$(date +%s)"
      if (( NOW_TS - START_TS >= WAIT_TIMEOUT_SECONDS )); then
        echo "ERROR: preflight still failing after ${WAIT_TIMEOUT_SECONDS}s (last exit ${PREFLIGHT_RC})." >&2
        exit 1
      fi
    fi

    sleep "$WAIT_INTERVAL_SECONDS"
  done
fi

PR_URL="$(run_gh_with_retry gh pr view "$PR_NUMBER" --json url --jq '.url')"

if [[ "$ENABLE_AUTO_MERGE" != "true" ]]; then
  echo "INFO: PR #${PR_NUMBER} is ready. Auto-merge is disabled by default; rerun with --enable-auto-merge after the designated audit comment (`FINAL-VERDICT` + `ACCEPT`) is present." >&2
  exit 0
fi

require_audit_pass_comment "$PR_NUMBER" "$PR_URL"

IS_DRAFT="$(run_gh_with_retry gh pr view "$PR_NUMBER" --json isDraft --jq '.isDraft')"
if [[ "$IS_DRAFT" == "true" ]]; then
  run_gh_with_retry gh pr ready "$PR_NUMBER" >/dev/null
fi

run_gh_with_retry gh pr merge "$PR_NUMBER" --auto --squash >/dev/null
watch_checks_with_resilience "$PR_NUMBER"

START_MERGE_TS="$(date +%s)"
LAST_STATUS_LINE=""
while true; do
  set +e
  PR_STATUS="$(run_gh_with_retry gh pr view "$PR_NUMBER" --json mergedAt,mergeStateStatus,reviewDecision,url --jq '[.mergedAt // "", .mergeStateStatus // "", .reviewDecision // "", .url] | join("\u001f")')"
  PR_STATUS_RC=$?
  set -e
  if [[ $PR_STATUS_RC -ne 0 ]]; then
    if [[ "$GH_LAST_TRANSIENT" == "true" ]]; then
      echo "INFO: transient GitHub query failure while polling merge state (transient=true)." >&2
      emit_transient_ci_snapshot "$PR_NUMBER"
      sleep "$MERGE_INTERVAL_SECONDS"
      continue
    fi
    echo "ERROR: failed to query PR #${PR_NUMBER} merge state." >&2
    exit "$PR_STATUS_RC"
  fi
  IFS=$'\x1f' read -r MERGED_AT MERGE_STATE REVIEW_DECISION PR_URL <<<"$PR_STATUS"

  if [[ -n "$MERGED_AT" && "$MERGED_AT" != "null" ]]; then
    break
  fi

  STATUS_LINE="mergeState=${MERGE_STATE} reviewDecision=${REVIEW_DECISION:-none}"
  if [[ "$STATUS_LINE" != "$LAST_STATUS_LINE" ]]; then
    echo "INFO: waiting merge for PR #${PR_NUMBER}: ${STATUS_LINE}" >&2
    LAST_STATUS_LINE="$STATUS_LINE"
  fi

  if [[ "$REVIEW_DECISION" == "REVIEW_REQUIRED" ]]; then
    echo "ERROR: PR #${PR_NUMBER} is blocked by review requirement; independent review must be completed before merge." >&2
    comment_pr_with_kind "$PR_NUMBER" "review-required" "$PR_URL"
    exit 1
  fi

  if [[ "$REVIEW_DECISION" == "CHANGES_REQUESTED" ]]; then
    echo "ERROR: PR #${PR_NUMBER} has changes requested; resolve the review feedback before merging." >&2
    comment_pr_with_kind "$PR_NUMBER" "changes-requested" "$PR_URL"
    exit 1
  fi

  if [[ "$MERGE_STATE" == "BEHIND" ]]; then
    echo "WARN: PR #${PR_NUMBER} is behind base; rebasing and re-running preflight/checks." >&2
    rebase_onto_origin_main
    scripts/agent_pr_preflight.sh
    watch_checks_with_resilience "$PR_NUMBER"
    continue
  fi

  if [[ "$MERGE_STATE" == "DIRTY" ]]; then
    echo "ERROR: PR #${PR_NUMBER} has merge conflicts; resolve conflicts then rerun checks." >&2
    comment_pr_with_kind "$PR_NUMBER" "merge-conflicts" "$PR_URL" "$MERGE_STATE"
    exit 1
  fi

  if [[ "$MERGE_TIMEOUT_SECONDS" != "0" ]]; then
    NOW_TS="$(date +%s)"
    if (( NOW_TS - START_MERGE_TS >= MERGE_TIMEOUT_SECONDS )); then
      echo "ERROR: PR still not merged after ${MERGE_TIMEOUT_SECONDS}s: #${PR_NUMBER}" >&2
      comment_pr_with_kind "$PR_NUMBER" "merge-timeout" "$PR_URL" "$MERGE_STATE" "$REVIEW_DECISION" "$MERGE_TIMEOUT_SECONDS"
      exit 1
    fi
  fi

  sleep "$MERGE_INTERVAL_SECONDS"
done

if [[ "$NO_SYNC" == "true" ]]; then
  exit 0
fi

scripts/agent_controlplane_sync.sh

COMMON_DIR="$(git rev-parse --git-common-dir)"
CONTROLPLANE_ROOT="$(cd "$(dirname "$COMMON_DIR")" && pwd)"

LOCAL_HEAD="$(git -C "$CONTROLPLANE_ROOT" rev-parse main)"
REMOTE_HEAD="$(git -C "$CONTROLPLANE_ROOT" rev-parse origin/main)"

if [[ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]]; then
  echo "ERROR: controlplane main not in sync with origin/main" >&2
  echo "  local : $LOCAL_HEAD" >&2
  echo "  remote: $REMOTE_HEAD" >&2
  exit 1
fi

echo "OK: merged PR #${PR_NUMBER} and synced controlplane main"
