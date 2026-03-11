# Tasks: G0.5-02 后端 Coverage Threshold 门禁（GAP-2）

- **GitHub Issue**: 待创建
- **分支**: 待创建
- **Delta Spec**: `specs/test-quality/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0.5-GATE: 审计补丁 — 制度门禁补齐

## 问题根因

`apps/desktop/vitest.config.ts`（前端）已设置 coverage thresholds（statements: 60%, branches: 58%, functions: 60%, lines: 60%），PR 如果拉低覆盖率会被 CI 阻断。

`apps/desktop/vitest.config.core.ts`（后端）**无 `thresholds` 配置**。CI 中 `coverage-gate` job 只上传 artifact，**不校验阈值**。后端覆盖率降到 0% 也不会阻断 PR。

> 详见 `docs/references/testing-excellence-roadmap.md` §二 GAP-2。

---

## 验收标准

| ID | 标准 |
|----|------|
| AC-1 | `vitest.config.core.ts` 包含 `thresholds` 配置且四项值均 > 0 |
| AC-2 | `pnpm test:coverage:core` 在当前代码下通过 |
| AC-3 | 人为将某项 threshold 设为当前值 + 10 后，`pnpm test:coverage:core` 失败（证明阻断生效） |
| AC-4 | 同步更新 `07-test-command-and-ci-map.md` 中的"尚未设置"说明 |

---

## Phase 1: Red（测试先行）

### Task 1.1: 收集 Baseline

- [ ] 运行 `pnpm test:coverage:core`，记录 statements / branches / functions / lines 四个数字
- [ ] 设定阈值 = 当前值 - 2%（留 headroom）

---

## Phase 2: Green（实现）

### Task 2.1: 修改 vitest 配置

**映射验收标准**: AC-1, AC-2

- [ ] 在 `apps/desktop/vitest.config.core.ts` 的 `coverage` 块中添加 `thresholds`
- [ ] 验证 `pnpm test:coverage:core` 通过

### Task 2.2: 验证阻断能力

**映射验收标准**: AC-3

- [ ] 临时提高 threshold + 10，确认 CI 会失败
- [ ] 恢复正确值

### Task 2.3: 文档同步

**映射验收标准**: AC-4

- [ ] 更新 `07-test-command-and-ci-map.md` 中后端 coverage 状态描述
