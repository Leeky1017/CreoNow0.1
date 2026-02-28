import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { IpcMainInvokeEvent } from "electron";

import { createValidatedIpcMain } from "../../main/src/ipc/runtime-validation";
import { registerProjectIpcHandlers } from "../../main/src/ipc/project";
import {
  createProjectTestDb,
  createNoopLogger,
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
          senderFrame: { url: "file:///index.html" },
          sender: { id: 1 },
        } as IpcMainInvokeEvent,
        payload,
      );
    },
  };
}

/**
 * PM1-S10 + PM1-S11
 * - should reject invalid enum payload with PROJECT_METADATA_INVALID_ENUM
 * - should return PROJECT_IPC_SCHEMA_INVALID with traceId
 */
async function main(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-pm1-ipc-"),
  );
  const db = createProjectTestDb();

  const rawIpcMain = createMockIpcMain();
  const validatedIpcMain = createValidatedIpcMain({
    ipcMain: rawIpcMain as unknown as Parameters<
      typeof createValidatedIpcMain
    >[0]["ipcMain"],
    logger: createNoopLogger(),
  });

  registerProjectIpcHandlers({
    ipcMain: validatedIpcMain,
    db,
    userDataDir,
    logger: createNoopLogger(),
  });

  const created = (await rawIpcMain.invoke("project:project:create", {
    name: "IPC 验证项目",
  })) as { ok: boolean; data?: { projectId: string } };

  assert.equal(created.ok, true);
  if (!created.ok || !created.data) {
    throw new Error("expected project created for validation test");
  }

  const invalidEnumRes = (await rawIpcMain.invoke("project:project:update", {
    projectId: created.data.projectId,
    patch: {
      stage: "publishing",
    },
  })) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(invalidEnumRes.ok, false);
  if (invalidEnumRes.ok) {
    throw new Error("expected invalid enum response");
  }
  assert.equal(invalidEnumRes.error?.code, "PROJECT_METADATA_INVALID_ENUM");

  const invalidSchemaRes = (await rawIpcMain.invoke("project:project:list", {
    includeArchived: "yes",
  })) as {
    ok: boolean;
    error?: { code?: string; traceId?: string; details?: unknown };
  };

  assert.equal(invalidSchemaRes.ok, false);
  if (invalidSchemaRes.ok) {
    throw new Error("expected invalid schema response");
  }

  assert.equal(invalidSchemaRes.error?.code, "PROJECT_IPC_SCHEMA_INVALID");
  assert.equal(typeof invalidSchemaRes.error?.traceId, "string");

  db.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
