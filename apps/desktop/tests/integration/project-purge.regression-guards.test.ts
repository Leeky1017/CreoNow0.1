import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { createProjectService } from "../../main/src/services/projects/projectService";
import {
  createNoopLogger,
  createProjectTestDb,
} from "../unit/projectService.test-helpers";

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function assertArchivedState(args: {
  db: ReturnType<typeof createProjectTestDb>;
  projectId: string;
}): Promise<void> {
  const row = args.db
    .prepare<
      [string],
      {
        archivedAt: number | null;
      }
    >("SELECT archived_at as archivedAt FROM projects WHERE project_id = ?")
    .get(args.projectId);
  assert.equal(typeof row?.archivedAt, "number");
}

/**
 * issue #831
 * should reject out-of-bound root_path and keep project archived
 */
async function shouldRejectOutOfBoundRootPath(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-purge-oob-user-"),
  );
  const outsideRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-purge-oob-outside-"),
  );
  const markerPath = path.join(outsideRoot, "must-survive.txt");
  await fs.writeFile(markerPath, "marker");

  const db = createProjectTestDb();
  const service = createProjectService({
    db,
    userDataDir,
    logger: createNoopLogger(),
  });

  try {
    const created = service.create({ name: "Out-of-bound purge guard" });
    assert.equal(created.ok, true);
    if (!created.ok) {
      throw new Error("failed to create project");
    }

    const archived = service.lifecycleArchive({
      projectId: created.data.projectId,
      traceId: "trace-oob-archive",
    });
    assert.equal(archived.ok, true);

    db.prepare("UPDATE projects SET root_path = ? WHERE project_id = ?").run(
      outsideRoot,
      created.data.projectId,
    );

    const purged = service.lifecyclePurge({
      projectId: created.data.projectId,
      traceId: "trace-oob-purge",
    });
    assert.equal(purged.ok, false);

    await assertArchivedState({ db, projectId: created.data.projectId });
    assert.equal(await pathExists(outsideRoot), true);
    assert.equal(await pathExists(markerPath), true);
  } finally {
    db.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
    await fs.rm(outsideRoot, { recursive: true, force: true });
  }
}

/**
 * issue #832
 * should keep root directory and archived status when DB delete fails
 */
async function shouldKeepDirectoryWhenDbDeleteFails(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-purge-db-failure-"),
  );
  const db = createProjectTestDb();
  const service = createProjectService({
    db,
    userDataDir,
    logger: createNoopLogger(),
  });

  try {
    const created = service.create({ name: "DB failure purge guard" });
    assert.equal(created.ok, true);
    if (!created.ok) {
      throw new Error("failed to create project");
    }

    const archived = service.lifecycleArchive({
      projectId: created.data.projectId,
      traceId: "trace-db-archive",
    });
    assert.equal(archived.ok, true);

    const markerPath = path.join(created.data.rootPath, "must-survive.txt");
    await fs.writeFile(markerPath, "marker");

    db.exec(`
      CREATE TRIGGER block_project_delete
      BEFORE DELETE ON projects
      BEGIN
        SELECT RAISE(ABORT, 'simulate delete failure');
      END;
    `);

    const purged = service.lifecyclePurge({
      projectId: created.data.projectId,
      traceId: "trace-db-purge",
    });
    assert.equal(purged.ok, false);
    if (purged.ok || !purged.error) {
      throw new Error("expected DB_ERROR");
    }
    assert.equal(purged.error.code, "DB_ERROR");

    await assertArchivedState({ db, projectId: created.data.projectId });
    assert.equal(await pathExists(created.data.rootPath), true);
    assert.equal(await pathExists(markerPath), true);
  } finally {
    db.close();
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const failures: Error[] = [];

  try {
    await shouldRejectOutOfBoundRootPath();
  } catch (error) {
    failures.push(error as Error);
    console.error("[issue-831]", error);
  }

  try {
    await shouldKeepDirectoryWhenDbDeleteFails();
  } catch (error) {
    failures.push(error as Error);
    console.error("[issue-832]", error);
  }

  if (failures.length > 0) {
    throw new AggregateError(
      failures,
      `project purge regression guard failed (${failures.length.toString()})`,
    );
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
