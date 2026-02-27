import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";

/**
 * Enforce production hardening for debug-only DB inspection channel.
 */
function shouldRegisterDbDebugChannel(env: NodeJS.ProcessEnv): boolean {
  if (env.CREONOW_ENABLE_DB_DEBUG === "1") {
    return true;
  }
  return env.NODE_ENV === "development" || env.NODE_ENV === "test";
}

/**
 * Register `db:debug:tablenames` only outside production.
 */
export function registerDbDebugIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  env: NodeJS.ProcessEnv;
}): void {
  if (!shouldRegisterDbDebugChannel(deps.env)) {
    return;
  }

  deps.ipcMain.handle(
    "db:debug:tablenames",
    async (): Promise<IpcResponse<{ tableNames: string[] }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      try {
        const rows = deps.db
          .prepare<
            [],
            { name: string }
          >("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
          .all();
        const tableNames = rows.map((row) => row.name).sort();
        return { ok: true, data: { tableNames } };
      } catch (error) {
        deps.logger.error("db_list_tables_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Failed to list tables" },
        };
      }
    },
  );
}
