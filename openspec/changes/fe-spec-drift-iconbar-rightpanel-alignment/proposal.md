# 提案：fe-spec-drift-iconbar-rightpanel-alignment

更新时间：2026-02-28 19:20

## Why（问题与目标）

`openspec/specs/workbench/spec.md` 与当前实现之间已出现可感知漂移，且 spec 内部也存在自相矛盾之处（例如：文字要求 RightPanel 仅 AI/Info，但同文件中又出现 `activeRightPanel` 包含 `quality` 的枚举）。

漂移若不先收敛，后续 S3/S6 的整改会陷入“按 spec 做会打碎现有功能，按现状做又违背 spec”的两难。

本 change 目标：先把“契约”本身对齐成一份唯一真相（Single Source of Truth），为后续实现提供明确方向。

## What（交付内容）

- IconBar：对齐实际入口与整改计划（search/memory/versionHistory 等作为一等入口存在，但呈现形态可从 Sidebar 迁为 Dialog/Spotlight）。
- 命名收敛：统一 `graph` vs `knowledgeGraph` 面板 ID，消除同义双栈。
- RightPanel：明确是否允许 `Quality` 作为第三个 tab，并修复 spec 内部自相矛盾。

> 注：`media` 面板当前 spec 要求存在但代码缺失。本 change 默认将其标注为“未实现能力，需单独 change 补齐”；若 Owner 决定从 spec 移除，也应在本 change 内一并完成对齐。

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-spec-drift-iconbar-rightpanel-alignment/specs/workbench/spec.md`

## Out of Scope（不做什么）

- 不在本 change 内实现 `media` 面板能力本体（仅处理 spec 对齐与决策落盘）。

## Dependencies（依赖）

- 阻塞：Owner 决策（D1/D2/D3）
  - D1：IconBar `media` 面板处置（补全实现 / 从 spec 删除 / 标注未实现）
  - D2：`graph` vs `knowledgeGraph` 命名统一方向
  - D3：RightPanel `Quality` tab 保留 / 移除

## 审阅状态

- Owner 审阅：`PENDING`
