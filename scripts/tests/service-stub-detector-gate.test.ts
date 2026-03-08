import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  scanServiceStubs,
  writeBaseline,
  runGate,
} from "../service-stub-detector-gate";

// ── Test: normal method (with business logic) → not detected ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-normal-"));
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "ai");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "aiService.ts"),
    `
    class AiService {
      async runSkill(skillId: string, input: string) {
        const result = await this.provider.complete(input);
        return this.formatOutput(result);
      }
    }
    `,
  );
  const violations = scanServiceStubs(root);
  assert.equal(violations.length, 0, "Normal method should not be detected");
}

// ── Test: return [] → detected ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-empty-arr-"));
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "search");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "searchService.ts"),
    `
    class SearchService {
      search(query: string) {
        return [];
      }
    }
    `,
  );
  const violations = scanServiceStubs(root);
  assert.equal(violations.length, 1, "return [] should be detected");
  assert.equal(violations[0].pattern, "return-empty-array");
}

// ── Test: return {} → detected ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-empty-obj-"));
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "ctx");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "contextService.ts"),
    `
    class ContextService {
      getContext(id: string) {
        return {};
      }
    }
    `,
  );
  const violations = scanServiceStubs(root);
  assert.equal(violations.length, 1, "return {} should be detected");
  assert.equal(violations[0].pattern, "return-empty-object");
}

// ── Test: TODO comment → detected ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-todo-"));
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "memory");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "memoryService.ts"),
    `
    class MemoryService {
      recall(query: string) {
        // TODO: implement recall logic
        return null;
      }
    }
    `,
  );
  const violations = scanServiceStubs(root);
  assert.equal(violations.length, 1, "TODO comment should be detected");
  assert.equal(violations[0].pattern, "todo-comment");
}

// ── Test: throw not implemented → detected ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-throw-"));
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "export");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "exportService.ts"),
    `
    class ExportService {
      exportPdf(docId: string) {
        throw new Error("not implemented yet");
      }
    }
    `,
  );
  const violations = scanServiceStubs(root);
  assert.equal(violations.length, 1, "throw not implemented should be detected");
  assert.equal(violations[0].pattern, "throw-not-implemented");
}

// ── Test: empty body → detected ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-empty-"));
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "misc");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "miscService.ts"),
    `
    class MiscService {
      doNothing() {
      }
    }
    `,
  );
  const violations = scanServiceStubs(root);
  assert.equal(violations.length, 1, "Empty body should be detected");
  assert.equal(violations[0].pattern, "empty-body");
}

// ── Test: private method → not detected ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-private-"));
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "priv");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "privService.ts"),
    `
    class PrivService {
      private helperStub() {
        return [];
      }
    }
    `,
  );
  const violations = scanServiceStubs(root);
  assert.equal(violations.length, 0, "Private methods should not be detected");
}

// ── Test: violations ≤ baseline → PASS ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-pass-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(10, root);
  // No service files → 0 violations ≤ 10 baseline
  const result = runGate(root);
  assert.ok(result.ok, "violations ≤ baseline should PASS");
}

// ── Test: violations > baseline → FAIL ──
{
  const root = mkdtempSync(path.join(tmpdir(), "stub-gate-fail-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(0, root);
  const svcDir = path.join(root, "apps", "desktop", "main", "src", "services", "fail");
  mkdirSync(svcDir, { recursive: true });
  writeFileSync(
    path.join(svcDir, "failService.ts"),
    `
    class FailService {
      broken() {
        return [];
      }
    }
    `,
  );
  const result = runGate(root);
  assert.ok(!result.ok, "violations > baseline should FAIL");
}

console.log("✅ service-stub-detector-gate: all tests passed");
