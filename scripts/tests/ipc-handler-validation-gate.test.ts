import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  scanIpcHandlers,
  writeBaseline,
  runGate,
} from "../ipc-handler-validation-gate";

// ── Test: handler with schema.parse() → not reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "ipc-gate-pass-"));
  const ipcDir = path.join(root, "apps", "desktop", "main", "src", "ipc");
  mkdirSync(ipcDir, { recursive: true });
  writeFileSync(
    path.join(ipcDir, "project.ts"),
    `
    deps.ipcMain.handle("project:create", async (_e, payload) => {
      const args = schema.parse(payload);
      return createProject(args);
    });
    `,
  );
  const violations = scanIpcHandlers(root);
  assert.equal(violations.length, 0, "Handler with schema.parse() should not be reported");
}

// ── Test: handler without validation → reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "ipc-gate-fail-"));
  const ipcDir = path.join(root, "apps", "desktop", "main", "src", "ipc");
  mkdirSync(ipcDir, { recursive: true });
  writeFileSync(
    path.join(ipcDir, "ai.ts"),
    `
    deps.ipcMain.handle("ai:skill:run", async (_e, { skillId, input }) => {
      return runSkill(skillId, input);
    });
    `,
  );
  const violations = scanIpcHandlers(root);
  assert.equal(violations.length, 1, "Handler without validation should be reported");
  assert.equal(violations[0].handler, "ai:skill:run");
}

// ── Test: handler with validateArgs() → not reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "ipc-gate-custom-"));
  const ipcDir = path.join(root, "apps", "desktop", "main", "src", "ipc");
  mkdirSync(ipcDir, { recursive: true });
  writeFileSync(
    path.join(ipcDir, "memory.ts"),
    `
    deps.ipcMain.handle("memory:episode:record", async (_e, payload) => {
      const args = validatePayload(payload);
      return recordEpisode(args);
    });
    `,
  );
  const violations = scanIpcHandlers(root);
  assert.equal(violations.length, 0, "Handler with custom validate should not be reported");
}

// ── Test: violations ≤ baseline → PASS ──
{
  const root = mkdtempSync(path.join(tmpdir(), "ipc-gate-ratchet-pass-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(5, root);
  const ipcDir = path.join(root, "apps", "desktop", "main", "src", "ipc");
  mkdirSync(ipcDir, { recursive: true });
  writeFileSync(
    path.join(ipcDir, "test.ts"),
    `
    deps.ipcMain.handle("test:one", async (_e, p) => { return p; });
    deps.ipcMain.handle("test:two", async (_e, p) => { return p; });
    `,
  );
  const result = runGate(root);
  assert.ok(result.ok, "violations ≤ baseline should PASS");
}

// ── Test: violations > baseline → FAIL ──
{
  const root = mkdtempSync(path.join(tmpdir(), "ipc-gate-ratchet-fail-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(0, root);
  const ipcDir = path.join(root, "apps", "desktop", "main", "src", "ipc");
  mkdirSync(ipcDir, { recursive: true });
  writeFileSync(
    path.join(ipcDir, "test.ts"),
    `
    deps.ipcMain.handle("test:new", async (_e, p) => { return p; });
    `,
  );
  const result = runGate(root);
  assert.ok(!result.ok, "violations > baseline should FAIL");
}

// ── Test: output format ──
{
  const root = mkdtempSync(path.join(tmpdir(), "ipc-gate-format-"));
  const ipcDir = path.join(root, "apps", "desktop", "main", "src", "ipc");
  mkdirSync(ipcDir, { recursive: true });
  writeFileSync(
    path.join(ipcDir, "handler.ts"),
    `
    deps.ipcMain.handle("channel:action", async (_e, data) => { return data; });
    `,
  );
  const violations = scanIpcHandlers(root);
  assert.ok(violations[0].file.includes("handler.ts"), "Violation should include file path");
  assert.ok(violations[0].line > 0, "Violation should include line number");
  assert.ok(violations[0].description.includes("channel:action"), "Violation should include channel name");
}

console.log("✅ ipc-handler-validation-gate: all tests passed");
