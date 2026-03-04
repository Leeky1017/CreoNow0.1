import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  evaluateCrossModuleContractGate,
  type CrossModuleContractActual,
  type CrossModuleContractBaseline,
} from "../../../../scripts/cross-module-contract-gate";

const baseline: CrossModuleContractBaseline = {
  version: "2026-02-09",
  expectedChannels: [
    "memory:episode:record",
    "knowledge:query:byIds",
    "skill:execute",
    "ai:chat:send",
  ],
  channelAliases: {
    "knowledge:query:byIds": "knowledge:query:byids",
    "skill:execute": "ai:skill:run",
  },
  approvedMissingChannels: ["ai:chat:send"],
  expectedErrorCodes: ["KG_QUERY_TIMEOUT", "SKILL_TIMEOUT"],
  approvedMissingErrorCodes: ["SKILL_TIMEOUT"],
  desiredEnvelope: "success",
  approvedEnvelopeDrift: {
    actual: "ok",
    reason: "legacy envelope before migration",
  },
};

const actualWithApprovedDrift: CrossModuleContractActual = {
  channels: ["memory:episode:record", "knowledge:query:byids", "ai:skill:run"],
  errorCodes: ["KG_QUERY_TIMEOUT"],
  envelope: "ok",
};

// S1: 已登记漂移可通过 [ADDED]
// should pass when drift is explicitly declared in baseline
{
  const result = evaluateCrossModuleContractGate(
    baseline,
    actualWithApprovedDrift,
  );

  assert.equal(result.ok, true);
}

// S2: 未登记漂移必须失败 [ADDED]
// should fail when expected channel is missing without approved drift
{
  const result = evaluateCrossModuleContractGate(
    {
      ...baseline,
      approvedMissingChannels: [],
    },
    actualWithApprovedDrift,
  );

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected missing channel failure");
  }
  assert.match(result.issues.join("\n"), /ai:chat:send/);
}

// S3: 漂移条目陈旧必须失败 [ADDED]
// should fail when approved drift becomes stale
{
  const result = evaluateCrossModuleContractGate(baseline, {
    ...actualWithApprovedDrift,
    channels: [...actualWithApprovedDrift.channels, "ai:chat:send"],
  });

  assert.equal(result.ok, false);
  if (result.ok) {
    assert.fail("expected stale drift failure");
  }
  assert.match(result.issues.join("\n"), /stale/i);
}

// S4: CI/preflight 接线契约存在 [ADDED]
// should expose script and gate wiring contract for ci/preflight invocation
{
  assert.equal(typeof evaluateCrossModuleContractGate, "function");

  const repoRoot = path.resolve(import.meta.dirname, "../../../..");

  const packageJson = JSON.parse(
    readFileSync(path.join(repoRoot, "package.json"), "utf8"),
  ) as {
    scripts?: Record<string, string>;
  };
  assert.equal(
    packageJson.scripts?.["cross-module:check"],
    "tsx scripts/cross-module-contract-gate.ts",
  );

  const ciWorkflow = readFileSync(
    path.join(repoRoot, ".github/workflows/ci.yml"),
    "utf8",
  );
  assert.match(ciWorkflow, /cross-module-check/);
  assert.match(ciWorkflow, /pnpm cross-module:check/);

  const preflight = readFileSync(
    path.join(repoRoot, "scripts/agent_pr_preflight.py"),
    "utf8",
  );
  assert.match(preflight, /Branch naming: task\/<N>-<slug>/);
  assert.match(preflight, /Issue state: must be OPEN/);
  assert.match(preflight, /PR body: must contain Closes #<N>/);
  assert.doesNotMatch(preflight, /cross-module:check/);
}
