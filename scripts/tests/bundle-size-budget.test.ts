import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  collectChunkSizes,
  readBaseline,
  writeBaseline,
  compareBundles,
  runGate,
} from "../bundle-size-budget";

// ── Test: collect chunk sizes from build output ──
{
  const root = mkdtempSync(path.join(tmpdir(), "bundle-collect-"));
  const distDir = path.join(root, "apps", "desktop", "dist");
  mkdirSync(path.join(distDir, "renderer", "assets"), { recursive: true });
  mkdirSync(path.join(distDir, "preload"), { recursive: true });
  writeFileSync(path.join(distDir, "main.js"), "x".repeat(1000));
  writeFileSync(path.join(distDir, "renderer", "assets", "vendor.js"), "y".repeat(2000));
  writeFileSync(path.join(distDir, "preload", "index.cjs"), "p".repeat(750));
  writeFileSync(path.join(distDir, "renderer", "assets", "style.css"), "z".repeat(500)); // not JS, excluded

  const chunks = collectChunkSizes(root);
  assert.equal(chunks.length, 3, "Should collect 3 JS-like files");
  const mainChunk = chunks.find((c) => c.name === "main.js");
  assert.ok(mainChunk, "Should find main.js");
  assert.equal(mainChunk!.size, 1000);
  const preloadChunk = chunks.find((c) => c.name === path.join("preload", "index.cjs"));
  assert.ok(preloadChunk, "Should find preload/index.cjs");
  assert.equal(preloadChunk!.size, 750);
}

// ── Test: no build output → empty chunks ──
{
  const root = mkdtempSync(path.join(tmpdir(), "bundle-empty-"));
  const chunks = collectChunkSizes(root);
  assert.equal(chunks.length, 0, "No build output should return empty");
}

// ── Test: runGate fails when build output is missing ──
{
  const root = mkdtempSync(path.join(tmpdir(), "bundle-missing-output-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  const baseline = {
    totalSize: 1234,
    chunks: [{ name: "renderer/assets/index.js", size: 1234 }],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  writeFileSync(
    path.join(guardsDir, "bundle-size-baseline.json"),
    JSON.stringify(baseline, null, 2) + "\n",
  );

  const result = runGate(root);
  assert.equal(result.ok, false, "Missing build output should FAIL");
  assert.equal(result.missingBuildOutput, true, "Should report missing build output");
}

// ── Test: total within budget → PASS ──
{
  const current = [
    { name: "main.js", size: 1000 },
    { name: "vendor.js", size: 2000 },
  ];
  const baseline = {
    totalSize: 3000,
    chunks: [
      { name: "main.js", size: 1000 },
      { name: "vendor.js", size: 2000 },
    ],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  const result = compareBundles(current, baseline);
  assert.ok(result.ok, "Same size should PASS");
  assert.equal(result.totalSize, 3000);
}

// ── Test: total exceeds budget (>10% increase) → FAIL ──
{
  const current = [
    { name: "main.js", size: 2000 },
    { name: "vendor.js", size: 2500 },
  ];
  const baseline = {
    totalSize: 3000,
    chunks: [
      { name: "main.js", size: 1000 },
      { name: "vendor.js", size: 2000 },
    ],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  const result = compareBundles(current, baseline);
  assert.ok(!result.ok, "50% increase should FAIL");
}

// ── Test: --update-baseline writes correct data ──
{
  const root = mkdtempSync(path.join(tmpdir(), "bundle-update-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  const chunks = [
    { name: "app.js", size: 5000 },
    { name: "lib.js", size: 3000 },
  ];
  writeBaseline(chunks, root);
  const bl = readBaseline(root);
  assert.equal(bl.totalSize, 8000, "Baseline total should be 8000");
  assert.equal(bl.chunks.length, 2, "Baseline should have 2 chunks");
}

// ── Test: change details include per-chunk diff ──
{
  const current = [
    { name: "main.js", size: 1200 },
    { name: "vendor.js", size: 2000 },
  ];
  const baseline = {
    totalSize: 3000,
    chunks: [
      { name: "main.js", size: 1000 },
      { name: "vendor.js", size: 2000 },
    ],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  const result = compareBundles(current, baseline);
  const mainChange = result.changes.find((c) => c.name === "main.js");
  assert.ok(mainChange, "Should include main.js change");
  assert.equal(mainChange!.diff, 200, "main.js diff should be +200");
  assert.ok(Math.abs(mainChange!.diffPercent - 20) < 0.1, "main.js diff should be ~20%");
}

// ── Test: new chunks detected ──
{
  const current = [
    { name: "main.js", size: 1000 },
    { name: "newModule.js", size: 500 },
  ];
  const baseline = {
    totalSize: 1000,
    chunks: [{ name: "main.js", size: 1000 }],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  const result = compareBundles(current, baseline);
  assert.equal(result.newChunks.length, 1, "Should detect 1 new chunk");
  assert.equal(result.newChunks[0].name, "newModule.js");
}

// ── Test: removed chunks detected ──
{
  const current = [{ name: "main.js", size: 1000 }];
  const baseline = {
    totalSize: 3000,
    chunks: [
      { name: "main.js", size: 1000 },
      { name: "old.js", size: 2000 },
    ],
    updatedAt: "2024-01-01T00:00:00.000Z",
  };
  const result = compareBundles(current, baseline);
  assert.equal(result.removedChunks.length, 1, "Should detect 1 removed chunk");
  assert.equal(result.removedChunks[0], "old.js");
}

// ── Test: zero baseline → PASS (first run) ──
{
  const current = [{ name: "main.js", size: 5000 }];
  const baseline = {
    totalSize: 0,
    chunks: [],
    updatedAt: "1970-01-01T00:00:00.000Z",
  };
  const result = compareBundles(current, baseline);
  assert.ok(result.ok, "Zero baseline should always PASS (first run)");
}

console.log("✅ bundle-size-budget: all tests passed");
