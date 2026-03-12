#!/usr/bin/env bash
# scripts/review-audit.sh — AGENTS.md §6.4 审计必跑命令一键入口
# 用法：scripts/review-audit.sh [<base-ref>]
#   base-ref  可选，diff 的基准引用（默认 origin/main）

set -uo pipefail

BASE_REF="${1:-origin/main}"
TOTAL=6
PASS=0
FAIL=0
SKIP=0

run_step() {
  local idx="$1"; shift
  local title="$1"; shift

  printf '\n=== [%d/%d] %s ===\n' "$idx" "$TOTAL" "$title"
  if "$@"; then
    (( PASS++ ))
    printf '[OK]  %s\n' "$title"
  else
    local rc=$?
    (( FAIL++ ))
    printf '[FAIL] %s (exit %d)\n' "$title" "$rc"
  fi
}

# ── 1/6 ──────────────────────────────────────────────
run_step 1 "git diff --numstat" \
  git diff --numstat "$BASE_REF"

# ── 2/6 ──────────────────────────────────────────────
run_step 2 "git diff --check" \
  git diff --check "$BASE_REF"

# ── 3/6 ──────────────────────────────────────────────
run_step 3 "git diff --ignore-cr-at-eol --name-status" \
  git diff --ignore-cr-at-eol --name-status "$BASE_REF"

# ── 4/6 ──────────────────────────────────────────────
run_step 4 "bash -n scripts/agent_pr_automerge_and_sync.sh" \
  bash -n scripts/agent_pr_automerge_and_sync.sh

# ── 5/6 ──────────────────────────────────────────────
if command -v pytest &>/dev/null; then
  run_step 5 "pytest -q scripts/tests" \
    pytest -q scripts/tests
else
  printf '\n=== [5/%d] pytest -q scripts/tests ===\n' "$TOTAL"
  printf '[SKIP] pytest not found in PATH\n'
  (( SKIP++ ))
fi

# ── 6/6 ──────────────────────────────────────────────
run_step 6 "test -x scripts/agent_pr_automerge_and_sync.sh && echo EXEC_OK" \
  bash -c 'test -x scripts/agent_pr_automerge_and_sync.sh && echo EXEC_OK'

# ── 汇总 ─────────────────────────────────────────────
printf '\n══════════════════════════════════════\n'
printf '审计命令汇总: %d PASS / %d FAIL / %d SKIP（共 %d）\n' \
  "$PASS" "$FAIL" "$SKIP" "$TOTAL"

if (( FAIL > 0 )); then
  printf '结论：存在失败项，请检查上方输出。\n'
  exit 1
fi
printf '结论：全部通过。\n'
