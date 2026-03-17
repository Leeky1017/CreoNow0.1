import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { IpcMainInvokeEvent } from "electron";

import { registerProjectIpcHandlers } from "../../main/src/ipc/project";
import type { ProjectLifecycle } from "../../main/src/services/projects/projectLifecycle";
import {
  createNoopLogger,
  createProjectTestDb,
} from "./projectService.test-helpers";

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
      return await listener(
        {
          sender: { id: 7 },
        } as unknown as IpcMainInvokeEvent,
        payload,
      );
    },
  };
}

async function main(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-project-ipc-switch-"),
  );
  const db = createProjectTestDb();
  const ipcMain = createMockIpcMain();

  let switchCalls = 0;
  let unbindCalls = 0;
  let bindCalls = 0;
  let persistCalls = 0;
  let seenFromProjectId = "";
  let seenToProjectId = "";

  const lifecycle: ProjectLifecycle = {
    register: () => {},
    unbindAll: async () => {
      unbindCalls += 1;
    },
    bindAll: async () => {
      bindCalls += 1;
    },
    switchProject: async ({ fromProjectId, toProjectId, persist }) => {
      switchCalls += 1;
      seenFromProjectId = fromProjectId;
      seenToProjectId = toProjectId;
      persistCalls += 1;
      return await persist();
    },
  };

  registerProjectIpcHandlers({
    ipcMain: ipcMain as unknown as Parameters<
      typeof registerProjectIpcHandlers
    >[0]["ipcMain"],
    db,
    userDataDir,
    logger: createNoopLogger(),
    projectLifecycle: lifecycle,
  });

  const createdA = (await ipcMain.invoke("project:project:create", {
    name: "A",
  })) as { ok: boolean; data?: { projectId: string } };
  const createdB = (await ipcMain.invoke("project:project:create", {
    name: "B",
  })) as { ok: boolean; data?: { projectId: string } };

  assert.equal(createdA.ok, true);
  assert.equal(createdB.ok, true);
  if (!createdA.ok || !createdA.data || !createdB.ok || !createdB.data) {
    throw new Error("failed to create test projects");
  }

  const switched = (await ipcMain.invoke("project:project:switch", {
    projectId: createdB.data.projectId,
    fromProjectId: createdA.data.projectId,
    operatorId: "tester",
    traceId: "trace-switch-ipc",
  })) as { ok: boolean; data?: { currentProjectId: string } };

  assert.equal(switched.ok, true);
  if (!switched.ok || !switched.data) {
    throw new Error("switch project failed");
  }

  assert.equal(
    switchCalls,
    1,
    "switch must go through lifecycle.switchProject",
  );
  assert.equal(
    persistCalls,
    1,
    "persist should run inside lifecycle.switchProject",
  );
  assert.equal(unbindCalls, 0, "ipc entry should not call unbindAll directly");
  assert.equal(bindCalls, 0, "ipc entry should not call bindAll directly");
  assert.equal(seenFromProjectId, createdA.data.projectId);
  assert.equal(seenToProjectId, createdB.data.projectId);

  db.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
