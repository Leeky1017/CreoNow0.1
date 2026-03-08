import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type ContractEnvelope = "ok" | "success" | "unknown";

export type SourceScanViolation = {
  file: string;
  line: number;
  functionName: string;
  description: string;
};

export type CrossModuleContractBaseline = {
  version: string;
  sourceSpec?: string;
  expectedChannels: string[];
  channelAliases?: Record<string, string>;
  approvedMissingChannels?: string[];
  expectedErrorCodes: string[];
  approvedMissingErrorCodes?: string[];
  desiredEnvelope: Exclude<ContractEnvelope, "unknown">;
  approvedEnvelopeDrift?: {
    actual: Exclude<ContractEnvelope, "unknown">;
    reason: string;
  };
  skillOutputValidation?: {
    approvedUnvalidatedCount: number;
  };
  apiKeyFormatValidation?: {
    approvedWeakCount: number;
  };
};

export type CrossModuleContractActual = {
  channels: string[];
  errorCodes: string[];
  envelope: ContractEnvelope;
  skillOutputViolations?: SourceScanViolation[];
  apiKeyFormatViolations?: SourceScanViolation[];
};

export type CrossModuleContractGateResult = {
  ok: boolean;
  drifts: string[];
  issues: string[];
};

const GENERATED_TYPES_PATH = path.join(
  "packages",
  "shared",
  "types",
  "ipc-generated.ts",
);
const SHARED_AI_TYPES_PATH = path.join("packages", "shared", "types", "ai.ts");
const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "cross-module-contract-baseline.json",
);

const SKILL_SERVICES_DIR = path.join(
  "apps",
  "desktop",
  "main",
  "src",
  "services",
  "skills",
);
const AI_SERVICES_DIR = path.join(
  "apps",
  "desktop",
  "main",
  "src",
  "services",
  "ai",
);

const OUTPUT_VALIDATION_MARKERS = [
  /outputSchema\.parse\s*\(/,
  /schema\.parse\s*\(/,
  /\.safeParse\s*\(/,
  /validate\w*Output\s*\(/i,
  /validateSkillRunOutput\s*\(/,
];

const KEY_FORMAT_MARKERS = [
  /\.startsWith\s*\(/,
  /\.match\s*\(/,
  /\.test\s*\(/,
  /RegExp\s*\(/,
  /\.length\s*>=\s*\d{2,}/,
  /API_KEY_FORMAT/,
  /hasRecognizedApiKeyFormat\s*\(/,
  /normalizeApiKey\s*\(/,
];

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function parseChannels(generatedContent: string): string[] {
  const match = generatedContent.match(
    /export const IPC_CHANNELS = \[([\s\S]*?)\] as const;/m,
  );
  if (!match) {
    throw new Error("failed to parse IPC_CHANNELS from generated types");
  }

  return uniqueSorted(
    [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]),
  );
}

function parseErrorCodes(generatedContent: string): string[] {
  const start = generatedContent.indexOf("export type IpcErrorCode =");
  if (start < 0) {
    throw new Error("failed to locate IpcErrorCode block");
  }
  const tail = generatedContent.slice(start);
  const end = tail.indexOf("export type IpcMeta =");
  if (end < 0) {
    throw new Error("failed to locate end of IpcErrorCode block");
  }
  const block = tail.slice(0, end);

  return uniqueSorted([...block.matchAll(/"([^"]+)"/g)].map((item) => item[1]));
}

function parseEnvelope(generatedContent: string): ContractEnvelope {
  const hasOk =
    /\bok:\s*true;/.test(generatedContent) &&
    /\bok:\s*false;/.test(generatedContent);
  const hasSuccess =
    /\bsuccess:\s*true;/.test(generatedContent) &&
    /\bsuccess:\s*false;/.test(generatedContent);

  if (hasOk && !hasSuccess) {
    return "ok";
  }
  if (hasSuccess && !hasOk) {
    return "success";
  }
  return "unknown";
}

function parseSupplementalPushChannels(repoRoot: string): string[] {
  const absPath = path.resolve(repoRoot, SHARED_AI_TYPES_PATH);
  if (!existsSync(absPath)) {
    return [];
  }
  const source = readFileSync(absPath, "utf8");
  return uniqueSorted(
    [
      ...source.matchAll(/"([a-z][a-z0-9]*:[a-z][a-z0-9]*:[a-z][a-z0-9]*)"/g),
    ].map((item) => item[1]),
  );
}

type FunctionBlock = {
  name: string;
  body: string;
  startLine: number;
};

function extractFunctionBlocks(source: string): FunctionBlock[] {
  const blocks: FunctionBlock[] = [];
  const lines = source.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/function\s+(\w+)\s*\(/);
    if (!match) continue;

    const name = match[1];
    let depth = 0;
    let started = false;
    const bodyLines: string[] = [];

    for (let j = i; j < lines.length; j++) {
      for (const ch of lines[j]) {
        if (ch === "{") {
          depth++;
          started = true;
        }
        if (ch === "}") depth--;
      }
      bodyLines.push(lines[j]);
      if (started && depth === 0) break;
    }

    blocks.push({ name, body: bodyLines.join("\n"), startLine: i + 1 });
  }

  return blocks;
}

export function scanSkillOutputValidation(
  repoRoot: string = process.cwd(),
): SourceScanViolation[] {
  const dir = path.resolve(repoRoot, SKILL_SERVICES_DIR);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));
  const violations: SourceScanViolation[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const source = readFileSync(filePath, "utf-8");
    const functions = extractFunctionBlocks(source);

    for (const fn of functions) {
      const isRunSkillConsumer = /(?:\.|\b)runSkill\s*\(/.test(fn.body);
      const isRuntimeOutputValidator = fn.name === "validateSkillRunOutput";

      if (!isRunSkillConsumer && !isRuntimeOutputValidator) {
        continue;
      }

      const hasValidation = OUTPUT_VALIDATION_MARKERS.some((p) =>
        p.test(fn.body),
      );
      const hasSynopsisOnlyBypass =
        /leafSkillId\(args\.skillId\)\s*!==\s*"synopsis"/.test(fn.body) &&
        /return\s*\{\s*ok:\s*true[^}]*data:\s*true\s*\}/.test(fn.body);

      if (!hasValidation || hasSynopsisOnlyBypass) {
        violations.push({
          file: path.join(SKILL_SERVICES_DIR, file),
          line: fn.startLine,
          functionName: fn.name,
          description: hasSynopsisOnlyBypass
            ? `"${fn.name}" bypasses output validation for some skill paths`
            : `"${fn.name}" consumes runSkill result without output validation`,
        });
      }
    }
  }

  return violations;
}

export function scanApiKeyFormatValidation(
  repoRoot: string = process.cwd(),
): SourceScanViolation[] {
  const dir = path.resolve(repoRoot, AI_SERVICES_DIR);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter((f) => f.endsWith(".ts"));
  const violations: SourceScanViolation[] = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const source = readFileSync(filePath, "utf-8");
    const functions = extractFunctionBlocks(source);

    for (const fn of functions) {
      const isKeyHandler =
        /\b(?:normalize|validate|check)\w*(?:key|api)/i.test(fn.name);
      if (!isKeyHandler) continue;

      const bodyWithoutSignature = fn.body.split("\n").slice(1).join("\n");
      const hasFormatCheck = KEY_FORMAT_MARKERS.some((p) =>
        p.test(bodyWithoutSignature),
      );
      if (!hasFormatCheck) {
        violations.push({
          file: path.join(AI_SERVICES_DIR, file),
          line: fn.startLine,
          functionName: fn.name,
          description: `"${fn.name}" validates API key without format/prefix/length check`,
        });
      }
    }
  }

  return violations;
}

function readJson<T>(absPath: string): T {
  const raw = readFileSync(absPath, "utf8");
  return JSON.parse(raw) as T;
}

function readBaseline(repoRoot: string): CrossModuleContractBaseline {
  const absPath = path.resolve(repoRoot, BASELINE_PATH);
  if (!existsSync(absPath)) {
    throw new Error(`baseline not found: ${BASELINE_PATH}`);
  }

  const parsed = readJson<CrossModuleContractBaseline>(absPath);
  if (
    !Array.isArray(parsed.expectedChannels) ||
    !Array.isArray(parsed.expectedErrorCodes) ||
    (parsed.desiredEnvelope !== "ok" && parsed.desiredEnvelope !== "success")
  ) {
    throw new Error("invalid cross-module baseline shape");
  }
  return parsed;
}

export function readGeneratedCrossModuleContractActual(
  repoRoot: string = process.cwd(),
): CrossModuleContractActual {
  const absPath = path.resolve(repoRoot, GENERATED_TYPES_PATH);
  if (!existsSync(absPath)) {
    throw new Error(`generated IPC types not found: ${GENERATED_TYPES_PATH}`);
  }

  const generated = readFileSync(absPath, "utf8");
  return {
    channels: uniqueSorted([
      ...parseChannels(generated),
      ...parseSupplementalPushChannels(repoRoot),
    ]),
    errorCodes: parseErrorCodes(generated),
    envelope: parseEnvelope(generated),
  };
}

function evaluateRatchetDimension(args: {
  tag: string;
  violations: SourceScanViolation[];
  approvedCount: number | undefined;
  issues: string[];
  drifts: string[];
}): void {
  if (args.approvedCount === undefined) return;

  if (args.violations.length > args.approvedCount) {
    args.issues.push(
      `[${args.tag}] ${args.violations.length} violations (approved: ${args.approvedCount})`,
    );
    for (const v of args.violations) {
      args.issues.push(`  ${v.file}:${v.line} ${v.description}`);
    }
  } else if (args.violations.length > 0) {
    args.drifts.push(
      `[${args.tag}] ${args.violations.length} approved (threshold: ${args.approvedCount})`,
    );
  }
}

export function evaluateCrossModuleContractGate(
  baseline: CrossModuleContractBaseline,
  actual: CrossModuleContractActual,
): CrossModuleContractGateResult {
  const issues: string[] = [];
  const drifts: string[] = [];

  const channelSet = new Set(actual.channels);
  const errorCodeSet = new Set(actual.errorCodes);

  const aliases = baseline.channelAliases ?? {};
  const approvedMissingChannels = new Set(
    baseline.approvedMissingChannels ?? [],
  );
  const approvedMissingErrorCodes = new Set(
    baseline.approvedMissingErrorCodes ?? [],
  );

  for (const expectedChannel of baseline.expectedChannels) {
    const aliasTarget = aliases[expectedChannel];
    const hasExpected = channelSet.has(expectedChannel);

    if (hasExpected) {
      if (aliasTarget) {
        issues.push(
          `[stale-alias] ${expectedChannel} now exists; remove alias ${expectedChannel} -> ${aliasTarget}`,
        );
      }
      continue;
    }

    if (aliasTarget) {
      if (channelSet.has(aliasTarget)) {
        drifts.push(
          `[approved-alias] ${expectedChannel} is mapped to ${aliasTarget}`,
        );
        continue;
      }
      issues.push(
        `[invalid-alias] ${expectedChannel} alias target missing: ${aliasTarget}`,
      );
      continue;
    }

    if (approvedMissingChannels.has(expectedChannel)) {
      drifts.push(`[approved-missing-channel] ${expectedChannel}`);
      continue;
    }

    issues.push(`[missing-channel] ${expectedChannel}`);
  }

  for (const missingChannel of approvedMissingChannels) {
    if (channelSet.has(missingChannel)) {
      issues.push(
        `[stale-missing-channel] ${missingChannel} now exists; remove approved missing entry`,
      );
    }
  }

  for (const expectedCode of baseline.expectedErrorCodes) {
    if (errorCodeSet.has(expectedCode)) {
      continue;
    }
    if (approvedMissingErrorCodes.has(expectedCode)) {
      drifts.push(`[approved-missing-error-code] ${expectedCode}`);
      continue;
    }
    issues.push(`[missing-error-code] ${expectedCode}`);
  }

  for (const approvedMissingCode of approvedMissingErrorCodes) {
    if (errorCodeSet.has(approvedMissingCode)) {
      issues.push(
        `[stale-missing-error-code] ${approvedMissingCode} now exists; remove approved missing entry`,
      );
    }
  }

  if (actual.envelope === baseline.desiredEnvelope) {
    if (baseline.approvedEnvelopeDrift) {
      issues.push(
        `[stale-envelope-drift] desired=${baseline.desiredEnvelope} already matches actual; remove approved drift`,
      );
    }
  } else {
    const approvedDrift = baseline.approvedEnvelopeDrift;
    if (!approvedDrift || approvedDrift.actual !== actual.envelope) {
      issues.push(
        `[envelope-mismatch] desired=${baseline.desiredEnvelope} actual=${actual.envelope}`,
      );
    } else {
      drifts.push(
        `[approved-envelope-drift] desired=${baseline.desiredEnvelope} actual=${actual.envelope} reason=${approvedDrift.reason}`,
      );
    }
  }

  // ── Skill output validation dimension ──
  evaluateRatchetDimension({
    tag: "skill-output-validation",
    violations: actual.skillOutputViolations ?? [],
    approvedCount:
      baseline.skillOutputValidation?.approvedUnvalidatedCount,
    issues,
    drifts,
  });

  // ── API key format validation dimension ──
  evaluateRatchetDimension({
    tag: "api-key-format-validation",
    violations: actual.apiKeyFormatViolations ?? [],
    approvedCount: baseline.apiKeyFormatValidation?.approvedWeakCount,
    issues,
    drifts,
  });

  return {
    ok: issues.length === 0,
    drifts,
    issues,
  };
}

export function runCrossModuleContractGate(
  repoRoot: string = process.cwd(),
): CrossModuleContractGateResult {
  const baseline = readBaseline(repoRoot);
  const actual = readGeneratedCrossModuleContractActual(repoRoot);

  actual.skillOutputViolations = scanSkillOutputValidation(repoRoot);
  actual.apiKeyFormatViolations = scanApiKeyFormatValidation(repoRoot);

  return evaluateCrossModuleContractGate(baseline, actual);
}

function main(): number {
  const result = runCrossModuleContractGate(process.cwd());

  if (!result.ok) {
    for (const issue of result.issues) {
      console.error(`[CROSS_MODULE_GATE] FAIL ${issue}`);
    }
    if (result.drifts.length > 0) {
      for (const drift of result.drifts) {
        console.error(`[CROSS_MODULE_GATE] DRIFT ${drift}`);
      }
    }
    return 1;
  }

  if (result.drifts.length > 0) {
    for (const drift of result.drifts) {
      console.log(`[CROSS_MODULE_GATE] DRIFT ${drift}`);
    }
  }
  console.log("[CROSS_MODULE_GATE] PASS");
  return 0;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  process.exit(main());
}
