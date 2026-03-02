# ISSUE-905

- Issue: #905
- Branch: task/905-fe-lucide-icon-unification
- PR: 待回填

## Plan

- 将 Feature 层 156 处内联 `<svg>` 统一替换为 `lucide-react` 图标
- 统一图标规格：`strokeWidth={1.5}`、`size={16|20|24}`
- 新增 guard 测试防止回归

## Runs

### 2026-03-02 15:00 环境准备

- Command: `scripts/agent_worktree_setup.sh 905 fe-lucide-icon-unification`
- Key output: Worktree created at `.worktrees/issue-905-fe-lucide-icon-unification`
- Branch: `task/905-fe-lucide-icon-unification` from `origin/main`

### 2026-03-02 15:05 Red — guard 测试确认失败

- Command: `grep -rn "<svg" apps/desktop/renderer/src/features/ --include="*.tsx" | grep -v "__tests__\|\.stories\.\|\.test\." | wc -l`
- Key output: `156`（Feature 层产品代码中 156 处内联 SVG）
- 创建 guard 测试: `apps/desktop/renderer/src/features/__tests__/icon-lucide-guard.test.ts`
  - S1: `feature layer contains no inline <svg> elements`
  - S2: `all lucide imports use consistent strokeWidth and size`

### 2026-03-02 15:10 Green — 逐目录替换

- 替换覆盖 15 个 Feature 目录：editor、search、character、outline、quality-gates、commandPalette、diff、ai、version-history、export、dashboard、settings-dialog、onboarding、projects、zen-mode
- 常见映射：search→Search、close/x→X、plus→Plus、chevron→ChevronDown/ChevronRight、bold→Bold、italic→Italic、underline→Underline、copy→Copy、trash→Trash2、edit→Pencil
- 共 35 文件修改，896 行新增，2620 行删除

### 2026-03-02 15:20 全量测试回归

- Command: `pnpm -C apps/desktop test:run`
- Key output:
```
Test Files  217 passed (217)
     Tests  1642 passed (1642)
  Start at  15:21:22
  Duration  46.00s
```
- guard 测试: `feature layer contains no inline <svg> elements` ✅
- guard 测试: `all lucide imports use consistent strokeWidth and size` ✅
- 全量回归: 217 test files, 1642 tests, 0 failures ✅

### Dependency Sync Check

N/A（无上游依赖）
