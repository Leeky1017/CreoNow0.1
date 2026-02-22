# Proposal: issue-604-windows-frameless-titlebar

更新时间：2026-02-21 14:45

## Why

CreoNow 当前保留系统窗口装饰（Windows 原生标题栏与菜单栏），与产品期望的沉浸式 Workbench 风格不一致。窗口层缺少统一的自定义标题栏，也无法通过受控 IPC 统一管理最小化/最大化/关闭行为。该偏差会直接影响视觉一致性与后续窗口层扩展（例如自定义快捷入口、状态提示）。

## What Changes

- 主进程 Windows 条件下启用 `frame: false`，并移除原生菜单栏。
- 新增 `app:window:*` IPC 契约与 handler（`getstate/minimize/togglemaximized/close`）。
- 渲染层新增全局 `WindowTitleBar` 组件，支持拖拽区与窗口控制按钮。
- 标题文字与当前项目联动（优先项目名，回退 `CreoNow`）。
- 新增主进程 IPC 单测与渲染层标题栏单测，覆盖 Windows 支持与非 Windows 退化路径。

## Impact

- Affected specs:
  - `openspec/specs/workbench/spec.md`（窗口壳层行为补充）
  - `openspec/specs/ipc/spec.md`（窗口控制 IPC 契约补充）
- Affected code:
  - `apps/desktop/main/src/index.ts`
  - `apps/desktop/main/src/ipc/window.ts`
  - `apps/desktop/main/src/ipc/contract/ipc-contract.ts`
  - `apps/desktop/renderer/src/components/window/WindowTitleBar.tsx`
  - `apps/desktop/renderer/src/App.tsx`
  - `apps/desktop/renderer/src/styles/main.css`
- Breaking change: NO（仅 Windows 窗口外观行为变更；macOS/Linux 保持既有路径）
- User benefit: Windows 获得一致的自定义标题栏体验，窗口控制行为可测试、可扩展且受 IPC 契约保护。
