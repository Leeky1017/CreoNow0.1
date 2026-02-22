# Proposal: issue-613-issue-606-phase-1-stop-bleeding

更新时间：2026-02-22 15:20

## Why

issue-606 Phase 1 已完成 pre-Red 文档收敛之外的实际实现与验证（guard tests + UI token/primitive 改造）。本 proposal 需要与仓库当前已完成范围一致，避免治理记录与代码状态再度漂移。

## What Changes

- 保留并完成 pre-Red 治理收敛：更新 issue-606 Phase 1 proposal/tasks 依赖状态与 Dependency Sync Check，补齐 `openspec/_ops/task_runs/ISSUE-613.md` admission 证据。
- 新增 5 个 guard tests（`apps/desktop/renderer/src/features/__tests__/`）：
  - `token-color-guard.test.ts`
  - `z-index-token-guard.test.ts`
  - `shadow-token-guard.test.ts`
  - `overlay-layering.test.ts`
  - `primitive-replacement-guard.test.ts`
- 完成 AI overlay tokenization（4 个组件）：
  - `apps/desktop/renderer/src/features/ai/ModelPicker.tsx`
  - `apps/desktop/renderer/src/features/ai/ModePicker.tsx`
  - `apps/desktop/renderer/src/features/ai/ChatHistory.tsx`
  - `apps/desktop/renderer/src/features/ai/SkillPicker.tsx`
  - 将 overlay backdrop/popup 的 z-index 与阴影改为语义 token（`--z-dropdown`/`--z-popover`、`--shadow-xl`）。
- 完成 primitive replacement（2 个组件）：
  - `apps/desktop/renderer/src/features/ai/ModelPicker.tsx`
  - `apps/desktop/renderer/src/features/ai/ModePicker.tsx`
  - 列表项交互由原生 `<button>` 切换为 primitives `Button`。

## Impact

- Affected governance/docs:
  - `openspec/_ops/task_runs/ISSUE-613.md`
  - `openspec/changes/issue-606-phase-1-stop-bleeding/proposal.md`
  - `openspec/changes/issue-606-phase-1-stop-bleeding/tasks.md`
- Affected code:
  - `apps/desktop/renderer/src/features/ai/ModelPicker.tsx`
  - `apps/desktop/renderer/src/features/ai/ModePicker.tsx`
  - `apps/desktop/renderer/src/features/ai/ChatHistory.tsx`
  - `apps/desktop/renderer/src/features/ai/SkillPicker.tsx`
- Affected tests:
  - `apps/desktop/renderer/src/features/__tests__/token-color-guard.test.ts`
  - `apps/desktop/renderer/src/features/__tests__/z-index-token-guard.test.ts`
  - `apps/desktop/renderer/src/features/__tests__/shadow-token-guard.test.ts`
  - `apps/desktop/renderer/src/features/__tests__/overlay-layering.test.ts`
  - `apps/desktop/renderer/src/features/__tests__/primitive-replacement-guard.test.ts`
- Breaking change: NO
- User benefit: 治理记录与已完成实现/验证一致，Phase 1 的 token/primitives 防回退护栏已落盘，可继续后续合并收口。
