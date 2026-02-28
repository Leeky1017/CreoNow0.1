# 提案：fe-hotfix-searchpanel-backdrop-close

更新时间：2026-02-28 19:20

## Why（问题与目标）

当前 `SearchPanel` 在 Sidebar 内挂载时存在“覆水难收”的交互故障：面板渲染了 `fixed inset-0` 的全屏覆盖层，但挂载方未传入 `open`/`onClose`，导致用户点击 backdrop 无法关闭，只能依赖切换 IconBar 面板“曲线脱困”。

此 change 的目标是把“可关闭”从偶然行为收敛为确定契约：SearchPanel 受控于 `open` 状态，且关闭动作可由 backdrop / Esc / 显式关闭按钮触发。

## What（交付内容）

- SearchPanel 必须支持 `open` 短路：`open=false` 时不得渲染任何 overlay/backdrop。
- Sidebar 挂载 SearchPanel 时必须传入 `open` 与 `onClose`，确保 backdrop 点击可关闭。
- 回归测试覆盖：
  - `open=false` 不渲染覆盖层
  - backdrop 点击触发 `onClose`

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-hotfix-searchpanel-backdrop-close/specs/workbench/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/renderer/src/features/search/SearchPanel.tsx`
  - `apps/desktop/renderer/src/components/layout/Sidebar.tsx`
  - 相关 store（如存在 open 状态）

## Out of Scope（不做什么）

- 不在本 change 内进行 S3“左侧面板弹出式改造”（Search→Spotlight、Memory/KG/History→Dialog）。
- 不调整 SearchPanel 的视觉风格与 Token 体系（这些归入后续 SearchPanel 重写与视觉噪音治理）。

## Dependencies（依赖）

- 上游：`openspec/specs/workbench/spec.md`
- 下游：`fe-leftpanel-dialog-migration`、`fe-searchpanel-tokenized-rewrite`

## 审阅状态

- Owner 审阅：`PENDING`
