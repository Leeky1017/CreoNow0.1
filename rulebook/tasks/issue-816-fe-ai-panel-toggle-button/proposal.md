# Proposal: issue-816-fe-ai-panel-toggle-button

更新时间：2026-03-01 19:40

## Why

右侧 AI 面板虽然已有快捷键 `Ctrl+L`，但缺少显式可见入口，导致 discoverability 不足；同时前一轮审计要求补齐行为测试并统一 toggle 逻辑，避免按钮与快捷键双栈分叉。

## What Changes

- 在 `AppShell` 主编辑区右上角新增 AI toggle 按钮（`AI Panel (Ctrl+L)`）。
- 实现三路切换语义：
  - 折叠 → 展开 + `activeRightPanel=ai`
  - 展开 + ai → 折叠
  - 展开 + 非 ai → 切换到 ai（不折叠）
- 统一按钮、快捷键、命令面板到同一 toggle 逻辑。
- 补齐行为测试覆盖 S1/S1b/S1c 与可达性/触控目标断言。

## Impact

- Affected specs:
  - `openspec/changes/fe-ai-panel-toggle-button/specs/workbench/spec.md`
- Affected code:
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - `apps/desktop/renderer/src/components/layout/AppShell.ai-toggle.test.tsx`
- Breaking change: NO
- User benefit: AI 入口更直观，交互语义与快捷键一致，回归可测性更强。
