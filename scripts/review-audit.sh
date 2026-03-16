#!/usr/bin/env bash
# scripts/review-audit.sh — 分层自适应审计命令入口（Tiered Adaptive Audit）
#
# 用法：scripts/review-audit.sh [<tier>] [<base-ref>]
#   tier      审计层级：L（轻量） / S（标准） / D（深度），默认 S
#   base-ref  diff 的基准引用（默认 origin/main）
#
# 层级说明：
#   Tier L — 低风险 / 文档 / 测试补充 / 纯样式
#   Tier S — 中等风险 / 单模块功能
#   Tier D — 高风险 / 跨模块 / 安全相关 / 核心架构
#
# 详见 AGENTS.md §六 + docs/delivery-skill.md §八

set -uo pipefail

# ── 参数解析 ─────────────────────────────────────────
TIER="${1:-S}"
TIER=$(echo "$TIER" | tr '[:lower:]' '[:upper:]')
BASE_REF="${2:-origin/main}"

case "$TIER" in
  L|S|D) ;;
  *) printf '❌ 未知审计层级: %s（可选：L / S / D）\n' "$TIER"; exit 1 ;;
esac

TOTAL=0
PASS=0
FAIL=0
SKIP=0

# ── 工具函数 ─────────────────────────────────────────
run_step() {
  local title="$1"; shift
  (( TOTAL++ ))

  printf '\n=== [%d] %s ===\n' "$TOTAL" "$title"
  if "$@"; then
    (( PASS++ ))
    printf '[OK]   %s\n' "$title"
  else
    local rc=$?
    (( FAIL++ ))
    printf '[FAIL] %s (exit %d)\n' "$title" "$rc"
  fi
}

skip_step() {
  local title="$1"; shift
  local reason="$1"
  (( TOTAL++ ))
  (( SKIP++ ))
  printf '\n=== [%d] %s ===\n' "$TOTAL" "$title"
  printf '[SKIP] %s\n' "$reason"
}

section() {
  printf '\n────────────────────────────────────────\n'
  printf '  %s\n' "$1"
  printf '────────────────────────────────────────\n'
}

# ══════════════════════════════════════════════════════
# 共享层：所有 Tier 都执行
# ══════════════════════════════════════════════════════
run_common() {
  section "共享检查（Common）"

  run_step "git diff --numstat" \
    git diff --numstat "$BASE_REF"

  run_step "git diff --check（CRLF/LF 噪音检测）" \
    git diff --check "$BASE_REF"

  run_step "git diff --ignore-cr-at-eol --name-status" \
    git diff --ignore-cr-at-eol --name-status "$BASE_REF"

  # 变更分类概览
  section "变更分类概览"
  printf '变更文件清单:\n'
  git diff --name-only "$BASE_REF" | head -50
  local file_count
  file_count=$(git diff --name-only "$BASE_REF" | wc -l)
  printf '\n共 %d 个文件变更\n' "$file_count"

  # 变更层分布
  printf '\n变更层分布:\n'
  git diff --name-only "$BASE_REF" | grep -c '^apps/desktop/main/' | xargs -I{} printf '  backend:  %s 文件\n' "{}" || true
  git diff --name-only "$BASE_REF" | grep -c '^apps/desktop/renderer/' | xargs -I{} printf '  frontend: %s 文件\n' "{}" || true
  git diff --name-only "$BASE_REF" | grep -c '^apps/desktop/preload/' | xargs -I{} printf '  preload:  %s 文件\n' "{}" || true
  git diff --name-only "$BASE_REF" | grep -c '^packages/shared/' | xargs -I{} printf '  shared:   %s 文件\n' "{}" || true
  git diff --name-only "$BASE_REF" | grep -cE '^(scripts/|\.github/|.*\.config\.)' | xargs -I{} printf '  infra:    %s 文件\n' "{}" || true
  git diff --name-only "$BASE_REF" | grep -cE '^(docs/|openspec/|.*\.md$)' | xargs -I{} printf '  docs:     %s 文件\n' "{}" || true
}

# ══════════════════════════════════════════════════════
# Tier L — 轻量审计
# ══════════════════════════════════════════════════════
run_tier_l() {
  run_common
  section "Tier L 审计完成 — 轻量级"
}

# ══════════════════════════════════════════════════════
# Tier S — 标准审计
# ══════════════════════════════════════════════════════
run_tier_s() {
  run_common

  section "标准检查（Tier S）"

  # 脚本基础设施检查
  run_step "bash -n scripts/agent_pr_automerge_and_sync.sh（语法检查）" \
    bash -n scripts/agent_pr_automerge_and_sync.sh

  if command -v pytest &>/dev/null; then
    run_step "pytest -q scripts/tests（脚本测试）" \
      pytest -q scripts/tests
  else
    skip_step "pytest -q scripts/tests" "pytest not found in PATH"
  fi

  run_step "test -x scripts/agent_pr_automerge_and_sync.sh（可执行权限）" \
    bash -c 'test -x scripts/agent_pr_automerge_and_sync.sh && echo EXEC_OK'

  # TypeScript 类型检查
  if command -v pnpm &>/dev/null; then
    run_step "pnpm typecheck（类型安全验证）" \
      pnpm typecheck
  else
    skip_step "pnpm typecheck" "pnpm not found in PATH"
  fi

  # 动态测试选择：根据变更文件选择测试范围
  section "动态测试（按变更文件选择）"
  local has_renderer has_main
  has_renderer=$(git diff --name-only "$BASE_REF" | grep -c '^apps/desktop/renderer/' || true)
  has_main=$(git diff --name-only "$BASE_REF" | grep -c '^apps/desktop/main/' || true)

  if command -v pnpm &>/dev/null; then
    if (( has_renderer > 0 )); then
      run_step "vitest run renderer（前端测试）" \
        pnpm -C apps/desktop exec vitest run --reporter=verbose renderer/
    fi

    if (( has_main > 0 )); then
      run_step "vitest run main（后端测试）" \
        pnpm -C apps/desktop exec vitest run --reporter=verbose main/
    fi

    # 前端变更追加 Storybook 构建验证
    if (( has_renderer > 0 )); then
      run_step "storybook:build（前端组件可构建验证）" \
        pnpm -C apps/desktop storybook:build
    fi
  else
    skip_step "vitest + storybook" "pnpm not found in PATH"
  fi
}

# ══════════════════════════════════════════════════════
# Tier D — 深度审计
# ══════════════════════════════════════════════════════
run_tier_d() {
  # 先跑完 Tier S 全部内容
  run_tier_s

  section "深度检查（Tier D）"

  if command -v pnpm &>/dev/null; then
    # 全量测试
    run_step "vitest run（全量测试）" \
      pnpm -C apps/desktop exec vitest run

    # ESLint
    run_step "pnpm lint（代码规范）" \
      pnpm lint

    # 架构健康门禁
    if [[ -f "scripts/architecture-health-gate.ts" ]]; then
      run_step "architecture-health-gate（架构健康）" \
        node --import tsx scripts/architecture-health-gate.ts
    fi

    # cross-module contract 检查
    if [[ -f "scripts/cross-module-contract-gate.ts" ]]; then
      run_step "cross-module-contract-gate（跨模块 contract）" \
        node --import tsx scripts/cross-module-contract-gate.ts
    fi

    # IPC 验收门禁
    local has_ipc
    has_ipc=$(git diff --name-only "$BASE_REF" | grep -cE '(ipc|preload|shared)' || true)
    if (( has_ipc > 0 )) && [[ -f "scripts/ipc-acceptance-gate.ts" ]]; then
      run_step "ipc-acceptance-gate（IPC 验收）" \
        node --import tsx scripts/ipc-acceptance-gate.ts
    fi
  else
    skip_step "Tier D 质量门禁" "pnpm not found in PATH"
  fi
}

# ══════════════════════════════════════════════════════
# 执行入口
# ══════════════════════════════════════════════════════
printf '╔══════════════════════════════════════╗\n'
printf '║  CreoNow 分层自适应审计 — Tier %s     ║\n' "$TIER"
printf '║  基准: %-29s ║\n' "$BASE_REF"
printf '╚══════════════════════════════════════╝\n'

case "$TIER" in
  L) run_tier_l ;;
  S) run_tier_s ;;
  D) run_tier_d ;;
esac

# ── 汇总 ─────────────────────────────────────────────
printf '\n╔══════════════════════════════════════╗\n'
printf '║  审计命令汇总                         ║\n'
printf '╠══════════════════════════════════════╣\n'
printf '║  层级: Tier %-25s  ║\n' "$TIER"
printf '║  PASS: %-3d  FAIL: %-3d  SKIP: %-3d    ║\n' "$PASS" "$FAIL" "$SKIP"
printf '║  总计: %-30d ║\n' "$TOTAL"
printf '╚══════════════════════════════════════╝\n'

if (( FAIL > 0 )); then
  printf '结论：存在 %d 个失败项，请检查上方输出。\n' "$FAIL"
  exit 1
fi
printf '结论：Tier %s 审计全部通过。\n' "$TIER"
