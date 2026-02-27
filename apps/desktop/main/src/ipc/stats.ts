import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import { createStatsService } from "../services/stats/statsService";
import { ipcError } from "../services/shared/ipcResult";

type StatsSummary = {
  wordsWritten: number;
  writingSeconds: number;
  skillsUsed: number;
  documentsCreated: number;
};

type StatsDay = { date: string; summary: StatsSummary };

type StatsRange = {
  from: string;
  to: string;
  days: StatsDay[];
  summary: StatsSummary;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKey(x: string): boolean {
  if (!DATE_RE.test(x)) {
    return false;
  }
  const t = Date.parse(`${x}T00:00:00Z`);
  return Number.isFinite(t);
}

/**
 * Register `stats:*` IPC handlers.
 *
 * Why: analytics UI needs stable query channels for today/range, and stats must
 * have deterministic error semantics (`INVALID_ARGUMENT` / `DB_ERROR`).
 */
export function registerStatsIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
}): void {
  deps.ipcMain.handle(
    "stats:day:gettoday",
    async (): Promise<IpcResponse<StatsDay>> => {
      if (!deps.db) {
        return ipcError("DB_ERROR", "Database not ready");
      }

      const svc = createStatsService({ db: deps.db, logger: deps.logger });
      const res = svc.getToday({ ts: Date.now() });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "stats:range:get",
    async (
      _e,
      payload: { from: string; to: string },
    ): Promise<IpcResponse<StatsRange>> => {
      if (!deps.db) {
        return ipcError("DB_ERROR", "Database not ready");
      }

      const from = typeof payload.from === "string" ? payload.from.trim() : "";
      const to = typeof payload.to === "string" ? payload.to.trim() : "";
      if (!isValidDateKey(from)) {
        return ipcError("INVALID_ARGUMENT", "from must be YYYY-MM-DD");
      }
      if (!isValidDateKey(to)) {
        return ipcError("INVALID_ARGUMENT", "to must be YYYY-MM-DD");
      }
      if (from > to) {
        return ipcError("INVALID_ARGUMENT", "from must be <= to");
      }

      const svc = createStatsService({ db: deps.db, logger: deps.logger });
      const res = svc.getRange({ from, to });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}
