import assert from "node:assert/strict";

import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import type { EmbeddingService } from "../../services/embedding/embeddingService";
import type {
  SemanticChunk,
  SemanticChunkIndexService,
} from "../../services/embedding/semanticChunkIndexService";
import type { RagComputeRunner } from "../../services/rag/ragComputeOffload";
import { registerRagIpcHandlers } from "../rag";

type RagContextResponse = IpcResponse<{
  chunks: Array<{
    chunkId: string;
    documentId: string;
    text: string;
    score: number;
    tokenEstimate: number;
  }>;
  truncated: boolean;
  usedTokens: number;
  fallback?: {
    from: "semantic";
    to: "fts";
    reason: string;
  };
}>;

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDbStub(): Database.Database {
  return {
    prepare: (sql: string) => {
      if (sql.includes("FROM documents WHERE project_id = ?")) {
        return {
          all: () => [
            {
              documentId: "doc-1",
              contentText: "warehouse memo",
              updatedAt: 7,
            },
          ],
        };
      }

      if (sql.includes("COUNT(*) as total")) {
        return {
          get: () => ({ total: 2 }),
        };
      }

      if (sql.includes("FROM documents_fts")) {
        return {
          all: () => [
            {
              projectId: "project-1",
              documentId: "doc-1",
              documentTitle: "Doc 1",
              documentType: "chapter",
              snippet: "abcdefgh",
              score: 0.92,
              updatedAt: 7,
            },
            {
              projectId: "project-1",
              documentId: "doc-2",
              documentTitle: "Doc 2",
              documentType: "chapter",
              snippet: "abcdefghijkl",
              score: 0.91,
              updatedAt: 6,
            },
          ],
        };
      }

      throw new Error(`unexpected sql in test: ${sql}`);
    },
  } as unknown as Database.Database;
}

function createEmbeddingStub(): EmbeddingService {
  return {
    encode: () => ({
      ok: false,
      error: {
        code: "MODEL_NOT_READY",
        message: "embedding not needed in this contract test",
      },
    }),
  };
}

function createSemanticIndexStub(args: {
  onSearch: () => void;
}): SemanticChunkIndexService {
  return {
    upsertDocument: () => ({
      ok: true,
      data: {
        changedChunkIds: [],
        unchangedChunkIds: [],
        removedChunkIds: [],
        totalChunks: 0,
      },
    }),
    reindexProject: () => ({
      ok: true,
      data: {
        indexedDocuments: 0,
        indexedChunks: 0,
        changedChunks: 0,
      },
    }),
    search: () => {
      args.onSearch();
      return {
        ok: false,
        error: {
          code: "MODEL_NOT_READY",
          message: "semantic model booting",
        },
      };
    },
    listProjectChunks: (): SemanticChunk[] => [],
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
  let observedTimeoutMs: number | undefined;

  const computeRunner: RagComputeRunner = {
    run: async (args) => {
      runCalls += 1;
      observedSignal = args.signal;
      observedTimeoutMs = args.timeoutMs;
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

  const { ipcMain, handlers } = createIpcHarness();

  registerRagIpcHandlers({
    ipcMain,
    db: createDbStub(),
    logger: createLogger(),
    embedding: createEmbeddingStub(),
    ragRerank: { enabled: false },
    semanticIndex: createSemanticIndexStub({
      onSearch: () => {
        assert.equal(
          inComputeRunner,
          true,
          "rag retrieve semantic search must run inside compute runner",
        );
      },
    }),
    computeRunner,
  } as unknown as Parameters<typeof registerRagIpcHandlers>[0]);

  const retrieveHandler = handlers.get("rag:context:retrieve");
  assert.ok(retrieveHandler, "rag:context:retrieve handler should be registered");
  const callerAbort = new AbortController();

  const response = (await retrieveHandler?.(
    {},
    {
      projectId: "project-1",
      queryText: "warehouse",
      topK: 2,
      maxTokens: 4,
    },
    callerAbort.signal,
  )) as RagContextResponse;

  assert.equal(runCalls, 1, "rag retrieve should call compute runner exactly once");
  assert.equal(
    observedSignal,
    callerAbort.signal,
    "rag retrieve should forward caller AbortSignal to compute runner",
  );
  assert.equal(
    observedTimeoutMs,
    5_000,
    "rag retrieve should set compute runner timeout to avoid long-running stalls",
  );
  assert.equal(response.ok, true);
  if (!response.ok) {
    throw new Error("expected rag retrieve success response");
  }

  assert.equal(response.data.chunks.length, 1);
  assert.equal(response.data.chunks[0]?.documentId, "doc-1");
  assert.equal(response.data.fallback?.reason, "MODEL_NOT_READY");
  assert.equal(
    response.data.truncated,
    true,
    "rag fallback should preserve token-budget truncation behavior",
  );
  assert.equal(response.data.usedTokens, 2);

  let abortedSearchCalls = 0;

  const abortedSignalRunner: RagComputeRunner = {
    run: async (args) => {
      const aborted = new AbortController();
      aborted.abort("timeout");
      return {
        status: "completed",
        value: await args.execute(aborted.signal),
      };
    },
  };

  const abortedHarness = createIpcHarness();
  registerRagIpcHandlers({
    ipcMain: abortedHarness.ipcMain,
    db: createDbStub(),
    logger: createLogger(),
    embedding: createEmbeddingStub(),
    ragRerank: { enabled: false },
    semanticIndex: createSemanticIndexStub({
      onSearch: () => {
        abortedSearchCalls += 1;
      },
    }),
    computeRunner: abortedSignalRunner,
  } as unknown as Parameters<typeof registerRagIpcHandlers>[0]);

  const abortedRetrieveHandler = abortedHarness.handlers.get(
    "rag:context:retrieve",
  );
  assert.ok(
    abortedRetrieveHandler,
    "rag:context:retrieve handler should be registered for aborted-signal scenario",
  );

  const abortedResponse = (await abortedRetrieveHandler?.(
    {},
    {
      projectId: "project-1",
      queryText: "warehouse",
      topK: 2,
      maxTokens: 4,
    },
  )) as RagContextResponse;

  assert.equal(
    abortedSearchCalls,
    0,
    "aborted compute signal should short-circuit before semantic search",
  );
  assert.equal(abortedResponse.ok, false);
  if (abortedResponse.ok) {
    throw new Error("expected aborted-signal scenario to return an error");
  }
  assert.equal(abortedResponse.error.code, "CANCELED");

  const timeoutHarness = createIpcHarness();
  const timeoutRunner: RagComputeRunner = {
    run: async () => ({
      status: "timeout",
      error: new Error("compute timeout"),
    }),
  };
  registerRagIpcHandlers({
    ipcMain: timeoutHarness.ipcMain,
    db: createDbStub(),
    logger: createLogger(),
    embedding: createEmbeddingStub(),
    ragRerank: { enabled: false },
    semanticIndex: createSemanticIndexStub({
      onSearch: () => {},
    }),
    computeRunner: timeoutRunner,
  } as unknown as Parameters<typeof registerRagIpcHandlers>[0]);

  const timeoutRetrieveHandler = timeoutHarness.handlers.get(
    "rag:context:retrieve",
  );
  assert.ok(timeoutRetrieveHandler, "timeout-path handler should be registered");
  const timeoutResponse = (await timeoutRetrieveHandler?.(
    {},
    {
      projectId: "project-1",
      queryText: "warehouse",
      topK: 2,
      maxTokens: 4,
    },
  )) as RagContextResponse;
  assert.equal(timeoutResponse.ok, false);
  if (timeoutResponse.ok) {
    throw new Error("expected timeout-path scenario to return an error");
  }
  assert.equal(timeoutResponse.error.code, "SEARCH_TIMEOUT");

  const abortedRunnerHarness = createIpcHarness();
  const abortedRunner: RagComputeRunner = {
    run: async () => ({
      status: "aborted",
      error: new Error("compute aborted"),
    }),
  };
  registerRagIpcHandlers({
    ipcMain: abortedRunnerHarness.ipcMain,
    db: createDbStub(),
    logger: createLogger(),
    embedding: createEmbeddingStub(),
    ragRerank: { enabled: false },
    semanticIndex: createSemanticIndexStub({
      onSearch: () => {},
    }),
    computeRunner: abortedRunner,
  } as unknown as Parameters<typeof registerRagIpcHandlers>[0]);

  const abortedRunnerRetrieveHandler = abortedRunnerHarness.handlers.get(
    "rag:context:retrieve",
  );
  assert.ok(
    abortedRunnerRetrieveHandler,
    "aborted-path handler should be registered",
  );
  const abortedRunnerResponse = (await abortedRunnerRetrieveHandler?.(
    {},
    {
      projectId: "project-1",
      queryText: "warehouse",
      topK: 2,
      maxTokens: 4,
    },
  )) as RagContextResponse;
  assert.equal(abortedRunnerResponse.ok, false);
  if (abortedRunnerResponse.ok) {
    throw new Error("expected aborted-path scenario to return an error");
  }
  assert.equal(abortedRunnerResponse.error.code, "CANCELED");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
