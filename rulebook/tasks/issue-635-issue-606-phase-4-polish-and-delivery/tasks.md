---
更新时间：2026-02-24 11:28

## 1. Specification

- [x] 1.1 锁定执行上下文：Issue `#635`（OPEN）、分支 `task/635-issue-606-phase-4-polish-and-delivery`、worktree `.worktrees/issue-635-issue-606-phase-4-polish-and-delivery`
- [x] 1.2 阅读并确认 change scope：`openspec/changes/issue-606-phase-4-polish-and-delivery/{proposal.md,specs/*,tasks.md}`
- [x] 1.3 创建 Rulebook task：`issue-635-issue-606-phase-4-polish-and-delivery`
- [x] 1.4 建立 `openspec/_ops/task_runs/ISSUE-635.md` 初始治理骨架（含 Main Session Audit scaffold）

## 2. TDD Mapping（先测前提）

- [x] 2.1 引用并确认 Scenario->测试映射来源：`openspec/changes/issue-606-phase-4-polish-and-delivery/tasks.md`
- [x] 2.2 明确执行门禁：未记录 Red 失败证据前，不得进入 Green
- [x] 2.3 在实施阶段逐条回填 `WB-P4-*` / `PM-P4-*` 的 Red/Green 证据到 ISSUE-635 RUN_LOG

## 3. Red（先写失败测试）

- [x] 3.1 记录视觉审计闭环与截图基线缺失场景的失败证据
- [x] 3.2 记录交付物台账/ADR 缺失场景的失败证据
- [x] 3.3 记录分支策略/CI 门禁/i18n 违规场景的失败证据

## 4. Green（最小实现通过）

- [x] 4.1 回填审计闭环与视觉基线相关场景的通过证据
- [x] 4.2 回填治理策略（ADR/分支/CI/i18n）相关场景的通过证据
- [ ] 4.3 required checks 对齐并通过（`ci` / `openspec-log-guard` / `merge-serial`）

## 5. Refactor（保持绿灯）

- [x] 5.1 回填重构后回归验证证据并确认无行为漂移
- [ ] 5.2 汇总 Main Session Audit 签字输入（由主会话最终签字）

## 6. Evidence

- [x] 6.1 `rulebook task validate issue-635-issue-606-phase-4-polish-and-delivery` 通过并记录输出
- [x] 6.2 完成 dependency sync freshness 检查，结论 `NO_DRIFT`（本次无需更新 phase4 change 文档）
- [x] 6.3 记录 `gh issue view 635` 的 OPEN 证据
- [ ] 6.4 PR 创建后回填 ISSUE-635 RUN_LOG 的真实 PR URL（禁止占位符）
- [ ] 6.5 完成 required checks 全绿 + auto-merge 合并后的 main 收口证据
