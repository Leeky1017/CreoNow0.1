# Delta Spec: document-management — 自动保存失败可见化

- **Parent Change**: `a0-02-autosave-visible-failure`
- **Base Spec**: `openspec/specs/document-management/spec.md`
- **GitHub Issue**: #992

---

## 新增 Requirement: 自动保存状态可视化与失败反馈

自动保存（autosave）的运行状态**必须**在用户界面中可见——用户不应需要打开开发者工具才能知道保存是否成功。保存失败时**必须**主动通知用户并提供重试入口。

### 保存状态定义

`editorStore` 已定义四种 `AutosaveStatus`，本 Requirement 要求每种状态在 UI 层有明确的视觉映射：

| 状态     | 语义         | 状态栏指示                                                                            | 备注                               |
| -------- | ------------ | ------------------------------------------------------------------------------------- | ---------------------------------- |
| `idle`   | 无待保存内容 | 无特殊显示                                                                            | 默认态                             |
| `saving` | 正在保存中   | 状态栏显示保存中指示（旋转图标 + `t("autosave.status.saving")`）                      | 过渡态                             |
| `saved`  | 保存成功     | 状态栏短暂显示成功指示（`t("autosave.status.saved")`），2s 后回到 idle                | 反馈态                             |
| `error`  | 保存失败     | 状态栏显示错误指示（`--color-error` 文字 + `t("autosave.status.error")`），可点击重试 | **持久显示直到重试成功或手动清除** |

### 状态栏 UI 规格

状态栏保存指示区域位于 `StatusBar` 已有内容的右侧区域：

| 属性            | 值                                             |
| --------------- | ---------------------------------------------- |
| 位置            | 状态栏右侧区域，字数统计左侧                   |
| 字体            | `--font-family-ui`，12px                       |
| idle 态文字色   | 不显示                                         |
| saving 态文字色 | `--color-fg-muted`                             |
| saved 态文字色  | `--color-success`                              |
| error 态文字色  | `--color-error`                                |
| error 态背景    | `--color-error-subtle`                         |
| error 态圆角    | `--radius-sm`                                  |
| error 态内边距  | `var(--spacing-1) var(--spacing-2)`            |
| error 态光标    | `cursor: pointer`（点击触发重试）              |
| error 态 hover  | 背景 `--color-error-subtle` 不透明度加深至 0.2 |

### Design Token 引用

| 用途                  | Token                        |
| --------------------- | ---------------------------- |
| 保存中文字色          | `--color-fg-muted`           |
| 保存成功文字色        | `--color-success`            |
| 保存失败文字色        | `--color-error`              |
| 保存失败背景色        | `--color-error-subtle`       |
| 保存失败 Toast 边框色 | `--color-error`              |
| 状态栏字体            | `--font-family-ui`           |
| 保存失败圆角          | `--radius-sm`                |
| 保存失败内边距        | `--spacing-1`、`--spacing-2` |

### Toast 通知规格

保存失败时**必须**触发一条 `error` variant 的 Toast 通知（依赖 A0-13 Toast 基础设施）：

| 属性           | 值                                                                                    |
| -------------- | ------------------------------------------------------------------------------------- |
| variant        | `error`                                                                               |
| title          | `t("autosave.toast.error.title")`（"保存失败"）                                       |
| description    | `t("autosave.toast.error.description")`（"自动保存未成功，您的最近修改可能未保存。"） |
| action.label   | `t("autosave.toast.error.retry")`（"重试"）                                           |
| action.onClick | 调用 `editorStore.retryLastAutosave()`                                                |
| duration       | 8000ms（error variant 默认值）                                                        |

Toast **不得**在每次 debounce 周期失败时重复触发——同一 `documentId` 的连续失败仅触发一次 Toast，直到用户操作（重试或切换文档）后才允许再次触发。

### 重试机制

用户可通过两个入口触发重试：

1. **状态栏点击**：error 状态下点击保存指示区域，调用 `retryLastAutosave()`
2. **Toast action 按钮**：点击 Toast 中的「重试」按钮，调用 `retryLastAutosave()`

重试成功后：

- `autosaveStatus` 切换为 `"saved"`
- 状态栏恢复正常显示
- 触发 `success` variant 的 Toast：`t("autosave.toast.retrySuccess.title")`（"保存已恢复"）

重试失败后：

- `autosaveStatus` 保持 `"error"`
- 不重复触发 Toast（避免通知轰炸）

### Cleanup Flush 失败可见化

文档切换时 `useAutosave` 的 cleanup 函数会执行 flush save。若 flush save 失败：

- **必须**在新文档的上下文中触发一条 `warning` variant 的 Toast
- title: `t("autosave.toast.flushError.title")`（"上一文档保存异常"）
- description: `t("autosave.toast.flushError.description")`（"切换前的文档可能未完全保存，请返回检查。"）
- duration: 8000ms
- 无 action 按钮（用户需手动切回文档查看）

### 无障碍要求

- 状态栏保存指示区域**必须**具有 `role="status"` 和 `aria-live="polite"`，确保屏幕阅读器播报状态变化
- error 状态下的点击重试区域**必须**具有 `role="button"` 和 `aria-label`（`t("autosave.a11y.retryLabel")`，"重试保存"）
- 保存状态变更**必须**通过 `aria-live` 自动播报，不依赖视觉
- saving 态的旋转图标**必须**具有 `aria-hidden="true"`（装饰性动画）

### i18n 要求

所有保存状态文案**必须**通过 `t()` 函数获取。新增 i18n key：

| i18n Key                                | 中文值                                   | 英文值                                                                  |
| --------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `autosave.status.saving`                | 保存中…                                  | Saving…                                                                 |
| `autosave.status.saved`                 | 已保存                                   | Saved                                                                   |
| `autosave.status.error`                 | 保存失败                                 | Save failed                                                             |
| `autosave.toast.error.title`            | 保存失败                                 | Save failed                                                             |
| `autosave.toast.error.description`      | 自动保存未成功，您的最近修改可能未保存。 | Auto-save failed. Your recent changes may not be saved.                 |
| `autosave.toast.error.retry`            | 重试                                     | Retry                                                                   |
| `autosave.toast.retrySuccess.title`     | 保存已恢复                               | Save recovered                                                          |
| `autosave.toast.flushError.title`       | 上一文档保存异常                         | Previous document save issue                                            |
| `autosave.toast.flushError.description` | 切换前的文档可能未完全保存，请返回检查。 | The previous document may not be fully saved. Please go back and check. |
| `autosave.a11y.retryLabel`              | 重试保存                                 | Retry save                                                              |

---

### Scenario: 自动保存失败后状态栏显示错误并触发 Toast

- **假设** 用户正在编辑文档「第三章」，自动保存正常运行
- **当** 自动保存 IPC 调用返回失败（如 `DOCUMENT_SAVE_ERROR`）
- **则** 状态栏保存指示区域显示 `t("autosave.status.error")`，文字色为 `--color-error`，背景色为 `--color-error-subtle`
- **并且** 触发一条 error Toast，标题为 `t("autosave.toast.error.title")`，描述为 `t("autosave.toast.error.description")`，附带「重试」按钮
- **并且** Toast 的 `aria-live` 属性为 `assertive`

### Scenario: 用户通过状态栏点击重试保存成功

- **假设** 状态栏显示保存失败状态
- **当** 用户点击状态栏的保存错误指示区域
- **则** `autosaveStatus` 切换为 `"saving"`，状态栏显示 `t("autosave.status.saving")`
- **当** 重试保存成功
- **则** `autosaveStatus` 切换为 `"saved"`，状态栏显示 `t("autosave.status.saved")`（`--color-success`）
- **并且** 触发 success Toast（`t("autosave.toast.retrySuccess.title")`）
- **并且** 2s 后状态栏回到 idle 状态

### Scenario: 用户通过 Toast 重试按钮重试保存

- **假设** 屏幕上显示自动保存失败的 error Toast
- **当** 用户点击 Toast 中的「重试」按钮
- **则** 调用 `retryLastAutosave()`
- **并且** 行为与状态栏重试一致

### Scenario: 连续失败不重复触发 Toast

- **假设** 自动保存已失败一次，error Toast 已触发
- **当** 下一个 debounce 周期的自动保存再次失败（同一 `documentId`）
- **则** 不触发新的 error Toast
- **并且** 状态栏保持 error 状态

### Scenario: 文档切换时 flush save 失败的警告

- **假设** 用户正在编辑文档「第三章」，有待保存的内容
- **当** 用户切换到文档「第四章」，cleanup flush save 失败
- **则** 在「第四章」的上下文中触发一条 warning Toast
- **并且** Toast 标题为 `t("autosave.toast.flushError.title")`
- **并且** Toast 描述为 `t("autosave.toast.flushError.description")`

### Scenario: 保存成功时状态栏短暂显示成功后回到 idle

- **假设** 自动保存正在执行
- **当** 保存成功完成
- **则** 状态栏显示 `t("autosave.status.saved")`，文字色为 `--color-success`
- **并且** 2s 后自动切换回 idle 状态（无特殊显示）

### Scenario: 屏幕阅读器播报保存状态变化

- **假设** 用户使用屏幕阅读器
- **当** `autosaveStatus` 从 `"idle"` 变为 `"error"`
- **则** 屏幕阅读器通过 `aria-live="polite"` 的 `role="status"` 区域播报状态文案
- **并且** error 态下的重试按钮可通过 Tab 聚焦，`aria-label` 为 `t("autosave.a11y.retryLabel")`
