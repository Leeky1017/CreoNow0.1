import assert from "node:assert/strict";

import {
  PHASE4_REQUIRED_CI_STAGE_CHECKS,
  PHASE4_REQUIRED_CHECKS,
  validateCiDeliveryGate,
  type Phase4CiGateInput,
} from "../phase4-governance";

// PM-P4-S5
// required checks 全绿并启用 auto-merge
{
  const validGate: Phase4CiGateInput = {
    autoMergeEnabled: true,
    requiredChecks: [
      {
        name: "ci",
        state: "success",
      },
      {
        name: "openspec-log-guard",
        state: "success",
      },
      {
        name: "merge-serial",
        state: "success",
      },
    ],
    qualityGates: {
      hardcodedColor: "pass",
      hardcodedZIndex: "pass",
      transitionAll: "pass",
      viewportOwnership: "pass",
      ipcBypass: "pass",
      i18nLiteral: "pass",
    },
    stageChecks: [
      { name: "lint", state: "success" },
      { name: "typecheck", state: "success" },
      { name: "unit-test", state: "success" },
      { name: "build", state: "success" },
      { name: "e2e-smoke", state: "success" },
    ],
  } as Phase4CiGateInput;

  const result = validateCiDeliveryGate(validGate);
  assert.deepEqual(PHASE4_REQUIRED_CHECKS, [
    "ci",
    "openspec-log-guard",
    "merge-serial",
  ]);
  assert.deepEqual(PHASE4_REQUIRED_CI_STAGE_CHECKS, [
    "lint",
    "typecheck",
    "unit-test",
    "build",
    "e2e-smoke",
  ]);
  assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
}

// PM-P4-S6
// 任一质量门禁失败时阻断交付
{
  const invalidGate: Phase4CiGateInput = {
    autoMergeEnabled: true,
    requiredChecks: [
      {
        name: "ci",
        state: "success",
      },
      {
        name: "openspec-log-guard",
        state: "success",
      },
      {
        name: "merge-serial",
        state: "success",
      },
    ],
    qualityGates: {
      hardcodedColor: "fail",
      hardcodedZIndex: "pass",
      transitionAll: "pass",
      viewportOwnership: "pass",
      ipcBypass: "pass",
      i18nLiteral: "pass",
    },
    stageChecks: [
      { name: "lint", state: "success" },
      { name: "typecheck", state: "success" },
      { name: "unit-test", state: "success" },
      { name: "build", state: "success" },
      { name: "e2e-smoke", state: "success" },
    ],
  } as Phase4CiGateInput;

  const result = validateCiDeliveryGate(invalidGate);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.code === "CI_QUALITY_GATE_FAILED"),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}

// PM-P4-S5
// 缺失或失败的 CI stage 检查必须阻断 auto-merge 交付
{
  const missingStageGate: Phase4CiGateInput = {
    autoMergeEnabled: true,
    requiredChecks: [
      {
        name: "ci",
        state: "success",
      },
      {
        name: "openspec-log-guard",
        state: "success",
      },
      {
        name: "merge-serial",
        state: "success",
      },
    ],
    qualityGates: {
      hardcodedColor: "pass",
      hardcodedZIndex: "pass",
      transitionAll: "pass",
      viewportOwnership: "pass",
      ipcBypass: "pass",
      i18nLiteral: "pass",
    },
    stageChecks: [
      { name: "lint", state: "success" },
      { name: "typecheck", state: "success" },
      { name: "unit-test", state: "success" },
      { name: "build", state: "success" },
      { name: "e2e-smoke", state: "failure" },
    ],
  } as Phase4CiGateInput;

  const result = validateCiDeliveryGate(missingStageGate);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.code === "CI_STAGE_CHECK_NOT_GREEN"),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}
