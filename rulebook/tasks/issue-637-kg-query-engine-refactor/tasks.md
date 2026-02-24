# issue-637-kg-query-engine-refactor

更新时间：2026-02-24 11:44

## 1. Governance Baseline

- [x] 1.1 使用 OPEN issue #637 作为当前交付入口
- [x] 1.2 创建隔离 worktree + `task/637-kg-query-engine-refactor`
- [x] 1.3 创建 Rulebook task + validate（本任务）
- [x] 1.4 创建 RUN_LOG `openspec/_ops/task_runs/ISSUE-637.md`
- [x] 1.5 记录依赖同步检查输入与结论（NO_DRIFT）

## 2. Implementation (TDD)

- [x] 2.1 BE-KGQ-S1/S2：subgraph/path 合同测试 Red -> Green
- [x] 2.2 BE-KGQ-S3：validate 迭代化合同测试 Red -> Green
- [x] 2.3 BE-KGQ-S4：entity matcher 多模式匹配合同测试 Red -> Green
- [x] 2.4 Refactor：保持绿灯并清理重复逻辑

## 3. Audit + Delivery

- [ ] 3.1 审计 mate #1：Spec 合规审计
- [ ] 3.2 审计 mate #2：代码质量/回归风险审计
- [ ] 3.3 修复审计发现并复验
- [ ] 3.4 创建 PR（`Closes #637`）并开启 auto-merge
- [ ] 3.5 required checks 全绿，自动合并到 `main`
- [ ] 3.6 控制面 `main` 同步 + worktree 清理
