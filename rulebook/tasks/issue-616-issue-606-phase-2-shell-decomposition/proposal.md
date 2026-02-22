# Proposal: issue-616-issue-606-phase-2-shell-decomposition

更新时间：2026-02-22 18:35

## Why

落实 `openspec/changes/issue-606-phase-2-shell-decomposition/*` 的 Wave B（Phase 2）范围：对渲染层 `AppShell` 进行职责拆分、收回 viewport 分配权，并将 renderer 侧 IPC 调用入口收敛到 service 层，从而降低耦合、提升布局稳定性与边界可审计性。

## What Changes

- AppShell decomposition：将 `AppShell` 拆分为 `LayoutShell`、`NavigationController`、`PanelOrchestrator`，并以组合方式交付同等行为。
- Viewport ownership：壳层独占 viewport 分配；feature 组件禁止通过 `h-screen`/`w-screen`/`absolute inset-0` 等方式接管整屏尺寸（以测试/门禁约束为准）。
- IPC service convergence：renderer 侧调用路径收敛为 `Feature -> Service -> Preload/Main`，错误策略在 service 层统一。

## Impact
- Affected specs:
  - `openspec/changes/issue-606-phase-2-shell-decomposition/{proposal.md,tasks.md}`
  - `openspec/specs/workbench/spec.md`
  - `openspec/specs/ipc/spec.md`
- Affected code:
  - `apps/desktop/renderer/src/components/layout/AppShell.tsx`
  - `apps/desktop/renderer/src/components/layout/**`（新增/拆分组件）
  - `apps/desktop/renderer/src/services/**`（service 入口收敛）
  - `apps/desktop/tests/lint/**`（viewport ownership / IPC boundary tests）
- Breaking change: NO
- User benefit: AppShell 更可维护、布局更稳定、IPC 边界更清晰且可验证，降低后续 Phase 3/4 漂移成本。
