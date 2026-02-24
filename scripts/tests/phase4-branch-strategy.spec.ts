import assert from "node:assert/strict";

import {
  validateBranchLifecyclePolicy,
  type Phase4BranchStrategyInput,
} from "../phase4-governance";

// PM-P4-S3
// 短命执行分支按策略合并回治理分支
{
  const validPlan: Phase4BranchStrategyInput = {
    governanceBranch: "task/635-issue-606-phase-4-polish-and-delivery",
    now: "2026-02-24T02:30:00.000Z",
    executionBranches: [
      {
        name: "style/workbench-panel-spacing",
        createdAt: "2026-02-22T03:00:00.000Z",
        mergedAt: "2026-02-24T01:00:00.000Z",
        targetBranch: "task/635-issue-606-phase-4-polish-and-delivery",
      },
    ],
  };

  const result = validateBranchLifecyclePolicy(validPlan);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
}

// PM-P4-S4
// experiment 分支未晋升时不得进入主干交付
{
  const invalidPlan: Phase4BranchStrategyInput = {
    governanceBranch: "task/635-issue-606-phase-4-polish-and-delivery",
    now: "2026-02-24T02:30:00.000Z",
    executionBranches: [
      {
        name: "experiment/new-shell-layout",
        createdAt: "2026-02-20T03:00:00.000Z",
        targetBranch: "main",
        promoted: false,
      },
    ],
  };

  const result = validateBranchLifecyclePolicy(invalidPlan);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some(
      (error) => error.code === "BRANCH_EXPERIMENT_PROMOTION_REQUIRED",
    ),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}

// PM-P4-S3
// 执行分支未回合并治理分支时阻断交付
{
  const notMergedBackPlan: Phase4BranchStrategyInput = {
    governanceBranch: "task/635-issue-606-phase-4-polish-and-delivery",
    now: "2026-02-24T02:30:00.000Z",
    executionBranches: [
      {
        name: "feat/project-qa-dashboard",
        createdAt: "2026-02-22T03:00:00.000Z",
        targetBranch: "task/635-issue-606-phase-4-polish-and-delivery",
      },
    ],
  };

  const result = validateBranchLifecyclePolicy(notMergedBackPlan);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.code === "BRANCH_NOT_MERGED_BACK"),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}

// PM-P4-S3 edge case
// createdAt 晚于 mergedAt/now 时必须阻断
{
  const invalidChronologyPlan: Phase4BranchStrategyInput = {
    governanceBranch: "task/635-issue-606-phase-4-polish-and-delivery",
    now: "2026-02-24T02:30:00.000Z",
    executionBranches: [
      {
        name: "fix/sidebar-density",
        createdAt: "2026-02-24T02:00:00.000Z",
        mergedAt: "2026-02-24T01:30:00.000Z",
        targetBranch: "task/635-issue-606-phase-4-polish-and-delivery",
      },
    ],
  };

  const result = validateBranchLifecyclePolicy(invalidChronologyPlan);
  assert.equal(result.ok, false, JSON.stringify(result.errors, null, 2));
  assert.equal(
    result.errors.some((error) => error.code === "BRANCH_CHRONOLOGY_INVALID"),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}
