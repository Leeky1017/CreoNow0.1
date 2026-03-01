# Proposal: issue-825-enforce-progressive-governance-updates

更新时间：2026-03-01 20:45

## Why

现有流程虽要求 Spec/Rulebook 前置，但缺少“过程记录时序”硬门禁，导致部分任务在末尾集中回填 `rulebook + run_log + audit`。
这会放大遗漏风险，并在合并前集中触发修补式返工。

## What Changes

- 在 `scripts/agent_pr_preflight.py` 增加“过程记录时序校验”：若分支存在早期交付提交，但 Rulebook/RUN_LOG 仅在最后签字阶段出现，直接阻断。
- 在 `docs/delivery-skill.md` 明确“边做边记”硬约束与失败示例。
- 在 `scripts/README.md` 同步新门禁说明与触发条件。

## Impact

- Affected specs:
  - `docs/delivery-skill.md`
- Affected code:
  - `scripts/agent_pr_preflight.py`
  - `scripts/README.md`
- Breaking change: NO
- User benefit: 过程证据前置，减少末尾补录返工与遗漏。
