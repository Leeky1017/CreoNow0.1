更新时间：2026-02-22 13:16

## 1. Specification

- [x] 1.1 审阅并确认需求边界（仅 Windows 启用 frameless 与自定义标题栏）
- [x] 1.2 审阅并确认错误路径与边界路径（非 Windows 降级、窗口对象缺失）
- [x] 1.3 审阅并确认验收阈值与不可变契约（IPC schema-first + preload 唯一入口）
- [x] 1.4 若存在上游依赖，先完成依赖同步检查（Dependency Sync Check）并记录“无漂移/已更新”；无依赖则标注 N/A（本变更为 `NO_DRIFT`）

## 2. TDD Mapping（先测前提）

- [x] 2.1 将 delta spec 的每个 Scenario 映射为至少一个测试用例
- [x] 2.2 为每个测试标注对应 Scenario ID，建立可追踪关系
- [x] 2.3 设定门禁：未出现 Red（失败测试）不得进入实现

### Scenario → 测试映射

| Scenario ID | 测试文件                                                              | 测试名称                                                       | 断言要点                                      |
| ----------- | --------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| WN-IPC-S1   | `apps/desktop/main/src/ipc/__tests__/window-ipc.test.ts`              | `W1 should expose enabled window state on Windows`             | `controlsEnabled=true` 且平台为 `win32`       |
| WN-IPC-S2   | `apps/desktop/main/src/ipc/__tests__/window-ipc.test.ts`              | `W2 should minimize/close/toggle maximize`                     | 调用序列 `minimize/maximize/unmaximize/close` |
| WN-IPC-S3   | `apps/desktop/main/src/ipc/__tests__/window-ipc.test.ts`              | `W3 should reject action channels on non-Windows`              | 非 Windows 返回 `UNSUPPORTED`                 |
| WN-IPC-S4   | `apps/desktop/main/src/ipc/__tests__/window-ipc.test.ts`              | `W4 should return NOT_FOUND when no BrowserWindow is resolved` | 缺失窗口返回 `NOT_FOUND`                      |
| WN-UI-S1    | `apps/desktop/renderer/src/components/window/WindowTitleBar.test.tsx` | `shows current project title on supported window controls`     | 标题显示当前项目名                            |
| WN-UI-S2    | `apps/desktop/renderer/src/components/window/WindowTitleBar.test.tsx` | `invokes window control IPC channels`                          | 三按钮触发对应 `app:window:*` 通道            |
| WN-UI-S3    | `apps/desktop/renderer/src/components/window/WindowTitleBar.test.tsx` | `hides itself when controls are disabled`                      | 非 Windows 场景不渲染标题栏                   |

## 3. Red（先写失败测试）

- [x] 3.1 新增 `window-ipc.test.ts`，在 `registerWindowIpcHandlers` 不存在时验证失败（`ERR_MODULE_NOT_FOUND`）
- [x] 3.2 新增 `WindowTitleBar.test.tsx`，在组件文件不存在时验证失败（Vite import 解析失败）
- [x] 3.3 记录 Red 证据：缺失模块导致目标测试失败

## 4. Green（最小实现通过）

- [x] 4.1 主进程新增 `apps/desktop/main/src/ipc/window.ts` 与 handler 注册
- [x] 4.2 主窗口创建参数在 Windows 启用 `frame: false` 并隐藏菜单栏
- [x] 4.3 IPC 契约新增 `app:window:*` 并生成 `ipc-generated.ts`
- [x] 4.4 渲染层新增全局 `WindowTitleBar` 组件并挂载至 `App.tsx`
- [x] 4.5 目标测试 + typecheck 通过

## 5. Refactor（保持绿灯）

- [x] 5.1 收敛平台判定逻辑（主进程统一 `controlsEnabled`）
- [x] 5.2 标题取值改为 `current.projectId` + `items` 映射，消除 store 类型漂移
- [x] 5.3 保持非 Windows 路径无行为回归

## 6. Evidence

- [x] 6.1 记录 RUN_LOG（含 Red 失败证据、Green 通过证据与关键命令输出）
- [x] 6.2 记录 Dependency Sync Check 的输入、核对结论与后续动作（无漂移/已更新）
- [x] 6.3 记录 Main Session Audit（Audit-Owner/Reviewed-HEAD-SHA=签字提交 HEAD^/三项 PASS/Blocking-Issues=0/Decision=ACCEPT），并确认签字提交仅变更当前任务 RUN_LOG
