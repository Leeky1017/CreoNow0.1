import assert from "node:assert/strict";

import {
  PHASE4_REQUIRED_BASELINE_VIEWS,
  evaluateBaselineCaptureCompleteness,
  type Phase4BaselineCaptureEntry,
  type Phase4Theme,
} from "../../../main/src/services/workbench/phase4-delivery-gate";

const REQUIRED_THEMES: readonly Phase4Theme[] = ["light", "dark"] as const;

function buildCompleteCaptureEntries(): Phase4BaselineCaptureEntry[] {
  const entries: Phase4BaselineCaptureEntry[] = [];

  for (const view of PHASE4_REQUIRED_BASELINE_VIEWS) {
    for (const theme of REQUIRED_THEMES) {
      entries.push({
        screen: view.screen,
        state: view.state,
        theme,
        baselinePath: `baseline/2026-02-24/${view.screen}.${view.state}.${theme}.png`,
        afterPath: `after/2026-02-24/${view.screen}.${view.state}.${theme}.png`,
      });
    }
  }

  return entries;
}

// WB-P4-S3: 必选界面截图基线齐备 [ADDED]
{
  const gate = evaluateBaselineCaptureCompleteness(
    buildCompleteCaptureEntries(),
  );

  assert.equal(gate.ok, true);
  assert.deepEqual(gate.missing, []);
}

// WB-P4-S3: baseline/after paths must include date-layered directory
{
  const entries = buildCompleteCaptureEntries().map((entry) => ({
    ...entry,
    baselinePath: `baseline/${entry.screen}.${entry.state}.${entry.theme}.png`,
  }));

  const gate = evaluateBaselineCaptureCompleteness(entries);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.missing.some((missing) => missing.reason === "invalid-baseline-path"),
    true,
  );
}

// WB-P4-S3: duplicated capture entries should block acceptance
{
  const entries = buildCompleteCaptureEntries();
  entries.push({
    ...entries[0],
  });

  const gate = evaluateBaselineCaptureCompleteness(entries);

  assert.equal(gate.ok, false);
  assert.equal(
    gate.missing.some((missing) => missing.reason === "duplicate-entry"),
    true,
  );
}
