import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  loadWindowState,
  saveWindowState,
  type WindowState,
} from "../windowState";

async function main(): Promise<void> {
  const sandboxRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "creonow-win-state-"),
  );

  try {
    // ── WB-FE-WIN-S1: loads saved window state from JSON file ──
    runScenario(
      "WB-FE-WIN-S1 loads saved window state from JSON file",
      () => {
        const dir = path.join(sandboxRoot, "s1");
        fs.mkdirSync(dir, { recursive: true });

        const expected: WindowState = {
          x: 100,
          y: 200,
          width: 1400,
          height: 900,
        };
        fs.writeFileSync(
          path.join(dir, "window-state.json"),
          JSON.stringify(expected),
          "utf8",
        );

        const result = loadWindowState(dir);
        assert.deepStrictEqual(result, expected);
      },
    );

    // ── WB-FE-WIN-S1b: returns null when state file is corrupted ──
    runScenario(
      "WB-FE-WIN-S1b returns null when state file is corrupted",
      () => {
        const dir = path.join(sandboxRoot, "s1b");
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(
          path.join(dir, "window-state.json"),
          "not valid json {{{",
          "utf8",
        );

        const result = loadWindowState(dir);
        assert.equal(result, null);
      },
    );

    // ── WB-FE-WIN-S1b2: returns null when state has invalid shape ──
    runScenario(
      "WB-FE-WIN-S1b2 returns null when state has invalid shape",
      () => {
        const dir = path.join(sandboxRoot, "s1b2");
        fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(
          path.join(dir, "window-state.json"),
          JSON.stringify({ x: "not a number", y: 0, width: 100, height: 100 }),
          "utf8",
        );

        const result = loadWindowState(dir);
        assert.equal(result, null);
      },
    );

    // ── WB-FE-WIN-S1c: returns null when state file does not exist ──
    runScenario(
      "WB-FE-WIN-S1c returns null when state file does not exist",
      () => {
        const dir = path.join(sandboxRoot, "s1c");
        fs.mkdirSync(dir, { recursive: true });
        // No file written

        const result = loadWindowState(dir);
        assert.equal(result, null);
      },
    );

    // ── WB-FE-WIN-S2: saves window state to JSON file ──
    runScenario("WB-FE-WIN-S2 saves window state to JSON file", () => {
      const dir = path.join(sandboxRoot, "s2");
      fs.mkdirSync(dir, { recursive: true });

      const state: WindowState = {
        x: 50,
        y: 60,
        width: 1280,
        height: 800,
      };
      saveWindowState(dir, state);

      const raw = fs.readFileSync(
        path.join(dir, "window-state.json"),
        "utf8",
      );
      const parsed: unknown = JSON.parse(raw);
      assert.deepStrictEqual(parsed, state);
    });

    // ── WB-FE-WIN-S2b: saves overwrites existing state ──
    runScenario("WB-FE-WIN-S2b saves overwrites existing state", () => {
      const dir = path.join(sandboxRoot, "s2b");
      fs.mkdirSync(dir, { recursive: true });

      const first: WindowState = { x: 0, y: 0, width: 800, height: 600 };
      const second: WindowState = { x: 10, y: 20, width: 1920, height: 1080 };

      saveWindowState(dir, first);
      saveWindowState(dir, second);

      const raw = fs.readFileSync(
        path.join(dir, "window-state.json"),
        "utf8",
      );
      const parsed: unknown = JSON.parse(raw);
      assert.deepStrictEqual(parsed, second);
    });

    console.log("✅ All windowState tests passed");
  } finally {
    fs.rmSync(sandboxRoot, { recursive: true, force: true });
  }
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

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
