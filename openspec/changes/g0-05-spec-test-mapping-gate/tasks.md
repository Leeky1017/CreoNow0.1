# Tasks: G0-05 Spec-Test 映射与测试质量门禁

- **GitHub Issue**: #1024
- **分支**: `task/1024-spec-test-mapping-gate`
- **Delta Spec**: `specs/test-quality/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0-GATE: 门禁基础设施

## 三层执行模型归属

**Tier 2: CI 半自动 + 审计交叉验证** —— gate 检查测试“存在性”（Scenario 有无对应测试），审计 Agent 验证测试“有效性”（测试是否真正覆盖行为）。
同时输出 Tier 2 语义维度汇总（否定测试/能力声称/CJK/拒绝路径），供审计 Agent 作为验证输入。覆盖 Pattern #15~18, #22, #23。

公共约定见 `EXECUTION_ORDER.md` §二·五。

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `spec-test-mapping-gate.ts` 解析 spec.md 提取 Scenario ID 列表 | S-MAP-01~03 |
| AC-2 | gate 在测试文件中搜索 Scenario ID 引用，输出未映射列表 | S-MAP-02, S-MAP-03 |
| AC-3 | gate 同时扫描 `openspec/specs/` 和 `openspec/changes/*/specs/` | S-MAP-03 |
| AC-4 | gate 支持 baseline ratchet | S-MAP-04, S-MAP-05 |
| AC-5 | gate 输出映射覆盖率 | S-MAP-06 |
| AC-6 | `docs/references/testing/README.md` 增加否定测试约定章节 | S-NEG-01 |
| AC-7 | `docs/references/testing/README.md` 增加 guard 测试质量约定章节 | S-GTEST-01 |
| AC-8 | `pnpm gate:spec-test-mapping` 命令可执行 | 全局 |
| AC-9 | CI 新增对应 job | 全局 |
| AC-10 | gate 输出包含 Tier 2 语义维度汇总（否定测试/能力声称/CJK/拒绝路径 分类覆盖率） | S-T2-01~05 |
| AC-11 | Scenario 支持 `@tag` 标签注解以标识语义类型 | S-T2-01~04 |

---

## Phase 1: Red（测试先行）

### Task 1.1: Spec 解析测试

**映射验收标准**: AC-1

- [ ] 测试：构造含 `### Scenario S-TEST-01:` 标题的 spec.md → 提取出 `S-TEST-01`
- [ ] 测试：构造含多个 Scenario 的 spec.md → 全部提取
- [ ] 测试：构造无 Scenario 的 spec.md → 返回空列表
- [ ] 测试：Scenario ID 支持 `S-XXX-NN` 格式

**文件**: `scripts/__tests__/spec-test-mapping-gate.test.ts`（新建）

### Task 1.2: 测试文件映射搜索测试

**映射验收标准**: AC-2

- [ ] 测试：测试文件含 `// Scenario: S-TEST-01` 注释 → 映射成功
- [ ] 测试：测试文件 describe 名含 `S-TEST-01` → 映射成功
- [ ] 测试：测试文件不含任何 Scenario 引用 → 对应 Scenario 未映射
- [ ] 测试：一个测试文件映射多个 Scenario → 全部成功

**文件**: `scripts/__tests__/spec-test-mapping-gate.test.ts`

### Task 1.3: Baseline ratchet 测试

**映射验收标准**: AC-4

- [ ] 测试：未映射数 ≤ 基线 → PASS
- [ ] 测试：未映射数 > 基线 → FAIL，输出新增未映射列表
- [ ] 测试：--update-baseline 模式更新 baseline

**文件**: `scripts/__tests__/spec-test-mapping-gate.test.ts`

### Task 1.4: Tier 2 语义维度测试

**映射验收标准**: AC-10, AC-11

- [ ] 测试：Scenario 标题含 `should NOT render editable` → 自动归类为 negation 维度
- [ ] 测试：Scenario 标签含 `@capability` → 归类为 capability 维度
- [ ] 测试：Scenario 标题含 `CJK` 或 `中文` → 归类为 cjk 维度
- [ ] 测试：Scenario 描述含 `拒绝` 或 `reject` → 归类为 rejection 维度
- [ ] 测试：无标签且无关键词的 Scenario → 归类为 general，不计入 Tier 2 维度统计
- [ ] 测试：输出包含 Tier 2 维度汇总（各类的 mapped/total/百分比）

**文件**: `scripts/__tests__/spec-test-mapping-gate.test.ts`

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `spec-test-mapping-gate.ts`

- [ ] 创建 `scripts/spec-test-mapping-gate.ts`
- [ ] 解析器：读取 `*.spec.md` 文件，正则提取 `### Scenario (S-[A-Z]+-\d+)` 格式的 ID
- [ ] **标签解析**：提取 Scenario 标题/描述中的 `@negation`、`@capability`、`@cjk`、`@rejection` 标签；若无显式标签，根据关键词启发匹配（`should NOT` → negation，`声称支持`/`capability` → capability，`中文`/`CJK` → cjk，`拒绝`/`reject`/`deny` → rejection）
- [ ] 搜索器：在 `**/*.test.{ts,tsx}` 和 `**/*.spec.{ts,tsx}` 中搜索 Scenario ID 引用
- [ ] 匹配器：构建 Scenario → 测试文件 映射表
- [ ] 报告器：输出未映射列表 + 覆盖率
- [ ] **Tier 2 维度报告**：按 negation / capability / cjk / rejection 分类输出各维度的覆盖率，格式 `[SPEC_TEST_MAP] Tier-2 summary: negation: C/T (XX%)`
- [ ] 实现 baseline 读写（`openspec/guards/spec-test-mapping-baseline.json`）

### Task 2.2: 文档更新——否定测试约定

- [ ] 在 `docs/references/testing/README.md` 增加"否定测试（Negative Testing）"章节：
  - 假 UI / 未实现功能必须有 `describe('should NOT ...')` 块
  - 能力声明必须有真实性验证测试
  - 异步操作拒绝路径必须有测试覆盖

### Task 2.3: 文档更新——Guard 测试质量约定

- [ ] 在 `docs/references/testing/README.md` 增加"Guard 测试要求"章节：
  - 每个 gate 测试必须有 PASS + FAIL fixture
  - FAIL fixture 必须验证 gate 能正确检出违规
  - CJK / 多语言场景作为推荐测试维度

### Task 2.4: CI 集成

- [ ] `package.json` 新增 `gate:spec-test-mapping` 脚本
- [ ] `ci.yml` 新增 `spec-test-mapping` job（条件：if docs_only ≠ true）
- [ ] 纳入 ci meta-job

### Task 2.5: 生成初始 Baseline

- [ ] 运行 gate 生成初始 baseline
- [ ] 提交 baseline

---

## Phase 3: Refactor（收口）

- [ ] 更新 `scripts/README.md`
- [ ] 更新 `docs/references/toolchain.md`

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
pnpm -C apps/desktop vitest run <test-file-pattern>   # Guard 测试（必须含 PASS + FAIL fixture）
pnpm typecheck                                         # 类型检查
pnpm lint                                              # ESLint
```

**五大反模式（Red Line）**：
1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为
