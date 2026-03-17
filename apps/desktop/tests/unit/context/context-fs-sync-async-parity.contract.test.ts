import assert from "node:assert/strict";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  ensureCreonowDirStructure,
  ensureCreonowDirStructureAsync,
  getCreonowDirStatus,
  getCreonowDirStatusAsync,
  listCreonowFiles,
  listCreonowFilesAsync,
  readCreonowTextFile,
  readCreonowTextFileAsync,
} from "../../../main/src/services/context/contextFs";

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function snapshotCreonow(projectRootPath: string): Promise<string[]> {
  const base = path.join(projectRootPath, ".creonow");
  if (!fs.existsSync(base)) {
    return [];
  }

  const items: string[] = [];

  async function walk(absPath: string, relPath: string): Promise<void> {
    const entries = await fsp.readdir(absPath, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absChild = path.join(absPath, entry.name);
      const relChild =
        relPath.length > 0 ? `${relPath}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        items.push(`D:${relChild}`);
        await walk(absChild, relChild);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      const content = await fsp.readFile(absChild, "utf8");
      items.push(`F:${relChild}:${content}`);
    }
  }

  await walk(base, ".creonow");
  return items.sort((a, b) => a.localeCompare(b));
}

function assertIoErrorShape(
  result: ReturnType<typeof ensureCreonowDirStructure>,
): void {
  assert.equal(result.ok, false);
}

// AUD-C6-S2: sync ensure must match async ensure output.
{
  const syncRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), "creonow-c6-sync-"),
  );
  const asyncRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), "creonow-c6-async-"),
  );

  try {
    const syncEnsured = ensureCreonowDirStructure(syncRoot);
    const asyncEnsured = await ensureCreonowDirStructureAsync(asyncRoot);

    assert.deepEqual(syncEnsured, { ok: true, data: true });
    assert.deepEqual(asyncEnsured, { ok: true, data: true });

    const syncSnapshot = await snapshotCreonow(syncRoot);
    const asyncSnapshot = await snapshotCreonow(asyncRoot);
    assert.deepEqual(syncSnapshot, asyncSnapshot);
  } finally {
    await fsp.rm(syncRoot, { recursive: true, force: true });
    await fsp.rm(asyncRoot, { recursive: true, force: true });
  }
}

// AUD-C6-S4: sync status query must match async status query.
{
  const projectRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), "creonow-c6-status-"),
  );

  try {
    const syncBefore = getCreonowDirStatus(projectRoot);
    const asyncBefore = await getCreonowDirStatusAsync(projectRoot);
    assert.deepEqual(syncBefore, asyncBefore);

    const ensured = await ensureCreonowDirStructureAsync(projectRoot);
    assert.deepEqual(ensured, { ok: true, data: true });

    const syncAfter = getCreonowDirStatus(projectRoot);
    const asyncAfter = await getCreonowDirStatusAsync(projectRoot);
    assert.deepEqual(syncAfter, asyncAfter);
  } finally {
    await fsp.rm(projectRoot, { recursive: true, force: true });
  }
}

// AUD-C6-S4: list/read sync APIs should stay behaviorally consistent with async APIs.
{
  const projectRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), "creonow-c6-list-read-"),
  );

  try {
    const ensured = await ensureCreonowDirStructureAsync(projectRoot);
    assert.deepEqual(ensured, { ok: true, data: true });

    const nestedDir = path.join(projectRoot, ".creonow", "rules", "nested");
    await fsp.mkdir(nestedDir, { recursive: true });

    const filePath = path.join(nestedDir, "alpha.md");
    await fsp.writeFile(filePath, "alpha-content", "utf8");

    const listSync = listCreonowFiles({
      projectRootPath: projectRoot,
      scope: "rules",
    });
    const listAsync = await listCreonowFilesAsync({
      projectRootPath: projectRoot,
      scope: "rules",
    });
    assert.deepEqual(listSync, listAsync);

    const readSync = readCreonowTextFile({
      projectRootPath: projectRoot,
      path: ".creonow/rules/nested/alpha.md",
    });
    const readAsync = await readCreonowTextFileAsync({
      projectRootPath: projectRoot,
      path: ".creonow/rules/nested/alpha.md",
    });
    assert.deepEqual(readSync, readAsync);
  } finally {
    await fsp.rm(projectRoot, { recursive: true, force: true });
  }
}

// AUD-C6-S5: sync/async ensure should expose equivalent error semantics.
{
  const tempRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), "creonow-c6-error-"),
  );
  const fileAsProjectRoot = path.join(tempRoot, "project-root-as-file.txt");

  try {
    await fsp.writeFile(fileAsProjectRoot, "not-a-directory", "utf8");

    const syncResult = ensureCreonowDirStructure(fileAsProjectRoot);
    const asyncResult = await ensureCreonowDirStructureAsync(fileAsProjectRoot);

    assertIoErrorShape(syncResult);
    assert.equal(asyncResult.ok, false);
    if (!syncResult.ok && !asyncResult.ok) {
      assert.equal(syncResult.error.code, asyncResult.error.code);
      assert.equal(syncResult.error.message, asyncResult.error.message);
      assert.equal(
        Boolean(syncResult.error.details),
        Boolean(asyncResult.error.details),
      );
    }
  } finally {
    await fsp.rm(tempRoot, { recursive: true, force: true });
  }
}

// AUD-C6-S6: async ensure should be idempotent.
{
  const projectRoot = await fsp.mkdtemp(
    path.join(os.tmpdir(), "creonow-c6-idempotent-"),
  );

  try {
    const first = await ensureCreonowDirStructureAsync(projectRoot);
    assert.deepEqual(first, { ok: true, data: true });
    const snapshotAfterFirst = await snapshotCreonow(projectRoot);

    const second = await ensureCreonowDirStructureAsync(projectRoot);
    assert.deepEqual(second, { ok: true, data: true });
    const snapshotAfterSecond = await snapshotCreonow(projectRoot);

    assert.deepEqual(snapshotAfterSecond, snapshotAfterFirst);
  } finally {
    await fsp.rm(projectRoot, { recursive: true, force: true });
  }
}

// AUD-C6-S7: duplicated directory/default-file business logic must stay in one SSOT definition.
{
  const source = await fsp.readFile(
    path.resolve(
      import.meta.dirname,
      "../../../main/src/services/context/contextFs.ts",
    ),
    "utf8",
  );

  const singleSourceLiterals = [
    'relativePath: path.join("rules", "style.md")',
    'relativePath: path.join("rules", "terminology.json")',
    'relativePath: path.join("rules", "constraints.json")',
    'JSON.stringify({ terms: [] }, null, 2) + "\\n"',
    'JSON.stringify({ version: 1, items: [] }, null, 2) + "\\n"',
  ];
  for (const literal of singleSourceLiterals) {
    const matches = source.match(new RegExp(escapeRegExp(literal), "g")) ?? [];
    assert.equal(
      matches.length,
      1,
      `literal should be defined once: ${literal}`,
    );
  }

  assert.match(source, /const CREONOW_REQUIRED_SUBDIRS = \[/);
  assert.match(source, /const CREONOW_DEFAULT_FILE_TEMPLATES:/);
  assert.match(
    source,
    /export function ensureCreonowDirStructure\([\s\S]*?ensureCreonowDirStructureSyncFromPlan\(\s*buildCreonowDirStructurePlan\(projectRootPath\),\s*\)/,
  );
  assert.match(
    source,
    /export async function ensureCreonowDirStructureAsync\([\s\S]*?await ensureCreonowDirStructureAsyncFromPlan\(\s*buildCreonowDirStructurePlan\(projectRootPath\),\s*\)/,
  );
  assert.doesNotMatch(
    source,
    /export function ensureCreonowDirStructure\([\s\S]*?const dirs = \[/,
    "sync ensure should not keep an inlined dirs array",
  );
  assert.doesNotMatch(
    source,
    /export async function ensureCreonowDirStructureAsync\([\s\S]*?const dirs = \[/,
    "async ensure should not keep an inlined dirs array",
  );
}

console.log(
  "context-fs-sync-async-parity.contract.test.ts: all assertions passed",
);
