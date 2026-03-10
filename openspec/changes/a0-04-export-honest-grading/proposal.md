# A0-04 真实结构化导出能力

- **GitHub Issue**: #1002
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **涉及模块**: document-management
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

用户点击 PDF 或 DOCX，不是为了把文章压成一条平线，而是为了带着层次、语气与证据离开编辑器。当前实现却仍以 `contentText` 为舟，以纯文本为桨，标题、粗斜体、列表、引用、链接、图片一并沉没。界面若继续以“诚实降级”搪塞，便是把能力缺口写成验收目标，本末倒置。

### 2. 根因

- **导出后端走错数据源**：PDF 直接写 `contentText`，DOCX 以换行拆段，均绕开 TipTap JSON 的结构信息
- **验证口径失真**：现有测试只证明“文件写出来了”，没有证明“语义还活着”
- **Spec 曾被错误收口**：把“纯文本诚实标注”当成 v0.1 目标，等于默认接受 silently downgrade
- **UI 与实现互相掩护**：ExportDialog 只改说法，不改能力，文案成了遮羞布

### 3. 当前 follow-up scope 的含义

Owner 已明确批准 follow-up scope change：v0.1 的 PDF / DOCX 不再接受“仅纯文本导出”的非目标定义。A0-04 必须回到真实能力交付主线，先更新 OpenSpec，再以测试与实现完成收口。

### 4. 证据来源

| 文档 | 章节 | 内容 |
|------|------|------|
| `docs/audit/amp/08-backend-module-health-audit.md` | 导出模块 | PDF 仍用 `contentText`，DOCX 仍按纯文本拆段 |
| `apps/desktop/main/src/services/export/exportService.ts` | `exportPdf` / `exportDocx` | 结构信息未参与导出 |
| `apps/desktop/main/src/services/export/__tests__/export-markdown.test.ts` | 现有测试 | 只验证标题与段落，未覆盖结构语义 |
| `apps/desktop/main/src/services/export/__tests__/export-txt-docx.test.ts` | 现有测试 | 只验证 DOCX 是 zip 容器，不验证内部语义 |

---

## What：做什么

1. **把导出实现改回 TipTap JSON 主线**：Markdown、PDF、DOCX 都以结构化文档模型为输入，而非退回 `contentText`
2. **定义真实支持的最低语义集**：至少保留标题层级、段落与换行、粗体、斜体、下划线、有序列表、无序列表、引用块、链接、行内代码、分隔线、图片
3. **禁止 silently downgrade**：对编辑器允许创建但当前导出管线尚不支持的节点或 mark，只允许两种结果：正确导出，或在导出前显式报错并指出不支持项
4. **补齐可重复验证**：引入固定 fixture 文档，并为 Markdown / PDF / DOCX 分别断言结构语义仍在
5. **同步主 spec**：`openspec/specs/document-management/spec.md` 与 delta spec 一致改为真实结构化导出承诺

---

## Non-Goals：不做什么

1. **不追求像素级复刻编辑器排版**：v0.1 的目标是语义保真，不是版式 1:1 复写
2. **不扩展新格式**：EPUB、HTML、ODT 等不在本次范围
3. **不把未支持内容悄悄剥离**：若暂不支持，必须显式失败，这属于约束而非留白
4. **不把本任务简化为 UI 改词**：文案同步属于收口项，不能替代能力交付

---

## 依赖与影响

- **上游依赖**: 无，A0-04 是真实导出能力主线
- **被依赖于**: A0-19（导出能力 UI 与真实实现一致）、A0-06 / A0-07 / A0-11（事实表与边界文档回写）
- **受影响模块**: `main/src/services/export/*`、`renderer/src/features/export/*`、主 spec 与相关 docs PR
