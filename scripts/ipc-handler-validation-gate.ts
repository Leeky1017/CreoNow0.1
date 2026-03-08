/**
 * G0-02: IPC Handler Validation Gate
 *
 * Scans IPC handler files for handlers that lack schema/validation calls.
 * Supports baseline ratchet: current violations ≤ baseline → PASS.
 *
 * Usage:
 *   pnpm gate:ipc-validation                 # check mode
 *   pnpm gate:ipc-validation --update-baseline  # update baseline
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export type IpcValidationBaseline = {
  count: number;
  updatedAt: string;
};

export type IpcValidationViolation = {
  file: string;
  line: number;
  handler: string;
  description: string;
};

export type IpcValidationResult = {
  ok: boolean;
  violations: IpcValidationViolation[];
  baseline: number;
};

// ── Constants ──────────────────────────────────────────────────────

const IPC_DIR = path.join("apps", "desktop", "main", "src", "ipc");
const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "ipc-validation-baseline.json",
);

const GATE_NAME = "IPC_VALIDATION_GATE";

// Patterns that indicate validation is present
const VALIDATION_PATTERNS = [
  /\.parse\s*\(/,        // zod schema.parse()
  /\.safeParse\s*\(/,    // zod schema.safeParse()
  /validate\w*\s*\(/i,   // validateArgs(), validatePayload() etc.
  /\.validate\s*\(/,     // schema.validate()
  /assert\w*\s*\(/i,     // assertValid(), assertPayload() etc.
];

// ── Core Logic ─────────────────────────────────────────────────────

/**
 * Find IPC handler registrations and check if they perform validation.
 */
export function scanIpcHandlers(rootDir: string = "."): IpcValidationViolation[] {
  const ipcDir = path.join(rootDir, IPC_DIR);
  if (!existsSync(ipcDir)) return [];

  const files = readdirSync(ipcDir).filter((f) => f.endsWith(".ts"));
  const violations: IpcValidationViolation[] = [];

  for (const file of files) {
    const filePath = path.join(ipcDir, file);
    const content = readFileSync(filePath, "utf-8");

    // Find all handler registrations first
    const handlePattern = /\.handle\s*\(\s*["'`]([^"'`]+)["'`]/g;
    const matches: Array<{ channel: string; index: number }> = [];
    let m;
    while ((m = handlePattern.exec(content)) !== null) {
      matches.push({ channel: m[1], index: m.index });
    }

    // Check each handler
    for (let i = 0; i < matches.length; i++) {
      const { channel, index: matchPos } = matches[i];
      const nextPos = i + 1 < matches.length ? matches[i + 1].index : content.length;

      // Find the line number
      const beforeMatch = content.slice(0, matchPos);
      const lineNum = beforeMatch.split("\n").length;

      // Extract the handler body (from match to the next handler or end)
      const handlerBody = content.slice(matchPos, nextPos);

      // Check if any validation pattern exists in the handler body
      const hasValidation = VALIDATION_PATTERNS.some((pat) =>
        pat.test(handlerBody),
      );

      if (!hasValidation) {
        violations.push({
          file: path.relative(rootDir, filePath),
          line: lineNum,
          handler: channel,
          description: `Handler "${channel}" lacks schema/validation call`,
        });
      }
    }
  }

  return violations;
}

/**
 * Read baseline from disk.
 */
export function readBaseline(rootDir: string = "."): IpcValidationBaseline {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return { count: 0, updatedAt: "1970-01-01T00:00:00.000Z" };
  }
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

/**
 * Write baseline to disk.
 */
export function writeBaseline(
  count: number,
  rootDir: string = ".",
): void {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  const data: IpcValidationBaseline = {
    count,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(baselinePath, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Run the gate check.
 */
export function runGate(rootDir: string = "."): IpcValidationResult {
  const violations = scanIpcHandlers(rootDir);
  const baseline = readBaseline(rootDir);

  return {
    ok: violations.length <= baseline.count,
    violations,
    baseline: baseline.count,
  };
}

// ── CLI entry ──────────────────────────────────────────────────────

if (
  process.argv[1] &&
  (process.argv[1].endsWith("ipc-handler-validation-gate.ts") ||
    process.argv[1].endsWith("ipc-handler-validation-gate.js"))
) {
  const updateBaseline = process.argv.includes("--update-baseline");
  const result = runGate();

  if (updateBaseline) {
    writeBaseline(result.violations.length);
    console.log(
      `[${GATE_NAME}] Baseline updated: ${result.violations.length} violations`,
    );
    process.exit(0);
  }

  if (result.ok) {
    console.log(
      `[${GATE_NAME}] PASS  violations: ${result.violations.length} (baseline: ${result.baseline})`,
    );
  } else {
    const newCount = result.violations.length - result.baseline;
    console.log(
      `[${GATE_NAME}] FAIL  violations: ${result.violations.length} (baseline: ${result.baseline})  +${newCount} new:`,
    );
    for (const v of result.violations) {
      console.log(`  - ${v.file}:${v.line} — ${v.description}`);
    }
    process.exit(1);
  }
}
