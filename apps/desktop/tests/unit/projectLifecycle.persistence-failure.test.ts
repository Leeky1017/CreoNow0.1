import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type Database from "better-sqlite3";

import { createProjectService } from "../../main/src/services/projects/projectService";
import {
  createNoopLogger,
  createProjectTestDb,
} from "./projectService.test-helpers";

/**
 * PM2-S9
 * should return PROJECT_LIFECYCLE_WRITE_FAILED when db write fails
 */
async function main(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-pm2-write-failure-"),
  );
  const db = createProjectTestDb();
  const svc = createProjectService({
    db,
    userDataDir,
    logger: createNoopLogger(),
  });

  const created = svc.create({ name: "Write Failure" });
  assert.equal(created.ok, true);
  if (!created.ok) {
    throw new Error("failed to create project");
  }

  const originalPrepare = db.prepare.bind(db);
  (db as unknown as { prepare: Database.Database["prepare"] }).prepare = ((
    sql,
  ) => {
    if (
      typeof sql === "string" &&
      sql.includes("UPDATE projects SET archived_at = ?, updated_at = ?")
    ) {
      return {
        run: () => {
          throw new Error("db write failed");
        },
      } as unknown as ReturnType<Database.Database["prepare"]>;
    }
    return originalPrepare(sql as never);
  }) as Database.Database["prepare"];

  const res = svc.archive({
    projectId: created.data.projectId,
    archived: true,
  });

  assert.equal(res.ok, false);
  if (res.ok) {
    throw new Error("expected lifecycle persistence failure");
  }
  assert.equal(res.error.code, "PROJECT_LIFECYCLE_WRITE_FAILED");

  db.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
