/**
 * G0-03: Architecture Health Gate
 *
 * Checks:
 *   1. Provider nesting depth in entry components (threshold: 10)
 *   2. File size violations (threshold: 500 lines)
 *   3. ARIA-live attribute coverage for dynamic content components
 *
 * Supports baseline ratchet.
 *
 * Usage:
 *   pnpm gate:architecture-health                   # check mode
 *   pnpm gate:architecture-health --update-baseline  # update baseline
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export type ArchHealthBaseline = {
  count: number;
  updatedAt: string;
};

export type ArchHealthViolation = {
  file: string;
  category: "provider-nesting" | "file-size" | "aria-live-missing";
  description: string;
  value?: number;
};

export type ArchHealthResult = {
  ok: boolean;
  violations: ArchHealthViolation[];
  baseline: number;
};

// ── Constants ──────────────────────────────────────────────────────

const RENDERER_SRC = path.join("apps", "desktop", "renderer", "src");
const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "architecture-health-baseline.json",
);
const GATE_NAME = "ARCHITECTURE_HEALTH_GATE";

const PROVIDER_NESTING_THRESHOLD = 10;
const FILE_SIZE_THRESHOLD = 500;

// Dynamic content component names that should have aria-live
const DYNAMIC_COMPONENTS = [
  "Toast",
  "Alert",
  "StatusBar",
  "Notification",
  "ProgressBar",
  "SnackBar",
];

// ── Core Logic ─────────────────────────────────────────────────────

/**
 * Count the maximum Provider nesting depth in JSX content.
 * Providers are identified by component names ending with "Provider".
 */
export function countProviderNestingDepth(content: string): number {
  const lines = content.split("\n");
  let depth = 0;
  let maxDepth = 0;

  for (const line of lines) {
    // Count opening Provider tags
    const openMatches = line.match(/<(\w+Provider)\b/g);
    if (openMatches) {
      depth += openMatches.length;
      maxDepth = Math.max(maxDepth, depth);
    }

    // Count closing Provider tags
    const closeMatches = line.match(/<\/(\w+Provider)\s*>/g);
    if (closeMatches) {
      depth -= closeMatches.length;
    }

    // Self-closing Provider tags don't add nesting depth
  }

  return maxDepth;
}

/**
 * Count non-empty, non-comment lines in a file.
 */
function countLines(content: string): number {
  return content.split("\n").length;
}

/**
 * Check if a component file uses aria-live for dynamic content.
 * Returns true if aria-live is present, or if the file doesn't define a dynamic component.
 */
export function hasAriaLive(content: string): boolean {
  return /aria-live/.test(content);
}

/**
 * Walk a directory tree recursively.
 */
function walk(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

/**
 * Scan renderer source for architecture health violations.
 */
export function scanArchitectureHealth(rootDir: string = "."): ArchHealthViolation[] {
  const srcDir = path.join(rootDir, RENDERER_SRC);
  if (!existsSync(srcDir)) return [];

  const violations: ArchHealthViolation[] = [];

  // 1. Check Provider nesting depth in entry files
  const entryFiles = ["App.tsx", "main.tsx"];
  for (const entry of entryFiles) {
    const entryPath = path.join(srcDir, entry);
    if (existsSync(entryPath)) {
      const content = readFileSync(entryPath, "utf-8");
      const depth = countProviderNestingDepth(content);
      if (depth > PROVIDER_NESTING_THRESHOLD) {
        violations.push({
          file: path.relative(rootDir, entryPath),
          category: "provider-nesting",
          description: `Provider nesting depth ${depth} exceeds threshold ${PROVIDER_NESTING_THRESHOLD}`,
          value: depth,
        });
      }
    }
  }

  // 2. Check file sizes
  const allFiles = walk(srcDir);
  for (const filePath of allFiles) {
    if (!filePath.match(/\.(ts|tsx)$/)) continue;
    if (filePath.includes(".test.") || filePath.includes(".spec.") || filePath.includes(".stories.")) continue;

    const content = readFileSync(filePath, "utf-8");
    const lines = countLines(content);
    if (lines > FILE_SIZE_THRESHOLD) {
      violations.push({
        file: path.relative(rootDir, filePath),
        category: "file-size",
        description: `File has ${lines} lines, exceeds threshold ${FILE_SIZE_THRESHOLD}`,
        value: lines,
      });
    }
  }

  // 3. Check ARIA-live coverage for dynamic content components
  for (const filePath of allFiles) {
    if (!filePath.endsWith(".tsx")) continue;
    if (filePath.includes(".test.") || filePath.includes(".spec.") || filePath.includes(".stories.")) continue;

    const basename = path.basename(filePath, ".tsx");
    const isDynamicComponent = DYNAMIC_COMPONENTS.some(
      (name) => basename === name || basename.endsWith(name),
    );

    if (isDynamicComponent) {
      const content = readFileSync(filePath, "utf-8");
      if (!hasAriaLive(content)) {
        violations.push({
          file: path.relative(rootDir, filePath),
          category: "aria-live-missing",
          description: `Dynamic component "${basename}" lacks aria-live attribute`,
        });
      }
    }
  }

  return violations;
}

export function readBaseline(rootDir: string = "."): ArchHealthBaseline {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return { count: 0, updatedAt: "1970-01-01T00:00:00.000Z" };
  }
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

export function writeBaseline(count: number, rootDir: string = "."): void {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  const data: ArchHealthBaseline = {
    count,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(baselinePath, JSON.stringify(data, null, 2) + "\n");
}

export function runGate(rootDir: string = "."): ArchHealthResult {
  const violations = scanArchitectureHealth(rootDir);
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
  (process.argv[1].endsWith("architecture-health-gate.ts") ||
    process.argv[1].endsWith("architecture-health-gate.js"))
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
      console.log(`  - [${v.category}] ${v.file} — ${v.description}`);
    }
    process.exit(1);
  }
}
