# 提案：fe-command-palette-search-uplift

更新时间：2026-02-28 19:20

## Why（问题与目标）

Command Palette 已具备基础骨架与 i18n 范本价值，但深度审计指出两项核心能力缺失：

- 无文件搜索（仅少量命令项）
- 搜索匹配仅 `includes`，无 fuzzy match

对写作 IDE 而言，Command Palette 应是“快刀”，能快速定位文件与动作。

本 change 目标：补齐文件搜索与 fuzzy 匹配，并维持性能阈值。

## What（交付内容）

- Command Palette 支持文件搜索：接入 fileStore/文档索引（以现有数据源为准）。
- 搜索匹配升级为 fuzzy match（如 fuse.js 或等价实现）。
- 保持性能约束（以 workbench spec 的 p95 阈值为准）。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-command-palette-search-uplift/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/command-palette/CommandPalette.tsx`
  - 文件索引/数据源

## Out of Scope（不做什么）

- 不在本 change 内扩展到跨项目搜索（先在当前工作区闭环）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`
- 建议先行：open-folder 相关 change（确保工作区语义稳定）

## 审阅状态

- Owner 审阅：`PENDING`
