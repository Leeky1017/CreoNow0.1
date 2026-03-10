# Tasks: A0-19 导出能力 UI 与真实实现一致

- **GitHub Issue**: #998
- **分支**: `task/998-export-plain-text-labeling`
- **Delta Spec**: `specs/document-management/spec.md`
- **前置依赖**: **A0-04**（真实结构化导出能力）

---

## 所属任务簇

P0-3: 能力诚实分级与假功能处置

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | ExportDialog 中 Markdown / PDF / DOCX / TXT 的说明与真实能力一致 | 用户在 ExportDialog 中看到与真实能力一致的格式说明 |
| AC-2 | PDF / DOCX 主文案中不再出现“纯文本导出 · 不含格式”旧口径 | 用户在 ExportDialog 中看到与真实能力一致的格式说明 |
| AC-3 | 命中不支持结构时，UI 显示明确且可本地化的失败原因 | 命中不支持结构时 UI 给出明确原因 |
| AC-4 | Storybook 覆盖正常态与失败态，并可见真实能力说明 | Storybook 中可见真实导出能力说明与失败状态 |
| AC-5 | `zh-CN.json` 与 `en.json` 的导出相关 key 与主界面文案保持一致 | 全部 Scenario |

---

## Phase 1: Red（测试先行）

### Task 1.1: ExportDialog 文案一致性测试

**映射验收标准**: AC-1, AC-2, AC-5

- [ ] 测试：Markdown / PDF / DOCX / TXT 的说明文案与真实能力一致
- [ ] 测试：PDF / DOCX 不再显示“纯文本导出 · 不含格式”
- [ ] 测试：中英文 locale 下文案一致映射

**文件**: `apps/desktop/renderer/src/features/export/ExportDialog.test.tsx`

### Task 1.2: 失败提示测试

**映射验收标准**: AC-3

- [ ] 测试：导出前命中不支持结构时，错误区显示明确原因
- [ ] 测试：错误消息包含不支持的节点或 mark 类型

**文件**: `apps/desktop/renderer/src/features/export/ExportDialog.test.tsx` 及相关错误表面测试

### Task 1.3: Storybook 与交互测试

**映射验收标准**: AC-4

- [ ] 为 ExportDialog 增加正常态与失败态 Story
- [ ] 交互测试覆盖格式切换、提交失败、错误提示展示

---

## Phase 2: Green（实现）

### Task 2.1: 重写 ExportDialog 文案与提示

- [ ] 更新 `getFormatOptions()`，让 PDF / DOCX / Markdown / TXT 的说明文案与真实能力一致
- [ ] 删除或替换过期的 plain-text-only 主文案
- [ ] 保持所有用户可见文案走 i18n

### Task 2.2: 收口导出失败表面

- [ ] 当导出前命中不支持结构时，在 ExportDialog 或关联错误表面显示明确原因
- [ ] 确保错误态对屏幕阅读器可读

### Task 2.3: 同步 i18n

- [ ] 更新 `zh-CN.json` / `en.json` 的导出文案 key
- [ ] 删除或替换过期纯文本兜底文案在主界面的使用点

---

## Phase 3: Refactor & 视觉验收

### Task 3.1: Storybook 验证

- [ ] `pnpm -C apps/desktop storybook:build` 通过
- [ ] Story 中可见真实能力说明与失败提示

### Task 3.2: 与 A0-04 对照复核

- [ ] 对照 A0-04 的实现与 fixture 结果，确认 UI 未夸大也未缩小能力

---

## 自查清单

| 条目 | 检查项 | 状态 |
|------|--------|------|
| AC-1 UI 一致 | 四种格式说明与真实能力一致 | [ ] |
| AC-2 旧口径移除 | PDF / DOCX 不再显示纯文本旧提示 | [ ] |
| AC-3 失败明确 | 不支持结构时给出明确、可本地化原因 | [ ] |
| AC-4 Storybook 覆盖 | 正常态与失败态均有 Story | [ ] |
| AC-5 i18n 收口 | 中英文 key 与主界面文案一致 | [ ] |

---

## TDD 规范引用

> 本 Change 的所有测试必须遵循 `docs/references/testing/` 中的规范。开始写测试前，先阅读以下文档。

**必读文档**：
- 测试哲学与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策树：`docs/references/testing/02-test-type-decision-guide.md`
- 前端测试模式：`docs/references/testing/03-frontend-testing-patterns.md`
- 命令与 CI 映射：`docs/references/testing/07-test-command-and-ci-map.md`

**本地验证命令**：
```bash
pnpm -C apps/desktop vitest run <test-file-pattern>   # 单元/集成测试
pnpm typecheck                                         # 类型检查
pnpm lint                                              # ESLint
pnpm -C apps/desktop storybook:build                   # Storybook 视觉验收
```

**五大反模式（Red Line）**：
1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为
