import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type StatsSummary = {
  wordsWritten: number;
  writingSeconds: number;
  skillsUsed: number;
  documentsCreated: number;
};

export type StatsDay = {
  date: string;
  summary: StatsSummary;
};

export type StatsRange = {
  from: string;
  to: string;
  days: StatsDay[];
  summary: StatsSummary;
};

export type StatsService = {
  increment: (args: {
    ts: number;
    delta: Partial<StatsSummary>;
  }) => ServiceResult<{
    updated: true;
    date: string;
  }>;
  getToday: (args: { ts: number }) => ServiceResult<StatsDay>;
  getRange: (args: { from: string; to: string }) => ServiceResult<StatsRange>;
};

const DEFAULT_SUMMARY: StatsSummary = {
  wordsWritten: 0,
  writingSeconds: 0,
  skillsUsed: 0,
  documentsCreated: 0,
};

function asNonNegativeInt(x: unknown): number {
  const n = typeof x === "number" ? x : 0;
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.max(0, Math.floor(n));
}

function utcDateKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

type StatsRow = {
  date: string;
  wordsWritten: number;
  writingSeconds: number;
  skillsUsed: number;
  documentsCreated: number;
};

function rowToDay(row: StatsRow): StatsDay {
  return {
    date: row.date,
    summary: {
      wordsWritten: asNonNegativeInt(row.wordsWritten),
      writingSeconds: asNonNegativeInt(row.writingSeconds),
      skillsUsed: asNonNegativeInt(row.skillsUsed),
      documentsCreated: asNonNegativeInt(row.documentsCreated),
    },
  };
}

function sumSummaries(a: StatsSummary, b: StatsSummary): StatsSummary {
  return {
    wordsWritten: a.wordsWritten + b.wordsWritten,
    writingSeconds: a.writingSeconds + b.writingSeconds,
    skillsUsed: a.skillsUsed + b.skillsUsed,
    documentsCreated: a.documentsCreated + b.documentsCreated,
  };
}

/**
 * Create the main-process stats service.
 *
 * Why: stats must be stored in SQLite for persistence and must expose stable IPC
 * query shapes for analytics UI and Windows E2E.
 */
export function createStatsService(deps: {
  db: Database.Database;
  logger: Logger;
}): StatsService {
  return {
    increment: ({ ts, delta }) => {
      const date = utcDateKey(ts);
      const wordsWritten = asNonNegativeInt(delta.wordsWritten);
      const writingSeconds = asNonNegativeInt(delta.writingSeconds);
      const skillsUsed = asNonNegativeInt(delta.skillsUsed);
      const documentsCreated = asNonNegativeInt(delta.documentsCreated);

      try {
        deps.db
          .prepare(
            "INSERT INTO stats_daily (date, words_written, writing_seconds, skills_used, documents_created, updated_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(date) DO UPDATE SET words_written = words_written + excluded.words_written, writing_seconds = writing_seconds + excluded.writing_seconds, skills_used = skills_used + excluded.skills_used, documents_created = documents_created + excluded.documents_created, updated_at = excluded.updated_at",
          )
          .run(
            date,
            wordsWritten,
            writingSeconds,
            skillsUsed,
            documentsCreated,
            ts,
          );

        deps.logger.info("stats_increment", {
          date,
          wordsWritten,
          writingSeconds,
          skillsUsed,
          documentsCreated,
        });

        return { ok: true, data: { updated: true, date } };
      } catch (error) {
        deps.logger.error("stats_increment_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to update stats");
      }
    },

    getToday: ({ ts }) => {
      const date = utcDateKey(ts);
      try {
        const row = deps.db
          .prepare<
            [string],
            StatsRow
          >("SELECT date, words_written as wordsWritten, writing_seconds as writingSeconds, skills_used as skillsUsed, documents_created as documentsCreated FROM stats_daily WHERE date = ?")
          .get(date);
        if (!row) {
          return { ok: true, data: { date, summary: { ...DEFAULT_SUMMARY } } };
        }
        return { ok: true, data: rowToDay(row) };
      } catch (error) {
        deps.logger.error("stats_get_today_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to load stats");
      }
    },

    getRange: ({ from, to }) => {
      try {
        const rows = deps.db
          .prepare<
            [string, string],
            StatsRow
          >("SELECT date, words_written as wordsWritten, writing_seconds as writingSeconds, skills_used as skillsUsed, documents_created as documentsCreated FROM stats_daily WHERE date >= ? AND date <= ? ORDER BY date ASC")
          .all(from, to);

        const days = rows.map(rowToDay);
        const summary = days.reduce(
          (acc, day) => sumSummaries(acc, day.summary),
          { ...DEFAULT_SUMMARY },
        );

        return { ok: true, data: { from, to, days, summary } };
      } catch (error) {
        deps.logger.error("stats_get_range_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to load stats");
      }
    },
  };
}
