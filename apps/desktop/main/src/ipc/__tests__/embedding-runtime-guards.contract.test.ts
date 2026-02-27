import assert from "node:assert/strict";

import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { EmbeddingService } from "../../services/embedding/embeddingService";
import { registerEmbeddingIpcHandlers } from "../embedding";

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
  const embedding: EmbeddingService = {
    encode: () => ({
      ok: true,
      data: {
        vectors: [[0.1, 0.2]],
        dimension: 2,
      },
    }),
  };

  registerEmbeddingIpcHandlers({
    ipcMain,
    db: {} as Database.Database,
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
    embedding,
  });

  const generateHandler = handlers.get("embedding:text:generate");
  assert.ok(generateHandler, "embedding:text:generate handler should exist");

  const invalidGeneratePayloads: unknown[] = [
    null,
    1,
    { texts: "x" },
    { texts: ["ok", 1] },
    { texts: ["ok"], model: 2 },
  ];

  for (const payload of invalidGeneratePayloads) {
    const response = (await generateHandler?.({}, payload)) as {
      ok: boolean;
      error?: { code: string };
    };
    assert.equal(response.ok, false);
    assert.equal(response.error?.code, "INVALID_ARGUMENT");
  }

  const semanticHandler = handlers.get("embedding:semantic:search");
  assert.ok(semanticHandler, "embedding:semantic:search handler should exist");

  const invalidSemanticPayloads: unknown[] = [
    null,
    1,
    { projectId: 1, queryText: "hello" },
    { projectId: "p1", queryText: 2 },
    { projectId: "p1", queryText: "hello", topK: "3" },
    { projectId: "p1", queryText: "hello", minScore: "0.5" },
    { projectId: "p1", queryText: "hello", model: 3 },
  ];

  for (const payload of invalidSemanticPayloads) {
    const response = (await semanticHandler?.({}, payload)) as {
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
