import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateLintRatchet,
  type LintRatchetBaseline,
  type LintStatsSnapshot,
} from "../lint-ratchet";

const baseline: LintRatchetBaseline = {
  version: "2026-02-15",
  generatedAt: "2026-02-15T00:00:00.000Z",
  source: "eslint@8",
  governance: {
    issue: "#556",
    reason: "baseline fixture",
  },
  snapshot: {
    totalViolations: 3,
    byRule: {
      complexity: 1,
      "max-lines-per-function": 2,
    },
  },
};

// CMI-S3-LR-S2
// should fail ratchet when violations regress and emit rule-level drift details
{
  const current: LintStatsSnapshot = {
    totalViolations: 5,
    byRule: {
      complexity: 2,
      "max-lines-per-function": 2,
      "no-console": 1,
    },
  };

  const result = evaluateLintRatchet(baseline, current);
  assert.equal(result.ok, false);
  assert.equal(result.totalDelta, 2);
  assert.deepEqual(
    result.regressionsByRule.map((item) => item.rule),
    ["complexity", "no-console"],
  );
}

// CMI-S3-LR-S2
// should wire ratchet check into package scripts and ci workflow
{
  const repoRoot = path.resolve(import.meta.dirname, "../..");
  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ) as {
    scripts?: Record<string, string>;
  };
  assert.equal(
    packageJson.scripts?.["lint:warning-budget"],
    "tsx scripts/lint-ratchet.ts",
  );
  assert.equal(
    packageJson.scripts?.["lint:ratchet"],
    "pnpm lint:warning-budget",
  );

  const ciWorkflow = readFileSync(
    path.join(repoRoot, ".github/workflows/ci.yml"),
    "utf8",
  );
  assert.match(ciWorkflow, /Lint warning budget/);
  assert.match(ciWorkflow, /pnpm lint:warning-budget/);
}
