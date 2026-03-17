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

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function createMockIpcMain() {
  const handlers = new Map<string, HandleListener>();

  return {
    handle(channel: string, listener: HandleListener): void {
      handlers.set(channel, listener);
    },
    handlers,
  };
}

/**
 * PM2-S10
 * should assert switch/archive/restore/purge latency baseline thresholds
 */
async function main(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-pm2-benchmark-"),
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

  const switchHandler = ipcMain.handlers.get("project:project:switch");
  const archiveHandler = ipcMain.handlers.get("project:lifecycle:archive");
  const restoreHandler = ipcMain.handlers.get("project:lifecycle:restore");
  const purgeHandler = ipcMain.handlers.get("project:lifecycle:purge");
  const createHandler = ipcMain.handlers.get("project:project:create");

  assert.ok(switchHandler, "Missing handler project:project:switch");
  assert.ok(archiveHandler, "Missing handler project:lifecycle:archive");
  assert.ok(restoreHandler, "Missing handler project:lifecycle:restore");
  assert.ok(purgeHandler, "Missing handler project:lifecycle:purge");
  assert.ok(createHandler, "Missing handler project:project:create");

  const createdIds: string[] = [];
  for (let i = 0; i < 20; i += 1) {
    const created = (await createHandler?.({} as IpcMainInvokeEvent, {
      name: `Perf ${i}`,
    })) as { ok: boolean; data?: { projectId: string } };
    if (!created.ok || !created.data) {
      throw new Error("create failed in benchmark setup");
    }
    createdIds.push(created.data.projectId);
  }

  const switchDurations: number[] = [];
  const archiveDurations: number[] = [];
  const restoreDurations: number[] = [];
  const purgeDurations: number[] = [];

  for (let i = 0; i < createdIds.length; i += 1) {
    const current = createdIds[i];
    const previous =
      createdIds[(i + createdIds.length - 1) % createdIds.length];

    const tSwitch0 = performance.now();
    await switchHandler?.({} as IpcMainInvokeEvent, {
      projectId: current,
      fromProjectId: previous,
      operatorId: "bench",
      traceId: `switch-${i}`,
    });
    const tSwitch1 = performance.now();
    switchDurations.push(tSwitch1 - tSwitch0);

    const tArchive0 = performance.now();
    await archiveHandler?.({} as IpcMainInvokeEvent, {
      projectId: current,
      traceId: `archive-${i}`,
    });
    const tArchive1 = performance.now();
    archiveDurations.push(tArchive1 - tArchive0);

    const tRestore0 = performance.now();
    await restoreHandler?.({} as IpcMainInvokeEvent, {
      projectId: current,
      traceId: `restore-${i}`,
    });
    const tRestore1 = performance.now();
    restoreDurations.push(tRestore1 - tRestore0);

    await archiveHandler?.({} as IpcMainInvokeEvent, {
      projectId: current,
      traceId: `archive-final-${i}`,
    });

    const tPurge0 = performance.now();
    await purgeHandler?.({} as IpcMainInvokeEvent, {
      projectId: current,
      traceId: `purge-${i}`,
    });
    const tPurge1 = performance.now();
    purgeDurations.push(tPurge1 - tPurge0);
  }

  const switchP95 = percentile(switchDurations, 95);
  const switchP99 = percentile(switchDurations, 99);
  const archiveP95 = percentile(archiveDurations, 95);
  const restoreP95 = percentile(restoreDurations, 95);
  const purgeP95 = percentile(purgeDurations, 95);

  assert.ok(switchP95 < 1000, `switch p95 >= 1s: ${switchP95}`);
  assert.ok(switchP99 < 2000, `switch p99 >= 2s: ${switchP99}`);
  assert.ok(archiveP95 < 600, `archive p95 >= 600ms: ${archiveP95}`);
  assert.ok(restoreP95 < 800, `restore p95 >= 800ms: ${restoreP95}`);
  assert.ok(purgeP95 < 2000, `purge p95 >= 2s: ${purgeP95}`);

  db.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
