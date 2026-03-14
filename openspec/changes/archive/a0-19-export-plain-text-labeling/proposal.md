# A0-19 导出能力 UI 与真实实现一致

- **GitHub Issue**: #998
- **所属任务簇**: P0-3（能力诚实分级与假功能处置）
- **涉及模块**: document-management
- **前端验收**: 需要

---

## Why：为什么必须做

### 1. 用户现象

当 A0-04 回到真实导出主线后，ExportDialog 若还保留“纯文本导出 · 不含格式”的旧文案，便会把已经修好的能力重新说坏；若仍只写扩展名，又会把能力说空。界面、i18n、交互提示与真实实现必须同口同声，否则用户先被旧话误导，再被新实现辜负，前后都不讨好。

### 2. 根因

- A0-19 原本被错误定义为“纯文本诚实标注”的实施任务
- follow-up scope 已把 A0-04 改写为真实结构化导出能力，A0-19 的职责也随之变化
- 当前 ExportDialog 的格式描述、提示语、成功/失败反馈与 Storybook 仍未围绕真实能力重新校准

### 3. 新职责

A0-19 不再负责为纯文本降级擦脂抹粉，而是负责让导出 UI 与真实实现一致：

- 正确描述 Markdown / PDF / DOCX / TXT 的能力边界
- 对显式失败场景给出用户可理解的提示
- 在 Storybook 与交互测试中证明 UI 不再沿用过期审计口径

---

## What：做什么

1. **重写 ExportDialog 文案**：删除“纯文本导出 · 不含格式”等过期描述，改为与真实结构化导出一致的说明
2. **补齐 UI 失败提示**：当导出前命中不支持结构时，界面要显示明确、可本地化的原因
3. **同步 i18n**：删除或替换过期 plain-text-only 文案，补齐新的结构化导出说明文案
4. **补齐 Storybook 与交互测试**：证明 UI 说明、交互反馈、失败提示与真实实现一致

---

## Scope

- **主规范**: `openspec/specs/document-management/spec.md`
- **涉及源码**:
  - `renderer/src/features/export/ExportDialog.tsx`
  - `renderer/src/features/export/ExportDialog.test.tsx`
  - `renderer/src/i18n/locales/zh-CN.json`
  - `renderer/src/i18n/locales/en.json`
  - `renderer/src/components/providers/*` 或导出相关 toast / error surface（如需）
- **前置依赖**: **A0-04**（真实结构化导出能力）
- **下游影响**: A0-06 / A0-07 / A0-11 文档回写与 PR 描述更新

---

## Non-Goals：不做什么

1. **不重新定义导出后端能力**：真实能力由 A0-04 实现，本任务负责前端一致性收口
2. **不保留“纯文本诚实标注”旧口径**：即便 key 仍存在，也不得继续作为主界面文案
3. **不新增无实现支撑的营销式文案**：所有文案必须能被测试与实现证明

---

## 依赖与影响

- **上游依赖**: A0-04 的结构化导出实现与测试结果
- **被依赖于**: A0-06 / A0-07 / A0-11 的事实表与边界文档
- **协调关系**: A0-13 的 Storybook / warning 清理可能影响前端验证环境
