import assert from "node:assert/strict";

import { evaluateVisualRegressionDiff } from "../../../main/src/services/workbench/phase4-delivery-gate";

// WB-P4-S4: 视觉差异超阈值触发回归阻断 [ADDED]
{
  const gate = evaluateVisualRegressionDiff({
    threshold: 0.03,
    results: [
      { viewId: "dashboard.default.light", diffRatio: 0.012 },
      { viewId: "command-palette.default.dark", diffRatio: 0.048 },
    ],
  });

  assert.equal(gate.ok, false);
  assert.equal(gate.blockedBy.length, 1);
  assert.equal(gate.blockedBy[0]?.viewId, "command-palette.default.dark");
}

// WB-P4-S4: invalid diff ratio must block regression gate
{
  const gate = evaluateVisualRegressionDiff({
    threshold: 0.03,
    results: [{ viewId: "kg-panel.default.light", diffRatio: -0.2 }],
  });

  assert.equal(gate.ok, false);
  assert.equal(gate.blockedBy[0]?.viewId, "kg-panel.default.light");
}
