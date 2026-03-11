# Tasks: G0.5-01 测试结构规范自动化拦截（GAP-8）

- **GitHub Issue**: 待创建
- **分支**: 待创建
- **Delta Spec**: `specs/test-quality/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0.5-GATE: 审计补丁 — 制度门禁补齐

## 问题根因

仓库规范（`01-philosophy-and-anti-patterns.md`）明确要求测试使用 `describe/it` 结构、禁止脚本式 `async function main()`、禁止顶层裸块。但**没有任何 ESLint 规则、Guard 或 CI gate 自动拦截违反这些规则的新 PR**。

这是「规范有要求但完全没有机器守门」的唯一制度漏洞。339 个存量文件违反此规范，且新 PR 可随时写回旧模式并通过全部 19 个 CI job。

> 详见 `docs/references/testing-excellence-roadmap.md` §八 GAP-8。

---

## 验收标准

| ID | 标准 |
|----|------|
| AC-1 | ESLint 规则 `local/require-describe-in-tests` 存在于 `scripts/eslint-rules/` |
| AC-2 | `.eslintrc.cjs` 中该规则设为 `"error"` |
| AC-3 | 新建一个无 `describe()` 的 `.test.ts` 文件 → `pnpm lint` 报错 |
| AC-4 | 新建一个有 `describe()` 的 `.test.ts` 文件 → `pnpm lint` 通过 |
| AC-5 | 存量目录（`main/src`、`tests/unit`、`tests/integration`、`scripts/tests`、`tests/e2e`、`tests/perf`、`renderer/src/**/*.snapshot.test.*`）及其 `*.spec.*` 变体通过 `overrides` 临时设为 `"warn"`，不阻断 CI |
| AC-6 | 该规则有对应的 ESLint rule test（`scripts/eslint-rules/__tests__/require-describe-in-tests.test.cjs`） |
| AC-7 | 同步更新 `01-philosophy-and-anti-patterns.md`、`06-guard-and-lint-policy.md`、`07-test-command-and-ci-map.md` |

---

## Phase 1: Red（测试先行）

### Task 1.1: ESLint 规则测试

**映射验收标准**: AC-3, AC-4, AC-6

- [ ] 测试：无 `describe()` 的 `.test.ts` 文件触发 `missingDescribe` 错误
- [ ] 测试：有 `describe()` 的 `.test.ts` 文件不触发
- [ ] 测试：非测试文件（`.ts` / `.tsx`）不触发
- [ ] 测试：有 `describe()` 但嵌套在条件语句中仍算有效

---

## Phase 2: Green（实现）

### Task 2.1: 实现 ESLint 规则

**映射验收标准**: AC-1, AC-2

- [ ] 在 `scripts/eslint-rules/` 下新增 `require-describe-in-tests.cjs`
- [ ] 在 `scripts/eslint-rules/index.cjs` 中导出
- [ ] 在 `.eslintrc.cjs` 中注册为 `"error"`

### Task 2.2: 存量豁免 overrides

**映射验收标准**: AC-5

- [ ] 在 `.eslintrc.cjs` 的 `overrides` 中对存量目录设为 `"warn"`：
  - `apps/desktop/main/src/**/*.test.*`
  - `apps/desktop/tests/unit/**/*.test.*`
  - `apps/desktop/tests/unit/**/*.spec.*`
  - `apps/desktop/tests/integration/**/*.test.*`
  - `apps/desktop/tests/integration/**/*.spec.*`
  - `apps/desktop/tests/e2e/**/*.spec.*`
  - `apps/desktop/tests/perf/**/*.test.*`
  - `apps/desktop/tests/perf/**/*.spec.*`
  - `apps/desktop/renderer/src/**/*.snapshot.test.*`
  - `scripts/tests/**/*.test.*`

> **发现说明**：初始 spec 仅列出 4 个目录的 `*.test.*` 模式。实施时排查发现 E2E（21 文件）、perf（7 文件）、snapshot（2 文件）以及 unit/integration 的 `*.spec.*` 变体（27 文件）同样缺少 `describe()` 包装。按 P1 原则「开发中发现 spec 遗漏场景，先更新 spec 再实现」同步扩展。

### Task 2.3: 文档同步

**映射验收标准**: AC-7

- [ ] `01-philosophy-and-anti-patterns.md`：注明由 ESLint 自动强制
- [ ] `06-guard-and-lint-policy.md`：新增此规则作为示例
- [ ] `07-test-command-and-ci-map.md`：在 lint job 行中注明

---

## 过渡期策略

每完成一批 T-MIG 存量迁移后，从 `overrides` 中移除该目录，使 `"warn"` 升级为 `"error"`——锁住成果。
