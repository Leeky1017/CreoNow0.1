# 测试与门禁体系：从「良好」到「优秀」的精确路径

> 「纸上得来终觉浅，绝知此事要躬行。」
> 本文档基于 2026-03-10 对仓库的全量审计，列出从当前状态达到优秀所需的每一个具体行动。

## 执行顺序原则

> 「磨刀不误砍柴工。」

本文档包含两类 GAP：

- **制度设计类**（GAP-2, GAP-3, GAP-6, GAP-7, GAP-8）：补齐规范与门禁本身的缺口
- **存量迁移类**（GAP-1, GAP-4, GAP-5）：将历史代码按已有规范翻修

**必须先完成全部制度设计类 GAP，再开始存量迁移。** 原因：
1. 制度类总工作量 < 2 天，迁移类 ~15 天。先建好门禁再迁移，避免迁移途中规范变更导致返工。
2. GAP-8（测试结构自动拦截门禁）建好后，迁移过程中每完成一批就能用 gate 锁住，防止新 PR 又写回旧模式。

---

## 零、当前量化快照

| 维度 | 数据 |
|------|------|
| 测试文件总数 | 648（renderer/src: 267, main/src: 157, tests/unit: 94, tests/integration: 87, tests/e2e: 25, tests/lint: 3, scripts/tests: 15） |
| **使用 `describe/it` 结构的测试文件** | renderer/src: 262/267 (98%) ✅ |
| **未使用 `describe/it` 的测试文件** | main/src: 152/157 (97%) ❌, tests/unit: 89/94 (95%) ❌, tests/integration: 87/87 (100%) ❌, scripts/tests: 13/15 (87%) ❌ |
| 脚本式 `async function main()` 测试 | tests/unit: 13 个文件 |
| 裸块 `{}` 式测试 | tests/unit: 21 个文件, scripts/tests: 所有 gate 测试, main/src: ~152 个文件, tests/integration: ~87 个文件 |
| `console.log("✅ ... passed")` 式成功信号 | scripts/tests: 9 个文件 |
| `toBeTruthy()/toBeDefined()` 浅断言 | 18 处（分布在 10 个文件中），vs 具体断言 369 处（比例 4.9%，可接受但应趋零） |
| 语义化查询 (`getByTestId/getByRole/getByLabelText`) | 1237 处 |
| `getByText` 查询 | 625 处（占比 33.6%） |
| Frontend coverage 阈值 | statements: 60%, branches: 58%, functions: 60%, lines: 60% ✅ 已阻断 |
| Backend coverage 阈值 | **未设置** ❌ |
| CI gate 总数 | 19 个 job + 1 个汇总 `ci` gate ✅ |
| E2E spec 文件数 | 25 ✅ |

---

## 一、GAP-1：后端与集成测试的结构性缺陷（最大短板）

### 1.1 问题精确描述

仓库中 **339 个测试文件**（main/src: 152 + tests/unit: 89 + tests/integration: 87 + scripts/tests: 11）使用裸块 `{}` 或 `async function main()` 而非 `describe/it` 结构。这意味着：

- vitest 报告中无法按行为定位失败
- 单个文件失败时，只知道"某个文件挂了"，不知道哪条行为回归
- 不进入标准 vitest 的 `--reporter` 体系，无法生成 JUnit XML / JSON 报告
- 与 `01-philosophy-and-anti-patterns.md` 规范直接矛盾

### 1.2 影响的文件清单

#### 1.2.1 `scripts/tests/`（9 个 gate 测试 + 4 个 lint-ratchet 测试）

| 文件 | 裸块数 | `console.log ✅` |
|------|--------|-------------------|
| `resource-size-gate.test.ts` | 7 | ✅ |
| `architecture-health-gate.test.ts` | 10 | ✅ |
| `bundle-size-budget.test.ts` | 10 | ✅ |
| `service-stub-detector-gate.test.ts` | 9 | ✅ |
| `spec-test-mapping-gate.test.ts` | 17 | ✅ |
| `cross-module-contract-gate.test.ts` | 6 | ✅ |
| `ipc-handler-validation-gate.test.ts` | 6 | ✅ |
| `error-boundary-coverage-gate.test.ts` | 5 | ✅ |
| `ai-rate-limit-coverage-gate.test.ts` | 2 | ✅ |
| `lint-ratchet-regression.test.ts` | 2 | ❌ |
| `lint-ratchet-cross-session-guard.test.ts` | 1 | ❌ |
| `lint-ratchet-warning-budget.test.ts` | 1 | ❌ |
| `lint-ratchet-baseline.test.ts` | 1 | ❌ |

#### 1.2.2 `apps/desktop/tests/unit/`（13 个脚本式 + 21 个裸块式）

**脚本式 `async function main()`**:
- `projectService.create.test.ts`
- `projectService.update.test.ts`
- `projectService.stage.test.ts`
- `projectService.capacity.test.ts`
- `projectService.projectActions.test.ts`
- `projectService.perf-baseline.test.ts`
- `projectLifecycle.persistence-failure.test.ts`
- `projectIpc.validation.test.ts`
- `projectIpc.switch-lifecycle.contract.test.ts`
- `embedding-ipc-runtime-guards.test.ts`
- `rag-ipc-runtime-guards.test.ts`
- `version-branch-merge-conflict.ipc.test.ts`
- `version-diff-rollback.ipc.test.ts`

**裸块式**（共 21 个）:
- `skill-executor.test.ts` (7 bare blocks)
- `skill-scope-management.test.ts` (7)
- `documentService.lifecycle.test.ts` (8)
- `memoryService.test.ts` (8)
- `ai-service-run-options.test.ts` (5)
- `ai-service-model-catalog.test.ts` (4)
- `db-native-doctor.test.ts` (4)
- `skillLoader.test.ts` (4)
- `skillLoader.conversation-skills.test.ts` (3)
- `ai-skill-prompt-ordering.test.ts` (2)
- `ai-store-run-request-options.test.ts` (2)
- `ipc-db-not-ready-diagnostics.test.ts` (2)
- `preferenceLearning.test.ts` (2)
- `renderer-ai-panel-formatting.test.ts` (2)
- `renderer-app-shell-layout-helpers.test.ts` (2)
- `skillLoader.writing-skills.test.ts` (2)
- `skillValidator.test.ts` (2)
- `ai-upstream-error-mapping.test.ts` (1)
- `memoryService.settings.test.ts` (1)
- `s2-test-timing-fix.guard.test.ts` (1)
- `skill-builtin-catalog.test.ts` (1)

#### 1.2.3 `apps/desktop/main/src/`（152/157 个文件无 describe）

#### 1.2.4 `apps/desktop/tests/integration/`（87/87 个文件无 describe）

### 1.3 整改方案

**原则**：不改行为，只改结构。每个裸块/main 包装进 `describe/it`，保留原有断言逻辑。

**模板 A**（裸块 → describe/it，以 `resource-size-gate.test.ts` 为例）：

```ts
// ❌ 当前
{
  const root = mkdtempSync(...);
  // ...setup...
  const violations = scanResourceSizeViolations(root);
  assert.equal(violations.length, 0, "...");
}
console.log("✅ resource-size-gate: all tests passed");

// ✅ 目标
import { describe, it, expect } from "vitest";

describe("resource-size-gate", () => {
  it("should not report writeFile with Buffer.byteLength check", () => {
    const root = mkdtempSync(...);
    // ...setup...
    const violations = scanResourceSizeViolations(root);
    expect(violations).toHaveLength(0);
  });
  // ... 每个裸块对应一个 it()
});
// 删除 console.log("✅ ...")
```

**模板 B**（脚本式 main → describe/it，以 `projectService.create.test.ts` 为例）：

```ts
// ❌ 当前
async function main(): Promise<void> {
  const db = createProjectTestDb();
  const svc = createProjectService({...});
  const created = svc.create({name: "暗流"});
  assert.equal(created.ok, true);
  // ... 更多 assert
}
main().catch((e) => { process.exitCode = 1; console.error(e); });

// ✅ 目标
import { describe, it, expect } from "vitest";

describe("PM1-S1: project creation", () => {
  it("should create project and default chapter when valid manual input", () => {
    const db = createProjectTestDb();
    const svc = createProjectService({...});
    const created = svc.create({name: "暗流"});
    expect(created.ok).toBe(true);
    // ...
  });
});
```

### 1.4 整改规则

1. **it 名称**：从现有注释中的 Scenario ID 或 `assert.equal` 的 message 参数提取，格式 `it("should <行为> when <条件>")`
2. **assert → expect**：`assert.equal(a, b)` → `expect(a).toBe(b)`；`assert.ok(x)` → `expect(x).toBe(true)`；`assert.throws(fn, /pat/)` → `expect(fn).toThrow(/pat/)`；`assert.deepEqual` → `expect(a).toEqual(b)`
3. **不拆文件**：一个测试文件迁移后仍是一个文件，只改结构
4. **不改被测行为**：不修改 setup、fixture、mock 逻辑
5. **删除 console.log 成功信号**：vitest 的 pass/fail 即为信号

### 1.5 优先级排序

| 批次 | 范围 | 文件数 | 优先理由 |
|------|------|--------|----------|
| **P0** | `scripts/tests/*.test.ts` | 13 | 自身是门禁体系的测试，自洽性最重要 |
| **P1** | `apps/desktop/tests/unit/projectService.*.test.ts` + `projectIpc.*.test.ts` + `projectLifecycle.*.test.ts` | 13 | 核心业务路径 |
| **P2** | `apps/desktop/tests/unit/` 剩余裸块文件 | 21 | 完成 tests/unit 全域收口 |
| **P3** | `apps/desktop/main/src/` 无 describe 文件 | 152 | 后端最大存量 |
| **P4** | `apps/desktop/tests/integration/` | 87 | 集成测试收口 |

### 1.6 验收标准

- [ ] 所有迁移后的文件包含至少一个 `describe()` + 至少一个 `it()`
- [ ] `grep -r 'console.log.*✅.*passed' scripts/tests/` 返回 0 结果
- [ ] `grep -rl 'async function main' apps/desktop/tests/unit/` 返回 0 结果
- [ ] 仓库中不再有顶层裸块 `{}` 作为测试组织方式（grep `'^{$'` 在测试文件中为 0）
- [ ] `pnpm test:unit` 和 `pnpm test:integration` 的 vitest 报告中，每条用例有独立名称
- [ ] 所有迁移不改变原有行为断言逻辑——只包装结构
- [ ] 迁移后 CI 全绿

---

## 二、GAP-2：Backend coverage 阈值未设置，门禁不咬人

### 2.1 问题精确描述

`apps/desktop/vitest.config.ts`（renderer）已设置 coverage thresholds：
```
statements: 60%, branches: 58%, functions: 60%, lines: 60%
```

`apps/desktop/vitest.config.core.ts`（backend/main）**无 `thresholds` 配置**。CI 中 `coverage-gate` job 运行 `pnpm test:coverage:core`，但只上传 artifact，**不校验阈值**。覆盖率低于任何数字都不会阻断 PR。

### 2.2 整改步骤

1. **收集 baseline**：运行 `pnpm test:coverage:core`，记录 statements / branches / functions / lines 四个数字
2. **设定阈值**：初始值 = 当前值 - 2%（留 headroom，避免因正常波动导致 CI 误报）
3. **修改配置**：在 `apps/desktop/vitest.config.core.ts` 的 `coverage` 块中添加 `thresholds`

**具体改动位置**（`apps/desktop/vitest.config.core.ts` 第 69-76 行）：

```ts
// ❌ 当前
coverage: {
  provider: "v8",
  reporter: ["text", "html", "lcov"],
  include: ["main/src/**/*.{ts,tsx}"],
  exclude: ["main/src/**/*.test.{ts,tsx}"],
},

// ✅ 目标
coverage: {
  provider: "v8",
  reporter: ["text", "html", "lcov"],
  include: ["main/src/**/*.{ts,tsx}"],
  exclude: ["main/src/**/*.test.{ts,tsx}"],
  thresholds: {
    statements: <baseline_statements - 2>,
    branches: <baseline_branches - 2>,
    functions: <baseline_functions - 2>,
    lines: <baseline_lines - 2>,
  },
},
```

### 2.3 验收标准

- [ ] `vitest.config.core.ts` 包含 `thresholds` 配置且四项值均 > 0
- [ ] `pnpm test:coverage:core` 在当前代码下通过
- [ ] 人为将某项 threshold 设为当前值 + 5 后，`pnpm test:coverage:core` 失败（证明阻断生效）
- [ ] CI `coverage-gate` job 在 coverage 不足时阻断 PR
- [ ] 同步更新 `07-test-command-and-ci-map.md` 第 118-129 行中的"尚未设置"说明

---

## 三、GAP-3：`pnpm format:check` 未接入 CI

### 3.1 问题精确描述

`07-test-command-and-ci-map.md` 第 86-89 行明确记录：
> `pnpm format:check` **尚未**作为独立 CI job 接入 `.github/workflows/ci.yml`。

代码格式不一致不会被 CI 自动捕获。

### 3.2 整改方案

**方案 A（推荐，最小改动）**：在现有 `lint-and-typecheck` job 中新增 step。

位置：`.github/workflows/ci.yml` 第 77-83 行之后新增：

```yaml
      - name: Format check
        run: pnpm format:check
```

**方案 B（可选）**：新增独立 job + 加入 `ci` 汇总 needs。

### 3.3 验收标准

- [ ] `pnpm format:check` 作为 CI step 或 job 存在于 `ci.yml`
- [ ] 若为独立 job，`ci` 汇总 gate 的 `needs` 数组包含该 job
- [ ] 故意引入格式问题（如删除某行末尾分号后不 format）的 PR 被 CI 拒绝
- [ ] 同步更新 `07-test-command-and-ci-map.md` 第 86-89 行，删除"尚未"说明，改为实际状态

---

## 四、GAP-4：`toBeTruthy()/toBeDefined()` 浅断言残留

### 4.1 问题精确描述

10 个 renderer 测试文件中共 18 处使用 `toBeTruthy()` 或 `toBeDefined()`，违反反模式 #2（只验存在，不验结果）。

### 4.2 影响的具体文件与行号

| 文件 | 次数 | 示例行 |
|------|------|--------|
| `features/editor/__tests__/inlineDiff.decoration.test.ts` | 5 | L63 `expect(inlineDiffPlugin).toBeDefined()`, L67-68 `toBeDefined()` |
| `features/editor/extensions/dragHandle.test.ts` | 4 | |
| `features/kg/KnowledgeGraphPanel.interaction.test.tsx` | 2 | |
| `features/kg/KnowledgeGraphPanel.render.test.tsx` | 1 | L98 `expect(characterNode).toBeTruthy()` |
| `features/kg/__tests__/kg-async-validation.test.tsx` | 1 | |
| `features/settings/__tests__/AiSettingsSection.test.tsx` | 1 | |
| `features/outline/deriveOutline.test.ts` | 1 | |
| `features/editor/EditorPane.test.tsx` | 1 | L410 `expect(aiState.selectionRef?.selectionTextHash).toBeTruthy()` |
| `features/dashboard/HeroCard.responsive.guard.test.ts` | 1 | |
| `components/layout/AppShell.ai-toggle.test.tsx` | 1 | |

### 4.3 替换规则

| 当前写法 | 替换为 | 适用场景 |
|----------|--------|----------|
| `expect(x).toBeTruthy()` 其中 x 是 DOM 元素 | `expect(x).toBeInTheDocument()` | RTL 查询结果 |
| `expect(x).toBeTruthy()` 其中 x 是字符串 | `expect(typeof x).toBe("string")` + `expect(x.length).toBeGreaterThan(0)` 或 `expect(x).toMatch(/pattern/)` | 验证非空字符串 |
| `expect(x).toBeDefined()` 其中 x 是插件对象 | `expect(x).not.toBeNull()` + 进一步断言其关键属性值 | ProseMirror plugin |
| `expect(x.find).toBeDefined()` | `expect(typeof x.find).toBe("function")` | 验证方法存在 |
| `expect(x).toBeDefined()` 后紧跟 `x!.someMethod()` | 合并为直接断言 `someMethod()` 的返回值 | 多步断言链 |

### 4.4 验收标准

- [ ] `grep -rn 'toBeTruthy()\|toBeDefined()' apps/desktop/renderer/src/ --include="*.test.*"` 返回 0 结果
- [ ] 替换后所有测试仍通过（`pnpm -C apps/desktop test:run`）
- [ ] 每处替换后的断言验证了具体值/类型/内容，而不仅仅是存在性

---

## 五、GAP-5：`getByText` 查询占比偏高

### 5.1 问题精确描述

前端测试查询统计：
- 语义化查询（`getByTestId` / `getByRole` / `getByLabelText`）：1237 处
- `getByText` 查询：625 处（占总查询 1862 处的 **33.6%**）

`03-frontend-testing-patterns.md` 明确的优先级：`getByRole` > `getByLabelText` > `getByTestId` >> `getByText`。

### 5.2 整改方案

**目标**：将 `getByText` 占比从 33.6% 降到 < 25%（即减少约 160+ 处）。

**优先替换**（高价值 / 高脆弱）：

1. 用于**元素定位后交互**的 `getByText`（如 `await user.click(screen.getByText("某按钮"))`）→ 改为 `getByRole("button", { name: "..." })` 或 `getByTestId`
2. **硬编码中文文案**的 `getByText`（如 `getByText("欢迎使用")`, `getByText("设置")`）→ 改为 `getByTestId`
3. 仅验证**存在性**的 `getByText`（如 `expect(screen.getByText("xxx")).toBeInTheDocument()`）→ 改为 `getByTestId` + `toHaveTextContent`

**保留**（合理使用）：
1. 验证业务关键输出格式（如 `getByText("MARKDOWN • A4")`）
2. 验证 error message 具体内容

### 5.3 验收标准

- [ ] `getByText` 在 renderer 测试中的总使用次数 < 470（当前 625 × 0.75）
- [ ] 所有硬编码中文文案的 `getByText` 已改为语义化查询
- [ ] 替换后所有测试仍通过

---

## 六、GAP-6：审计 reviewer 一键脚本未落地

### 6.1 问题精确描述

`AGENTS.md` §6.4 列出审计必跑命令（5 条）。`07-test-command-and-ci-map.md` 第 153-170 行描述了"第二阶段：审计脚本化与 reviewer wrapper"但标注为未落地。审计 Agent 需手动逐条执行。

### 6.2 整改方案

创建 `scripts/review-audit.sh`，内容覆盖 `AGENTS.md` §6.4 全部命令：

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "═══ CreoNow PR Audit ═══"

echo "── 1/6 diff stats ──"
git diff --numstat
echo ""

echo "── 2/6 CRLF / whitespace check ──"
git diff --check 2>&1 || echo "⚠ whitespace issues detected"
echo ""

echo "── 3/6 file status (ignore CR at EOL) ──"
git diff --ignore-cr-at-eol --name-status
echo ""

echo "── 4/6 delivery script syntax ──"
bash -n scripts/agent_pr_automerge_and_sync.sh && echo "✅ bash syntax OK"
echo ""

echo "── 5/6 Python tests ──"
pytest -q scripts/tests
echo ""

echo "── 6/6 script permissions ──"
test -x scripts/agent_pr_automerge_and_sync.sh && echo "✅ EXEC_OK" || echo "❌ NOT_EXEC"

echo ""
echo "═══ Audit Complete ═══"
```

### 6.3 验收标准

- [ ] `scripts/review-audit.sh` 存在、有可执行权限（`chmod +x`）
- [ ] 脚本输出涵盖 `AGENTS.md` §6.4 列出的全部 5 条命令（git diff --numstat / --check / --ignore-cr-at-eol --name-status / bash -n / pytest -q）
- [ ] `.github/agents/creonow-audit.agent.md` 引用 `scripts/review-audit.sh` 作为一键入口
- [ ] 同步更新 `07-test-command-and-ci-map.md` 第 153-170 行的"第二阶段"状态描述

---

## 七、GAP-7：E2E 与 spec 关键路径对齐不透明

### 7.1 问题精确描述

`05-e2e-testing-patterns.md` 列出 7 条关键用户路径。E2E 目录有 25 个 spec 文件。但 **路径 ↔ E2E 的映射关系无文档记录**，无法快速判断是否存在覆盖空洞。

### 7.2 当前 E2E 文件与关键路径的对应分析

| 关键路径 | E2E 文件 | 覆盖判定 |
|----------|----------|----------|
| 应用启动 | `app-launch.spec.ts` | ✅ 已覆盖 |
| 项目切换 / 文档打开 | `project-lifecycle.spec.ts`, `documents-filetree.spec.ts`, `dashboard-project-actions.spec.ts` | ✅ 已覆盖 |
| 编辑与保存 | `editor-autosave.spec.ts` | ⚠️ 仅 autosave，缺少手动编辑操作 + 手动保存的 E2E |
| 命令面板 | `command-palette.spec.ts` | ✅ 已覆盖 |
| AI 成功 / 失败 / 取消 | `ai-runtime.spec.ts`, `ai-apply.spec.ts` | ✅ 已覆盖 |
| 导出 | `export-markdown.spec.ts` | ⚠️ 仅 markdown，spec 中 ExportDialog 支持 pdf/docx/txt/markdown 四种格式 |
| 设置与关键面板 | `settings-dialog.spec.ts`, `layout-panels.spec.ts` | ✅ 已覆盖 |

**额外 E2E（超出 7 条关键路径，属于增强覆盖）**：
`db-bootstrap.spec.ts`, `judge.spec.ts`, `knowledge-graph.spec.ts`, `skills.spec.ts`, `memory-preference-learning.spec.ts`, `memory-semantic-recall.spec.ts`, `proxy-error-semantics.spec.ts`, `search-rag.spec.ts`, `analytics.spec.ts`, `outline-panel.spec.ts`, `rightpanel-info-quality.spec.ts`, `system-dialog.spec.ts`, `theme.spec.ts`, `version-history.spec.ts`

### 7.3 整改方案

1. 在 `05-e2e-testing-patterns.md` 末尾新增 **「关键路径 ↔ E2E 映射表」** 章节（内容即上表）
2. 对 ⚠️ 标记的路径，评估是否需要补充 E2E：
   - **编辑与保存**：确认 `editor-autosave.spec.ts` 是否包含"用户输入文字 → 内容持久化"的完整链路，若只有 autosave 触发，需补一个手动编辑 + Ctrl+S E2E
   - **导出**：确认是否需要 PDF/DOCX 格式的 E2E，还是 markdown 足以代表导出链路

### 7.4 验收标准

- [ ] `05-e2e-testing-patterns.md` 中有精确的 7 条路径 ↔ E2E 文件映射表
- [ ] 映射表中所有 ⚠️ 项有明确的处理结论（补充 E2E / 标注为已由下层测试覆盖 + 理由）
- [ ] 新增或变更的 E2E 文件通过 `pnpm -C apps/desktop test:e2e`

---

## 八、GAP-8：测试结构规范无自动化拦截（制度设计缺口）

### 8.1 问题精确描述

现有规范（`01-philosophy-and-anti-patterns.md`、`06-guard-and-lint-policy.md`）明确要求测试使用 `describe/it` 结构、禁止脚本式 `async function main()`、禁止顶层裸块。但**没有任何 ESLint 规则、Guard 或 CI gate 自动拦截违反这些规则的新 PR**。

这意味着规范的执行完全依赖 Agent 自觉。一旦 Agent 未读规范或理解有偏差，裸块/脚本式测试可以直接通过全部 19 个 CI job 合入 main。

这是本文档中**唯一一个纯制度设计层面的漏洞**——其他 GAP 要么是配置缺失（GAP-2/3），要么是工具未落地（GAP-6），要么是文档缺口（GAP-7），要么是存量债务（GAP-1/4/5）。只有这一条是"规范有要求但完全没有机器守门"。

### 8.2 整改方案

**方案 A（推荐）：ESLint 自定义规则**

在 `scripts/eslint-rules/` 下新增规则 `require-describe-in-tests`：

```ts
// scripts/eslint-rules/require-describe-in-tests.ts
import type { Rule } from "eslint";

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Test files must use describe() structure, not bare blocks or script-style main()",
    },
    messages: {
      missingDescribe: "Test file must contain at least one describe() call. Bare blocks and async function main() are prohibited. See docs/references/testing/01-philosophy-and-anti-patterns.md.",
    },
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!/\.(test|spec)\.(ts|tsx)$/u.test(filename)) {
      return {};
    }

    let hasDescribe = false;

    return {
      CallExpression(node) {
        if (
          node.callee.type === "Identifier" &&
          node.callee.name === "describe"
        ) {
          hasDescribe = true;
        }
      },
      "Program:exit"(node) {
        if (!hasDescribe) {
          context.report({ node, messageId: "missingDescribe" });
        }
      },
    };
  },
};

export default rule;
```

在 `.eslintrc.cjs` 中注册并启用：

```js
rules: {
  "local/require-describe-in-tests": "error",
}
```

**方案 B（补充）：Guard gate 检测 `console.log ✅` 和 `async function main`**

如果 ESLint 规则的粒度不够（比如想检测 `console.log("✅ ... passed")` 这种特定模式），可以在 `scripts/` 下新增一个轻量 guard：

```ts
// scripts/test-structure-gate.ts
// 扫描所有 .test.ts/.test.tsx 文件，检查：
// 1. 必须包含 describe() 调用
// 2. 不得包含 console.log("✅") 成功信号
// 3. 不得包含顶层 async function main()
```

**方案 A 和 B 不冲突**——A 拦截"无 describe"，B 拦截更细粒度的反模式。但 A 是必须的，B 是增强。

### 8.3 需要同步更新的文档

| 文档 | 更新内容 |
|------|----------|
| `01-philosophy-and-anti-patterns.md` | 在反模式清单末尾新增"这些反模式由 ESLint 规则 `local/require-describe-in-tests` 自动拦截" |
| `06-guard-and-lint-policy.md` | 在"什么时候应该写 ESLint"一节中新增此规则作为示例 |
| `07-test-command-and-ci-map.md` | 在 CI 对应关系表的 `lint-and-typecheck` 行中注明该规则 |
| `AGENTS.md` §P2 | 可选：在 Test-First 小节中注明"由 ESLint 自动强制执行" |

### 8.4 验收标准

- [ ] ESLint 规则 `local/require-describe-in-tests` 存在于 `scripts/eslint-rules/`
- [ ] `.eslintrc.cjs` 中该规则设为 `"error"`
- [ ] 新建一个无 `describe()` 的 `.test.ts` 文件 → `pnpm lint` 报错
- [ ] 新建一个有 `describe()` 的 `.test.ts` 文件 → `pnpm lint` 通过
- [ ] 该规则有对应的 ESLint rule test（`pnpm test:eslint-rules` 通过）
- [ ] 上述 4 个文档已同步更新

### 8.5 过渡期处理

由于当前有 ~339 个存量文件不符合此规则，直接启用 `"error"` 会导致 `pnpm lint` 全面报错。需要**分阶段启用**：

1. **阶段 1**：规则设为 `"error"`，但在 `.eslintrc.cjs` 中对存量目录使用 `overrides` 临时豁免：
   ```js
   overrides: [
     {
       files: [
         "apps/desktop/tests/unit/**/*.test.*",
         "apps/desktop/tests/integration/**/*.test.*",
         "apps/desktop/main/src/**/*.test.*",
         "scripts/tests/**/*.test.*",
       ],
       rules: {
         "local/require-describe-in-tests": "warn", // 存量豁免，迁移后移除
       },
     },
   ],
   ```
2. **阶段 2**：每迁移完一个目录，从 `overrides` 中移除该目录，使其从 `"warn"` 升级为 `"error"`
3. **阶段 3**：所有目录迁移完成，删除 `overrides` 块，全域 `"error"`

这样新 PR 立刻被拦截（新文件不在豁免列表中），存量文件逐步收口。

---

## 九、优先级总排序

### 制度设计类（必须先完成）

| 优先级 | GAP | 范围 | 工作量估算 | 影响 |
|--------|-----|------|-----------|------|
| **S0** | GAP-8 | ESLint 规则 `require-describe-in-tests` + 存量豁免 overrides | 0.5 天 | **唯一的制度漏洞**——补上后新 PR 立刻被机器拦截 |
| **S0** | GAP-2 | `vitest.config.core.ts` 添加 coverage thresholds | 0.5 天 | 后端 coverage 门禁从虚设变为真实阻断 |
| **S0** | GAP-3 | `ci.yml` 接入 `format:check` | 0.5 天 | 格式一致性自动化 |
| **S1** | GAP-6 | 创建 `review-audit.sh` | 0.5 天 | 审计效率 |
| **S1** | GAP-7 | E2E 映射表 + 空洞评估 | 0.5 天 | 覆盖透明度 |

**制度设计类总工作量**：约 2.5 天。

### 存量迁移类（制度设计完成后再开工）

| 优先级 | GAP | 范围 | 工作量估算 | 影响 |
|--------|-----|------|-----------|------|
| **P0** | GAP-1 batch 0 | `scripts/tests/` 13 个文件迁移到 describe/it | 1 天 | 门禁自洽性——门禁的测试自己都不遵守规范 |
| **P1** | GAP-1 batch 1 | `tests/unit/` 13 个脚本式 main 文件迁移 | 2 天 | 核心业务（project/IPC/version）测试可读性 |
| **P2** | GAP-1 batch 2 | `tests/unit/` 21 个裸块文件迁移 | 1.5 天 | tests/unit 全域收口 |
| **P2** | GAP-4 | 10 个文件 18 处浅断言替换 | 0.5 天 | 测试信号质量 |
| **P3** | GAP-5 | `getByText` 占比降低 ~160 处 | 2 天 | i18n 鲁棒性 |
| **P3** | GAP-1 batch 3 | `main/src/` 152 个文件迁移 | 5 天 | 后端全域收口 |
| **P4** | GAP-1 batch 4 | `tests/integration/` 87 个文件迁移 | 3 天 | 集成测试收口 |

**存量迁移类总工作量**：约 15 天。

**每批迁移完成后**，从 GAP-8 的 ESLint `overrides` 中移除该目录，将 `"warn"` 升级为 `"error"`，锁住成果。

---

## 十、完成后的目标状态（优秀的定义）

| 指标 | 当前值 | 目标值 |
|------|--------|--------|
| 测试结构规范自动拦截 | **无机器守门** | **ESLint `require-describe-in-tests` 全域 `"error"`** |
| 使用 `describe/it` 的测试文件占比 | renderer 98%, 其余 < 5% | **全域 100%** |
| `console.log ✅` 成功信号文件数 | 9 | **0** |
| `async function main()` 测试文件数 | 13 | **0** |
| 顶层裸块测试文件数 | ~330 | **0** |
| Backend coverage threshold | 未设置 | **已设置且 CI 阻断** |
| `format:check` CI 覆盖 | 未接入 | **已接入且阻断** |
| `toBeTruthy/toBeDefined` 在 renderer 中 | 18 处 | **0** |
| `getByText` 占总查询比例 | 33.6% | **< 25%** |
| 审计一键脚本 | 不存在 | **存在且可执行** |
| 关键路径 ↔ E2E 映射 | 无文档 | **映射表完整，空洞已处理** |

达成以上全部指标后，CN 的测试与门禁体系可称「优秀」——**设计与执行完全自洽，规范自身的代码也遵守规范，每道门禁都真正咬人，测试信号精准可定位**。
