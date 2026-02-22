更新时间：2026-02-22 15:08

## 1. Admission & Isolation (Phase 1)

- [x] 1.1 确认 OPEN Issue：#613（`Wave1 implementation: issue-606 phase-1 stop bleeding`）
- [x] 1.2 确认分支/worktree：`task/613-issue-606-phase-1-stop-bleeding`
- [x] 1.3 执行 Rulebook task create/validate 并记录真实输出

## 2. OpenSpec Drift Remediation (Pre-Red)

- [x] 2.1 将 issue-604 依赖引用改为 archive 路径/状态
- [x] 2.2 删除 phase2/3/4 “待分别建档”陈旧描述并改为现存变更引用
- [x] 2.3 刷新 Phase 1 proposal 的 Dependency Sync Check 输入与结论
- [x] 2.4 更新 Phase 1 tasks，仅勾选 admission/spec setup，保持 Red/Green/Refactor 未勾选

## 3. Governance Evidence

- [x] 3.1 创建 `openspec/_ops/task_runs/ISSUE-613.md` 并落盘 admission 命令证据
- [x] 3.2 填充本 Rulebook `proposal.md` 与 `tasks.md`，对齐 Phase 1 pre-Red 范围

## 4. Verification（Red + Green）

- [x] 4.1 `rulebook task validate issue-613-issue-606-phase-1-stop-bleeding`
- [x] 4.2 `git status -sb`
- [x] 4.3 Red：运行 5 个 guard 测试并确认全部失败（`token-color` / `z-index-token` / `shadow-token` / `overlay-layering` / `primitive-replacement`）
- [x] 4.4 Green：运行同一组 5 个 guard 测试并确认全部通过
- [x] 4.5 兼容性回归：`SkillPicker.test.tsx`、`AiPanel.test.tsx`、`AiPanel.db-error.test.tsx` 全部通过（记录 React `act(...)` warning 但不阻断）

## 5. Merge / Closeout / Signing（Pending）

- [ ] 5.1 创建 PR 并开启 auto-merge（PR body 包含 `Closes #613`）
- [ ] 5.2 等待并确认 required checks（`ci` / `openspec-log-guard` / `merge-serial`）全绿后自动合并
- [ ] 5.3 回填并完成 Main Session Audit（签字提交仅变更本任务 RUN_LOG，`Reviewed-HEAD-SHA=HEAD^`）
- [ ] 5.4 合并后同步控制面 `main`、清理 worktree 并归档 Rulebook task
