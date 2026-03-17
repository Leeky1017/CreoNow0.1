import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import { createFtsService } from "../ftsService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

type FulltextRow = {
  projectId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  snippet: string;
  score: number;
  updatedAt: number;
};

function createDbStub(args?: {
  searchRows?: FulltextRow[];
  countRow?: { total: number };
  searchError?: Error;
  reindexChanges?: number;
  reindexError?: Error;
}): Database.Database {
  const searchRows = args?.searchRows ?? [];
  const countRow = args?.countRow ?? { total: searchRows.length };
  const searchError = args?.searchError;
  const reindexChanges = args?.reindexChanges ?? 0;
  const reindexError = args?.reindexError;

  return {
    prepare: (sql: string) => {
      if (sql.includes("SELECT COUNT(*)")) {
        return {
          get: (..._params: unknown[]) => {
            if (searchError) {
              throw searchError;
            }
            return countRow;
          },
        };
      }

      if (sql.includes("FROM documents_fts") && sql.includes("MATCH")) {
        return {
          all: (..._params: unknown[]) => {
            if (searchError) {
              throw searchError;
            }
            return searchRows;
          },
        };
      }

      if (sql.includes("DELETE FROM documents_fts")) {
        return {
          run: (..._params: unknown[]) => {
            if (reindexError) {
              throw reindexError;
            }
            return { changes: 0 };
          },
        };
      }

      if (sql.includes("INSERT OR REPLACE INTO documents_fts")) {
        return {
          run: (..._params: unknown[]) => {
            if (reindexError) {
              throw reindexError;
            }
            return { changes: reindexChanges };
          },
        };
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },
  } as unknown as Database.Database;
}

// S1: search returns results with highlights and pagination
{
  const rows: FulltextRow[] = [
    {
      projectId: "proj-1",
      documentId: "doc-1",
      documentTitle: "第一章",
      documentType: "chapter",
      snippet: "月光照在古道上",
      score: 1.5,
      updatedAt: 1000,
    },
    {
      projectId: "proj-1",
      documentId: "doc-2",
      documentTitle: "第二章",
      documentType: "chapter",
      snippet: "月光穿过窗棂",
      score: 1.2,
      updatedAt: 2000,
    },
  ];
  const svc = createFtsService({
    db: createDbStub({ searchRows: rows, countRow: { total: 5 } }),
    logger: createLogger(),
  });

  const res = svc.search({
    projectId: "proj-1",
    query: "月光",
    limit: 2,
    offset: 0,
  });
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error("unreachable");

  assert.equal(res.data.results.length, 2);
  assert.equal(res.data.total, 5);
  assert.equal(res.data.hasMore, true);
  assert.equal(res.data.indexState, "ready");

  const first = res.data.results[0]!;
  assert.equal(first.documentId, "doc-1");
  assert.equal(first.snippet, "月光照在古道上");
  assert.ok(first.highlights.length > 0, "should have highlights");
  assert.equal(first.highlights[0]!.start, 0);
  assert.deepStrictEqual(first.anchor, { start: 0, end: 1 });
}

// S2: search with empty projectId returns INVALID_ARGUMENT
{
  const svc = createFtsService({
    db: createDbStub(),
    logger: createLogger(),
  });

  const res = svc.search({ projectId: "", query: "test" });
  assert.equal(res.ok, false);
  if (res.ok) throw new Error("unreachable");
  assert.equal(res.error.code, "INVALID_ARGUMENT");
  assert.ok(res.error.message.toLowerCase().includes("projectid"));
}

// S3: search with empty query returns INVALID_ARGUMENT
{
  const svc = createFtsService({
    db: createDbStub(),
    logger: createLogger(),
  });

  const res = svc.search({ projectId: "proj-1", query: "   " });
  assert.equal(res.ok, false);
  if (res.ok) throw new Error("unreachable");
  assert.equal(res.error.code, "INVALID_ARGUMENT");
  assert.ok(res.error.message.toLowerCase().includes("query"));
}

// S4: search with query too long returns INVALID_ARGUMENT
{
  const svc = createFtsService({
    db: createDbStub(),
    logger: createLogger(),
  });

  const longQuery = "a".repeat(1025);
  const res = svc.search({ projectId: "proj-1", query: longQuery });
  assert.equal(res.ok, false);
  if (res.ok) throw new Error("unreachable");
  assert.equal(res.error.code, "INVALID_ARGUMENT");
  assert.ok(res.error.message.toLowerCase().includes("too long"));
}

// S5: search with invalid limit returns INVALID_ARGUMENT
{
  const svc = createFtsService({
    db: createDbStub(),
    logger: createLogger(),
  });

  // limit = 0
  const r1 = svc.search({ projectId: "proj-1", query: "test", limit: 0 });
  assert.equal(r1.ok, false);
  if (!r1.ok) assert.equal(r1.error.code, "INVALID_ARGUMENT");

  // negative limit
  const r2 = svc.search({ projectId: "proj-1", query: "test", limit: -5 });
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.error.code, "INVALID_ARGUMENT");

  // limit exceeds max (100)
  const r3 = svc.search({ projectId: "proj-1", query: "test", limit: 101 });
  assert.equal(r3.ok, false);
  if (!r3.ok) assert.equal(r3.error.code, "INVALID_ARGUMENT");

  // non-integer limit
  const r4 = svc.search({ projectId: "proj-1", query: "test", limit: 2.5 });
  assert.equal(r4.ok, false);
  if (!r4.ok) assert.equal(r4.error.code, "INVALID_ARGUMENT");

  // NaN limit
  const r5 = svc.search({ projectId: "proj-1", query: "test", limit: NaN });
  assert.equal(r5.ok, false);
  if (!r5.ok) assert.equal(r5.error.code, "INVALID_ARGUMENT");

  // negative offset
  const r6 = svc.search({ projectId: "proj-1", query: "test", offset: -1 });
  assert.equal(r6.ok, false);
  if (!r6.ok) assert.equal(r6.error.code, "INVALID_ARGUMENT");

  // non-integer offset
  const r7 = svc.search({ projectId: "proj-1", query: "test", offset: 1.5 });
  assert.equal(r7.ok, false);
  if (!r7.ok) assert.equal(r7.error.code, "INVALID_ARGUMENT");
}

// S6: FTS syntax error from DB returns INVALID_ARGUMENT
{
  const svc = createFtsService({
    db: createDbStub({
      searchError: new Error("fts5: syntax error near 'AND'"),
    }),
    logger: createLogger(),
  });

  const res = svc.search({ projectId: "proj-1", query: "AND OR NOT" });
  assert.equal(res.ok, false);
  if (res.ok) throw new Error("unreachable");
  assert.equal(res.error.code, "INVALID_ARGUMENT");
  assert.ok(res.error.message.toLowerCase().includes("syntax"));
}

// S7: FTS corruption triggers reindex and returns rebuilding state
{
  let reindexCalled = false;
  const db = {
    prepare: (sql: string) => {
      if (sql.includes("FROM documents_fts") && sql.includes("MATCH")) {
        return {
          all: () => {
            throw new Error("database disk image is malformed");
          },
        };
      }
      if (sql.includes("SELECT COUNT(*)")) {
        return {
          get: () => {
            throw new Error("database disk image is malformed");
          },
        };
      }
      if (sql.includes("DELETE FROM documents_fts")) {
        reindexCalled = true;
        return { run: () => ({ changes: 0 }) };
      }
      if (sql.includes("INSERT OR REPLACE INTO documents_fts")) {
        return { run: () => ({ changes: 3 }) };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  } as unknown as Database.Database;

  const svc = createFtsService({ db, logger: createLogger() });

  const res = svc.search({ projectId: "proj-1", query: "test" });
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error("unreachable");
  assert.equal(res.data.indexState, "rebuilding");
  assert.equal(res.data.results.length, 0);
  assert.equal(res.data.total, 0);
  assert.equal(res.data.hasMore, false);
  assert.ok(reindexCalled, "reindex should have been triggered");
}

// S8: reindex happy path returns correct count
{
  const svc = createFtsService({
    db: createDbStub({ reindexChanges: 42 }),
    logger: createLogger(),
  });

  const res = svc.reindex({ projectId: "proj-1" });
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error("unreachable");
  assert.equal(res.data.indexState, "ready");
  assert.equal(res.data.reindexed, 42);
}

// S8b: reindex with empty projectId returns INVALID_ARGUMENT
{
  const svc = createFtsService({
    db: createDbStub(),
    logger: createLogger(),
  });

  const res = svc.reindex({ projectId: "  " });
  assert.equal(res.ok, false);
  if (res.ok) throw new Error("unreachable");
  assert.equal(res.error.code, "INVALID_ARGUMENT");
}

// S9: searchFulltext maps results to FulltextSearchItem format
{
  const rows: FulltextRow[] = [
    {
      projectId: "proj-1",
      documentId: "doc-1",
      documentTitle: "序章",
      documentType: "chapter",
      snippet: "白日依山尽",
      score: 2.0,
      updatedAt: 3000,
    },
  ];
  const svc = createFtsService({
    db: createDbStub({ searchRows: rows, countRow: { total: 1 } }),
    logger: createLogger(),
  });

  const res = svc.searchFulltext({ projectId: "proj-1", query: "白日" });
  assert.equal(res.ok, true);
  if (!res.ok) throw new Error("unreachable");
  assert.equal(res.data.items.length, 1);

  const item = res.data.items[0]!;
  assert.equal(item.projectId, "proj-1");
  assert.equal(item.documentId, "doc-1");
  assert.equal(item.title, "序章");
  assert.equal(item.snippet, "白日依山尽");
  assert.equal(item.score, 2.0);
  assert.equal(item.updatedAt, 3000);
}

console.log("ftsService.test.ts: all assertions passed");
