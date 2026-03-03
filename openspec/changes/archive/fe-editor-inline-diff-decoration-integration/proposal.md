# 提案：fe-editor-inline-diff-decoration-integration

更新时间：2026-02-28 19:20

## Why（问题与目标）

深度审计指出：Inline Diff 当前脱离编辑器，作为独立面板渲染，无法提供“所见即所得”的版本对比体验。

本 change 目标：将版本差异以 TipTap/ProseMirror decoration 的形式集成到编辑器内容中，使对比回到文本本体。

## What（交付内容）

- 在 TipTap 编辑器中集成 Inline Diff：
  - 插入/删除/修改以 decoration 高亮呈现
  - 支持开启/关闭（不影响正常编辑）
- 版本对比入口与现有 Version History 流程对齐（以现有实现为基线）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-editor-inline-diff-decoration-integration/specs/version-control/spec.md`
  - `openspec/changes/fe-editor-inline-diff-decoration-integration/specs/editor/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/version-history/*`
  - `apps/desktop/renderer/src/features/editor/*`（TipTap extension/decoration）

## Out of Scope（不做什么）

- 不在本 change 内做多版本同时对比（先完成单对比闭环）。

## Dependencies（依赖）

- 上游：`openspec/specs/version-control/spec.md`、`openspec/specs/editor/spec.md`
- 建议先行：`fe-leftpanel-dialog-migration`（若版本历史入口形态迁移）

## 审阅状态

- Owner 审阅：`PENDING`
