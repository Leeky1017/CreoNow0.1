/**
 * G0-04: Bundle Size Budget Gate
 *
 * Compares build output sizes against a baseline budget.
 * Reports per-chunk size changes.
 *
 * Supports baseline ratchet via --update-baseline.
 *
 * Usage:
 *   pnpm gate:bundle-budget                   # check mode
 *   pnpm gate:bundle-budget --update-baseline  # update baseline
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

// ── Types ──────────────────────────────────────────────────────────

export type ChunkInfo = {
  name: string;
  size: number;
};

export type BundleSizeBaseline = {
  totalSize: number;
  chunks: ChunkInfo[];
  updatedAt: string;
};

export type BundleSizeChange = {
  name: string;
  oldSize: number;
  newSize: number;
  diff: number;
  diffPercent: number;
};

export type BundleBudgetResult = {
  ok: boolean;
  totalSize: number;
  baselineTotalSize: number;
  changes: BundleSizeChange[];
  newChunks: ChunkInfo[];
  removedChunks: string[];
  missingBuildOutput: boolean;
};

// ── Constants ──────────────────────────────────────────────────────

const BUILD_OUTPUT_DIR = path.join("apps", "desktop", "dist");
const BASELINE_PATH = path.join(
  "openspec",
  "guards",
  "bundle-size-baseline.json",
);
const GATE_NAME = "BUNDLE_SIZE_BUDGET";

// Allow 10% total size increase before failing
const SIZE_INCREASE_THRESHOLD = 0.10;

// ── Core Logic ─────────────────────────────────────────────────────

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
 * Scan build output directory and collect JS-like chunk sizes.
 */
export function collectChunkSizes(rootDir: string = "."): ChunkInfo[] {
  const outputDir = path.join(rootDir, BUILD_OUTPUT_DIR);
  if (!existsSync(outputDir)) return [];

  const files = walk(outputDir);
  return files
    .filter(
      (f) => f.endsWith(".js") || f.endsWith(".mjs") || f.endsWith(".cjs"),
    )
    .map((f) => ({
      name: path.relative(path.join(rootDir, BUILD_OUTPUT_DIR), f),
      size: statSync(f).size,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function readBaseline(rootDir: string = "."): BundleSizeBaseline {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  if (!existsSync(baselinePath)) {
    return { totalSize: 0, chunks: [], updatedAt: "1970-01-01T00:00:00.000Z" };
  }
  return JSON.parse(readFileSync(baselinePath, "utf-8"));
}

export function writeBaseline(chunks: ChunkInfo[], rootDir: string = "."): void {
  const baselinePath = path.join(rootDir, BASELINE_PATH);
  const totalSize = chunks.reduce((sum, c) => sum + c.size, 0);
  const data: BundleSizeBaseline = {
    totalSize,
    chunks,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(baselinePath, JSON.stringify(data, null, 2) + "\n");
}

/**
 * Compare current chunks against baseline and produce result.
 */
export function compareBundles(
  current: ChunkInfo[],
  baseline: BundleSizeBaseline,
): BundleBudgetResult {
  const currentTotal = current.reduce((sum, c) => sum + c.size, 0);
  const baselineMap = new Map(baseline.chunks.map((c) => [c.name, c.size]));
  const currentMap = new Map(current.map((c) => [c.name, c.size]));

  const changes: BundleSizeChange[] = [];
  const newChunks: ChunkInfo[] = [];
  const removedChunks: string[] = [];

  for (const chunk of current) {
    const oldSize = baselineMap.get(chunk.name);
    if (oldSize !== undefined) {
      const diff = chunk.size - oldSize;
      const diffPercent = oldSize > 0 ? (diff / oldSize) * 100 : 0;
      changes.push({
        name: chunk.name,
        oldSize,
        newSize: chunk.size,
        diff,
        diffPercent,
      });
    } else {
      newChunks.push(chunk);
    }
  }

  for (const chunk of baseline.chunks) {
    if (!currentMap.has(chunk.name)) {
      removedChunks.push(chunk.name);
    }
  }

  // Fail if total size increased beyond threshold
  const ok =
    baseline.totalSize === 0 ||
    currentTotal <= baseline.totalSize * (1 + SIZE_INCREASE_THRESHOLD);

  return {
    ok,
    totalSize: currentTotal,
    baselineTotalSize: baseline.totalSize,
    changes,
    newChunks,
    removedChunks,
    missingBuildOutput: false,
  };
}

export function runGate(rootDir: string = "."): BundleBudgetResult {
  const outputDir = path.join(rootDir, BUILD_OUTPUT_DIR);
  if (!existsSync(outputDir)) {
    const baseline = readBaseline(rootDir);
    return {
      ok: false,
      totalSize: 0,
      baselineTotalSize: baseline.totalSize,
      changes: [],
      newChunks: [],
      removedChunks: [],
      missingBuildOutput: true,
    };
  }

  const chunks = collectChunkSizes(rootDir);
  const baseline = readBaseline(rootDir);
  return compareBundles(chunks, baseline);
}

// ── CLI entry ──────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
}

if (
  process.argv[1] &&
  (process.argv[1].endsWith("bundle-size-budget.ts") ||
    process.argv[1].endsWith("bundle-size-budget.js"))
) {
  const updateBaseline = process.argv.includes("--update-baseline");

  if (updateBaseline) {
    const outputDir = path.join(process.cwd(), BUILD_OUTPUT_DIR);
    if (!existsSync(outputDir)) {
      console.log(`[${GATE_NAME}] FAIL  build output missing: ${BUILD_OUTPUT_DIR}`);
      process.exit(1);
    }

    const chunks = collectChunkSizes();
    writeBaseline(chunks);
    const total = chunks.reduce((sum, c) => sum + c.size, 0);
    console.log(`[${GATE_NAME}] Baseline updated: ${chunks.length} chunks, ${formatBytes(total)} total`);
    process.exit(0);
  }

  const result = runGate();

  if (result.missingBuildOutput) {
    console.log(`[${GATE_NAME}] FAIL  build output missing: ${BUILD_OUTPUT_DIR}`);
    process.exit(1);
  }

  console.log(`[${GATE_NAME}] Total: ${formatBytes(result.totalSize)} (baseline: ${formatBytes(result.baselineTotalSize)})`);

  if (result.changes.length > 0) {
    console.log("  Changes:");
    for (const c of result.changes) {
      const sign = c.diff >= 0 ? "+" : "";
      console.log(`    ${c.name}: ${formatBytes(c.oldSize)} → ${formatBytes(c.newSize)} (${sign}${c.diffPercent.toFixed(1)}%)`);
    }
  }

  if (result.newChunks.length > 0) {
    console.log("  New chunks:");
    for (const c of result.newChunks) {
      console.log(`    ${c.name}: ${formatBytes(c.size)}`);
    }
  }

  if (result.removedChunks.length > 0) {
    console.log("  Removed:", result.removedChunks.join(", "));
  }

  if (result.ok) {
    console.log(`[${GATE_NAME}] PASS`);
  } else {
    console.log(`[${GATE_NAME}] FAIL  total size exceeds budget`);
    process.exit(1);
  }
}
