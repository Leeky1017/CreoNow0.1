# Tasks: T-MIG 测试结构存量迁移计划

- **GitHub Issue**: 待创建（umbrella）
- **分支**: 各批次分别创建
- **Delta Spec**: N/A（结构迁移，不改行为）
- **前置依赖**: G0.5-01（`require-describe-in-tests` ESLint 规则必须先就位）

> **本 change 登记 7 个迁移批次作为 TODO。不在本 PR 实施迁移，仅规划任务。**

---

## 所属任务簇

T-MIG: 测试结构存量迁移

## 问题根因

仓库中 **286 个测试文件** 使用裸块 `{}` 或 `async function main()` 而非 `describe/it` 结构。这些存量违规需要按优先级分批迁移。

迁移原则：**不改行为，只改结构**——每个裸块/main 包装进 `describe/it`，保留原有断言逻辑。

> 详见 `docs/references/testing-excellence-roadmap.md` §一 GAP-1、§四 GAP-4、§五 GAP-5。

---

## 迁移批次索引

### T-MIG-01: scripts/tests 门禁测试迁移（P0 优先级）

- **范围**: `scripts/tests/*.test.ts` — 13 个文件
- **问题**: 9 个 gate 测试使用 `console.log("✅")` 作为成功信号 + 裸块结构
- **迁移模板**: 裸块 → `describe/it`，删除 `console.log("✅ ...")`
- **优先理由**: 门禁体系的测试自己都不遵守规范，自洽性最重要
- **验收标准**:
  - [ ] 所有 13 个文件包含 `describe()` + `it()`
  - [ ] `grep -r 'console.log.*✅.*passed' scripts/tests/` 返回 0 结果
  - [ ] `pnpm test:unit` 通过

### T-MIG-02: tests/unit 脚本式 main 迁移（P1 优先级）

- **范围**: `apps/desktop/tests/unit/` — 13 个 `async function main()` 文件
- **文件清单**:
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
- **迁移模板**: `async function main()` → `describe/it`，`assert.equal` → `expect().toBe()`
- **优先理由**: 核心业务路径（project/IPC/version）测试可读性
- **验收标准**:
  - [ ] `grep -rl 'async function main' apps/desktop/tests/unit/` 返回 0 结果
  - [ ] `pnpm test:unit` 通过

### T-MIG-03: tests/unit 裸块文件迁移（P2 优先级）

- **范围**: `apps/desktop/tests/unit/` — 21 个裸块 `{}` 文件
- **迁移模板**: 裸块 → `describe/it`
- **优先理由**: 完成 tests/unit 全域收口
- **验收标准**:
  - [ ] tests/unit 中所有 `.test.*` 文件包含 `describe()`
  - [ ] `pnpm test:unit` 通过
  - [ ] G0.5-01 的 ESLint override 可移除 `tests/unit` 路径

### T-MIG-04: main/src 无 describe 文件迁移（P3 优先级）

- **范围**: `apps/desktop/main/src/` — 152 个无 `describe` 的测试文件
- **迁移模板**: 裸块 → `describe/it`
- **优先理由**: 后端最大存量
- **验收标准**:
  - [ ] main/src 中所有 `.test.*` 文件包含 `describe()`
  - [ ] `pnpm test:coverage:core` 通过
  - [ ] G0.5-01 的 ESLint override 可移除 `main/src` 路径

### T-MIG-05: tests/integration 迁移（P4 优先级）

- **范围**: `apps/desktop/tests/integration/` — 87 个无 `describe` 的测试文件
- **迁移模板**: 裸块 → `describe/it`
- **优先理由**: 集成测试收口
- **验收标准**:
  - [ ] tests/integration 中所有 `.test.*` 文件包含 `describe()`
  - [ ] `pnpm test:integration` 通过
  - [ ] G0.5-01 的 ESLint override 可移除 `tests/integration` 路径

### T-MIG-06: 浅断言替换（GAP-4）

- **范围**: 10 个 renderer 测试文件，共 18 处 `toBeTruthy()` / `toBeDefined()`
- **替换规则**:
  - DOM 元素 `toBeTruthy()` → `toBeInTheDocument()`
  - 字符串 `toBeTruthy()` → `toMatch()` 或具体值断言
  - 插件对象 `toBeDefined()` → 关键属性值断言
- **优先理由**: 测试信号质量——验证行为而非存在
- **验收标准**:
  - [ ] `grep -rn 'toBeTruthy()\|toBeDefined()' apps/desktop/renderer/src/ --include="*.test.*"` 返回 0 结果
  - [ ] 替换后所有测试仍通过

### T-MIG-07: getByText 占比降低（GAP-5）

- **范围**: renderer 测试中 625 处 `getByText` → 目标 < 470 处（占比从 33.6% 降到 < 25%）
- **优先替换**:
  1. 用于交互的 `getByText`（如 `user.click(getByText("按钮"))` → `getByRole("button", { name: "..." })`）
  2. 硬编码中文文案的 `getByText` → `getByTestId`
  3. 仅验证存在性的 `getByText` → `getByTestId` + `toHaveTextContent`
- **保留场景**: 验证业务关键输出格式、error message 具体内容
- **验收标准**:
  - [ ] `getByText` 在 renderer 测试中总使用次数 < 470
  - [ ] 所有硬编码中文文案的 `getByText` 已改为语义化查询
  - [ ] 替换后所有测试仍通过

---

## 执行策略

```
G0.5-01 ESLint 规则就位（前置条件）
    │
    ├── T-MIG-01 (P0): scripts/tests 13 个文件 ── ~1 天
    │       └── 完成后移除 ESLint override: scripts/tests
    │
    ├── T-MIG-02 (P1): tests/unit main 式 13 个文件 ── ~2 天
    │
    ├── T-MIG-03 (P2): tests/unit 裸块 21 个文件 ── ~1.5 天
    │       └── 完成后移除 ESLint override: tests/unit
    │
    ├── T-MIG-06 (P2): 浅断言 18 处 ── ~0.5 天
    │
    ├── T-MIG-07 (P3): getByText 降率 160+ 处 ── ~2 天
    │
    ├── T-MIG-04 (P3): main/src 152 个文件 ── ~5 天
    │       └── 完成后移除 ESLint override: main/src
    │
    └── T-MIG-05 (P4): tests/integration 87 个文件 ── ~3 天
            └── 完成后移除 ESLint override: tests/integration
            └── 全域 ESLint override 删除，规则升级为全域 error
```

**总工作量**: ~15 天（可与 A0/A1 功能开发并行推进）
