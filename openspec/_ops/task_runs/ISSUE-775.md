# ISSUE-775

- Issue: #775
- Branch: task/775-frontend-overhaul-change-breakdown
- PR: #782

## Plan

- 交付 `docs/frontend-overhaul-plan.md`（2026-02-28 二次审计修正版）并合并到控制面 `main`
- 基于该文档内容拆分可执行的 OpenSpec changes（`openspec/changes/*`），并更新 `openspec/changes/EXECUTION_ORDER.md`
- 为后续逐项 PR 执行提供可追踪的 change 粒度、依赖与验收口径（Spec-first / TDD-first / Evidence-first）

## Runs

### 2026-02-28 环境同步与隔离

- Command: `git stash push -u -m "wip: frontend overhaul plan"`
- Key output: Saved working directory and index state

- Command: `git fetch origin && git pull --ff-only`
- Key output: main fast-forward to `origin/main`

- Command: `gh issue create --title "docs: 前端整改方案落盘 + change 拆分" ...`
- Key output: created issue `#775`

- Command: `git worktree add .worktrees/issue-775-frontend-overhaul-change-breakdown -b task/775-frontend-overhaul-change-breakdown origin/main`
- Key output: worktree prepared on `task/775-frontend-overhaul-change-breakdown`

- Command: `git stash apply stash@{0}`
- Key output: restored `docs/frontend-overhaul-plan.md` edits into worktree

### 2026-02-28 Codex 批量生成 38 个 fe-* change 目录

- Command: Codex agent 基于 `docs/frontend-overhaul-plan.md` 生成 38 个 `openspec/changes/fe-*/` 目录
- Key output: 每个目录含 `proposal.md`（提案）+ `tasks.md`（骨架）+ `specs/`（delta spec 占位）
- Evidence: `openspec/changes/fe-*/proposal.md` × 38

### 2026-02-28 补写 38 个 tasks.md 到可执行粒度

- 方法：逐个读取 proposal.md + 骨架 tasks.md → grep/read 代码找精确触点（行号、计数） → 补写 §1 Specification + §1.5 预期实现触点 + §2 TDD Mapping + §3 Red + §4 Green + §5 Refactor + §6 Evidence
- Key output: 38 个 tasks.md 全部补写完成，每个含：
  - §1.5 精确代码触点（文件路径 + 行号 + 现状描述）
  - §2 Scenario → 测试映射表（测试文件、测试名、断言要点、Mock、运行命令）
  - §3 Red 阶段每个测试的期望红灯原因
  - §4 Green 阶段最小实现步骤与对应 Scenario 转绿映射
  - §5 Refactor 保持绿灯的重构项
  - §6 Evidence 记录清单
- Evidence: `openspec/changes/fe-*/tasks.md` × 38

### 2026-02-28 重写 EXECUTION_ORDER.md

- Command: 基于 `docs/frontend-overhaul-plan.md` §七批次定义 + 38 个 change 的依赖关系重写
- Key output: 5 批次（第零批 Hotfix → 第一批核心体验 → 第二批功能补全 → 第三批设计系统 → 第四批独立 Issue），含依赖拓扑图 + Owner 决策阻塞项（D1/D2/D3）
- Evidence: `openspec/changes/EXECUTION_ORDER.md`

### Reviewed-HEAD-SHA

`be901d0ac9d3c0c39884d9f99c1dede15a0afbdf`

