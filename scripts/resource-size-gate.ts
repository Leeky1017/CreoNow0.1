/**
 * G0-04: Resource Size Gate
 *
 * Scans file-write operations for missing size validation.
 * Detects: fs.writeFile, fs.writeFileSync, db.run with INSERT/UPDATE
 * that lack preceding Buffer.byteLength / .length / size checks.
 *
 * Supports baseline ratchet.
 *
 * Usage:
 *   pnpm gate:resource-size                   # check mode
 *   pnpm gate:resource-size --update-baseline  # update baseline
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export type ResourceSizeBaseline = {
  count: number;
  updatedAt: string;
};

export type ResourceSizeViolation = {
  file: string;
  line: number;
  description: string;
};

export type ResourceSizeResult = {
  ok: boolean;
  violations: ResourceSizeViolation[];
  baseline: number;
};

// ── Constants ──────────────────────────────────────────────────────

const SCAN_DIRS = [
  path.join("apps", "desktop", "main", "src"),
  path.join("packages", "shared"),
];
const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "resource-size-baseline.json",
);
const GATE_NAME = "RESOURCE_SIZE_GATE";

// Patterns indicating a file write operation
const WRITE_PATTERNS = [
  /\bwriteFile(?:Sync)?\s*\(/,
  /\bwriteSync\s*\(/,
  /\bdb\.run\s*\(\s*['"`](?:INSERT|UPDATE)\b/i,
  /\bcreateWriteStream\s*\(/,
];

// Patterns indicating a size check is present nearby
const SIZE_CHECK_PATTERNS = [
  /Buffer\.byteLength/,
  /\.byteLength\b/,
  /\.length\s*[><=!]/,
  /\.size\s*[><=!]/,
  /MAX_SIZE|maxSize|sizeLimit|SIZE_LIMIT|MAX_FILE_SIZE/,
  /checkSize|validateSize|assertSize/i,
];

// ── Core Logic ─────────────────────────────────────────────────────

function walk(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === ".git") continue;
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

/**
 * Scan source files for write operations without size validation.
 */
export function scanResourceSizeViolations(rootDir: string = "."): ResourceSizeViolation[] {
  const violations: ResourceSizeViolation[] = [];

  for (const scanDir of SCAN_DIRS) {
    const fullDir = path.join(rootDir, scanDir);
    const files = walk(fullDir);

    for (const filePath of files) {
      if (!filePath.match(/\.(ts|tsx|js|cjs|mjs)$/)) continue;
      if (filePath.includes(".test.") || filePath.includes(".spec.")) continue;

      const content = readFileSync(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        const hasWrite = WRITE_PATTERNS.some((p) => p.test(line));
        if (!hasWrite) continue;

        // Check surrounding context (20 lines before) for size checks
        const contextStart = Math.max(0, i - 20);
        const context = lines.slice(contextStart, i + 1).join("\n");

        const hasSizeCheck = SIZE_CHECK_PATTERNS.some((p) => p.test(context));
        if (hasSizeCheck) continue;

        violations.push({
          file: path.relative(rootDir, filePath),
          line: i + 1,
          description: `File write without size validation: ${line.trim().slice(0, 80)}`,
        });
      }
    }
  }

  return violations;
}

export function readBaseline(rootDir: string = "."): ResourceSizeBaseline {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return { count: 0, updatedAt: "1970-01-01T00:00:00.000Z" };
  }
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

export function writeBaseline(count: number, rootDir: string = "."): void {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  const data: ResourceSizeBaseline = {
    count,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(baselinePath, JSON.stringify(data, null, 2) + "\n");
}

export function runGate(rootDir: string = "."): ResourceSizeResult {
  const violations = scanResourceSizeViolations(rootDir);
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
  (process.argv[1].endsWith("resource-size-gate.ts") ||
    process.argv[1].endsWith("resource-size-gate.js"))
) {
  const updateBaseline = process.argv.includes("--update-baseline");
  const result = runGate();

  if (updateBaseline) {
    writeBaseline(result.violations.length);
    console.log(`[${GATE_NAME}] Baseline updated: ${result.violations.length} violations`);
    process.exit(0);
  }

  if (result.ok) {
    console.log(`[${GATE_NAME}] PASS  violations: ${result.violations.length} (baseline: ${result.baseline})`);
  } else {
    const newCount = result.violations.length - result.baseline;
    console.log(`[${GATE_NAME}] FAIL  violations: ${result.violations.length} (baseline: ${result.baseline})  +${newCount} new:`);
    for (const v of result.violations) {
      console.log(`  - ${v.file}:${v.line} — ${v.description}`);
    }
    process.exit(1);
  }
}
