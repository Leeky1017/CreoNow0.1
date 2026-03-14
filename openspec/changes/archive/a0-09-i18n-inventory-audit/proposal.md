# A0-09 i18n 存量 key 核查

- **GitHub Issue**: #990
- **所属任务簇**: P0-5（文案与 i18n 存量止血）
- **涉及模块**: 所有前端模块（editor, workbench, version-control, etc.）
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户在中文界面下操作时，编辑器区域、版本历史面板、AI 面板、slash menu 等多处 UI 突然冒出英文——"Entity suggestions unavailable."、"Just now"、"Loading versions..."、"Restore"、"Compare"——犹如一件锦袍上散落着补丁，切换语言后更是"原形毕露"。用户的合理预期是"我选了中文，就该全是中文"，但实际体验是中英夹杂、风格割裂。

### 2. 根因

存量文案未走 `t()` 的残留。项目开发阶段大量用户可见文案以裸字符串字面量直接写入组件 JSX 或逻辑层，跳过了 i18n 管线。随着功能迭代，这些硬编码文案分散在多个模块中，缺乏统一盘点，导致：

- **编辑器区域**：`EditorPane.tsx` 中 `"Entity suggestions unavailable."`、confirm 对话框文案硬编码；`EditorContextMenu.tsx` 中菜单项 `"AI"` 未走 i18n；`slashCommands.ts` 中 `/续写`、`/描写` 等 slash command 的 label 和 description 全部硬编码中文
- **版本历史**：`VersionHistoryContainer.tsx` 中作者名 `"You"` / `"AI"` / `"Auto"` / `"Unknown"`，时间分组 `"Just now"` / `"Xm ago"` / `"Today"` / `"Yesterday"` / `"Earlier"`，加载提示 `"Loading versions..."` 均未走 i18n；`VersionHistoryPanel.tsx` 中 hover tooltip `"Restore"` / `"Compare"` / `"Preview"` 硬编码；`useVersionCompare.ts` 中错误文案 `"No differences found."` / `"Unknown error"` 硬编码
- **AI 面板**：`AiPanel.tsx` 中 `formatDbErrorDescription` 含硬编码 `" Then restart the app."`；`props.language || "code"` 的 fallback 值；PanelContainer `title="AI"` 硬编码

### 3. v0.1 威胁

- **体验割裂**：中英混杂让创作者产生"产品没做完"的直觉判断——"一叶知秋"，一处裸字符串就可以瓦解整体体验的专业感
- **多语言不可交付**：i18n 是 v0.1 的基础承诺，存量裸字符串使得中文/英文切换形同虚设
- **修复成本雪球**：不在此刻盘点清扫，每一轮迭代都会继续积累新的裸字符串——"积薪不燃，终成隐患"

### 4. 证据来源

| 文档                                              | 章节              | 内容                                                              |
| ------------------------------------------------- | ----------------- | ----------------------------------------------------------------- |
| `docs/audit/amp/07-ui-ux-design-audit.md`         | §三 i18n 遗漏清单 | 编辑器区域、版本历史、slash menu、AI 面板中裸字符串逐文件逐行列表 |
| `docs/audit/amp/11-frontend-static-code-audit.md` | 全文              | 前端静态代码审计，包含 i18n 缺漏统计                              |

---

## What：做什么

1. **全量扫描 renderer 源码**：扫描 `apps/desktop/renderer/src/` 下所有 `.tsx` / `.ts` 文件，识别 JSX 中的裸字符串字面量和逻辑层中面向用户的硬编码文案
2. **建立清理清单**：输出结构化清单，每条记录包含——文件路径、行号、裸字符串内容、建议 i18n key、所属功能模块
3. **分类标注**：将清单中的条目按功能模块分组（editor、version-control、ai-service、workbench 等），标注优先级（P0 = 用户主流程必见、P1 = 边缘路径可见）
4. **验证扫描覆盖率**：对照 `07` §三已知裸字符串清单，确认全部已列入清理清单；扫描结果数量 ≥ `07` §三列出的条目数

---

## Scope

- **主规范**: `openspec/specs/workbench/spec.md`（核查工作涵盖全前端，以 workbench 为挂靠规范）
- **涉及源码扫描范围**:
  - `renderer/src/features/editor/` — EditorPane、EditorContextMenu、slashCommands
  - `renderer/src/features/rightpanel/` — AiPanel、VersionHistoryPanel
  - `renderer/src/features/version-control/` — VersionHistoryContainer、useVersionCompare
  - `renderer/src/features/` — 全目录递归扫描
  - `renderer/src/components/` — 公共组件中的裸字符串
- **所属任务簇**: P0-5（文案与 i18n 存量止血）
- **前置依赖**: 无——核查工作可独立启动
- **下游影响**: A0-16（编辑器/版本/Slash i18n 核查）依赖本任务产出的清理清单

---

## Non-Goals：不做什么

1. **不修改任何组件代码**——本任务只做核查和清单输出，实际 i18n 改造由 A0-16 等下游任务负责
2. **不新增 i18n key 或修改 locale 文件**——清单中建议的 key 命名仅供下游参考，不在本任务中创建
3. **不审计后端代码（main/src/）的硬编码字符串**——后端文案不直接面向用户 UI，不在本核查范围
4. **不制定 i18n CI lint 规则**——自动化防护属于 Phase 1+ 的治理基础设施工作
5. **不重构现有 i18n key 命名空间**——命名规范统一属于后续架构任务

---

## 依赖与影响

- **上游依赖**: 无——核查工作可独立启动
- **被依赖于**: A0-16（编辑器/版本/Slash i18n 核查）——A0-16 的修复范围直接取自本任务产出的清理清单
- **协调关系**: A0-22（i18n 错误文案修正）——A0-22 聚焦于 locale 文件中已有 key 的技术码清理，与本任务的裸字符串核查互补不交叉
