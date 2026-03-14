# A0-22 i18n 错误文案修正

- **GitHub Issue**: #989
- **所属任务簇**: P0-2（失败可见与错误人话化）
- **涉及模块**: workbench
- **前端验收**: 是

---

## Why：为什么必须做

### 1. 用户现象

CreoNow 的 i18n locale 文件中，部分错误相关文案仍携带技术错误码前缀或技术码插值——用户在导出面板看到 `"NO_PROJECT: 请先打开一个项目"`，在质量面板看到 `"错误 (MODEL_NOT_READY)"`。即使 A0-20 已建立全量映射函数、A0-21 已收口组件直接渲染，这些 i18n 文案本身仍在向用户泄露内部错误码。"药方已开好、管道已接通，但水源里还掺着杂质"——末端治理不彻底，用户体验链路仍有技术术语渗出。

### 2. 根因

错误文案去技术化工作在 A0-20 中聚焦于 `errorMessages.ts` 映射层，在 A0-21 中聚焦于组件调用层。但 i18n locale 文件（`zh-CN.json` / `en.json`）中已有的错误相关 key 未被同步清理：

- `export.error.noProject`：zh 值为 `"NO_PROJECT: 请先打开一个项目"` / en 值为 `"NO_PROJECT: Please open a project first"`——携带 `NO_PROJECT:` 错误码前缀
- `rightPanel.quality.errorWithCode`：zh 值为 `"错误 ({{code}})"` / en 值为 `"Error ({{code}})"`——`{{code}}` 插值会将 `MODEL_NOT_READY` 等技术码直接渲染到界面

### 3. v0.1 威胁

- **体验断裂**：A0-20 和 A0-21 已投入大量工作建立人话化映射与组件收口，但 i18n 文案本身的技术泄露使这些工作在视觉终端上功亏一篑
- **i18n 一致性破坏**：部分 key 已人话化（通过 `error.code.*` 命名空间），部分 key 仍含技术码前缀，同一界面上错误风格不统一
- **信任流失**：创作者看到 `(MODEL_NOT_READY)` 括号中的大写蛇形标识符，无法理解含义，只会认为产品不稳定

### 4. 证据来源

| 文档                                                            | 章节                  | 内容                                                                                                      |
| --------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------- |
| `docs/audit/amp/09-error-ux-audit.md`                           | §五 i18n 中的技术文案 | `export.error.noProject` 含 `NO_PROJECT:` 前缀；`rightPanel.quality.errorWithCode` 含 `{{code}}` 技术插值 |
| `openspec/changes/a0-20-error-message-humanization/proposal.md` | Non-Goals #2          | 明确声明"不修改 i18n locale 文件中已有的错误码前缀文案——由 A0-22 负责清理"                                |
| `openspec/changes/a0-21-error-surface-closure/proposal.md`      | Non-Goals #5          | 同上，再次将 i18n 文案清理职责指定给 A0-22                                                                |

---

## What：做什么

1. **清理 `export.error.noProject` 文案**：移除 zh-CN 值中的 `NO_PROJECT:` 前缀，改为 `"请先打开一个项目"`；移除 en 值中的 `NO_PROJECT:` 前缀，改为 `"Please open a project first"`
2. **重写 `rightPanel.quality.errorWithCode` 文案**：移除 `{{code}}` 技术码插值，zh-CN 改为不含错误码的人话文案 `"质量检测遇到问题"`；en 改为 `"Quality check encountered an issue"`
3. **全量扫描 i18n locale 文件**：扫描 `zh-CN.json` 和 `en.json` 中所有 key，识别并修正任何包含技术错误码模式的文案值（大写蛇形前缀 `XXX_YYY:`、`{{code}}` / `{{errorCode}}` 技术插值、`(${...})` 拼接模式）
4. **同步调用点**：若组件调用 `t("rightPanel.quality.errorWithCode", { code: ... })` 时依赖 `{{code}}` 参数，修改调用点移除参数传递，确保组件改为调用 `getHumanErrorMessage()` 或使用不含技术插值的 i18n key

---

## Non-Goals：不做什么

1. **不修改 `errorMessages.ts` 映射表或 `getHumanErrorMessage()` 函数**——映射基础设施由 A0-20 负责建立和维护
2. **不修改组件中 `error.code` / `error.message` 直接渲染逻辑**——组件层收口由 A0-21 负责
3. **不新增 `IpcErrorCode` 或变更 IPC 契约**——本任务只修正 i18n 文案内容，不涉及后端类型定义
4. **不重构 i18n key 命名空间**（如将 `export.error.noProject` 迁移到 `error.code.NO_PROJECT`）——命名空间迁移属于后续 Phase 1 统一 key 结构工作
5. **不增加 CI lint 规则检测 i18n 文案中的技术术语**——自动化防护属于 Phase 2+ 工作

---

## 依赖与影响

- **上游依赖**: A0-20（错误消息统一人话化）——全量映射函数和 `error.code.*` i18n 命名空间必须先就绪，本任务才能确认哪些旧 key 需要修正而非删除
- **被依赖于**: 无直接下游依赖；本任务完成后，错误体验人话化三部曲（A0-20 → A0-21 → A0-22）全部落地
