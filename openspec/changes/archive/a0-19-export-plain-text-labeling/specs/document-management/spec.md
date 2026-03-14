# Delta Spec: document-management — 导出能力 UI 与真实实现一致

- **Parent Change**: `a0-19-export-plain-text-labeling`
- **Base Spec**: `openspec/specs/document-management/spec.md`
- **GitHub Issue**: #998

---

## 变更摘要

ExportDialog、i18n 与导出失败提示**必须**围绕 A0-04 的真实结构化导出能力重新校准。A0-19 的目标不再是“纯文本诚实标注”，而是“UI 不说错、不说空、也不说过头”。

---

## 前置依赖

- **A0-04 完成状态**：A0-04 已把 PDF / DOCX / Markdown 收口为真实结构化导出主线；本变更以该实现与测试结果为行为依据

---

## 变更: ExportDialog 与错误反馈一致性

### 格式选项描述

ExportDialog 中的格式选项**必须**体现真实能力差异：

| 格式     | label                          | description 要求                                          |
| -------- | ------------------------------ | --------------------------------------------------------- |
| PDF      | `"PDF"`                        | 描述真实结构化导出能力，不得再使用“纯文本导出 · 不含格式” |
| DOCX     | `"Word"`                       | 描述真实结构化导出能力，不得再仅用扩展名充当能力说明      |
| Markdown | `"Markdown"`                   | 描述真实结构化 Markdown 导出能力                          |
| TXT      | `t('export.format.plainText')` | 明确纯文本能力边界                                        |

### 失败提示

当导出前命中暂不支持结构时：

- UI **必须**显示明确、可本地化的失败原因
- 失败原因 **必须**指出不支持的节点或 mark 类型
- UI **不得**回退展示模糊的“导出失败”总括语，除非无更具体信息

### i18n 要求

- `zh-CN.json` 与 `en.json` **必须**删除或替换过期的 plain-text-only 主界面文案
- 新增真实结构化导出描述与不支持结构失败提示所需 key
- 中英文 key 集保持一致

---

### Scenario: 用户在 ExportDialog 中看到与真实能力一致的格式说明

- **假设** 用户打开 ExportDialog
- **当** 用户浏览 Markdown、PDF、DOCX、TXT 选项
- **则** PDF / DOCX / Markdown 的描述反映真实结构化导出能力
- **并且** TXT 的描述明确其纯文本边界
- **并且** 不再出现“纯文本导出 · 不含格式”作为 PDF / DOCX 主文案

### Scenario: 命中不支持结构时 UI 给出明确原因

- **假设** 用户导出的文档包含当前目标格式尚未实现的结构
- **当** 导出在写文件前失败
- **则** ExportDialog 或其关联错误表面显示可本地化的明确原因
- **并且** 原因中指出不支持的结构类型

### Scenario: Storybook 中可见真实导出能力说明与失败状态

- **假设** 开发者打开 ExportDialog Story
- **当** 切换到正常导出或失败态
- **则** 可以看到与真实实现一致的格式说明与错误提示

---

## 可访问性要求

- 格式说明与失败原因**必须**可被屏幕阅读器读出
- 失败提示**必须**通过语义化错误区域暴露，而非仅靠颜色区别
