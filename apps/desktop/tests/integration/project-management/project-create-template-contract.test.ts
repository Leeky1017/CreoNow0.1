import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { IpcMainInvokeEvent } from "electron";

import { createValidatedIpcMain } from "../../../main/src/ipc/runtime-validation";
import { registerProjectIpcHandlers } from "../../../main/src/ipc/project";
import {
  createNoopLogger,
  createProjectTestDb,
} from "../../unit/projectService.test-helpers";

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
          senderFrame: { url: "file:///mock-renderer/index.html" },
          sender: { id: 1 },
        } as IpcMainInvokeEvent,
        payload,
      );
    },
  };
}

/**
 * S3-PROJECT-TPL-S2: project:create contract stays stable when template is provided.
 */
async function main(): Promise<void> {
  const userDataDir = await fs.mkdtemp(
    path.join(os.tmpdir(), "creonow-s3-template-contract-"),
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
    name: "Contract Template Project",
    template: {
      kind: "builtin",
      id: "novel",
    },
  })) as {
    ok: boolean;
    data?: { projectId: string; rootPath: string };
    error?: { code?: string; message?: string };
  };

  assert.equal(created.ok, true, "project:create should accept template input");
  if (!created.ok || !created.data) {
    throw new Error(
      `expected successful create response, got ${created.error?.code ?? "unknown"}`,
    );
  }

  const responseKeys = Object.keys(created.data).sort();
  assert.deepEqual(responseKeys, ["projectId", "rootPath"]);
  assert.equal(typeof created.data.projectId, "string");
  assert.equal(typeof created.data.rootPath, "string");

  db.close();
  await fs.rm(userDataDir, { recursive: true, force: true });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
