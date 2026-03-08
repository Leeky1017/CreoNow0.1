# Tasks: G0-04 资源大小与性能预算门禁

- **GitHub Issue**: #1033
- **分支**: `task/1033-resource-size-gates`
- **Delta Spec**: `specs/resource-limits/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0-GATE: 门禁基础设施

## 三层执行模型归属

**Tier 1: CI 自动阻断** —— resource-size gate 与 bundle-budget gate 均已纳入 CI required；其中 bundle-budget 先生成真实桌面构建产物，再对非零 bundle 体积执行 baseline ratchet。覆盖 Pattern #6。

公共约定见 `EXECUTION_ORDER.md` §二·五。

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `resource-size-gate.ts` 能检出无大小校验的文件写入操作 | S-RES-01, S-RES-02 |
| AC-2 | 资源大小 gate 支持 baseline ratchet | S-RES-03, S-RES-04 |
| AC-3 | `bundle-size-budget.ts` 能对比构建产物大小与基线 | S-BUNDLE-01, S-BUNDLE-02 |
| AC-4 | Bundle 大小 gate 支持 --update-baseline | S-BUNDLE-03 |
| AC-5 | `pnpm gate:resource-size` 命令可执行 | 全局 |
| AC-6 | `pnpm gate:bundle-budget` 命令可执行 | 全局 |
| AC-7 | CI 新增对应 job | 全局 |

---

## Phase 1: Red（测试先行）

### Task 1.1: 资源大小 Gate 测试

**映射验收标准**: AC-1, AC-2

- [x] 测试：构造含 `Buffer.byteLength` 检查的写入代码 → 不检出
- [x] 测试：构造直接 `fs.writeFile` 无大小检查的代码 → 检出
- [x] 测试：构造 DB INSERT with content 但无大小检查 → 检出
- [x] 测试：违规数 ≤ 基线 → PASS
- [x] 测试：违规数 > 基线 → FAIL

**文件**: `scripts/tests/resource-size-gate.test.ts`（新建）

### Task 1.2: Bundle 大小 Gate 测试

**映射验收标准**: AC-3, AC-4

- [x] 测试：构造 mock build output 目录，总大小在预算内 → PASS
- [x] 测试：构造 mock build output 目录，总大小超预算 → FAIL
- [x] 测试：--update-baseline 模式更新 baseline 文件
- [x] 测试：输出包含各 chunk 大小变化明细

**文件**: `scripts/tests/bundle-size-budget.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `resource-size-gate.ts`

- [x] 创建 `scripts/resource-size-gate.ts`
- [x] AST 扫描文件写入调用（`fs.writeFile`, `fs.writeFileSync`, `db.run` with INSERT/UPDATE）
- [x] 检查调用前上下文中是否有大小检查逻辑
- [x] 实现 baseline 读写（`openspec/guards/resource-size-baseline.json`）

### Task 2.2: 实现 `bundle-size-budget.ts`

- [x] 创建 `scripts/bundle-size-budget.ts`
- [x] 读取 build output 目录（`apps/desktop/dist/`），统计各 `.js` / `.mjs` / `.cjs` 文件大小
- [x] 对比 baseline，计算差异百分比
- [x] 实现 baseline 读写（`openspec/guards/bundle-size-baseline.json`）

### Task 2.3: CI 集成

- [x] `package.json` 新增命令
- [x] `ci.yml` 新增 job（resource-size 在 code_changed 时运行，bundle-budget 在 PR + desktop_changed 时运行，先生成真实 build 产物再执行 gate）
- [x] 纳入 ci meta-job
- [x] **当前模式说明**：bundle-budget job 已升级为 required gate；CI 需先执行 `pnpm -C apps/desktop build` 生成真实桌面构建产物，再运行 `pnpm gate:bundle-budget`。当构建产物缺失时，gate 必须直接 FAIL，不得回退为 `0B / 0B PASS`。

---

## Phase 3: Refactor（收口）

- [x] 更新 `scripts/README.md`
- [x] 更新 `docs/references/toolchain.md`

---

## TDD 规范引用

> 本 Change 的所有测试必须遵循 `docs/references/testing/` 中的规范。开始写测试前，先阅读以下文档。

**必读文档**：
- 测试哲学与反模式：`docs/references/testing/01-philosophy-and-anti-patterns.md`
- 测试类型决策树：`docs/references/testing/02-test-type-decision-guide.md`
- Guard 与 Lint 策略：`docs/references/testing/06-guard-and-lint-policy.md`
- 命令与 CI 映射：`docs/references/testing/07-test-command-and-ci-map.md`

**本地验证命令**：
```bash
pnpm exec tsx scripts/tests/resource-size-gate.test.ts  # resource-size Guard 测试
pnpm exec tsx scripts/tests/bundle-size-budget.test.ts  # bundle budget Guard 测试
pnpm -C apps/desktop build                              # 生成真实桌面构建产物
pnpm gate:bundle-budget                                 # 非零 bundle 体积比对
pnpm typecheck                                          # 类型检查
pnpm lint                                               # ESLint
```

**五大反模式（Red Line）**：
1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为
