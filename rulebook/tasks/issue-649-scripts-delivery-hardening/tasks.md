# issue-649-scripts-delivery-hardening

更新时间：2026-02-25 10:35

## 1. Governance Scaffold

- [x] 1.1 创建 Issue #649 并确认 OPEN 状态
- [x] 1.2 创建 `task/649-scripts-delivery-hardening` 隔离分支与 worktree
- [x] 1.3 创建 Rulebook task `issue-649-scripts-delivery-hardening` 并通过 validate
- [x] 1.4 创建并维护 RUN_LOG `openspec/_ops/task_runs/ISSUE-649.md`

## 2. TDD Implementation

- [x] 2.1 Red：新增脚本回归测试并验证失败
- [x] 2.2 Green：修复 `team_delivery_status.py` 的 `statusCheckRollup.state` 解析
- [x] 2.3 Green：修复 `scripts/main_audit_resign.sh` 执行位
- [x] 2.4 Refactor：保持改动最小并验证脚本相关单测通过

## 3. Delivery

- [x] 3.1 更新 README / Rulebook / RUN_LOG 证据
- [ ] 3.2 执行 preflight（至少 fast）与文档时间戳校验
- [x] 3.3 创建 PR（`Closes #649`）并开启 auto-merge
- [ ] 3.4 required checks 全绿：`ci`、`openspec-log-guard`、`merge-serial`
- [ ] 3.5 主会话审计签字提交（RUN_LOG only；`Reviewed-HEAD-SHA == HEAD^`）
- [ ] 3.6 合并回 `main` 并清理 worktree
