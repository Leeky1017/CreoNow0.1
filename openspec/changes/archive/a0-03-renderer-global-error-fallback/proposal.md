# A0-03 渲染进程全局错误兜底

- **GitHub Issue**: #993
- **所属任务簇**: P0-2（失败可见与错误人话化）
- **涉及模块**: workbench
- **前端验收**: 可选

---

## Why：为什么必须做

### 1. 用户现象

用户在 CreoNow 中操作时，若任何异步调用抛出未捕获的 rejection——IPC 调用超时、store action 内部 `await` 失败、第三方库抛出的 async 错误——浏览器控制台默默打出一行红字，用户界面纹丝不动。创作者没有打开 DevTools 的习惯，也不应该有。结果是：功能静默失效，用户以为操作成功，实际上什么都没发生。"于无声处听惊雷，但惊雷只在控制台里响。"

`ErrorBoundary` 只捕获 render 阶段的同步错误，对 `async` 世界的异常完全失明。渲染进程的异步链路——这是整个前端最大的异常产出区域——处于零防护状态。

### 2. 根因

`main.tsx` 入口文件中没有注册 `window.addEventListener('unhandledrejection', ...)` 和 `window.addEventListener('error', ...)`。`ErrorBoundary`（React class component）仅覆盖 `getDerivedStateFromError` / `componentDidCatch`，这是 React 生命周期边界内的同步错误兜底，不覆盖 `setTimeout` 回调、`Promise.reject`、`async/await` 抛出的异常、事件监听器中的异常等场景。

当前 renderer 也没有日志上报通道——错误即使被捕获，也没有路径将其发送到主进程写入磁盘日志，导致用户反馈"功能不工作"时，开发者无法事后诊断。

### 3. v0.1 威胁

- **静默失效**：用户操作无响应却无通知，v0.1 核心体验中不可出现"功能看似存在实则失灵"的局面
- **诊断盲区**：没有日志落盘，用户反馈的"不工作"无法复现、无法定位——等于在黑箱中调试
- **信任侵蚀**：一次"点了没反应"的体验足以让用户怀疑整个产品的可靠性
- **P0-2 链路缺口**：A0-13（Toast 接入）和 A0-20（错误人话化）建立了"错误 → 人话 → 通知"的管线，但如果 async 错误从源头就没被捕获，管线的入口就是断的

### 4. 证据来源

| 文档                                                        | 章节              | 内容                                                                                                                                    |
| ----------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/01-master-roadmap.md`                       | §4.2 可信度必修项 | "渲染进程无全局异常兜底——某些 async 报错只在控制台出现，用户看不到——缺 `unhandledrejection` 全局捕获——增加 renderer 全局错误兜底与落盘" |
| `docs/audit/amp/03-engineering-and-architecture-roadmap.md` | §二 隐性风险总表  | "渲染进程没有全局 `unhandledrejection/onerror`——async 异常可能只出现在控制台——先做——增加 renderer 全局错误兜底与日志上报"               |
| `docs/audit/amp/03-engineering-and-architecture-roadmap.md` | §2.1 首波先做     | "渲染进程全局异常兜底" 列入首波执行项                                                                                                   |

---

## What：做什么

1. **注册全局 `unhandledrejection` 监听器**：在 `main.tsx`（React 挂载之前）注册 `window.addEventListener('unhandledrejection', handler)`，捕获所有未处理的 Promise rejection
2. **注册全局 `error` 监听器**：在同一位置注册 `window.addEventListener('error', handler)`，捕获同步运行时错误（非 React render 阶段的，如 `setTimeout` 回调中的异常）
3. **错误 → Toast 通知**：捕获到未处理异常时，通过 Toast 向用户展示一条通用错误提示（`t("globalError.toast.title")` / `t("globalError.toast.description")`），不暴露技术细节
4. **错误 → 主进程日志落盘**：通过 IPC 将错误信息（error name、message、stack、来源标识）发送到主进程，由主进程写入磁盘日志文件，供事后诊断
5. **去重防护**：短时间内（1s 窗口）的重复错误不重复触发 Toast，避免错误风暴导致通知轰炸
6. **新增 i18n key**：在 `zh-CN.json` 和 `en.json` 中新增 `globalError.*` 命名空间下的全部文案

---

## Non-Goals：不做什么

1. **不实现结构化错误分类或错误码映射**——全局兜底只做"最后一道防线"级别的通用通知，具体错误的人话化由 A0-20（错误消息人话化）负责
2. **不实现错误上报到远程服务器（Sentry / Telemetry）**——v0.1 仅做本地日志落盘，远程错误采集属 v0.2+ 可观测性建设
3. **不修改 `ErrorBoundary` 的 render 阶段捕获逻辑**——`ErrorBoundary` 已正常工作，本任务只补全其覆盖不到的异步错误盲区
4. **不在全局兜底中执行自动恢复（重试 / 状态回滚）**——兜底只负责"捕获 + 通知 + 记录"，恢复策略由各业务模块自行实现
5. **不拦截已被业务代码 `catch` 处理的异常**——`unhandledrejection` 仅触发于确实未被任何 `.catch()` / `try-catch` 消费的 rejection，不干扰已有错误处理链路

---

## 依赖与影响

- **上游依赖**: A0-13（Toast 接入 App）——Toast 基础设施须先就绪，全局错误兜底的 Toast 通知才有通道
- **被依赖于**: 无直接下游依赖，但本任务补全的捕获能力为 P0-2 整条"失败可见"链路提供兜底覆盖
- **受益于**: A0-20（错误消息人话化）——未来可将全局兜底的 Toast 描述替换为 `getHumanErrorMessage()` 动态映射；本任务先用静态 i18n 通用文案
