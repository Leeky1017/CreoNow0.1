# Proposal: issue-649-scripts-delivery-hardening

更新时间：2026-02-25 10:35

## Why

当前仓库 `scripts/` 下存在一组未交付改动，覆盖 PR 自动合并抗抖动、preflight 快检模式、main-session 审计重签辅助脚本与 Team 交付状态聚合脚本。若直接保留为脏改，会导致后续治理链路不可复用、关键脚本运行风险（可执行权限）未受控，且缺少对应回归测试。

## What Changes

- 将现有 `scripts/` 脏改迁移到受治理的 `task/649-scripts-delivery-hardening` 分支交付。
- 补充回归测试：
  - `main_audit_resign.sh` 可执行权限校验
  - `team_delivery_status.py` 对 `statusCheckRollup.state` 兼容解析
- 修复 `team_delivery_status.py` 的状态解析逻辑，避免将成功的 `StatusContext` 误判为 `unknown`。
- 修复 `main_audit_resign.sh` 的执行位，确保被 `agent_pr_automerge_and_sync.sh` 直接调用时不会权限失败。
- 记录并交付本次脚本增强（README / RUN_LOG / PR 门禁）。

## Impact

- Affected specs:
  - `openspec/specs/cross-module-integration-spec.md`（仅作为跨模块契约阅读基线，不改动）
- Affected code:
  - `scripts/agent_pr_automerge_and_sync.sh`
  - `scripts/agent_pr_preflight.py`
  - `scripts/main_audit_resign.sh`
  - `scripts/team_delivery_status.py`
  - `scripts/tests/test_agent_pr_preflight.py`
  - `scripts/tests/test_script_permissions.py`
  - `scripts/tests/test_team_delivery_status.py`
  - `scripts/README.md`
- Breaking change: NO
- User benefit: 脚本交付链路稳定性提升，降低 PR/watch 抖动与 main-audit 重签失败带来的人工介入成本。
