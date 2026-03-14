# Delta Spec: workbench — 错误展示组件收口

- **Parent Change**: `a0-21-error-surface-closure`
- **Base Spec**: `openspec/specs/workbench/spec.md`
- **GitHub Issue**: #988

---

## 新增 Requirement: 错误展示统一收口

系统中所有面向用户的错误展示组件，**必须**通过 `getHumanErrorMessage()` 映射函数获取用户友好文案，**禁止**直接渲染 `error.code`、`error.message` 或拼接 `` `${error.code}: ${error.message}` ``。

### 收口规则

1. **JSX 渲染**：任何组件在 JSX 中展示 IPC 错误信息时，**必须**调用 `getHumanErrorMessage({ code: error.code, message: error.message })` 获取翻译后文案，不得直接插值 `{error.code}` 或 `{error.message}`
2. **模板字符串**：任何组件在 JS/TS 逻辑中构造错误文本时，**必须**调用 `getHumanErrorMessage()` 而非拼接 `` `${error.code}: ${error.message}` ``
3. **硬编码错误字符串**：组件中不得存在 `"ACTION_FAILED: ..."` / `"NO_PROJECT: ..."` 等硬编码错误文案；所有用户可见的错误文本**必须**走 `t()` i18n 调用
4. **导入统一**：`getHumanErrorMessage` 从 `renderer/src/lib/errorMessages.ts` 导入，不得在组件中重复实现映射逻辑

### 错误展示样式规范

错误文案在 UI 中的展示**必须**遵循以下 Design Token 规范：

| 属性       | Token                       | 说明                       |
| ---------- | --------------------------- | -------------------------- |
| 错误文字色 | `var(--color-text-error)`   | 错误文案的文字颜色         |
| 错误背景色 | `var(--color-bg-error)`     | 带背景的错误区域底色       |
| 错误边框色 | `var(--color-border-error)` | 错误区域的边框色（如适用） |
| 错误图标色 | `var(--color-icon-error)`   | 错误图标的颜色             |

**禁止**使用 Tailwind 原始色值（如 `text-red-500`、`bg-red-50`），**必须**通过语义化 Token。

### 无障碍要求

- 错误区域**必须**设置 `role="alert"` 或 `aria-live="polite"`，确保屏幕阅读器能即时播报错误内容
- 错误文案**必须**有足够色彩对比度（WCAG 2.1 AA 级别，4.5:1 以上）
- 错误区域**必须**可通过键盘聚焦（`tabIndex={0}` 或语义化 HTML 元素）
- 错误文案的 `lang` 属性**必须**与当前 i18n locale 一致（不会出现中文界面下展示英文错误）

### i18n 要求

- 所有用户可见的错误文案**必须**通过 `t()` 函数获取（包括 `getHumanErrorMessage()` 内部和 CommandPalette 硬编码替换）
- CommandPalette 新增的 i18n key **必须**遵循 `commandPalette.error.<场景>` 命名空间
- `zh-CN.json` 和 `en.json` **必须**同步新增所有 CommandPalette 错误文案的翻译条目

---

## 涉及组件清单

以下组件必须完成收口改造：

| #   | 组件                    | 文件路径                                               | 泄露类型       |
| --- | ----------------------- | ------------------------------------------------------ | -------------- |
| 1   | ExportDialog            | `features/export/ExportDialog.tsx`                     | JSX 直接渲染   |
| 2   | QualityPanel            | `features/rightpanel/QualityPanel.tsx`                 | JSX 直接渲染   |
| 3   | VersionPreviewDialog    | `features/version-history/VersionPreviewDialog.tsx`    | JSX 直接渲染   |
| 4   | InfoPanel               | `features/rightpanel/InfoPanel.tsx`                    | JSX 直接渲染   |
| 5   | MemoryPanel             | `features/memory/MemoryPanel.tsx`                      | JSX 直接渲染   |
| 6   | AnalyticsPage           | `features/analytics/AnalyticsPage.tsx`                 | JSX 直接渲染   |
| 7   | CreateProjectDialog     | `features/projects/CreateProjectDialog.tsx`            | JSX 直接渲染   |
| 8   | KnowledgeGraphPanel     | `features/kg/KnowledgeGraphPanel.tsx`                  | JSX 直接渲染   |
| 9   | VersionHistoryContainer | `features/version-history/VersionHistoryContainer.tsx` | JSX 直接渲染   |
| 10  | JudgeSection            | `features/settings/JudgeSection.tsx`                   | 模板字符串拼接 |
| 11  | AiSettingsSection       | `features/settings/AiSettingsSection.tsx`              | 模板字符串拼接 |
| 12  | DashboardPage           | `features/dashboard/DashboardPage.tsx`                 | 模板字符串拼接 |
| 13  | AiErrorCard             | `components/features/AiDialogs/AiErrorCard.tsx`        | 错误码展示     |
| 14  | CommandPalette          | `features/commandPalette/CommandPalette.tsx`           | 硬编码字符串   |

---

## Scenarios

### Scenario 1: 组件展示 IPC 错误时调用映射函数

- **假设** `ExportDialog` 组件接收到一个 IPC 错误 `{ code: "DB_ERROR", message: "SQLITE_CONSTRAINT: UNIQUE constraint failed" }`
- **当** 组件渲染错误状态
- **则** 界面展示 `getHumanErrorMessage()` 返回的人话文案（如"数据存储遇到问题，请稍后重试"），不展示 `DB_ERROR` 或 `SQLITE_CONSTRAINT`
- **并且** 错误文案使用 `var(--color-text-error)` Token 渲染
- **并且** 错误区域设置了 `role="alert"` 属性

### Scenario 2: 模板字符串拼接位置调用映射函数

- **假设** `JudgeSection` 组件接收到 AI 服务返回的错误 `{ code: "MODEL_NOT_READY", message: "Judge model ensure is not implemented (non-E2E build)" }`
- **当** 组件将错误信息设入 state 并渲染
- **则** state 中存储 `getHumanErrorMessage(res.error)` 的返回值（如"AI 模型正在准备中，请稍后重试"），不存储 `` `${res.error.code}: ${res.error.message}` ``
- **并且** 界面不展示 `MODEL_NOT_READY`、`non-E2E build` 等技术术语

### Scenario 3: CommandPalette 错误不展示硬编码技术字符串

- **假设** 用户在 CommandPalette 中触发了一个操作，但对应的对话框不可用
- **当** CommandPalette 需要展示错误信息
- **则** 展示 `t("commandPalette.error.settingsUnavailable")` 等 i18n 翻译值，不展示 `"ACTION_FAILED: Settings dialog not available"`
- **并且** 切换到英文 locale 后，错误文案同步切换为英文

### Scenario 4: AiErrorCard 不展示原始错误码

- **假设** `AiErrorCard` 处于 `service_error` 状态，错误对象包含 `errorCode: "AI_RATE_LIMITED"`
- **当** 组件渲染错误卡片
- **则** 展示 `getHumanErrorMessage()` 返回的人话文案（如"AI 请求过于频繁，请稍等片刻"），不展示 `AI_RATE_LIMITED`

### Scenario 5: i18n 语言切换后错误文案跟随

- **假设** 用户界面当前语言为中文，某组件正在展示错误状态
- **当** 用户切换界面语言为英文
- **则** 所有通过 `getHumanErrorMessage()` 展示的错误文案切换为英文翻译
- **并且** CommandPalette 的错误文案同步切换

### Scenario 6: 所有收口组件不泄露技术术语

- **假设** 遍历本任务涉及的全部 14 个组件
- **当** 模拟触发每个组件的错误状态
- **则** 无任何组件在 DOM 输出中包含 `IpcErrorCode` 联合类型中的任何值（大写蛇形标识符如 `DB_ERROR`、`AI_RATE_LIMITED`）
- **并且** 无任何组件在 DOM 输出中包含 `SQLITE`、`ENOENT`、`Anthropic`、`HTTP 4xx/5xx` 等后端技术术语
