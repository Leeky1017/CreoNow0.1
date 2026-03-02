# Proposal: Window State Persistence & Single Instance Lock

## Issue
- **GitHub Issue**: #908
- **Branch**: `task/908-fe-desktop-window-lifecycle-uplift`

## Summary
补齐窗口状态持久化（位置/尺寸）和单实例锁，提升桌面应用生命周期管理质量。

## Scope
1. 新增 `windowState.ts` 模块：`loadWindowState()` / `saveWindowState()` / `createDebouncedSaveWindowState()`
2. 修改 `index.ts`：集成窗口状态恢复、debounced 保存、单实例锁、second-instance 处理
3. 更新已有测试 mock 以兼容新窗口生命周期代码

## Out of Scope
- 多窗口编辑
- 窗口最大化/全屏状态持久化（仅持久化正常尺寸）

## Risks
- 无：模块独立，不影响已有功能
