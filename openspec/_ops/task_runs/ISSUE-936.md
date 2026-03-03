# ISSUE-936 RUN_LOG

- Issue: #936
- Branch: task/936-fe-editor-context-menu
- PR: https://github.com/Leeky1017/CreoNow/pull/939
- Change: fe-editor-context-menu-and-tooltips
- Commit: 76d0b6da

## Plan

1. 编写 EditorContextMenu 测试（基础动作 + AI 动作禁用状态）
2. 编写 tooltip-title-guard 测试（静态源码扫描）
3. 实现 EditorContextMenu 组件（Radix ContextMenu）
4. 集成到 EditorPane
5. 迁移 17 处原生 `title=` → `<Tooltip>`（10 个文件）
6. i18n 化全部菜单文案
7. 全量回归 + TypeScript 检查

## Dependency Sync Check

- `fe-editor-advanced-interactions`: 已归档（PR #918 ✓），无漂移
- `fe-hotkeys-shortcuts-unification`: 已归档（PR #931 ✓），无漂移
- 结论：**无漂移**，可进入 Red

## Runs

### Run 1 — Red 阶段

时间：2026-03-03

#### EditorContextMenu 测试（Red）

```
EditorContextMenu.test.tsx: 2 tests FAIL (expected)
- ED-FE-CM-S1: basic actions visible on right-click → FAIL (component not yet created)
- ED-FE-CM-S1b: AI actions disabled without selection → FAIL (component not yet created)
```

#### tooltip-title-guard 测试（Red）

```
tooltip-title-guard.test.ts: 1 test FAIL (expected)
- WB-FE-TT-S1: 17 violations detected across features/**/*.tsx
```

### Run 2 — Green 阶段

```
EditorContextMenu.test.tsx: 2 tests PASS
tooltip-title-guard.test.ts: 1 test PASS (0 violations)
```

### Run 3 — 全量回归

```
Test Files  237 passed (237)
Tests       1714 passed (1714)
Duration    48.81s
```

### Run 4 — TypeCheck

```
pnpm typecheck → 0 errors
```

## Title 迁移统计

- 迁移处数：17（10 feature files）
- 白名单保留：Dialog/ConfirmDialog/PanelContainer/EmptyState/ResultGroup/ErrorGuideCard/AlertDialog（组件 heading prop，非原生 HTML title）
- icon-only buttons: 6 buttons received aria-label for accessibility

## 修改文件清单

### 新增
- `EditorContextMenu.tsx` — Radix ContextMenu 组件
- `EditorContextMenu.test.tsx` — 2 test scenarios
- `tooltip-title-guard.test.ts` — 静态源码扫描 guard

### 修改（Tooltip 迁移）
- `InlineFormatButton.tsx` — title → Tooltip
- `EditorToolbar.tsx` — title → Tooltip
- `WriteButton.tsx` — title → Tooltip
- `DiffHeader.tsx` — title → Tooltip + aria-label
- `OutlinePanel.tsx` — title → Tooltip + aria-label
- `VersionHistoryPanel.tsx` — title → Tooltip
- `AiPanel.tsx` — title → Tooltip
- `SkillPicker.tsx` — title → Tooltip
- `SettingsAppearancePage.tsx` — title → Tooltip
- `EditorPane.tsx` — title → Tooltip + EditorContextMenu 集成

### 测试修复
- `EditorToolbar.test.tsx` — selector: title → aria-label
- `OutlinePanel.test.tsx` — selector: title → aria-label
- `DiffViewPanel.test.tsx` — selector: title → aria-label
- `*.snap` — snapshot 更新（editor + workbench）

## Main Session Audit

- Audit-Owner: main-session
- Reviewed-HEAD-SHA: 3bd15512b2cdc677ade79237667ccf4f68bb98b0
- Spec-Compliance: PASS
- Code-Quality: PASS
- Fresh-Verification: PASS
- Blocking-Issues: 0
- Decision: ACCEPT

### 审查摘要

1. Diff 审查：EditorContextMenu 正确使用 Radix ContextMenu，含基础/格式/AI 三类动作
2. 17 处 `title=` → `<Tooltip>` 迁移全部正确，白名单组件合理保留
3. tooltip-title-guard 静态扫描 guard 可防止未来回归
4. 上下文菜单全部文案 i18n 化（`t()` + locale key）
5. 测试回归 237/237 文件、1714/1714 test 全绿
6. TypeScript 0 errors
7. 主会话修复：10 处硬编码中文 → `t()` key
