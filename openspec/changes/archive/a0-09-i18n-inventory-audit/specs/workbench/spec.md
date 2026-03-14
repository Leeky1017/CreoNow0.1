# Delta Spec: workbench — i18n 存量 key 核查

- **Parent Change**: `a0-09-i18n-inventory-audit`
- **Base Spec**: `openspec/specs/workbench/spec.md`
- **GitHub Issue**: #990

---

## 变更摘要

renderer 前端源码中大量用户可见文案以裸字符串字面量硬编码，绕过了 i18n 管线。本变更定义全量核查的方法论、扫描范围、输出格式和验收标准，产出结构化的清理清单供下游 A0-16 等实施任务消费。

---

## 新增 Requirement: renderer 前端 i18n 裸字符串全量核查

### 扫描范围

扫描**必须**覆盖 `apps/desktop/renderer/src/` 下**全部** `.tsx` 和 `.ts` 文件，包括但不限于：

| 功能区域         | 关键文件                      | 已知裸字符串示例（来自 `07` §三）                                                   |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| 编辑器区域       | `EditorPane.tsx`              | `"Entity suggestions unavailable."`、confirm 对话框文案                             |
| 编辑器上下文菜单 | `EditorContextMenu.tsx`       | `"AI"`                                                                              |
| Slash 命令       | `slashCommands.ts`            | `/续写`、`/描写`、`/对白`、`/角色`、`/大纲`、`/搜索` 的 label 与 description        |
| 版本历史         | `VersionHistoryContainer.tsx` | `"You"` / `"AI"` / `"Auto"` / `"Unknown"`；`"Just now"` / `"Today"` / `"Yesterday"` |
| 版本历史面板     | `VersionHistoryPanel.tsx`     | `"Restore"` / `"Compare"` / `"Preview"`                                             |
| 版本对比         | `useVersionCompare.ts`        | `"No differences found."` / `"Unknown error"`                                       |
| AI 面板          | `AiPanel.tsx`                 | `" Then restart the app."`、`"code"`、`title="AI"`                                  |

### 扫描方法

1. **AST / 正则扫描**：对 JSX 中的文本节点（`>text<`）和字符串属性（`title="..."`, `placeholder="..."`, `aria-label="..."`）进行检测
2. **逻辑层扫描**：对 `.ts` 文件中面向用户的文案常量（error message、tooltip text、status text）进行检测
3. **排除规则**：以下类型的字符串**不计入**裸字符串清单——
   - CSS class name / Tailwind utility
   - DOM 事件名 / HTML 标签名
   - 技术常量（路由路径、存储 key、正则表达式）
   - `console.log` / `console.error` 中的调试文案
   - 测试文件（`*.test.ts` / `*.test.tsx` / `*.spec.ts`）中的字符串

### 输出格式

清理清单**必须**以 Markdown 表格形式输出，包含以下字段：

| 字段          | 说明                                                                   |
| ------------- | ---------------------------------------------------------------------- |
| 模块          | 功能模块名（editor / version-control / ai-service / workbench / etc.） |
| 文件          | 源码文件相对路径                                                       |
| 行号          | 裸字符串所在行                                                         |
| 裸字符串      | 原始文案内容                                                           |
| 建议 i18n key | 参考现有 key 命名规范建议的 key                                        |
| 优先级        | P0（用户主流程必见） / P1（边缘路径可见）                              |

### 覆盖率验证

扫描结果**必须**满足：

- `07` §三中列出的全部裸字符串条目均已出现在清理清单中
- 清理清单条目数 ≥ `07` §三列出的已知条目数（扫描应发现更多未在审计中列出的裸字符串）

### 约束

- **只读核查**：本任务**禁止**修改任何源码文件或 locale 文件
- **不生成代码 diff**：输出物为文档清单，不是代码变更
- **不判断文案内容正确性**：只标记"未走 i18n"的事实，不评估文案措辞是否恰当

---

## Scenarios

### Scenario 1: 已知裸字符串全覆盖

- **GIVEN** `07` §三已列出编辑器区域、版本历史、AI 面板中的裸字符串清单
- **WHEN** 执行 renderer 源码全量 i18n 扫描
- **THEN** 扫描结果中包含 `07` §三列出的每一条裸字符串（以文件路径 + 内容匹配确认）
- **AND** 缺失覆盖数为 0

### Scenario 2: 扫描发现超出审计文档的额外裸字符串

- **GIVEN** `07` §三基于人工审计，可能存在遗漏
- **WHEN** 对 `renderer/src/` 全目录执行自动化扫描
- **THEN** 清理清单的总条目数 ≥ `07` §三中已知裸字符串数量
- **AND** 每条扫描结果包含模块、文件路径、行号、裸字符串内容、建议 i18n key、优先级六个字段

### Scenario 3: 排除规则不产生假阳性

- **GIVEN** renderer 源码中包含大量非用户可见的技术字符串（CSS class、事件名、路由路径、测试文案）
- **WHEN** 扫描应用排除规则
- **THEN** 清理清单中不包含 Tailwind CSS class name
- **AND** 不包含 `console.log` / `console.error` 中的调试文案
- **AND** 不包含测试文件中的断言字符串

### Scenario 4: 清单按模块分组可供下游消费

- **GIVEN** A0-16 需要按模块（editor / version-control）领取修复任务
- **WHEN** 清理清单输出完成
- **THEN** 清单按模块分组排列
- **AND** 每个模块下的条目按文件路径 + 行号升序排列
- **AND** P0 条目排在 P1 条目之前
