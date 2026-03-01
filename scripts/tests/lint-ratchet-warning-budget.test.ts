import assert from "node:assert/strict";

import { parseLintWarningSnapshotFromEslintJson } from "../lint-ratchet";

// CMI-S3-LR-S2
// should count warning-level diagnostics only for budget ratchet
{
  const snapshot = parseLintWarningSnapshotFromEslintJson(
    JSON.stringify([
      {
        messages: [
          { ruleId: "complexity", severity: 1 },
          { ruleId: "max-lines-per-function", severity: 1 },
          { ruleId: "no-console", severity: 2 },
          { ruleId: null, severity: 1 },
          { ruleId: "react-hooks/exhaustive-deps", severity: 0 },
        ],
      },
    ]),
  );

  assert.equal(snapshot.totalViolations, 3);
  assert.deepEqual(snapshot.byRule, {
    __unknown_rule__: 1,
    complexity: 1,
    "max-lines-per-function": 1,
  });
}
