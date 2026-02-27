import assert from "node:assert/strict";

import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { Logger } from "../../main/src/logging/logger";
import type { EmbeddingService } from "../../main/src/services/embedding/embeddingService";
import { registerEmbeddingIpcHandlers } from "../../main/src/ipc/embedding";

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

  registerEmbeddingIpcHandlers({
    ipcMain,
    db: createDbStub(),
    logger: createLogger(),
    embedding: createEmbeddingStub(),
  } as unknown as Parameters<typeof registerEmbeddingIpcHandlers>[0]);

  const generateHandler = handlers.get("embedding:text:generate");
  assert.ok(generateHandler, "embedding:text:generate handler should be registered");

  for (const payload of [null, 1, { texts: [1] }, { texts: ["ok"], model: 1 }] as unknown[]) {
    const response = (await generateHandler?.({}, payload)) as {
      ok: boolean;
      error?: { code: string };
    };
    assert.equal(response.ok, false);
    assert.equal(response.error?.code, "INVALID_ARGUMENT");
  }

  const searchHandler = handlers.get("embedding:semantic:search");
  assert.ok(searchHandler, "embedding:semantic:search handler should be registered");

  for (const payload of [null, 1, { projectId: 1, queryText: "q" }, { projectId: "p1", queryText: 2 }] as unknown[]) {
    const response = (await searchHandler?.({}, payload)) as {
      ok: boolean;
      error?: { code: string };
    };
    assert.equal(response.ok, false);
    assert.equal(response.error?.code, "INVALID_ARGUMENT");
  }

  const reindexHandler = handlers.get("embedding:index:reindex");
  assert.ok(reindexHandler, "embedding:index:reindex handler should be registered");

  for (const payload of [null, 1, { projectId: 1 }, { projectId: "p1", model: 2 }] as unknown[]) {
    const response = (await reindexHandler?.({}, payload)) as {
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
