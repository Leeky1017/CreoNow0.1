import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import { createStatsService } from "../statsService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

type StatsRow = {
  date: string;
  wordsWritten: number;
  writingSeconds: number;
  skillsUsed: number;
  documentsCreated: number;
};

function createDbStub(args?: {
  runError?: Error;
  getRow?: StatsRow | undefined;
  allRows?: StatsRow[];
  getAllError?: Error;
}): Database.Database {
  const runError = args?.runError;
  const getRow = args?.getRow;
  const allRows = args?.allRows ?? [];
  const getAllError = args?.getAllError;

  return {
    prepare: (sql: string) => {
      if (sql.includes("INSERT INTO stats_daily")) {
        return {
          run: (..._params: unknown[]) => {
            if (runError) {
              throw runError;
            }
            return { changes: 1 };
          },
        };
      }

      if (sql.includes("FROM stats_daily WHERE date = ?")) {
        return {
          get: (..._params: unknown[]) => {
            if (getAllError) {
              throw getAllError;
            }
            return getRow;
          },
        };
      }

      if (sql.includes("FROM stats_daily WHERE date >= ?")) {
        return {
          all: (..._params: unknown[]) => {
            if (getAllError) {
              throw getAllError;
            }
            return allRows;
          },
        };
      }

      return {
        run: () => ({ changes: 0 }),
        get: () => undefined,
        all: () => [],
      };
    },
  } as unknown as Database.Database;
}

// ── S1: increment happy path → returns { updated: true, date } ──
{
  const svc = createStatsService({
    db: createDbStub(),
    logger: createLogger(),
  });

  const ts = new Date("2025-06-15T10:30:00Z").getTime();
  const result = svc.increment({
    ts,
    delta: { wordsWritten: 42, writingSeconds: 300 },
  });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.data.updated, true);
  assert.equal(result.data.date, "2025-06-15");
}

// ── S2: increment with DB error → returns DB_ERROR ──
{
  const svc = createStatsService({
    db: createDbStub({ runError: new Error("disk full") }),
    logger: createLogger(),
  });

  const ts = new Date("2025-06-15T10:30:00Z").getTime();
  const result = svc.increment({
    ts,
    delta: { wordsWritten: 10 },
  });

  assert.equal(result.ok, false);
  if (result.ok) throw new Error("unreachable");
  assert.equal(result.error.code, "DB_ERROR");
}

// ── S3: getToday with no data → returns zero summary ──
{
  const svc = createStatsService({
    db: createDbStub({ getRow: undefined }),
    logger: createLogger(),
  });

  const ts = new Date("2025-06-15T10:30:00Z").getTime();
  const result = svc.getToday({ ts });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.data.date, "2025-06-15");
  assert.equal(result.data.summary.wordsWritten, 0);
  assert.equal(result.data.summary.writingSeconds, 0);
  assert.equal(result.data.summary.skillsUsed, 0);
  assert.equal(result.data.summary.documentsCreated, 0);
}

// ── S4: getRange returns aggregated summary across multiple days ──
{
  const rows: StatsRow[] = [
    {
      date: "2025-06-14",
      wordsWritten: 100,
      writingSeconds: 600,
      skillsUsed: 2,
      documentsCreated: 1,
    },
    {
      date: "2025-06-15",
      wordsWritten: 200,
      writingSeconds: 900,
      skillsUsed: 3,
      documentsCreated: 0,
    },
  ];

  const svc = createStatsService({
    db: createDbStub({ allRows: rows }),
    logger: createLogger(),
  });

  const result = svc.getRange({ from: "2025-06-14", to: "2025-06-15" });

  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  assert.equal(result.data.from, "2025-06-14");
  assert.equal(result.data.to, "2025-06-15");
  assert.equal(result.data.days.length, 2);
  assert.equal(result.data.summary.wordsWritten, 300);
  assert.equal(result.data.summary.writingSeconds, 1500);
  assert.equal(result.data.summary.skillsUsed, 5);
  assert.equal(result.data.summary.documentsCreated, 1);
}

console.log("statsService.test.ts: all assertions passed");
