# ISSUE-927 Independent Review

更新时间：2026-03-03 11:14

- Issue: #927
- PR: https://github.com/Leeky1017/CreoNow/pull/931
- Author-Agent: claude
- Reviewer-Agent: codex
- Reviewed-HEAD-SHA: 873c1fef384e5ca061938c029dc92ba99d5149f2
- Decision: PASS

## Scope

- `apps/desktop/renderer/src/lib/hotkeys/HotkeyManager.ts`：统一热键管理器（scope/priority/handler return false passthrough）
- `apps/desktop/renderer/src/lib/hotkeys/useHotkey.ts`：React hook
- `apps/desktop/renderer/src/features/shortcuts/ShortcutsPanel.tsx`：快捷键面板
- Feature 迁移：EditorPane、NavigationController、SearchPanel、ZenMode、KnowledgeGraph
- `apps/desktop/renderer/src/features/__tests__/hotkey-listener-guard.test.ts`：架构守卫

## Findings

- 严重问题：
  - `editor:ai-undo`（Ctrl+Z）在无 checkpoint 场景仍被 HotkeyManager 拦截并 preventDefault，与"无 checkpoint 让位默认 undo"意图不一致（已修复：HotkeyManager 支持 handler 返回 false 跳过 preventDefault，ai-undo handler 无 checkpoint 时返回 false）
- 中等级问题：无
- 低风险问题：
  - `hotkey-listener-guard.test.ts` 用 `split("/")` 取 basename，Windows 下可能有误差（不阻塞）
  - 多个组件含未使用 `import React`（已由主会话清理：ShortcutsPanel、NavigationController props 解构）
  - `useHotkey.ts` exhaustive-deps warning（已由主会话修复：解构 combo 各字段）

## Verification

- `pnpm typecheck` → PASS
- `pnpm lint:warning-budget` → PASS（baseline=66, current=62, delta=-4）
- 定向测试 102 tests → PASS
- HotkeyManager 新增 2 回归测试（handler returns false / undefined）
- 全回归 228 files / 1689 tests → PASS（主会话验证，+2 新增测试）
