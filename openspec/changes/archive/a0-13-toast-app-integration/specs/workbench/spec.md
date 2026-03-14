# Delta Spec: workbench — Toast 接入 App

- **Parent Change**: `a0-13-toast-app-integration`
- **Base Spec**: `openspec/specs/workbench/spec.md`
- **GitHub Issue**: #981

---

## 新增 Requirement: Toast 全局通知基础设施

系统**必须**在应用根级挂载 Toast 基础设施，使任意组件可触发即时通知。

### 挂载规则

- `ToastProvider`（来自 `Toast.tsx`）**必须**包裹在 `App.tsx` 或 `AppProviders.tsx` 的 Provider 树最外层（在 ThemeStoreProvider 之内，在其他 Store Provider 之外）
- `ToastViewport`（来自 `Toast.tsx`）**必须**挂载在 Provider 树的根级 DOM 中，与 `AppRouter` 同级
- `ToastViewport` 固定定位在窗口右下角（`bottom: var(--spacing-4)`，`right: var(--spacing-4)`），z-index 使用 `--z-toast` Design Token
- `ToastViewport` 最大宽度 360px，不超过 `calc(100vw - 32px)`

### 全局 Toast Context

系统**必须**提供 `AppToastProvider` 和 `useAppToast()` hook：

- `useAppToast()` 返回 `showToast(options)` 方法
- `showToast` 接受参数：`title: string`、`description?: string`、`variant?: ToastVariant`、`duration?: number`、`action?: { label: string; onClick: () => void }`
- 同时存在多条 Toast 时，按触发顺序自下而上堆叠，间距 `var(--spacing-2)`
- 默认 `duration` 为 5000ms；variant 为 `error` 时默认 `duration` 为 8000ms

### Design Token 引用

| 用途                  | Token                    |
| --------------------- | ------------------------ |
| Toast 背景            | `--color-bg-raised`      |
| Toast 边框（default） | `--color-border-default` |
| Toast 边框（success） | `--color-success`        |
| Toast 边框（error）   | `--color-error`          |
| Toast 边框（warning） | `--color-warning`        |
| Toast 标题文字        | `--color-fg-default`     |
| Toast 描述文字        | `--color-fg-muted`       |
| Toast 圆角            | `--radius-lg`            |
| Toast 阴影            | `--shadow-lg`            |
| Toast 层级            | `--z-toast`              |
| 关闭按钮悬停          | `--color-bg-hover`       |
| Action 文字           | `--color-accent`         |

### 无障碍要求

- `ToastViewport` 的 Radix 默认 `role="region"` 和 `aria-label` 保持不变
- 每条 Toast **必须**设置 `aria-live`：variant 为 `error` 时使用 `assertive`，其余使用 `polite`
- 关闭按钮**必须**具有 `aria-label`，值为 i18n key `primitives.toast.close`（已存在于 `zh-CN.json`）
- Action 按钮**必须**通过 Radix `altText` 属性提供替代文本
- Toast **必须**支持键盘 Escape 关闭（Radix 默认行为）
- Toast **必须**支持滑动手势关闭（Radix swipe 默认行为）

### i18n 要求

Toast 的 `title` 和 `description` 参数**必须**由调用方传入已翻译的 i18n 字符串（通过 `t()` 函数）。Toast 组件本身不负责翻译业务文案，只负责翻译自身 UI 元素（关闭按钮 aria-label）。

关键场景所需的 i18n key 新增于 `zh-CN.json` 和 `en.json`：

| i18n Key                       | 用途                 |
| ------------------------------ | -------------------- |
| `toast.save.success.title`     | 文档保存成功标题     |
| `toast.save.error.title`       | 文档保存失败标题     |
| `toast.save.error.description` | 文档保存失败描述     |
| `toast.save.error.retry`       | 保存失败重试按钮文案 |
| `toast.export.success.title`   | 导出完成标题         |
| `toast.ai.error.title`         | AI 请求失败标题      |
| `toast.ai.error.description`   | AI 请求失败描述      |
| `toast.settings.success.title` | 设置保存成功标题     |

---

### Scenario: Provider 挂载后 Toast 可触发

- **假设** 应用已启动，`ToastProvider` 和 `ToastViewport` 已挂载在 Provider 树中
- **当** 任意组件调用 `useAppToast().showToast({ title: t("toast.save.success.title"), variant: "success" })`
- **则** 窗口右下角出现 success 样式的 Toast 通知
- **并且** Toast 背景色为 `--color-bg-raised`，边框色为 `--color-success`
- **并且** Toast 在 5000ms 后自动消失

### Scenario: 文档保存成功触发 Toast

- **假设** 用户在编辑器中编辑了文档内容
- **当** 文档保存操作成功完成
- **则** 触发 variant 为 `success` 的 Toast
- **并且** Toast 标题显示 `t("toast.save.success.title")` 的翻译值
- **并且** Toast 的 `aria-live` 属性为 `polite`

### Scenario: 文档保存失败触发带重试的 Toast

- **假设** 用户在编辑器中编辑了文档内容
- **当** 文档保存操作失败（IPC 返回错误）
- **则** 触发 variant 为 `error` 的 Toast
- **并且** Toast 标题显示 `t("toast.save.error.title")` 的翻译值
- **并且** Toast 描述显示 `t("toast.save.error.description")` 的翻译值
- **并且** Toast 包含 action 按钮，文案为 `t("toast.save.error.retry")`
- **并且** 点击 action 按钮重新触发保存操作
- **并且** Toast 的 `aria-live` 属性为 `assertive`
- **并且** Toast `duration` 为 8000ms

### Scenario: AI 请求失败触发 Toast

- **假设** 用户通过 AI 面板发送了请求
- **当** AI 请求返回错误（网络超时、模型不可用等）
- **则** 触发 variant 为 `error` 的 Toast
- **并且** Toast 标题显示 `t("toast.ai.error.title")` 的翻译值
- **并且** Toast 描述显示 `t("toast.ai.error.description")` 的翻译值
- **并且** Toast 的 `aria-live` 属性为 `assertive`

### Scenario: 导出完成触发 Toast

- **假设** 用户在导出对话框中选择了导出格式并确认
- **当** 导出操作成功完成
- **则** 触发 variant 为 `success` 的 Toast
- **并且** Toast 标题显示 `t("toast.export.success.title")` 的翻译值

### Scenario: 设置保存成功触发 Toast

- **假设** 用户在设置对话框中修改了配置项
- **当** 设置写入 Preference Store 成功
- **则** 触发 variant 为 `success` 的 Toast
- **并且** Toast 标题显示 `t("toast.settings.success.title")` 的翻译值

### Scenario: error variant 的 Toast 停留时间更长

- **假设** 应用已启动，Toast 基础设施已挂载
- **当** 触发 variant 为 `error` 的 Toast 且未指定 `duration`
- **则** Toast 停留 8000ms 后自动消失（而非默认的 5000ms）
- **并且** 用户可随时点击关闭按钮或滑动手势提前关闭

### Scenario: Toast 被键盘关闭

- **假设** 一条 Toast 正在显示
- **当** Toast 获得焦点后用户按下 Escape 键
- **则** 该 Toast 执行关闭动画并从 DOM 移除
- **并且** 屏幕阅读器播报 Toast 已关闭

### Scenario: 多条 Toast 同时显示时的堆叠

- **假设** 一条 success Toast 正在显示
- **当** 紧接着触发了另一条 error Toast
- **则** 两条 Toast 在 Viewport 中自下而上堆叠
- **并且** 间距为 `var(--spacing-2)`
- **并且** 每条 Toast 独立计算 duration 和关闭

---

## 修改 Requirement: 整体布局架构（补充）

在 `App.tsx` 的 Provider 树中新增 `ToastProvider` 和 `ToastViewport` 不改变现有布局结构。`ToastViewport` 使用 fixed 定位，不参与 flexbox 流式布局。

---

## 不变更项

- `Toast.tsx` 组件实现（视觉样式、动画、API 签名）不做修改
- `useToast()` hook 保持原有实现，`useAppToast()` 是在其之上的全局 context 封装
- 现有 Store Provider 的嵌套顺序不做调整
- 状态栏、Icon Bar、Sidebar、Right Panel 的布局和行为不受影响
