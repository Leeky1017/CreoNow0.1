# Tasks: Window State Persistence & Single Instance Lock (#908)

更新时间：2026-03-02 16:30

## Specification

### Scenario: 重启后必须恢复窗口位置与尺寸 [ADDED]
- 假设 用户调整了窗口位置与尺寸
- 当 用户关闭并重新启动应用
- 则 系统必须恢复上次的窗口位置与尺寸

### Scenario: 第二实例启动必须聚焦已存在窗口 [ADDED]
- 假设 应用已在运行
- 当 用户再次启动应用
- 则 系统不得创建第二个实例窗口
- 并且 必须聚焦已有窗口

### Scenario: 窗口状态文件损坏时回退到默认值 [ADDED]
- 假设 窗口状态文件损坏或缺失
- 当 应用启动
- 则 系统回退到默认 1280×800

## TDD Mapping

| ID | Scenario | 测试文件 | 测试名 |
|----|----------|----------|--------|
| WB-FE-WIN-S1 | 加载已保存的窗口状态 | `windowState.test.ts` | `loads saved window state from JSON file` |
| WB-FE-WIN-S1b | 文件损坏返回 null | `windowState.test.ts` | `returns null when state file is corrupted` |
| WB-FE-WIN-S1b2 | 无效形状返回 null | `windowState.test.ts` | `returns null when state has invalid shape` |
| WB-FE-WIN-S1c | 文件不存在返回 null | `windowState.test.ts` | `returns null when state file does not exist` |
| WB-FE-WIN-S2 | 保存窗口状态 | `windowState.test.ts` | `saves window state to JSON file` |
| WB-FE-WIN-S2b | 覆盖已有状态 | `windowState.test.ts` | `saves overwrites existing state` |
| WB-FE-WIN-S3 | index.ts 调用 requestSingleInstanceLock | `singleInstance.guard.test.ts` | `index.ts calls requestSingleInstanceLock` |
| WB-FE-WIN-S3b | index.ts 导入 loadWindowState | `singleInstance.guard.test.ts` | `index.ts imports loadWindowState` |
| WB-FE-WIN-S3c | index.ts 使用 debounced save | `singleInstance.guard.test.ts` | `index.ts uses debounced save` |
| WB-FE-WIN-S3d | index.ts 处理 second-instance | `singleInstance.guard.test.ts` | `index.ts handles second-instance event` |

## Red

测试先写 → 运行 → 全部失败（windowState 模块不存在 → ERR_MODULE_NOT_FOUND；guard 测试 → assertion 失败）。

## Green

1. 实现 `windowState.ts`：`loadWindowState` / `saveWindowState` / `createDebouncedSaveWindowState`
2. 修改 `index.ts`：集成窗口状态加载/保存、单实例锁、second-instance 聚焦
3. 更新 `window-load-catch.test.ts` 和 `index.app-ready-catch.test.ts` 的 mock

## Refactor

- debounce 间隔 500ms（默认值）
- 最大化/全屏时不保存窗口状态（避免覆盖正常尺寸）
- 窗口关闭时 flush 待保存的状态

## Evidence

- 全部 10 个测试文件通过（36 tests passed）
- TypeScript 编译零错误
- 详见 `openspec/_ops/task_runs/ISSUE-908.md`
