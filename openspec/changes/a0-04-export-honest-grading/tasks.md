# Tasks: A0-04 真实结构化导出能力

- **GitHub Issue**: #1002
- **分支**: `task/1002-export-honest-grading`
- **Delta Spec**: `specs/document-management/spec.md`

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | Markdown 导出基于固定 fixture 保留标题、粗体、斜体、列表、链接、图片等结构语义 | 用户导出 Markdown 后仍保留结构语义 |
| AC-2 | PDF 导出不再走 `contentText` 纯文本路径，测试可断言结构化样式转换层被调用 | 用户导出 PDF 后不再退化为纯文本管线 |
| AC-3 | DOCX 导出文件内部结构可断言 heading、run formatting、list 或 image relationship 等语义存在 | 用户导出 DOCX 后保留语义节点 |
| AC-4 | 命中暂不支持结构时，导出前显式报错并指出结构类型，不生成残缺文件 | 命中暂不支持的结构时导出前显式报错 |
| AC-5 | `openspec/specs/document-management/spec.md` 已改为真实结构化导出承诺 | Spec 校准 |
| AC-6 | 导出相关测试使用固定 fixture，结果可重复、可断言 | 全部 Scenario |

---

## Phase 1: Red（测试先行）

### Task 1.1: 固定 fixture 与 Markdown 语义测试

**映射验收标准**: AC-1, AC-6

- [ ] 新建固定导出 fixture，覆盖标题、粗体、斜体、列表、链接、图片
- [ ] 测试：Markdown 导出结果保留 heading、emphasis、list、link、image 语义
- [ ] 测试：Markdown 导出明确来自 TipTap JSON 结构，而非 `contentText` 拼接回退

**文件**: `apps/desktop/main/src/services/export/__tests__/`、相关 fixture 文件

### Task 1.2: PDF 结构化管线测试

**映射验收标准**: AC-2, AC-6

- [ ] 测试：PDF 导出对 fixture 中的结构节点生成可断言的样式块或渲染指令
- [ ] 测试：PDF 导出不再直接以 `contentText` 整段写正文
- [ ] 测试：图片节点进入 PDF 结构化转换层

**文件**: `apps/desktop/main/src/services/export/__tests__/`（新增或扩展）

### Task 1.3: DOCX 结构语义测试

**映射验收标准**: AC-3, AC-6

- [ ] 测试：DOCX 包内部存在 heading、run formatting、list 或 image relationship 对应结构
- [ ] 测试：重复导出保持稳定输出路径与稳定结构

**文件**: `apps/desktop/main/src/services/export/__tests__/`（新增或扩展）

### Task 1.4: 显式失败测试

**映射验收标准**: AC-4

- [ ] 测试：fixture 含暂不支持结构时，导出在写文件前失败
- [ ] 测试：错误消息包含不支持的节点或 mark 类型
- [ ] 测试：失败时不留下导出文件

---

## Phase 2: Green（实现）

### Task 2.1: 建立 TipTap JSON 导出中间模型

- [ ] 为导出服务增加结构化解析层，将 TipTap JSON 转为 Markdown / PDF / DOCX 共用的中间表示
- [ ] 覆盖标题、段落、换行、粗体、斜体、下划线、有序/无序列表、引用块、链接、行内代码、分隔线、图片
- [ ] 为不支持结构提供显式失败分支

**文件**: `apps/desktop/main/src/services/export/exportService.ts` 及同目录新增辅助模块

### Task 2.2: 实现 Markdown / PDF / DOCX 真正结构化导出

- [ ] Markdown：补齐缺失结构映射
- [ ] PDF：从结构模型生成样式块与绘制顺序，不再从 `contentText` 直出
- [ ] DOCX：按结构模型生成 heading、runs、lists、links、images，不再按纯文本拆段
- [ ] TXT：继续保留纯文本导出，不受影响

### Task 2.3: 同步主 Spec

- [ ] 修改 `openspec/specs/document-management/spec.md` 中「文档导出」Requirement，使 PDF / DOCX / Markdown 的真实能力与本变更一致

---

## Phase 3: Refactor & 验收

### Task 3.1: 定向集成或 E2E 验收

- [ ] 为真实导出能力补充定向集成测试或 E2E，验证从编辑器到落盘的完整链路
- [ ] 至少覆盖一条包含标题、列表、链接、图片的真实导出路径

### Task 3.2: 验证与文档回写准备

- [ ] 运行导出相关 renderer / core 测试
- [ ] 运行 `pnpm -C apps/desktop storybook:build`
- [ ] 输出供 A0-06 / A0-07 / A0-11 回写使用的真实能力证据

---

## 自查清单

| 条目 | 检查项 | 状态 |
|------|--------|------|
| AC-1 Markdown 结构保真 | fixture 中的 heading/emphasis/list/link/image 仍在 | [ ] |
| AC-2 PDF 非纯文本路径 | 不再直接从 `contentText` 渲染正文 | [ ] |
| AC-3 DOCX 结构可断言 | heading/run/list/image 语义存在 | [ ] |
| AC-4 显式失败 | 不支持结构时失败且不落残缺文件 | [ ] |
| AC-5 Spec 校准 | 主 spec 已改为真实结构化导出承诺 | [ ] |
| AC-6 Fixture 可重复 | 测试夹具稳定、断言明确 | [ ] |

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
