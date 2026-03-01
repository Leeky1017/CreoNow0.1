# 提案：fe-ipc-open-folder-contract

更新时间：2026-02-28 19:20

## Why（问题与目标）

当前产品无法打开已有文件夹：IPC 层缺失 `dialog.showOpenDialog` 通道，导致用户无法像 Cursor/Windsurf 一样“Open Folder”。这属于 P0 级缺失。

本 change 目标是先把“打开文件夹”这条能力链路在 IPC 侧打通，形成可测试、可复用的契约。

## What（交付内容）

- IPC contract 新增 `dialog:open-folder` 通道：
  - 仅允许 `openDirectory`
  - 返回 `string | null`（取消返回 null）
- 主进程实现：调用 `dialog.showOpenDialog({ properties: ['openDirectory'] })`
- Preload 暴露该能力给 renderer（受控 API）
- 项目语义：文件夹即工作区（不引入“项目”中间层），并支持识别 `.creonow/` 元目录（若存在）

## Scope（影响范围）

- OpenSpec Delta:
  - `openspec/changes/fe-ipc-open-folder-contract/specs/ipc/spec.md`
  - `openspec/changes/fe-ipc-open-folder-contract/specs/project-management/spec.md`
- 预期实现触点（后续 Apply 阶段）：
  - `apps/desktop/main/src/*`（dialog handler）
  - `apps/desktop/preload/src/*`（contextBridge 暴露）
  - `packages/shared/*`（IPC 类型）

## Out of Scope（不做什么）

- 不在本 change 内铺设 UI 入口（Onboarding/Dashboard/CommandPalette/Menu），见 `fe-ui-open-folder-entrypoints`。
- 不在本 change 内实现复杂项目元数据迁移（仅识别 `.creonow/` 是否存在）。

## Dependencies（依赖）

- 上游：`openspec/specs/ipc/spec.md`、`openspec/specs/project-management/spec.md`
- 下游：`fe-ui-open-folder-entrypoints`、`fe-onboarding-flow-refresh`

## 审阅状态

- Owner 审阅：`PENDING`
