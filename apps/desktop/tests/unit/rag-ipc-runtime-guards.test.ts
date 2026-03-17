import assert from "node:assert/strict";

import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { Logger } from "../../main/src/logging/logger";
import type { EmbeddingService } from "../../main/src/services/embedding/embeddingService";
import { registerRagIpcHandlers } from "../../main/src/ipc/rag";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDbStub(): Database.Database {
  return {
    prepare: () => {
      throw new Error("db should not be used in invalid payload guard test");
    },
  } as unknown as Database.Database;
}

function createEmbeddingStub(): EmbeddingService {
  return {
    encode: () => ({
      ok: false,
      error: {
        code: "MODEL_NOT_READY",
        message: "embedding should not be used in invalid payload guard test",
      },
    }),
  };
}

function createIpcHarness(): {
  ipcMain: IpcMain;
  handlers: Map<
    string,
    (event: unknown, payload: unknown, signal?: AbortSignal) => Promise<unknown>
  >;
} {
  const handlers = new Map<
    string,
    (event: unknown, payload: unknown, signal?: AbortSignal) => Promise<unknown>
  >();

  const ipcMain = {
    handle: (channel: string, handler: unknown) => {
      handlers.set(
        channel,
        handler as (event: unknown, payload: unknown) => Promise<unknown>,
      );
    },
  };

  return {
    ipcMain: ipcMain as unknown as IpcMain,
    handlers,
  };
}

async function main(): Promise<void> {
  const { ipcMain, handlers } = createIpcHarness();

  registerRagIpcHandlers({
    ipcMain,
    db: createDbStub(),
    logger: createLogger(),
    embedding: createEmbeddingStub(),
    ragRerank: { enabled: false },
  } as unknown as Parameters<typeof registerRagIpcHandlers>[0]);

  const configUpdateHandler = handlers.get("rag:config:update");
  assert.ok(
    configUpdateHandler,
    "rag:config:update handler should be registered",
  );

  const invalidConfigPayloads: unknown[] = [
    null,
    3,
    { model: 9 },
    { topK: "2" },
  ];
  for (const payload of invalidConfigPayloads) {
    const response = (await configUpdateHandler?.({}, payload)) as {
      ok: boolean;
      error?: { code: string };
    };
    assert.equal(response.ok, false);
    assert.equal(response.error?.code, "INVALID_ARGUMENT");
  }

  const retrieveHandler = handlers.get("rag:context:retrieve");
  assert.ok(
    retrieveHandler,
    "rag:context:retrieve handler should be registered",
  );

  const invalidRetrievePayloads: unknown[] = [
    null,
    1,
    { projectId: 1, queryText: "query" },
    { projectId: "project-1", queryText: 2 },
    { projectId: "project-1", queryText: "query", model: 1 },
  ];

  for (const payload of invalidRetrievePayloads) {
    const response = (await retrieveHandler?.({}, payload)) as {
      ok: boolean;
      error?: { code: string };
    };
    assert.equal(response.ok, false);
    assert.equal(response.error?.code, "INVALID_ARGUMENT");
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
