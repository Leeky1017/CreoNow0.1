# Tasks: G0-03 前端架构守护门禁

- **GitHub Issue**: #1032
- **分支**: `task/1032-frontend-architecture-gates`
- **Delta Spec**: `specs/frontend-architecture/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0-GATE: 门禁基础设施

## 三层执行模型归属

**Tier 1: CI 自动阻断** —— 本 Change 产出的 ESLint 规则 + Guard gate 纳入 CI，以 baseline ratchet 模式阻断增量违规。覆盖 Pattern #8, #11, #20, #26, #28。

公共约定见 `EXECUTION_ORDER.md` §二·五。

---

## 验收标准

| ID | 标准 | 对应 Scenario |
|----|------|--------------|
| AC-1 | `creonow/no-hardcoded-dimension` 规则检出 h-[600px] 等大像素固定尺寸 | S-DIM-01 |
| AC-2 | 小像素尺寸（≤48px）和 Tailwind 预定义类不误报 | S-DIM-02, S-DIM-03 |
| AC-3 | `error-boundary-coverage-gate.ts` 能检出未被 ErrorBoundary 包裹的路由 | S-EB-01, S-EB-02 |
| AC-4 | ErrorBoundary gate 支持 baseline ratchet | S-EB-03 |
| AC-5 | `architecture-health-gate.ts` 检测 Provider 嵌套深度 | S-ARCH-01 |
| AC-6 | `architecture-health-gate.ts` 检测超限文件 | S-ARCH-02 |
| AC-7 | `architecture-health-gate.ts` 检测 ARIA-live 缺失 | S-ARCH-03, S-ARCH-04 |
| AC-8 | 架构健康 gate 支持 baseline ratchet | S-ARCH-05 |
| AC-9 | CI 新增对应 job，纳入 ci meta-job | 全局 |

---

## Phase 1: Red（测试先行）

### Task 1.1: `no-hardcoded-dimension` 规则测试

**映射验收标准**: AC-1, AC-2

- [ ] 测试：`className="h-[600px]"` 触发违规
- [ ] 测试：`className="w-[400px]"` 触发违规
- [ ] 测试：`className="min-h-[800px]"` 触发违规
- [ ] 测试：`className="h-[16px]"` 不触发（≤48px 豁免）
- [ ] 测试：`className="h-full"` 不触发
- [ ] 测试：`className="max-w-prose"` 不触发
- [ ] 测试：`className="h-[50vh]"` 不触发（非 px）

**文件**: `scripts/eslint-rules/__tests__/no-hardcoded-dimension.test.cjs`（新建）

### Task 1.2: ErrorBoundary 覆盖 Gate 测试

**映射验收标准**: AC-3, AC-4

- [ ] 测试：构造含 ErrorBoundary 包裹的路由组件 → gate 判定为覆盖
- [ ] 测试：构造无 ErrorBoundary 的路由组件 → gate 判定为未覆盖
- [ ] 测试：违规数 ≤ 基线 → PASS
- [ ] 测试：违规数 > 基线 → FAIL

**文件**: `scripts/tests/error-boundary-coverage-gate.test.ts`（新建）

### Task 1.3: 架构健康 Gate 测试

**映射验收标准**: AC-5, AC-6, AC-7, AC-8

- [ ] 测试：Provider 嵌套 13 层 + 阈值 10 → 报警
- [ ] 测试：Provider 嵌套 8 层 + 阈值 10 → 不报警
- [ ] 测试：650 行文件 + 阈值 500 → 超限报告
- [ ] 测试：300 行文件 + 阈值 500 → 不报告
- [ ] 测试：有 aria-live 的组件 → 不在缺失列表
- [ ] 测试：无 aria-live 的动态组件 → 在缺失列表
- [ ] 测试：各维度 ≤ 基线 → PASS
- [ ] 测试：任一维度 > 基线 → FAIL

**文件**: `scripts/tests/architecture-health-gate.test.ts`（新建）

---

## Phase 2: Green（实现）

### Task 2.1: 实现 `no-hardcoded-dimension` 规则

- [ ] 创建 `scripts/eslint-rules/no-hardcoded-dimension.cjs`
- [ ] 正则匹配：`(h|w|min-h|min-w|max-h|max-w)-\[(\d+)px\]`，检查数值 > 48
- [ ] Literal + TemplateLiteral visitor
- [ ] 在 `index.cjs` 中注册，`.eslintrc.cjs` 中启用 `warn`

### Task 2.2: 实现 `error-boundary-coverage-gate.ts`

- [ ] 创建 `scripts/error-boundary-coverage-gate.ts`
- [ ] 解析路由配置（查找 `createBrowserRouter` / `<Route>` / routes 数组）
- [ ] 检查每个路由的 element/component 祖先链中是否有 ErrorBoundary
- [ ] 实现 baseline 读写（`openspec/guards/error-boundary-baseline.json`）

### Task 2.3: 实现 `architecture-health-gate.ts`

- [ ] 创建 `scripts/architecture-health-gate.ts`
- [ ] Provider 嵌套检测：解析 `App.tsx` 或入口组件的 JSX 树，计算 Provider 组件嵌套深度，超过阈值（默认 10 层）报警
- [ ] 文件行数检测：遍历 `renderer/src/**/*.{ts,tsx}`（排除 `*.test.*`/`*.stories.*`/`*.spec.*`），报告超过 500 行的文件
- [ ] ARIA-live 检测策略：
  - 定义动态内容组件清单（硬编码初始列表）：`Toast`, `Alert`, `StatusBar`, `Notification`, `ProgressBar`, `SnackBar`
  - 启发式补充：扫描 `renderer/src/components/` 下含 `useState`/`useEffect` + `set*` 动态更新且渲染用户可见文本的组件
  - 对清单内组件检查是否包含 `aria-live` 属性
  - 输出：缺失 ARIA-live 的组件列表与建议值（`polite` / `assertive`）
- [ ] 实现 baseline 读写（`openspec/guards/architecture-health-baseline.json`）

### Task 2.4: CI 集成

- [ ] `package.json` 新增 `gate:error-boundary` 和 `gate:architecture-health` 脚本
- [ ] `ci.yml` 新增 job
- [ ] 纳入 ci meta-job

### Task 2.5: 生成初始 Baseline

- [ ] 运行 gate 生成初始 baseline（`openspec/guards/error-boundary-baseline.json`、`openspec/guards/architecture-health-baseline.json`）
- [ ] 提交 baseline 文件

---

## Phase 3: Refactor（收口）

### Task 3.1: 文档更新

- [ ] 更新 `scripts/README.md`
- [ ] 更新 `docs/references/coding-standards.md`

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
pnpm -C apps/desktop vitest run <test-file-pattern>   # ESLint 规则测试
pnpm lint                                              # 验证新规则生效
pnpm typecheck                                         # 类型检查
```

**五大反模式（Red Line）**：
1. ❌ 字符串匹配源码检测实现 → 用行为断言
2. ❌ 只验证存在性（`toBeTruthy`）→ 验证具体值（`toEqual`）
3. ❌ 过度 mock 导致测的是 mock 本身 → 只 mock 边界依赖
4. ❌ 仅测 happy path → 必须覆盖 edge + error 路径
5. ❌ 无意义测试名称 → 名称必须说明前置条件和预期行为
