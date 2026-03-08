/**
 * G0-03: Error Boundary Coverage Gate
 *
 * Checks that top-level route/page components are wrapped in ErrorBoundary.
 * Supports baseline ratchet.
 *
 * Usage:
 *   pnpm gate:error-boundary                   # check mode
 *   pnpm gate:error-boundary --update-baseline  # update baseline
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export type ErrorBoundaryBaseline = {
  count: number;
  updatedAt: string;
};

export type ErrorBoundaryViolation = {
  file: string;
  component: string;
  description: string;
};

export type ErrorBoundaryResult = {
  ok: boolean;
  violations: ErrorBoundaryViolation[];
  baseline: number;
};

// ── Constants ──────────────────────────────────────────────────────

const RENDERER_SRC = path.join("apps", "desktop", "renderer", "src");
const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "error-boundary-baseline.json",
);
const GATE_NAME = "ERROR_BOUNDARY_GATE";

// Files/directories that represent top-level route entries
const PAGE_PATTERNS = [/pages?\//, /views?\//];
const PAGE_FILE_PATTERN = /(?:Page|View|Screen)\.tsx$/;

// ── Core Logic ─────────────────────────────────────────────────────

/**
 * Find page/route components and check if they're wrapped in ErrorBoundary.
 */
export function scanErrorBoundaryCoverage(rootDir: string = "."): ErrorBoundaryViolation[] {
  const srcDir = path.join(rootDir, RENDERER_SRC);
  if (!existsSync(srcDir)) return [];

  const violations: ErrorBoundaryViolation[] = [];

  // Check the main entry point (main.tsx or index.tsx) for top-level ErrorBoundary
  const entryFiles = ["main.tsx", "index.tsx"];
  let hasGlobalErrorBoundary = false;

  for (const entry of entryFiles) {
    const entryPath = path.join(srcDir, entry);
    if (existsSync(entryPath)) {
      const content = readFileSync(entryPath, "utf-8");
      if (/ErrorBoundary/.test(content)) {
        hasGlobalErrorBoundary = true;
        break;
      }
    }
  }

  // If there's a global ErrorBoundary wrapping the entire app, that's sufficient
  if (hasGlobalErrorBoundary) return [];

  // Otherwise, find page components and check individual wrapping
  const pageFiles = findPageFiles(srcDir);
  for (const filePath of pageFiles) {
    const content = readFileSync(filePath, "utf-8");
    const componentName = path.basename(filePath, ".tsx");

    if (!content.includes("ErrorBoundary")) {
      violations.push({
        file: path.relative(rootDir, filePath),
        component: componentName,
        description: `Page component "${componentName}" is not wrapped in ErrorBoundary`,
      });
    }
  }

  return violations;
}

function findPageFiles(srcDir: string): string[] {
  const results: string[] = [];

  function walk(dir: string) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (
        PAGE_FILE_PATTERN.test(entry) ||
        PAGE_PATTERNS.some((p) => p.test(path.relative(srcDir, full)))
      ) {
        if (entry.endsWith(".tsx") && !entry.includes(".test.") && !entry.includes(".stories.")) {
          results.push(full);
        }
      }
    }
  }

  walk(srcDir);
  return results;
}

export function readBaseline(rootDir: string = "."): ErrorBoundaryBaseline {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return { count: 0, updatedAt: "1970-01-01T00:00:00.000Z" };
  }
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

export function writeBaseline(count: number, rootDir: string = "."): void {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  const data: ErrorBoundaryBaseline = {
    count,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(baselinePath, JSON.stringify(data, null, 2) + "\n");
}

export function runGate(rootDir: string = "."): ErrorBoundaryResult {
  const violations = scanErrorBoundaryCoverage(rootDir);
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
  (process.argv[1].endsWith("error-boundary-coverage-gate.ts") ||
    process.argv[1].endsWith("error-boundary-coverage-gate.js"))
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
      console.log(`  - ${v.file} — ${v.description}`);
    }
    process.exit(1);
  }
}
