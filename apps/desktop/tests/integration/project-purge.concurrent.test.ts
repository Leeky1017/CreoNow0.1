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
 * PM2-S7
 * should return NOT_FOUND for second purge request without side effects
 */
async function main(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-pm2-purge-concurrent-"),
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
    name: "Concurrent Purge",
  })) as { ok: boolean; data?: { projectId: string } };
  assert.equal(created.ok, true);
  if (!created.ok || !created.data) {
    throw new Error("failed to create project");
  }

  const archived = (await ipcMain.invoke("project:lifecycle:archive", {
    projectId: created.data.projectId,
  })) as { ok: boolean };
  assert.equal(archived.ok, true);

  const first = (await ipcMain.invoke("project:lifecycle:purge", {
    projectId: created.data.projectId,
  })) as { ok: boolean };
  assert.equal(first.ok, true);

  const second = (await ipcMain.invoke("project:lifecycle:purge", {
    projectId: created.data.projectId,
  })) as { ok: boolean; error?: { code: string } };
  assert.equal(second.ok, false);
  if (second.ok || !second.error) {
    throw new Error("expected NOT_FOUND on second purge");
  }
  assert.equal(second.error.code, "NOT_FOUND");

  db.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
