import assert from "node:assert/strict";

import {
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
  };

  const result = validateCiDeliveryGate(validGate);
  assert.deepEqual(PHASE4_REQUIRED_CHECKS, [
    "ci",
    "openspec-log-guard",
    "merge-serial",
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
  };

  const result = validateCiDeliveryGate(invalidGate);
  assert.equal(result.ok, false);
  assert.equal(
    result.errors.some((error) => error.code === "CI_QUALITY_GATE_FAILED"),
    true,
    JSON.stringify(result.errors, null, 2),
  );
}
