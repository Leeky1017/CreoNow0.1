# ISSUE-908 Independent Review

更新时间：2026-03-02 18:57

- Issue: #908
- PR: https://github.com/Leeky1017/CreoNow/pull/912
- Author-Agent: main-session
- Reviewer-Agent: codex
- Reviewed-HEAD-SHA: d0d42e705d6fdb2e470ff8e90a4ae7cfcaf84623
- Decision: PASS

## Scope

- 窗口状态持久化（位置/尺寸恢复）：`windowState.ts` 模块
- 单实例锁：`requestSingleInstanceLock()` + `second-instance` 处理
- 文件损坏/缺失回退到默认 1280×800

## Findings

- 严重问题：无。
- 中等级问题（已修复）：`second-instance` 监听注册时机过晚 → 已移至 `requestSingleInstanceLock()` 后立即注册；固定 `mainWindow` 引用 → 已改为 `BrowserWindow.getAllWindows()[0]` 动态获取。
- 低风险问题：无。
- 代码层复审结论：PASS — 竞态修复后，窗口生命周期路径安全。

## Verification

- Guard test: 4/4 passed (S3/S3b/S3c/S3d)
- windowState test: 6/6 passed
- Regression: 216 files, 1640 tests passed
- Typecheck: clean
