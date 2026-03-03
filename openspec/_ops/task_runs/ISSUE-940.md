# RUN_LOG: ISSUE-940

更新时间：2026-03-03 15:00

- Issue: #940
- Branch: `task/940-fe-visual-noise-reduction`
- Change: `fe-visual-noise-reduction`
- PR: (待回填)

## Dependency Sync Check

前置依赖均已合并到 main：
- `fe-feature-focus-visible-coverage` ✓ (PR #928)
- `fe-rightpanel-ai-tabbar-layout` ✓ (PR #801)
- `fe-rightpanel-ai-guidance-and-style` ✓ (PR #809)
- `fe-leftpanel-dialog-migration` ✓ (PR #808)

当前分支基于最新 main (b4d5d655)，无上游漂移。

## Runs

### Red 阶段

```
$ pnpm -C apps/desktop test:run features/__tests__/visual-noise-guard
3 tests | 3 failed

S1: expected 10 to be less than or equal to 5   → ❌
S2: 8 × border-[var(--color-border-default)]    → ❌
S3: 12 separator violations (8 directional + 4 bg-divider) → ❌
```

### Green 阶段

修改文件:
- AiPanel.tsx: 移除 user-request/judge-result/usage-stats/selection-reference 边框; CodeBlock header → --color-separator
- ChatHistory.tsx, ModelPicker.tsx, ModePicker.tsx: popover header border-b → --color-separator
- DashboardPage.tsx: card wrappers → border-transparent; separators → --color-separator; tag badge → --color-separator
- SettingsGeneral.tsx, SettingsAccount.tsx, SettingsAppearancePage.tsx, SettingsExport.tsx: divider bg → --color-separator; card border removed
- SettingsDialog.tsx: sidebar border-r → --color-separator

```
$ pnpm -C apps/desktop test:run features/__tests__/visual-noise-guard
3 tests | 3 passed ✅
```

### 全量回归

```
$ pnpm -C apps/desktop test:run
Test Files  244 passed (244)
Tests       1731 passed (1731)

$ pnpm typecheck
0 errors ✅
```

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: f7c77a2433f29868d7796989b87be4a5efd70a4b
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

### 审计结论

1. Delta Spec 两个 Scenario 全部被守卫测试覆盖（S1/S2/S3），Spec-Compliance PASS
2. 代码变更仅涉及 CSS 类名替换，无功能逻辑变更，无 any，无原始色值，Code-Quality PASS
3. 守卫测试 3/3 通过，全量回归 244 files / 1731 tests 通过，typecheck 0 errors，Fresh-Verification PASS
4. 保留了功能性边框（CodeBlock、交互卡片 hover/focus），符合 spec 要求
