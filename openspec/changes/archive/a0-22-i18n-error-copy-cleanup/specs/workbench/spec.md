# Delta Spec: workbench — i18n 错误文案修正

- **Parent Change**: `a0-22-i18n-error-copy-cleanup`
- **Base Spec**: `openspec/specs/workbench/spec.md`
- **GitHub Issue**: #989

---

## 新增 Requirement: i18n 错误文案去技术化

i18n locale 文件（`zh-CN.json` / `en.json`）中所有面向用户的错误相关文案，**必须**使用自然语言描述，**禁止**包含技术错误码标识符、技术码插值或错误码前缀。

### 修正规则

1. **禁止错误码前缀**：文案值不得以 `XXX_YYY:` 格式（大写蛇形标识符 + 冒号）开头。现有违规实例：`"NO_PROJECT: 请先打开一个项目"` → 修正为 `"请先打开一个项目"`
2. **禁止技术码插值**：文案值不得包含 `{{code}}`、`{{errorCode}}`、`({{code}})` 等会将技术错误码渲染到界面的插值模式。现有违规实例：`"错误 ({{code}})"` → 修正为 `"质量检测遇到问题"`
3. **禁止技术术语**：文案值不得包含大写蛇形标识符（如 `MODEL_NOT_READY`、`DB_ERROR`）、HTTP 状态码（如 `401`、`500`）、系统路径、上游 API 名称等技术术语
4. **中英文同步**：每一处修正**必须**同时更新 `zh-CN.json` 和 `en.json`，确保两份 locale 文件的错误文案风格一致

### 文案撰写原则

修正后的文案**必须**满足（与 A0-20 Delta Spec 文案撰写原则一致）：

1. **说人话**：不包含英文技术术语、错误码标识符、HTTP 状态码
2. **可操作**：在适用场景下告诉用户下一步可以做什么
3. **不推责**：不暗示是用户的错误
4. **简洁**：单条文案不超过 30 个中文字

### 调用点同步

若组件代码通过 `t("someKey", { code: error.code })` 向 i18n 模板传入技术码参数，修正文案后**必须**同步修改调用点：

- 移除传入的 `{ code: ... }` 参数（因文案不再包含 `{{code}}` 插值）
- 或将调用点改为 `getHumanErrorMessage(error)`（优先，若组件已被 A0-21 收口）

#### 已知调用点清单

实现 Agent 在动手前**必须**全局搜索确认完整调用点清单。以下为已知调用点：

| 调用点文件         | i18n Key                           | 传入参数                     | 处置方式               |
| ------------------ | ---------------------------------- | ---------------------------- | ---------------------- |
| `QualityPanel.tsx` | `rightPanel.quality.errorWithCode` | `{ code: state.error.code }` | 移除 `{ code }` 参数   |
| `ExportDialog.tsx` | `export.error.noProject`           | 无插值                       | 仅修正 locale 文件即可 |

> **注意**：以上清单基于 AMP 审计时点。实现前**必须**执行 `grep -rn "errorWithCode\|error\.noProject" apps/desktop/renderer/` 确认无遗漏。

### 修正清单

以下为 `09-error-ux-audit.md` §五 记录的全部违规 i18n key：

| i18n Key                           | 修正前 zh-CN 值                  | 修正后 zh-CN 值      | 修正前 en 值                                | 修正后 en 值                           |
| ---------------------------------- | -------------------------------- | -------------------- | ------------------------------------------- | -------------------------------------- |
| `export.error.noProject`           | `"NO_PROJECT: 请先打开一个项目"` | `"请先打开一个项目"` | `"NO_PROJECT: Please open a project first"` | `"Please open a project first"`        |
| `rightPanel.quality.errorWithCode` | `"错误 ({{code}})"`              | `"质量检测遇到问题"` | `"Error ({{code}})"`                        | `"Quality check encountered an issue"` |

### 全量扫描规则

实现 Agent **必须**对 `zh-CN.json` 和 `en.json` 执行全量扫描，识别上表以外可能存在的技术泄露文案。扫描检测模式：

- `/^[A-Z][A-Z_]{2,}:\s/`——大写蛇形标识符前缀（如 `DB_ERROR: ...`）
- `/\{\{code\}\}/` 或 `/\{\{errorCode\}\}/`——技术码插值
- `/\([A-Z_]{3,}\)/`——括号包裹的技术码（如 `(MODEL_NOT_READY)`）

扫描发现的额外违规项**必须**按相同原则修正，并补充到测试中。

---

## Scenarios

### Scenario 1: 导出面板无项目错误不展示错误码前缀

- **假设** 用户未打开任何项目，界面语言为中文
- **当** 用户触发导出操作，组件调用 `t("export.error.noProject")`
- **则** 界面展示 `"请先打开一个项目"`
- **并且** 展示内容不包含 `NO_PROJECT` 或 `NO_PROJECT:` 前缀
- **并且** 切换语言为英文后展示 `"Please open a project first"`，同样不含 `NO_PROJECT` 前缀

### Scenario 2: 质量面板错误状态不展示技术码插值

- **假设** 质量面板的 Judge 模块处于错误状态，`state.error.code` 为 `"MODEL_NOT_READY"`，界面语言为中文
- **当** 组件渲染错误状态，展示质量检测错误文案
- **则** 界面展示 `"质量检测遇到问题"`
- **并且** 展示内容不包含 `MODEL_NOT_READY`、`(MODEL_NOT_READY)` 或任何大写蛇形标识符
- **并且** 切换语言为英文后展示 `"Quality check encountered an issue"`，同样不含技术码

### Scenario 3: locale 文件全量扫描无技术泄露

- **假设** A0-22 修正工作已完成
- **当** 扫描 `zh-CN.json` 中所有 key 的值
- **则** 无任何值匹配 `/^[A-Z][A-Z_]{2,}:\s/` 模式（错误码前缀）
- **并且** 无任何值包含 `{{code}}` 或 `{{errorCode}}` 插值模式
- **并且** `en.json` 同样满足上述约束
