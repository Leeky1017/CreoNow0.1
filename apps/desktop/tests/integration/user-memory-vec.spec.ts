import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import { createUserMemoryVecService } from "../../main/src/services/memory/userMemoryVec";
import type { Logger } from "../../main/src/logging/logger";

type Statement = {
  get?: (...args: unknown[]) => unknown;
  run?: (...args: unknown[]) => unknown;
  all?: (...args: unknown[]) => unknown[];
};

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDbStub(args: {
  loadExtension?: (path: string) => void;
  readDimension?: number | null;
  knnRows?: Array<{ memoryId: string; distance: number }>;
}): Database.Database {
  const loadExtension = args.loadExtension ?? (() => {});
  const readDimension = args.readDimension ?? null;
  const knnRows = args.knnRows ?? [];

  const db = {
    loadExtension,
    exec: (_sql: string) => {},
    transaction: (fn: () => void) => {
      return () => fn();
    },
    prepare: (sql: string): Statement => {
      if (sql.includes("SELECT value_json as valueJson FROM settings")) {
        return {
          get: () =>
            readDimension === null
              ? undefined
              : { valueJson: JSON.stringify(readDimension) },
        };
      }

      if (sql.includes("INSERT INTO settings")) {
        return { run: () => ({}) };
      }

      if (sql.startsWith("INSERT INTO user_memory_vec")) {
        return { run: () => ({}) };
      }

      if (sql.startsWith("SELECT memory_id as memoryId, distance")) {
        return { all: () => knnRows };
      }

      return {};
    },
  };

  return db as unknown as Database.Database;
}

const logger = createLogger();

{
  const db = createDbStub({
    loadExtension: () => {
      throw new Error("loadExtension failed");
    },
  });
  const svc = createUserMemoryVecService({ db, logger });

  const res = svc.topK({
    sources: [{ memoryId: "m1", content: "hello" }],
    queryText: "hello",
    k: 1,
    ts: Date.now(),
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.dimension, 64);
    assert.equal(res.data.matches.length, 1);
    assert.equal(res.data.matches[0]?.memoryId, "m1");
    assert.equal(res.data.matches[0]?.score, 1);
  }
}

{
  const db = createDbStub({ readDimension: 123 });
  const svc = createUserMemoryVecService({ db, logger });

  const res = svc.topK({
    sources: [{ memoryId: "m1", content: "hello" }],
    queryText: "hello",
    k: 1,
    ts: Date.now(),
  });

  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.code, "CONFLICT");
    assert.equal(res.error.message, "user_memory_vec dimension mismatch");
  }
}

{
  const db = createDbStub({
    readDimension: null,
    knnRows: [
      { memoryId: "m1", distance: 0 },
      { memoryId: "m2", distance: 1 },
    ],
  });
  const svc = createUserMemoryVecService({ db, logger });

  const res = svc.topK({
    sources: [
      { memoryId: "m1", content: "Prefer bullets" },
      { memoryId: "m2", content: "Prefer numbered lists" },
    ],
    queryText: "bullets",
    k: 2,
    ts: Date.now(),
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.dimension, 64);
    assert.equal(res.data.matches.length, 2);
    assert.equal(res.data.matches[0]?.memoryId, "m1");
    assert.equal(res.data.matches[0]?.score, 1);
    assert.equal(res.data.matches[1]?.score, 0.5);
  }
}
