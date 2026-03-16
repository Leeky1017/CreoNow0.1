# A0-16 编辑器/版本/Slash i18n 核查

- **GitHub Issue**: #991
- **所属任务簇**: P0-5（文案与 i18n 存量止血）
- **涉及模块**: editor, version-control
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户在编辑器核心路径上反复遭遇裸字符串——输入 `/` 弹出的 slash 菜单中 `/续写`、`/描写` 的 label 和 description 全部硬编码中文，切到英文 locale 后"一字不改"；编辑器弹框 `"This document is final. Editing will switch it back to draft. Continue?"` 在中文环境下突现英文；版本历史面板中 `"Just now"` / `"Yesterday"` / `"Restore"` 等时间分组与操作按钮名满屏英文——"锦衣夜行，花在暗处"，功能做得再好，文案不跟人走，用户感受的就是半成品。

### 2. 根因

A0-09 核查清单中编辑器、版本历史、slash menu 三大模块的裸字符串集中度最高，且全部位于用户主流程路径上。具体涉及：

**编辑器区域**：

- `EditorPane.tsx:400` — `"Entity suggestions unavailable."` 硬编码英文提示
- `EditorPane.tsx:616` — `"This document is final. Editing will switch it back to draft. Continue?"` confirm 对话框硬编码英文
- `EditorContextMenu.tsx:263` — 右键菜单 `"AI"` 标签未走 i18n
- `slashCommands.ts` — `/续写`、`/描写`、`/对白`、`/角色`、`/大纲`、`/搜索` 的 label 和 description 全部硬编码中文，切换英文后仍显示中文

**版本历史**：

- `VersionHistoryContainer.tsx` — 作者名 `"You"` / `"AI"` / `"Auto"` / `"Unknown"` 未走 i18n
- `VersionHistoryContainer.tsx` — 时间分组标题 `"Just now"` / `"Xm ago"` / `"Today"` / `"Yesterday"` / `"Earlier"` 未走 i18n
- `VersionHistoryContainer.tsx` — `"Loading versions..."` 加载提示未走 i18n
- `VersionHistoryPanel.tsx:372` — hover tooltip `"Restore"` / `"Compare"` / `"Preview"` 未走 i18n
- `useVersionCompare.ts:73,77` — `"No differences found."` / `"Unknown error"` 错误文案未走 i18n

### 3. v0.1 威胁

- **核心路径暴露**：编辑器和版本历史是用户使用频率最高的两个模块，裸字符串对体验的伤害面积最大
- **slash menu 语言锁死**：slash command 的 label 和 description 硬编码中文，英文用户完全无法使用
- **多语言交付阻塞**：编辑器区域和版本历史的 i18n 缺口不补，v0.1 的"中英双语"承诺等于空话

### 4. 证据来源

| 文档                                                   | 章节              | 内容                                                                  |
| ------------------------------------------------------ | ----------------- | --------------------------------------------------------------------- |
| `docs/audit/amp/07-ui-ux-design-audit.md`              | §三 i18n 遗漏清单 | 编辑器区域、版本历史、slash menu 裸字符串逐条列表（含文件路径和行号） |
| `docs/audit/amp/11-frontend-static-code-audit.md`      | 全文              | 前端代码审计确认 i18n 缺漏                                            |
| `openspec/changes/archive/a0-09-i18n-inventory-audit/` | 清理清单输出      | A0-09 全量核查产出的结构化清单                                        |

---

## What：做什么

1. **编辑器裸字符串 i18n 改造**：将 `EditorPane.tsx`、`EditorContextMenu.tsx`、`slashCommands.ts` 中的裸字符串全部替换为 `t()` 调用
2. **版本历史裸字符串 i18n 改造**：将 `VersionHistoryContainer.tsx`、`VersionHistoryPanel.tsx`、`useVersionCompare.ts` 中的裸字符串全部替换为 `t()` 调用
3. **新增 i18n key**：在 `zh-CN.json` 和 `en.json` 中同步新增全部所需 key，中英文案同步
4. **Slash command 双语化**：slash command 的 label 和 description 改为通过 i18n key 获取，中文和英文 locale 各有对应文案

---

## Scope

- **主规范**: `openspec/specs/editor/spec.md`（主模块）、`openspec/specs/version-control/spec.md`（关联模块）
- **涉及源码**:
  - `renderer/src/features/editor/EditorPane.tsx` — 硬编码提示和 confirm 对话框
  - `renderer/src/features/editor/EditorContextMenu.tsx` — 右键菜单 "AI" 标签
  - `renderer/src/features/editor/slashCommands.ts` — slash command label 和 description
  - `apps/desktop/renderer/src/features/version-history/VersionHistoryContainer.tsx` — 作者名、时间分组、加载提示
  - `renderer/src/features/rightpanel/VersionHistoryPanel.tsx` — hover tooltip
  - `renderer/src/features/version-control/useVersionCompare.ts` — 错误文案
  - `renderer/src/i18n/locales/zh-CN.json` — 新增 i18n key
  - `renderer/src/i18n/locales/en.json` — 新增 i18n key
- **所属任务簇**: P0-5（文案与 i18n 存量止血）
- **前置依赖**: **A0-09**（i18n 存量核查）——A0-09 的清理清单是本任务的修复范围依据
- **下游影响**: 无直接下游依赖

---

## Non-Goals：不做什么

1. **不修复 AI 面板（AiPanel.tsx）的裸字符串**——AI 面板的 i18n 缺口由独立任务负责，不在本任务范围
2. **不修改 slash command 的功能行为**——只改 label 和 description 的 i18n 化，不碰 slash command 的触发逻辑
3. **不重构版本历史的时间格式化逻辑**——仅将硬编码时间分组文案走 i18n，不引入 dayjs / date-fns 等时间库
4. **不新增 CI lint 规则防止新裸字符串引入**——自动化防护属于 Phase 1+ 的治理任务
5. **不修改 locale 文件中已有 key 的值**——只新增 key，不变更现有 key 的文案内容

---

## 依赖与影响

- **上游依赖**: A0-09（i18n 存量核查）——本任务的修复清单直接取自 A0-09 产出
- **被依赖于**: 无
- **协调关系**: A0-22（i18n 错误文案修正）——A0-22 聚焦 locale 文件中已有 key 的技术码清理，与本任务的新增 key 互不交叉
