import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  scanResourceSizeViolations,
  writeBaseline,
  runGate,
} from "../resource-size-gate";

// ── Test: writeFile with Buffer.byteLength check → not reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "res-gate-pass-"));
  const srcDir = path.join(root, "apps", "desktop", "main", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "fileManager.ts"),
    `
    import * as fs from "node:fs";
    async function saveDocument(filePath: string, content: string) {
      const size = Buffer.byteLength(content, "utf-8");
      if (size > MAX_FILE_SIZE) throw new Error("File too large");
      await fs.promises.writeFile(filePath, content);
    }
    `,
  );
  const violations = scanResourceSizeViolations(root);
  assert.equal(violations.length, 0, "writeFile with Buffer.byteLength should not be reported");
}

// ── Test: writeFile without size check → reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "res-gate-fail-"));
  const srcDir = path.join(root, "apps", "desktop", "main", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "unsafeWriter.ts"),
    `
    import * as fs from "node:fs";
    function saveRaw(path: string, data: string) {
      fs.writeFileSync(path, data);
    }
    `,
  );
  const violations = scanResourceSizeViolations(root);
  assert.equal(violations.length, 1, "writeFileSync without size check should be reported");
  assert.ok(violations[0].description.includes("writeFileSync"));
}

// ── Test: db.run INSERT without size check → reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "res-gate-db-"));
  const srcDir = path.join(root, "apps", "desktop", "main", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "dbWriter.ts"),
    `
    function insertRecord(db: any, data: string) {
      db.run('INSERT INTO records (content) VALUES (?)', [data]);
    }
    `,
  );
  const violations = scanResourceSizeViolations(root);
  assert.equal(violations.length, 1, "db.run INSERT without size check should be reported");
}

// ── Test: writeFile with MAX_SIZE constant → not reported ──
{
  const root = mkdtempSync(path.join(tmpdir(), "res-gate-const-"));
  const srcDir = path.join(root, "apps", "desktop", "main", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "safeWriter.ts"),
    `
    const MAX_SIZE = 1024 * 1024;
    function save(filePath: string, content: Buffer) {
      if (content.length > MAX_SIZE) {
        throw new Error("Too large");
      }
      writeFileSync(filePath, content);
    }
    `,
  );
  const violations = scanResourceSizeViolations(root);
  assert.equal(violations.length, 0, "writeFileSync with MAX_SIZE check should not be reported");
}

// ── Test: test files excluded ──
{
  const root = mkdtempSync(path.join(tmpdir(), "res-gate-excl-"));
  const srcDir = path.join(root, "apps", "desktop", "main", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "writer.test.ts"),
    `
    import * as fs from "node:fs";
    fs.writeFileSync("/tmp/test", "data");
    `,
  );
  const violations = scanResourceSizeViolations(root);
  assert.equal(violations.length, 0, "Test files should be excluded");
}

// ── Test: violations ≤ baseline → PASS ──
{
  const root = mkdtempSync(path.join(tmpdir(), "res-gate-ratchet-pass-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(10, root);
  const result = runGate(root);
  assert.ok(result.ok, "violations ≤ baseline should PASS");
}

// ── Test: violations > baseline → FAIL ──
{
  const root = mkdtempSync(path.join(tmpdir(), "res-gate-ratchet-fail-"));
  const guardsDir = path.join(root, "openspec", "guards");
  mkdirSync(guardsDir, { recursive: true });
  writeBaseline(0, root);
  const srcDir = path.join(root, "apps", "desktop", "main", "src");
  mkdirSync(srcDir, { recursive: true });
  writeFileSync(
    path.join(srcDir, "raw.ts"),
    `
    import { writeFile } from "node:fs/promises";
    writeFile("/tmp/x", data);
    `,
  );
  const result = runGate(root);
  assert.ok(!result.ok, "violations > baseline should FAIL");
}

console.log("✅ resource-size-gate: all tests passed");
