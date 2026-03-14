# A0-13 Toast 接入 App

- **GitHub Issue**: #981
- **所属任务簇**: P0-2（失败可见与错误人话化）
- **涉及模块**: workbench
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户在 CreoNow 中执行保存、导出、AI 生成等操作后，界面没有任何即时反馈。操作是否成功、是否失败，用户无从得知——只能靠"感觉"判断。文件保存后没有"已保存"提示，AI 请求失败后没有错误提醒，导出完成后没有确认通知。整个应用处于"静默模式"，用户在黑暗中操作。

### 2. 根因

`Toast.tsx` 已完整实现 Radix Toast 组件（含 `ToastProvider`、`ToastViewport`、`Toast`、`useToast`），但 `App.tsx` 的 Provider 树中**未挂载** `ToastProvider` 和 `ToastViewport`。Radix Toast 要求 Provider 包裹在组件树外层、Viewport 挂载在根级 DOM 中，缺少任何一个都会导致 Toast 无法触发。当前 `App.tsx` 的 Provider 嵌套链只包含 Store Provider（ThemeStore、EditorStore、AiStore 等），没有 UI 基础设施 Provider。

### 3. v0.1 威胁

- **信任崩塌**：用户无法确认操作结果，会反复执行同一操作（重复保存、重复导出），产生数据风险
- **错误不可见**：A0-02（自动保存失败可见化）、A0-03（渲染进程全局错误兜底）、A0-20/21/22（错误人话化系列）全部依赖 Toast 作为用户通知通道。Toast 不接入，整个 P0-2 任务簇的用户侧交付链路断裂
- **体验落差**：用户在其他创作工具中习惯了即时反馈，CreoNow 的静默行为会被解读为"功能有 bug"

### 4. 证据来源

| 文档                                      | 章节                        | 内容                                                                                                                                   |
| ----------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §二 假/占位 UI 清单 第 1 项 | "`Toast.tsx` 完整实现，但 `App.tsx` **未挂载** `ToastProvider` / `ToastViewport`，全应用无 Toast 能力"，时序标注"先做"                 |
| `docs/audit/amp/07-ui-ux-design-audit.md` | §四 交互断线清单            | "`Toast.tsx` 完整但 `App.tsx` 无 Provider → 保存、导出、AI 完成等无即时反馈"                                                           |
| `docs/audit/amp/01-master-roadmap.md`     | §4.1 体验侧必修项           | "Toast 未接入 → 保存/导出/AI/错误无即时反馈 → `Toast.tsx` 完整实现但 `App.tsx` 未挂载 Provider → 挂载 ToastProvider，梳理关键场景接入" |
| `docs/audit/amp/01-master-roadmap.md`     | Phase 0 验收矩阵            | "Toast 反馈 → 保存、导出、AI 完成等关键操作有即时 Toast 反馈"                                                                          |

---

## What：做什么

1. **挂载 Toast 基础设施**：在 `App.tsx`（或抽取的 `AppProviders.tsx`）的 Provider 树中挂载 `ToastProvider`，在根级 DOM 中挂载 `ToastViewport`
2. **建立全局 Toast 上下文**：提供 `useAppToast()` hook，使任意组件可通过 context 触发 Toast，不依赖组件本地 state
3. **接入关键场景**：为以下场景接入 Toast 通知：
   - 文档保存成功（variant: `success`）
   - 文档保存失败（variant: `error`，含重试 action）
   - 导出完成（variant: `success`）
   - AI 请求失败（variant: `error`）
   - 设置保存成功（variant: `success`）

---

## Non-Goals：不做什么

1. **不实现 Toast 队列管理系统**——v0.1 不需要同时展示超过 3 条 Toast 的复杂排队、合并、优先级机制
2. **不修改 `Toast.tsx` 组件本身的视觉样式和动画**——现有 Radix Toast 实现已满足需求，本变更只做接入不做重写
3. **不为所有业务场景接入 Toast**——仅覆盖上述 5 个关键场景；A0-02（自动保存失败）、A0-20/21（错误人话化）等有独立 change 负责各自的 Toast 调用
4. **不实现 Toast 持久化或历史记录**——Toast 是临时通知，展示后消失，不保留历史
5. **不做服务端推送触发的 Toast**——v0.1 仅处理渲染进程内的同步/异步操作反馈

---

## 依赖与影响

- **被依赖于**：A0-02（自动保存失败可见化）、A0-03（渲染进程全局错误兜底）、A0-20/21/22（错误人话化系列）——这些变更需要 Toast 基础设施已就绪
- **无上游依赖**：可独立实施
