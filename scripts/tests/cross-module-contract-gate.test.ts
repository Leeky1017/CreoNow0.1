import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  scanSkillOutputValidation,
  scanApiKeyFormatValidation,
  evaluateCrossModuleContractGate,
  type CrossModuleContractBaseline,
  type CrossModuleContractActual,
} from "../cross-module-contract-gate";

// ── Skill output: handler with outputSchema.parse(result) → not flagged ──
{
  const root = mkdtempSync(path.join(tmpdir(), "skill-output-pass-"));
  const skillDir = path.join(
    root,
    "apps",
    "desktop",
    "main",
    "src",
    "services",
    "skills",
  );
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    path.join(skillDir, "executor.ts"),
    `
async function execute(deps: { runSkill: (args: unknown) => Promise<{ data: { outputText: string } }> }) {
  const run = await deps.runSkill({});
  const validated = outputSchema.parse(run.data.outputText);
  return { ok: true, data: validated };
}
    `,
  );
  const violations = scanSkillOutputValidation(root);
  assert.equal(
    violations.length,
    0,
    "Handler with outputSchema.parse() should not be flagged",
  );
}

// ── Skill output: handler directly returns result without schema → flagged ──
{
  const root = mkdtempSync(path.join(tmpdir(), "skill-output-fail-"));
  const skillDir = path.join(
    root,
    "apps",
    "desktop",
    "main",
    "src",
    "services",
    "skills",
  );
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(
    path.join(skillDir, "executor.ts"),
    `
async function execute(deps: { runSkill: (args: unknown) => Promise<{ data: { outputText: string } }> }) {
  const run = await deps.runSkill({});
  return { ok: true, data: run.data.outputText };
}
    `,
  );
  const violations = scanSkillOutputValidation(root);
  assert.equal(
    violations.length,
    1,
    "Handler without schema validation should be flagged",
  );
  assert.ok(
    violations[0].functionName === "execute",
    "Should report the correct function name",
  );
}

// ── API key: validation with format check (startsWith) → not flagged ──
{
  const root = mkdtempSync(path.join(tmpdir(), "apikey-format-pass-"));
  const aiDir = path.join(
    root,
    "apps",
    "desktop",
    "main",
    "src",
    "services",
    "ai",
  );
  mkdirSync(aiDir, { recursive: true });
  writeFileSync(
    path.join(aiDir, "settings.ts"),
    `
function validateApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed.startsWith("sk-")) return null;
  return trimmed;
}
    `,
  );
  const violations = scanApiKeyFormatValidation(root);
  assert.equal(
    violations.length,
    0,
    "Key validator with format check should not be flagged",
  );
}

// ── API key: only non-empty check (if (!key)) → flagged ──
{
  const root = mkdtempSync(path.join(tmpdir(), "apikey-format-fail-"));
  const aiDir = path.join(
    root,
    "apps",
    "desktop",
    "main",
    "src",
    "services",
    "ai",
  );
  mkdirSync(aiDir, { recursive: true });
  writeFileSync(
    path.join(aiDir, "settings.ts"),
    `
function normalizeApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
    `,
  );
  const violations = scanApiKeyFormatValidation(root);
  assert.equal(
    violations.length,
    1,
    "Key validator with only non-empty check should be flagged",
  );
  assert.ok(
    violations[0].functionName === "normalizeApiKey",
    "Should report the correct function name",
  );
}

// ── Ratchet: skill output violations ≤ approved → PASS ──
{
  const baseline: CrossModuleContractBaseline = {
    version: "test",
    expectedChannels: [],
    expectedErrorCodes: [],
    desiredEnvelope: "ok",
    skillOutputValidation: { approvedUnvalidatedCount: 2 },
    apiKeyFormatValidation: { approvedWeakCount: 1 },
  };
  const actual: CrossModuleContractActual = {
    channels: [],
    errorCodes: [],
    envelope: "ok",
    skillOutputViolations: [
      {
        file: "test.ts",
        line: 1,
        functionName: "fn",
        description: "test",
      },
    ],
    apiKeyFormatViolations: [
      {
        file: "test.ts",
        line: 1,
        functionName: "fn",
        description: "test",
      },
    ],
  };
  const result = evaluateCrossModuleContractGate(baseline, actual);
  assert.ok(result.ok, "Violations ≤ approved threshold should PASS");
}

// ── Ratchet: skill output violations > approved → FAIL ──
{
  const baseline: CrossModuleContractBaseline = {
    version: "test",
    expectedChannels: [],
    expectedErrorCodes: [],
    desiredEnvelope: "ok",
    skillOutputValidation: { approvedUnvalidatedCount: 0 },
    apiKeyFormatValidation: { approvedWeakCount: 0 },
  };
  const actual: CrossModuleContractActual = {
    channels: [],
    errorCodes: [],
    envelope: "ok",
    skillOutputViolations: [
      {
        file: "test.ts",
        line: 1,
        functionName: "fn",
        description: "test",
      },
    ],
    apiKeyFormatViolations: [
      {
        file: "test.ts",
        line: 1,
        functionName: "fn",
        description: "test",
      },
    ],
  };
  const result = evaluateCrossModuleContractGate(baseline, actual);
  assert.ok(!result.ok, "Violations > approved threshold should FAIL");
  assert.ok(
    result.issues.some((i) => i.includes("skill-output-validation")),
    "Should report skill-output-validation issue",
  );
  assert.ok(
    result.issues.some((i) => i.includes("api-key-format-validation")),
    "Should report api-key-format-validation issue",
  );
}

console.log("✅ cross-module-contract-gate: all tests passed");
