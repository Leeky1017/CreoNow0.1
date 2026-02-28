import assert from "node:assert/strict";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

import { registerFileIpcHandlers } from "../../main/src/ipc/file";
import type { Logger } from "../../main/src/logging/logger";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

type IpcErrorPayload = {
  code: string;
  message: string;
};

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: IpcErrorPayload };

function createNoopLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createIpcHarness(): {
  ipcMain: IpcMain;
  handlers: Map<string, Handler>;
} {
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle(channel: string, handler: Handler) {
      handlers.set(channel, handler);
    },
  } as unknown as IpcMain;

  return { ipcMain, handlers };
}

async function testCreateRejectsNonStringProjectId(): Promise<void> {
  const { ipcMain, handlers } = createIpcHarness();
  registerFileIpcHandlers({
    ipcMain,
    db: {} as Database.Database,
    logger: createNoopLogger(),
  });

  const createHandler = handlers.get("file:document:create");
  assert.ok(createHandler, "file:document:create handler should be registered");
  if (!createHandler) {
    throw new Error("missing file:document:create handler");
  }

  const response = (await createHandler({}, { projectId: null })) as IpcResult<
    unknown
  >;

  assert.equal(response.ok, false, "non-string projectId should be rejected");
  if (!response.ok) {
    assert.equal(response.error.code, "INVALID_ARGUMENT");
    assert.equal(response.error.message, "projectId is required");
  }
}

const checks: Array<{ name: string; run: () => Promise<void> }> = [
  {
    name: "create rejects non-string projectId without throwing",
    run: testCreateRejectsNonStringProjectId,
  },
];

const failures: Array<{ name: string; error: unknown }> = [];
for (const check of checks) {
  try {
    await check.run();
    console.log(`[PASS] ${check.name}`);
  } catch (error) {
    failures.push({ name: check.name, error });
    console.error(`[FAIL] ${check.name}`);
    console.error(error);
  }
}

if (failures.length > 0) {
  const names = failures.map((item) => item.name).join(", ");
  throw new Error(`file IPC runtime boundary checks failed: ${names}`);
}

console.log("file-ipc-runtime-boundary.test.ts: all assertions passed");
