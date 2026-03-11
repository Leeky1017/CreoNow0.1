# Tasks: G0.5-03 `format:check` 接入 CI（GAP-3）

- **GitHub Issue**: 待创建
- **分支**: 待创建
- **Delta Spec**: `specs/ci-gates/spec.md`
- **前置依赖**: 无

---

## 所属任务簇

W0.5-GATE: 审计补丁 — 制度门禁补齐

## 问题根因

`pnpm format:check` 命令已存在，但**未作为独立 CI job 或 step 接入** `.github/workflows/ci.yml`。代码格式不一致不会被 CI 自动捕获。

> 详见 `docs/references/testing-excellence-roadmap.md` §三 GAP-3。

---

## 验收标准

| ID | 标准 |
|----|------|
| AC-1 | `pnpm format:check` 作为 CI step 或 job 存在于 `ci.yml` |
| AC-2 | 若为独立 job，`ci` 汇总 gate 的 `needs` 数组包含该 job |
| AC-3 | 故意引入格式问题的 PR 被 CI 拒绝 |
| AC-4 | 同步更新 `07-test-command-and-ci-map.md`，删除"尚未"说明 |

---

## Phase 1: Red（测试先行）

### Task 1.1: 验证当前状态

- [ ] 确认 `pnpm format:check` 命令可本地执行且通过
- [ ] 确认 `ci.yml` 中无此命令

---

## Phase 2: Green（实现）

### Task 2.1: 接入 CI（推荐方案：lint-and-typecheck job 新增 step）

**映射验收标准**: AC-1, AC-2

- [ ] 在 `.github/workflows/ci.yml` 的 `lint-and-typecheck` job 中新增 step：
  ```yaml
  - name: Format check
    run: pnpm format:check
  ```
- [ ] 如果选择独立 job 方案，需同步更新 `ci` meta-job 的 `needs`

### Task 2.2: 文档同步

**映射验收标准**: AC-4

- [ ] 更新 `07-test-command-and-ci-map.md` 格式化检查状态
