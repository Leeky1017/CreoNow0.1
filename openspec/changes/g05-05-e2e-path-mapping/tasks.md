# Tasks: G0.5-05 E2E 关键路径 ↔ 测试映射表（GAP-7）

- **GitHub Issue**: 待创建
- **分支**: 待创建
- **Delta Spec**: `specs/test-quality/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0.5-GATE: 审计补丁 — 制度门禁补齐

## 问题根因

`05-e2e-testing-patterns.md` 列出 7 条关键用户路径。E2E 目录有 25 个 spec 文件。但**路径 ↔ E2E 的映射关系无文档记录**，无法快速判断是否存在覆盖空洞。

审计发现 2 个潜在空洞：
- **编辑与保存**：`editor-autosave.spec.ts` 仅覆盖 autosave，缺少手动编辑 + 手动保存 E2E
- **导出**：`export-markdown.spec.ts` 仅覆盖 markdown，spec 中支持 pdf/docx/txt/markdown 四种格式

> 详见 `docs/references/testing-excellence-roadmap.md` §七 GAP-7。

---

## 验收标准

| ID | 标准 |
|----|------|
| AC-1 | `05-e2e-testing-patterns.md` 中有精确的 7 条路径 ↔ E2E 文件映射表 |
| AC-2 | 映射表中所有 ⚠️ 项有明确的处理结论（补充 E2E / 标注为已由下层测试覆盖 + 理由） |
| AC-3 | 新增或变更的 E2E 文件通过 `pnpm -C apps/desktop test:e2e`（若补充了新 E2E） |

---

## Phase 1: Red（测试先行）

### Task 1.1: 映射分析

- [ ] 逐一对比 7 条关键路径与 25 个 E2E spec 文件
- [ ] 标注覆盖状态：✅ 已覆盖 / ⚠️ 部分覆盖 / ❌ 未覆盖

---

## Phase 2: Green（实现）

### Task 2.1: 编写映射表

**映射验收标准**: AC-1

- [ ] 在 `05-e2e-testing-patterns.md` 末尾新增「关键路径 ↔ E2E 映射表」章节

### Task 2.2: 空洞处理决策

**映射验收标准**: AC-2

- [ ] 对 ⚠️ 项逐一评估：是否补充 E2E，或标注由下层测试覆盖并说明理由
- [ ] 若需补充 E2E，作为子任务单独执行

---

## 7 条关键路径与 E2E 对应参考

| 关键路径 | E2E 文件 | 覆盖判定 |
|----------|----------|----------|
| 应用启动 | `app-launch.spec.ts` | ✅ |
| 项目切换 / 文档打开 | `project-lifecycle.spec.ts`, `documents-filetree.spec.ts`, `dashboard-project-actions.spec.ts` | ✅ |
| 编辑与保存 | `editor-autosave.spec.ts` | ⚠️ 仅 autosave |
| 命令面板 | `command-palette.spec.ts` | ✅ |
| AI 成功 / 失败 / 取消 | `ai-runtime.spec.ts`, `ai-apply.spec.ts` | ✅ |
| 导出 | `export-markdown.spec.ts` | ⚠️ 仅 markdown |
| 设置与关键面板 | `settings-dialog.spec.ts`, `layout-panels.spec.ts` | ✅ |
