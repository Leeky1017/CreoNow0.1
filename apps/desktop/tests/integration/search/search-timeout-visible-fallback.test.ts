import assert from "node:assert/strict";

import type { IpcResponse } from "@shared/types/ipc-generated";
import { registerSearchIpcHandlers } from "../../../main/src/ipc/search";
import {
  asIpcMain,
  createFtsDbStub,
  createIpcHarness,
  createLogger,
} from "./hybrid-ranking-test-harness";

type QueryStrategyResponse = IpcResponse<{
  strategy: "fts" | "semantic" | "hybrid";
  fallback: "fts" | "none";
  notice?: string;
  results: Array<{
    documentId: string;
    chunkId: string;
    snippet: string;
  }>;
  total: number;
}>;

function createTimeoutHarness() {
  const logger = createLogger();
  const db = createFtsDbStub({
    projectId: "proj_1",
    rows: [
      {
        documentId: "doc_1",
        title: "Chapter One",
        snippet: "warehouse fallback candidate",
        score: 0.91,
        updatedAt: 1_739_030_400,
      },
    ],
  });
  const { ipcMain, handlers } = createIpcHarness();

  registerSearchIpcHandlers({
    ipcMain: asIpcMain(ipcMain),
    db,
    logger,
    semanticRetriever: {
      search: () => ({
        ok: false,
        error: {
          code: "TIMEOUT",
          message: "semantic timeout",
        },
      }),
    },
  });

  const queryByStrategy = handlers.get("search:query:strategy");
  assert.ok(queryByStrategy, "Missing handler search:query:strategy");
  if (!queryByStrategy) {
    throw new Error("Missing handler search:query:strategy");
  }

  return queryByStrategy;
}

// Scenario Mapping: SR5-R1-S2
{
  const queryByStrategy = createTimeoutHarness();
  const res = (await queryByStrategy(
    {},
    {
      projectId: "proj_1",
      query: "abandoned warehouse",
      strategy: "hybrid",
      limit: 20,
      offset: 0,
    },
  )) as QueryStrategyResponse;

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.strategy, "hybrid");
    assert.equal(res.data.fallback, "fts");
    assert.ok((res.data.notice ?? "").includes("语义检索超时"));
    assert.equal(res.data.total, 1);
    assert.equal(res.data.results[0]?.documentId, "doc_1");
  }
}

// Scenario Mapping: SR5-R1-S3
{
  const queryByStrategy = createTimeoutHarness();
  const res = (await queryByStrategy(
    {},
    {
      projectId: "proj_1",
      query: "abandoned warehouse",
      strategy: "semantic",
      limit: 20,
      offset: 0,
    },
  )) as QueryStrategyResponse;

  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.code, "SEARCH_TIMEOUT");
    const details = res.error.details as {
      fallback?: "fts" | "none";
      notice?: string;
      strategy?: "fts" | "semantic" | "hybrid";
    };
    assert.equal(details.fallback, "none");
    assert.equal(details.strategy, "semantic");
    assert.ok((details.notice ?? "").includes("语义检索超时"));
  }
}
