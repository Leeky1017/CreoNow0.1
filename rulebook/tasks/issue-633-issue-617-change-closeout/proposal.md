# Proposal: issue-633-issue-617-change-closeout

更新时间：2026-02-24 10:06

## Why

`openspec/changes/issue-617-scoped-lifecycle-and-abort/` 的运行时代码已经通过 PR #628、#631 合并到 `main`，但对应的 delta specs 仍停留在 change 目录，主 spec 与真实行为存在漂移。需要完成“应用到主 spec + 归档 change + 同步执行顺序”的治理收口，避免后续开发/审计误读系统真实状态。

## What Changes

- 将 change 内的 delta specs（`openspec/changes/issue-617-scoped-lifecycle-and-abort/specs/**`）应用到对应主 spec（`openspec/specs/**`）。
- 更新 change 的 `tasks.md`：勾选 checklist 并补齐证据（引用已合并的 PR #628/#631）。
- 将已完成的 change 目录归档到 `openspec/changes/archive/issue-617-scoped-lifecycle-and-abort/`。
- 同步更新 `openspec/changes/EXECUTION_ORDER.md`（移除已归档 change，并刷新更新时间）。

## Impact

- Affected specs:
  - `openspec/specs/context-engine/spec.md`
  - `openspec/specs/ipc/spec.md`
  - `openspec/specs/project-management/spec.md`
  - `openspec/specs/skill-system/spec.md`
  - `openspec/changes/EXECUTION_ORDER.md`
- Affected code: 无（治理收口；不改动 `apps/**` 运行时代码）
- Breaking change: NO
- User benefit: 主 spec 与 runtime 真实行为一致，change 生命周期闭环，降低后续迭代与审计成本
