# Delta Spec: workbench — 渲染进程全局错误兜底

- **Parent Change**: `a0-03-renderer-global-error-fallback`
- **Base Spec**: `openspec/specs/workbench/spec.md`
- **GitHub Issue**: #993

---

## 新增 Requirement: 渲染进程全局未处理异常捕获与通知

渲染进程**必须**在 React 挂载之前注册全局异常监听器，确保所有未被业务代码捕获的 async rejection 和运行时错误都被拦截、通知用户、并写入主进程日志。任何异步异常都不能只停留在浏览器控制台而不触达用户界面。

### 捕获范围

全局兜底覆盖 `ErrorBoundary` 无法捕获的异常类型：

| 异常类型                       | 触发场景示例                                                                | 捕获方式                                             |
| ------------------------------ | --------------------------------------------------------------------------- | ---------------------------------------------------- |
| 未处理的 Promise rejection     | IPC 调用超时未 `.catch()`、store action 内 `await` 失败未 `try-catch`       | `window.addEventListener('unhandledrejection', ...)` |
| 非 React render 阶段的同步错误 | `setTimeout` / `requestAnimationFrame` 回调中的异常、事件监听器中的 `throw` | `window.addEventListener('error', ...)`              |

React render 阶段的同步错误由 `ErrorBoundary` 处理，本 Requirement **不覆盖**、**不重复捕获**该类错误。

### 注册时机

全局监听器**必须**在 `main.tsx` 中、`ReactDOM.createRoot().render()` 之前注册。原因：

1. React 挂载本身可能触发异步操作（`useEffect` / store 初始化），若挂载后才注册监听器，存在捕获窗口空隙
2. 确保整个 renderer 生命周期内异常均被覆盖

### 注册入口

监听器注册逻辑**必须**封装为独立函数 `installGlobalErrorHandlers()`，位于 `renderer/src/lib/globalErrorHandlers.ts`。`main.tsx` 在 `ReactDOM.createRoot()` 之前调用该函数。

函数签名：

```typescript
export function installGlobalErrorHandlers(options: {
  onError: (entry: GlobalErrorEntry) => void;
}): () => void;
```

- `onError`：错误发生时的回调，接收标准化的 `GlobalErrorEntry` 对象
- 返回值：卸载函数，调用后移除两个全局监听器（供测试 cleanup 使用）

### 错误条目数据结构

```typescript
export interface GlobalErrorEntry {
  /** 错误来源标识 */
  source: "unhandledrejection" | "error";
  /** 错误名称（Error.name 或 'UnknownError'） */
  name: string;
  /** 错误消息（Error.message 或 String(reason)） */
  message: string;
  /** 调用栈（Error.stack 或 undefined） */
  stack: string | undefined;
  /** ISO 8601 时间戳 */
  timestamp: string;
}
```

### Toast 通知规格

捕获到未处理异常时**必须**触发一条 `error` variant 的 Toast（依赖 A0-13 Toast 基础设施）：

| 属性        | 值                                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| variant     | `error`                                                                                                |
| title       | `t("globalError.toast.title")`（"系统遇到意外问题"）                                                   |
| description | `t("globalError.toast.description")`（"部分功能可能受影响，请尝试重新操作。如问题持续，请重启应用。"） |
| action      | 无（全局兜底不提供自动恢复入口）                                                                       |
| duration    | 8000ms（error variant 默认值）                                                                         |

Toast 内容**禁止**包含技术细节（错误码、堆栈、内部路径）。用户看到的只是通用的"系统遇到问题"提示。

### 去重防护

短时间内的重复异常**不得**产生 Toast 轰炸。去重规则：

1. 以 `name + message` 组合作为去重键
2. 同一去重键在 1000ms 窗口内仅触发一次 Toast
3. 每次触发后重置该键的冷却计时器
4. 去重仅影响 Toast 通知——日志落盘**不去重**，每条异常均写入

### 日志落盘

捕获到的每条异常**必须**通过 IPC 发送到主进程写入磁盘日志：

1. 通过 `invoke('log:renderer-error', entry)` 将 `GlobalErrorEntry` 发送到主进程
2. 主进程将条目追加到日志文件（路径：`userData/logs/renderer-errors.log`）
3. 日志格式为 JSON Lines（每行一个 JSON 对象），便于后续解析
4. 日志文件大小上限 5MB，超过后轮转（移除最旧的一半行数）

**注意**：日志 IPC 调用本身的失败**不得**触发新的 Toast 或进入递归错误循环。日志发送失败时仅 `console.error` 静默记录。

### Design Token 引用

本 Requirement 不引入新的视觉组件，Toast 复用 A0-13 已定义的 `error` variant 样式。无额外 Design Token 需求。

### 无障碍要求

- Toast 通知通过 Radix Toast 的内建 `aria-live` 机制播报，无额外无障碍配置
- 全局错误兜底不渲染新的 DOM 元素（除 Toast 外），无额外 ARIA 需求

### i18n 要求

所有全局错误兜底文案**必须**通过 `t()` 函数获取。新增 i18n key：

| i18n Key                        | 中文值                                                       | 英文值                                                                                               |
| ------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `globalError.toast.title`       | 系统遇到意外问题                                             | Unexpected system error                                                                              |
| `globalError.toast.description` | 部分功能可能受影响，请尝试重新操作。如问题持续，请重启应用。 | Some features may be affected. Please retry the operation. If the problem persists, restart the app. |

---

### Scenario: 未处理的 Promise rejection 触发 Toast 通知并写入日志

- **假设** 应用已正常启动，全局错误监听器已注册
- **当** 一个未被 `.catch()` 捕获的 Promise rejection 发生（如 IPC 调用超时）
- **则** 触发一条 error Toast，标题为 `t("globalError.toast.title")`，描述为 `t("globalError.toast.description")`
- **并且** 通过 IPC 将包含 `source: 'unhandledrejection'`、错误 `name`、`message`、`stack`、`timestamp` 的 `GlobalErrorEntry` 发送到主进程
- **并且** 主进程将该条目追加到 `renderer-errors.log` 文件

### Scenario: 非 React render 阶段的同步错误触发 Toast 通知并写入日志

- **假设** 应用已正常启动，全局错误监听器已注册
- **当** 一个 `setTimeout` 回调中抛出未捕获的同步错误
- **则** 触发一条 error Toast，标题为 `t("globalError.toast.title")`，描述为 `t("globalError.toast.description")`
- **并且** 通过 IPC 将包含 `source: 'error'`、错误 `name`、`message`、`stack`、`timestamp` 的 `GlobalErrorEntry` 发送到主进程

### Scenario: 短时间内重复异常仅触发一次 Toast

- **假设** 应用已正常启动
- **当** 同一异常（相同 `name + message`）在 500ms 内连续触发 3 次
- **则** 仅显示 1 条 error Toast
- **并且** 3 条异常均通过 IPC 发送到主进程写入日志（日志不去重）

### Scenario: 不同异常各自独立触发 Toast

- **假设** 应用已正常启动
- **当** 异常 A（`TypeError: Cannot read properties of undefined`）和异常 B（`IpcTimeoutError: channel xxx timed out`）在 200ms 内先后触发
- **则** 分别显示 2 条 error Toast（去重键不同）
- **并且** 2 条异常均写入日志

### Scenario: 日志 IPC 调用失败不触发递归错误

- **假设** 主进程日志服务不可用（IPC 通道异常）
- **当** 全局兜底捕获到一个未处理异常，并尝试通过 IPC 发送日志条目
- **则** 日志 IPC 调用失败后仅 `console.error` 记录
- **并且** 不触发新的 Toast、不触发新的 `unhandledrejection` 事件
- **并且** 用户侧的 error Toast 仍正常显示（Toast 不依赖日志 IPC 成功）

### Scenario: 已被业务代码捕获的异常不触发全局兜底

- **假设** 应用已正常启动，全局错误监听器已注册
- **当** 一个 async 函数内部 `try-catch` 已捕获并处理了一个 rejection
- **则** 不触发全局 `unhandledrejection` 事件
- **并且** 不触发 Toast
- **并且** 不写入全局错误日志
