import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { IpcMainInvokeEvent } from "electron";

import { registerProjectIpcHandlers } from "../../main/src/ipc/project";
import {
  createNoopLogger,
  createProjectTestDb,
} from "../unit/projectService.test-helpers";

type HandleListener = (
  event: IpcMainInvokeEvent,
  payload: unknown,
) => Promise<unknown> | unknown;

/**
 * Create a fake ipcMain that stores handlers and supports invoke.
 */
function createMockIpcMain() {
  const handlers = new Map<string, HandleListener>();

  return {
    handle(channel: string, listener: HandleListener): void {
      handlers.set(channel, listener);
    },
    async invoke(channel: string, payload: unknown): Promise<unknown> {
      const listener = handlers.get(channel);
      if (!listener) {
        throw new Error(`Missing handler: ${channel}`);
      }
      return await listener({} as IpcMainInvokeEvent, payload);
    },
  };
}

/**
 * PM2-S5
 * should transition active->archived->active and preserve stats
 */
async function main(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-pm2-state-"),
  );
  const db = createProjectTestDb();
  const ipcMain = createMockIpcMain();

  registerProjectIpcHandlers({
    ipcMain: ipcMain as unknown as Parameters<
      typeof registerProjectIpcHandlers
    >[0]["ipcMain"],
    db,
    userDataDir,
    logger: createNoopLogger(),
  });

  const created = (await ipcMain.invoke("project:project:create", {
    name: "Lifecycle Project",
  })) as { ok: boolean; data?: { projectId: string } };
  assert.equal(created.ok, true);
  if (!created.ok || !created.data) {
    throw new Error("failed to create project");
  }

  const before = (await ipcMain.invoke("project:project:stats", {})) as {
    ok: boolean;
    data?: { total: number; active: number; archived: number };
  };
  assert.equal(before.ok, true);
  if (!before.ok || !before.data) {
    throw new Error("failed to read stats before lifecycle switch");
  }

  const archived = (await ipcMain.invoke("project:lifecycle:archive", {
    projectId: created.data.projectId,
  })) as { ok: boolean; data?: { state: "active" | "archived" | "deleted" } };
  assert.equal(archived.ok, true);
  if (!archived.ok || !archived.data) {
    throw new Error("archive failed");
  }
  assert.equal(archived.data.state, "archived");

  const restored = (await ipcMain.invoke("project:lifecycle:restore", {
    projectId: created.data.projectId,
  })) as { ok: boolean; data?: { state: "active" | "archived" | "deleted" } };
  assert.equal(restored.ok, true);
  if (!restored.ok || !restored.data) {
    throw new Error("restore failed");
  }
  assert.equal(restored.data.state, "active");

  const after = (await ipcMain.invoke("project:project:stats", {})) as {
    ok: boolean;
    data?: { total: number; active: number; archived: number };
  };
  assert.equal(after.ok, true);
  if (!after.ok || !after.data) {
    throw new Error("failed to read stats after lifecycle switch");
  }

  assert.deepEqual(after.data, before.data);

  db.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
