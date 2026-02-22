# 提案：issue-604-windows-frameless-titlebar

更新时间：2026-02-21 14:45

## 背景

CreoNow 在 Windows 仍使用 Electron 默认系统窗口装饰（标题栏 + 菜单栏 + 系统边框），与 Workbench 视觉和交互风格不一致，也限制了窗口层自定义能力。当前渲染层无法通过契约化 IPC 驱动窗口控制按钮，导致自定义标题栏无法落地。

## 变更内容

- Windows 平台主窗口启用 `frame: false`，移除系统窗口装饰。
- Windows 平台隐藏原生菜单栏（不通过 Alt 临时唤起）。
- 新增 `app:window:getstate/minimize/togglemaximized/close` IPC 通道与主进程实现。
- 渲染层新增全局 `WindowTitleBar`，提供可拖拽区域与最小化/最大化(还原)/关闭按钮。
- 标题内容显示当前项目名（无项目时回退 `CreoNow`）。

## 受影响模块

- workbench（窗口壳层表现与交互）
- ipc（窗口控制 request-response 契约）

## 不做什么

- 不改动 macOS/Linux 的窗口行为（保持现状）。
- 不引入原生菜单的替代业务入口（仅做窗口壳层与基础控件）。
- 不新增非窗口控制类 IPC 通道。

## 依赖关系

- 上游依赖：无。
- 下游依赖：无。

## 依赖同步检查（Dependency Sync Check）

- 核对输入：
  - `openspec/specs/workbench/spec.md`
  - `openspec/specs/ipc/spec.md`
  - 当前 `createValidatedIpcMain` 契约校验路径
- 核对项：
  - 新增 IPC 必须先写入 `ipc-contract.ts` 再生成 `ipc-generated.ts`。
  - 渲染层必须通过 `window.creonow.invoke` 调用，不允许绕过 preload。
  - Windows-only 行为必须可在非 Windows 平台安全降级。
- 结论：`NO_DRIFT`

## 审阅状态

- Owner 审阅：`PENDING`
