# Tasks: A0-09 i18n 存量 key 核查

- **GitHub Issue**: #990
- **分支**: `task/990-i18n-inventory-audit`
- **Delta Spec**: `specs/workbench/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

P0-5: 文案与 i18n 存量止血

---

## 验收标准

| ID   | 标准                                                                            | 对应 Scenario |
| ---- | ------------------------------------------------------------------------------- | ------------- |
| AC-1 | `07` §三列出的全部裸字符串均出现在清理清单中，覆盖缺失数为 0                    | Scenario 1    |
| AC-2 | 清理清单总条目数 ≥ `07` §三已知条目数                                           | Scenario 2    |
| AC-3 | 每条记录包含六个字段：模块、文件路径、行号、裸字符串内容、建议 i18n key、优先级 | Scenario 2    |
| AC-4 | 清单不包含 CSS class name、调试文案、测试文件字符串等假阳性条目                 | Scenario 3    |
| AC-5 | 清单按模块分组、按文件路径 + 行号升序排列、P0 排在 P1 前                        | Scenario 4    |
| AC-6 | 源码文件和 locale 文件未被修改（只读核查）                                      | 全部 Scenario |

---

## Phase 1: Red（测试先行）

### Task 1.1: 已知裸字符串覆盖测试

**映射验收标准**: AC-1

编写验证扫描覆盖率的测试框架：

- [x] 测试：定义 `07` §三已知裸字符串清单（至少以下条目），每条含文件路径和字符串内容：
  - `EditorPane.tsx` — `"Entity suggestions unavailable."`
  - `EditorPane.tsx` — `"This document is final. Editing will switch it back to draft. Continue?"`
  - `EditorContextMenu.tsx` — `"AI"`
  - `slashCommands.ts` — `/续写`、`/描写`、`/对白`、`/角色`、`/大纲`、`/搜索` labels & descriptions
  - `VersionHistoryContainer.tsx` — `"You"` / `"AI"` / `"Auto"` / `"Unknown"`
  - `VersionHistoryContainer.tsx` — `"Just now"` / `"Today"` / `"Yesterday"` / `"Earlier"`
  - `VersionHistoryContainer.tsx` — `"Loading versions..."`
  - `VersionHistoryPanel.tsx` — `"Restore"` / `"Compare"` / `"Preview"`
  - `useVersionCompare.ts` — `"No differences found."` / `"Unknown error"`
  - `AiPanel.tsx` — `" Then restart the app."` / `"code"` / `title="AI"`
- [x] 测试：断言扫描结果中每条已知裸字符串均可匹配（文件路径包含 + 内容包含）
- [x] 测试：断言未覆盖条目数 === 0

**文件**: `apps/desktop/tests/i18n/i18n-inventory-audit.test.ts`（新建）

### Task 1.2: 扫描输出格式测试

**映射验收标准**: AC-3

- [x] 测试：断言扫描结果中每条记录包含 `module`、`filePath`、`line`、`rawString`、`suggestedKey`、`priority` 六个字段
- [x] 测试：断言 `priority` 值仅为 `"P0"` 或 `"P1"`
- [x] 测试：断言 `module` 值为合法模块名（`editor` / `version-control` / `ai-service` / `workbench` / ...）

**文件**: `apps/desktop/tests/i18n/i18n-inventory-audit.test.ts`

### Task 1.3: 排除规则测试

**映射验收标准**: AC-4

- [x] 测试：准备包含 Tailwind class、console.log 调试文案、测试文件字符串的 mock 输入
- [x] 测试：断言扫描器对 Tailwind class `"flex items-center"` 返回排除结果
- [x] 测试：断言扫描器对 `console.error("debug info")` 内的字符串返回排除结果
- [x] 测试：断言扫描器对 `*.test.tsx` 文件中的字符串返回排除结果

**文件**: `apps/desktop/tests/i18n/i18n-inventory-audit.test.ts`

### Task 1.4: 只读约束测试

**映射验收标准**: AC-6

- [x] 测试：记录扫描前 `renderer/src/` 和 `renderer/src/i18n/locales/` 目录下全部文件的 hash
- [x] 测试：执行扫描
- [x] 测试：断言扫描后所有文件 hash 与扫描前一致（无修改）

**文件**: `apps/desktop/tests/i18n/i18n-inventory-audit.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 实现扫描器核心逻辑

实现 `i18nInventoryScanner` 模块，负责对指定目录执行 i18n 裸字符串扫描：

- [x] 递归遍历 `renderer/src/` 下全部 `.tsx` / `.ts` 文件
- [x] 解析 JSX 文本节点：匹配 `>text<` 中的裸文本（排除 `{expression}` 和 `{t("key")}`）
- [x] 解析字符串属性：匹配 `title="..."`, `placeholder="..."`, `aria-label="..."`, `alt="..."` 等用户可见属性中的裸字符串
- [x] 解析逻辑层文案：匹配函数调用中面向用户的文案常量（error message、tooltip、status text）
- [x] 每条结果输出：`{ module, filePath, line, rawString, suggestedKey, priority }`

**文件**: `apps/desktop/renderer/src/utils/i18n-inventory-scanner.ts`（新建）或作为脚本 `scripts/i18n-inventory-scan.ts`（新建）

### Task 2.2: 实现排除规则

- [x] 排除 CSS class name / Tailwind utility（匹配模式：`className="..."`, `cn(...)` 内的字符串）
- [x] 排除 DOM 事件名和 HTML 标签名
- [x] 排除技术常量（路由路径 `/...`、存储 key `STORAGE_KEY_*`、正则表达式）
- [x] 排除 `console.log` / `console.error` / `console.warn` / `console.info` 中的参数
- [x] 排除测试文件（`*.test.ts` / `*.test.tsx` / `*.spec.ts`）
- [x] 排除已走 `t()` 的调用：`t("...")` 内的 key 字符串不计入裸字符串

**文件**: 同 Task 2.1

### Task 2.3: 实现模块分类与优先级标注

- [x] 根据文件路径自动判断所属模块：
  - `features/editor/` → `editor`
  - `features/rightpanel/` → `ai-service`（AiPanel 相关）/ `version-control`（版本历史相关）
  - `features/version-control/` → `version-control`
  - `features/search/` → `search`
  - `features/settings-dialog/` → `workbench`
  - 其他 → `workbench`
- [x] 根据文件所在功能路径自动标注优先级：
  - 编辑器主路径（`EditorPane`、`EditorContextMenu`）→ P0
  - 版本历史、AI 面板 → P0
  - 设置页、边缘面板 → P1

**文件**: 同 Task 2.1

### Task 2.4: 执行扫描并输出清理清单

- [x] 对 `renderer/src/` 执行完整扫描
- [x] 输出 Markdown 格式清理清单，按模块分组、按文件路径 + 行号升序排列
- [x] P0 条目排在每组前面
- [x] 将清理清单保存为 `openspec/changes/a0-09-i18n-inventory-audit/i18n-inventory-checklist.md`

**文件**: `openspec/changes/a0-09-i18n-inventory-audit/i18n-inventory-checklist.md`（新建）

### Task 2.5: 对照 `07` §三验证覆盖率

- [x] 逐条核对 `07` §三中列出的裸字符串是否全部出现在清理清单中
- [x] 若发现遗漏，检查原因（文件路径变更 / 排除规则误伤 / 已被修复）并补充到清单
- [x] 确认覆盖缺失数 = 0

**文件**: 无新建，验证通过后更新 `i18n-inventory-checklist.md`

---

## Phase 3: Refactor（收尾）

### Task 3.1: 运行全量测试

- [x] 运行 `pnpm -C apps/desktop vitest run`，确认扫描器测试全部通过
- [x] 运行 `pnpm -C apps/desktop tsc --noEmit`，确认无类型错误
- [x] 确认 `renderer/src/` 和 locale 文件均未被修改（只读约束）

### Task 3.2: 清理清单可用性验证

- [x] 确认清理清单 Markdown 格式正确、表格可渲染
- [x] 确认清单中编辑器模块条目 ≥ 6 条（对应 `07` §三编辑器区域已知裸字符串）
- [x] 确认清单中版本历史模块条目 ≥ 8 条（对应 `07` §三版本历史已知裸字符串）
- [x] 确认清单中 AI 面板模块条目 ≥ 3 条（对应 `07` §三 AI 面板已知裸字符串）
- [x] 确认 A0-16 开发 Agent 可直接从清单中领取 editor / version-control 模块的修复任务

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
