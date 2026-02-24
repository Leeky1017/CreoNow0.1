import assert from "node:assert/strict";

import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import type { EmbeddingService } from "../../services/embedding/embeddingService";
import type { EmbeddingComputeRunner } from "../../services/embedding/embeddingComputeOffload";
import { registerEmbeddingIpcHandlers } from "../embedding";

type EmbeddingGenerateResponse = IpcResponse<{
  vectors: number[][];
  dimension: number;
}>;

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
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
  let runCalls = 0;
  let inComputeRunner = false;
  let observedSignal: AbortSignal | undefined;

  const computeRunner: EmbeddingComputeRunner = {
    run: async (args) => {
      runCalls += 1;
      observedSignal = args.signal;
      inComputeRunner = true;
      try {
        return {
          status: "completed",
          value: await args.execute(new AbortController().signal),
        };
      } finally {
        inComputeRunner = false;
      }
    },
  };

  const embedding: EmbeddingService = {
    encode: () => {
      assert.equal(
        inComputeRunner,
        true,
        "embedding encode must run inside compute runner",
      );
      return {
        ok: true,
        data: {
          vectors: [[0.1, 0.2]],
          dimension: 2,
        },
      };
    },
  };

  const { ipcMain, handlers } = createIpcHarness();

  registerEmbeddingIpcHandlers({
    ipcMain,
    db: {} as Database.Database,
    logger: createLogger(),
    embedding,
    computeRunner,
  } as unknown as Parameters<typeof registerEmbeddingIpcHandlers>[0]);

  const generateHandler = handlers.get("embedding:text:generate");
  assert.ok(
    generateHandler,
    "embedding:text:generate handler should be registered",
  );

  const callerAbort = new AbortController();
  const response = (await generateHandler?.(
    {},
    {
      texts: ["hello"],
      model: "default",
    },
    callerAbort.signal,
  )) as EmbeddingGenerateResponse;

  assert.equal(
    runCalls,
    1,
    "embedding:text:generate should call compute runner exactly once",
  );
  assert.equal(
    observedSignal,
    callerAbort.signal,
    "embedding:text:generate should forward caller AbortSignal",
  );
  assert.equal(response.ok, true);

  if (!response.ok) {
    throw new Error("expected embedding:text:generate success response");
  }

  assert.equal(response.data.dimension, 2);
  assert.deepEqual(response.data.vectors, [[0.1, 0.2]]);

  let errorEncodedInCompute = false;
  const errorEmbedding: EmbeddingService = {
    encode: () => {
      errorEncodedInCompute = inComputeRunner;
      return {
        ok: false,
        error: {
          code: "MODEL_NOT_READY",
          message: "model warming up",
        },
      };
    },
  };

  const errorHarness = createIpcHarness();
  registerEmbeddingIpcHandlers({
    ipcMain: errorHarness.ipcMain,
    db: {} as Database.Database,
    logger: createLogger(),
    embedding: errorEmbedding,
    computeRunner,
  } as unknown as Parameters<typeof registerEmbeddingIpcHandlers>[0]);

  const errorGenerateHandler = errorHarness.handlers.get("embedding:text:generate");
  assert.ok(errorGenerateHandler, "error-path handler should be registered");

  const errorResponse = (await errorGenerateHandler?.(
    {},
    {
      texts: ["hello"],
      model: "default",
    },
    callerAbort.signal,
  )) as EmbeddingGenerateResponse;

  assert.equal(
    errorEncodedInCompute,
    true,
    "error-path encode should still execute in compute runner",
  );
  assert.equal(errorResponse.ok, false);

  if (errorResponse.ok) {
    throw new Error("expected MODEL_NOT_READY response from error-path encode");
  }

  assert.equal(errorResponse.error.code, "MODEL_NOT_READY");

  let directEncodeCalls = 0;
  const directEmbedding: EmbeddingService = {
    encode: () => {
      directEncodeCalls += 1;
      return {
        ok: true,
        data: {
          vectors: [[0.3, 0.4]],
          dimension: 2,
        },
      };
    },
  };

  const directHarness = createIpcHarness();
  registerEmbeddingIpcHandlers({
    ipcMain: directHarness.ipcMain,
    db: {} as Database.Database,
    logger: createLogger(),
    embedding: directEmbedding,
  });

  const directGenerateHandler = directHarness.handlers.get("embedding:text:generate");
  assert.ok(directGenerateHandler, "direct-path handler should be registered");

  const directResponse = (await directGenerateHandler?.(
    {},
    {
      texts: ["hello"],
      model: "default",
    },
  )) as EmbeddingGenerateResponse;

  assert.equal(directEncodeCalls, 1, "direct path should preserve sync encode behavior");
  assert.equal(directResponse.ok, true);
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
