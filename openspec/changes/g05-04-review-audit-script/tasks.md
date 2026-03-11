# Tasks: G0.5-04 审计一键脚本 `review-audit.sh`（GAP-6）

- **GitHub Issue**: 待创建
- **分支**: 待创建
- **Delta Spec**: N/A（工具脚本）
- **前置依赖**: 无

---

## 所属任务簇

W0.5-GATE: 审计补丁 — 制度门禁补齐

## 问题根因

`AGENTS.md` §6.4 列出审计必跑命令（6 条），但审计 Agent 需手动逐条执行。`07-test-command-and-ci-map.md` 描述了"第二阶段：审计脚本化与 reviewer wrapper"但标注为未落地。

> 详见 `docs/references/testing-excellence-roadmap.md` §六 GAP-6。

---

## 验收标准

| ID | 标准 |
|----|------|
| AC-1 | `scripts/review-audit.sh` 存在、有可执行权限（`chmod +x`） |
| AC-2 | 脚本输出涵盖 `AGENTS.md` §6.4 列出的全部 6 条命令 |
| AC-3 | `.github/agents/creonow-audit.agent.md` 引用 `scripts/review-audit.sh` 作为一键入口 |
| AC-4 | 同步更新 `07-test-command-and-ci-map.md` 的"第二阶段"状态描述 |

---

## Phase 1: Red（测试先行）

### Task 1.1: 确认命令清单

- [ ] 确认 `AGENTS.md` §6.4 的 6 条必跑命令完整列表：
  1. `git diff --numstat`
  2. `git diff --check`
  3. `git diff --ignore-cr-at-eol --name-status`
  4. `bash -n scripts/agent_pr_automerge_and_sync.sh`
  5. `pytest -q scripts/tests`
  6. `test -x scripts/agent_pr_automerge_and_sync.sh && echo EXEC_OK`

---

## Phase 2: Green（实现）

### Task 2.1: 创建审计脚本

**映射验收标准**: AC-1, AC-2

- [ ] 创建 `scripts/review-audit.sh`，覆盖上述全部命令
- [ ] `chmod +x scripts/review-audit.sh`

### Task 2.2: Agent 引用更新

**映射验收标准**: AC-3

- [ ] 在 `creonow-audit.agent.md` 中引用该脚本

### Task 2.3: 文档同步

**映射验收标准**: AC-4

- [ ] 更新 `07-test-command-and-ci-map.md` 第二阶段状态
