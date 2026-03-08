# Tasks: G0-02 后端 IPC 与服务健壮性门禁

- **GitHub Issue**: #1031
- **分支**: `task/1031-backend-ipc-service-gates`
- **Delta Spec**: `specs/ipc-service-gates/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0-GATE: 门禁基础设施

## 三层执行模型归属

**Tier 1: CI 自动阻断** —— 本 Change 产出的 Guard gate 纳入 CI，以 baseline ratchet 模式阻断增量违规。覆盖 Pattern #7, #9, #14, #19。

公共约定见 `EXECUTION_ORDER.md` §二·五。

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `ipc-handler-validation-gate.ts` 能检出无 schema 验证的 handler | S-IPC-01, S-IPC-02 |
| AC-2 | IPC 验证 gate 支持 baseline ratchet（≤基线 PASS，>基线 FAIL） | S-IPC-03, S-IPC-04 |
| AC-3 | `service-stub-detector-gate.ts` 能检出 `return []`、TODO、throw not-impl 等桩方法 | S-STUB-01~04 |
| AC-4 | 桩方法 gate 支持 baseline ratchet | S-STUB-05, S-STUB-06 |
| AC-5 | `pnpm gate:ipc-validation` 命令可执行，输出格式统一 | 全局 |
| AC-6 | `pnpm gate:service-stubs` 命令可执行，输出格式统一 | 全局 |
| AC-7 | CI 新增对应 job，纳入 `ci` meta-job | 全局 |
| AC-8 | 初始 baseline 文件已生成并提交 | S-IPC-03, S-STUB-05 |
| AC-9 | `cross-module-contract-gate` 扩展能检出 Skill handler 输出无 schema 校验 | S-SKILL-01 |
| AC-10 | `cross-module-contract-gate` 扩展能检出 API Key 仅非空检查 | S-KEY-01 |

---

## Phase 1: Red（测试先行）

### Task 1.1: IPC Handler 验证 Gate 测试

**映射验收标准**: AC-1, AC-2

- [ ] 测试：构造包含 `schema.parse(args)` 的 handler 代码片段 → gate 判定为已验证
- [ ] 测试：构造直接 destructure 参数无验证的 handler 代码片段 → gate 判定为未验证
- [ ] 测试：构造自定义 `validateArgs()` 函数调用的 handler → gate 判定为已验证
- [ ] 测试：违规数 ≤ 基线 → PASS
- [ ] 测试：违规数 > 基线 → FAIL，输出新增违规列表
- [ ] 测试：gate 输出格式为 `[IPC_VALIDATION_GATE] PASS/FAIL` + 详细列表

**文件**: `scripts/tests/ipc-handler-validation-gate.test.ts`（新建）

### Task 1.2: Service 桩方法检测 Gate 测试

**映射验收标准**: AC-3, AC-4

- [ ] 测试：正常方法（含业务逻辑）→ 不检出
- [ ] 测试：`return []` 方法 → 检出
- [ ] 测试：`return {}` 方法 → 检出
- [ ] 测试：`// TODO: implement` 方法 → 检出
- [ ] 测试：`throw new Error('not implemented')` 方法 → 检出
- [ ] 测试：空方法体 → 检出
- [ ] 测试：private 方法 → 不检出（仅检查 public）
- [ ] 测试：违规数 ≤ 基线 → PASS
- [ ] 测试：违规数 > 基线 → FAIL

**文件**: `scripts/tests/service-stub-detector-gate.test.ts`（新建）

### Task 1.3: cross-module-contract-gate 扩展测试

**映射验收标准**: AC-9, AC-10

- [ ] 测试：Skill handler 函数在调用 LLM 后使用 `outputSchema.parse(result)` → 不检出
- [ ] 测试：Skill handler 直接 `return llmResult` 无 schema 校验 → 检出
- [ ] 测试：API Key 配置校验函数包含长度/前缀检查 → 不检出
- [ ] 测试：API Key 配置仅 `if (!key)` 非空检查 → 检出
- [ ] 测试：扩展维度违规数 ≤ 基线 → PASS
- [ ] 测试：扩展维度违规数 > 基线 → FAIL

**文件**: `scripts/tests/cross-module-contract-gate.test.ts`（已有文件，补充测试）

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `ipc-handler-validation-gate.ts`

**映射验收标准**: AC-1, AC-2, AC-5

- [ ] 创建 `scripts/ipc-handler-validation-gate.ts`
- [ ] 使用 TypeScript AST（ts-morph 或 TypeScript Compiler API）解析 `main/src/ipc/*.ts`
- [ ] 遍历所有 handler 注册调用，提取 handler 函数体
- [ ] 检查函数体是否包含 schema/validate 相关调用
- [ ] 实现 baseline 读写逻辑（`openspec/guards/ipc-validation-baseline.json`）
- [ ] 输出格式对齐现有 gate（`[IPC_VALIDATION_GATE] PASS/FAIL`）

### Task 2.2: 实现 `service-stub-detector-gate.ts`

**映射验收标准**: AC-3, AC-4, AC-6

- [ ] 创建 `scripts/service-stub-detector-gate.ts`
- [ ] 使用 AST 解析 `main/src/services/**/*.ts` 中的 class 声明
- [ ] 遍历 public 方法，检查方法体是否匹配桩模式
- [ ] 实现 baseline 读写逻辑（`openspec/guards/service-stubs-baseline.json`）
- [ ] 输出格式对齐现有 gate

### Task 2.3: 扩展 `cross-module-contract-gate`

**映射验收标准**: AC-9, AC-10

- [ ] 在 `scripts/cross-module-contract-gate.ts` 中新增 `skill-output-validation` 检查维度
- [ ] 扫描 `main/src/ipc/` 和 `main/src/services/` 中的 Skill handler 函数
- [ ] 检查 LLM 返回结果（如 `response`, `result`, `completion`）后是否经过 schema/validate 校验
- [ ] 新增 `api-key-format-validation` 检查维度
- [ ] 扫描 API Key 配置/校验函数，检查是否包含格式检查（长度/前缀/正则）而非仅 `if (!key)`
- [ ] 扩展维度纳入现有 baseline ratchet 机制

### Task 2.4: CI 集成

**映射验收标准**: AC-7

- [ ] `package.json` 新增 `gate:ipc-validation` 和 `gate:service-stubs` 脚本
- [ ] `ci.yml` 新增 `ipc-handler-validation` job（条件 `if code_changed`）
- [ ] `ci.yml` 新增 `service-stub-detection` job（条件 `if code_changed`）
- [ ] `cross-module-contract-gate` 扩展维度纳入现有 CI job（无需新增 job）
- [ ] 三个 gate 均纳入 `ci` meta-job 的 needs 列表

### Task 2.5: 生成初始 Baseline

**映射验收标准**: AC-8

- [ ] 运行 `pnpm gate:ipc-validation --update-baseline` 生成初始 baseline（`openspec/guards/ipc-validation-baseline.json`）
- [ ] 运行 `pnpm gate:service-stubs --update-baseline` 生成初始 baseline（`openspec/guards/service-stubs-baseline.json`）
- [ ] 提交 baseline 文件

---

## Phase 3: Refactor（收口）

### Task 3.1: 文档更新

- [ ] 更新 `scripts/README.md` 记录新 gate
- [ ] 更新 `docs/references/toolchain.md` 记录新 CI job

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
