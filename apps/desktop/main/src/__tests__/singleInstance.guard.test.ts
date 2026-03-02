import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function main(): void {
  // ── WB-FE-WIN-S3: index.ts calls requestSingleInstanceLock ──
  runScenario(
    "WB-FE-WIN-S3 index.ts calls requestSingleInstanceLock",
    () => {
      const indexPath = path.resolve(import.meta.dirname, "../index.ts");
      const source = readFileSync(indexPath, "utf8");

      assert.ok(
        source.includes("requestSingleInstanceLock"),
        "index.ts must call requestSingleInstanceLock() for single-instance enforcement",
      );
    },
  );

  // ── WB-FE-WIN-S3b: index.ts imports loadWindowState ──
  runScenario(
    "WB-FE-WIN-S3b index.ts imports loadWindowState from windowState module",
    () => {
      const indexPath = path.resolve(import.meta.dirname, "../index.ts");
      const source = readFileSync(indexPath, "utf8");

      assert.ok(
        source.includes("loadWindowState"),
        "index.ts must import and use loadWindowState from windowState module",
      );
    },
  );

  // ── WB-FE-WIN-S3c: index.ts uses window state save mechanism ──
  runScenario(
    "WB-FE-WIN-S3c index.ts uses debounced save from windowState module",
    () => {
      const indexPath = path.resolve(import.meta.dirname, "../index.ts");
      const source = readFileSync(indexPath, "utf8");

      assert.ok(
        source.includes("createDebouncedSaveWindowState"),
        "index.ts must import and use createDebouncedSaveWindowState from windowState module",
      );
    },
  );

  // ── WB-FE-WIN-S3d: index.ts handles second-instance event ──
  runScenario(
    "WB-FE-WIN-S3d index.ts handles second-instance event",
    () => {
      const indexPath = path.resolve(import.meta.dirname, "../index.ts");
      const source = readFileSync(indexPath, "utf8");

      assert.ok(
        source.includes("second-instance"),
        "index.ts must handle the 'second-instance' event to focus existing window",
      );
    },
  );

  console.log("✅ All singleInstance guard tests passed");
}

function runScenario(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

main();
