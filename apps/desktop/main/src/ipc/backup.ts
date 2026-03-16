import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcError, IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import {
  createBackupSnapshot,
  listBackupSnapshots,
  restoreBackupSnapshot,
  deleteBackupSnapshot,
  type BackupSnapshot,
} from "../services/documents/backupService";

type BackupPayloadError = IpcError;

function invalidPayload(message: string): BackupPayloadError {
  return { code: "INVALID_ARGUMENT", message };
}

function validateProjectPayload(
  payload: unknown,
): { ok: true; projectId: string } | { ok: false; error: BackupPayloadError } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: invalidPayload("payload must be an object") };
  }
  const projectId = (payload as { projectId?: unknown }).projectId;
  if (typeof projectId !== "string" || projectId.length === 0) {
    return {
      ok: false,
      error: invalidPayload("projectId must be a non-empty string"),
    };
  }
  return { ok: true, projectId };
}

function validateBackupIdPayload(
  payload: unknown,
): { ok: true; backupId: string } | { ok: false; error: BackupPayloadError } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: invalidPayload("payload must be an object") };
  }
  const backupId = (payload as { backupId?: unknown }).backupId;
  if (typeof backupId !== "string" || backupId.length === 0) {
    return {
      ok: false,
      error: invalidPayload("backupId must be a non-empty string"),
    };
  }
  return { ok: true, backupId };
}

function toBackupError(error: unknown): BackupPayloadError {
  if (error instanceof Error) {
    const knownCodes = [
      "BACKUP_INVALID_PROJECT",
      "BACKUP_PROJECT_NOT_FOUND",
      "BACKUP_INVALID_ID",
      "BACKUP_SNAPSHOT_NOT_FOUND",
    ] as const;
    for (const code of knownCodes) {
      if (error.message === code) {
        return { code: "INVALID_ARGUMENT", message: error.message };
      }
    }
  }
  return {
    code: "DB_ERROR",
    message: error instanceof Error ? error.message : String(error),
  };
}

export function registerBackupIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
}): void {
  deps.ipcMain.handle(
    "backup:snapshot:create",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<BackupSnapshot>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const validated = validateProjectPayload(payload);
      if (!validated.ok) {
        return { ok: false, error: validated.error };
      }
      try {
        const label = (payload as { label?: unknown }).label;
        const snapshot = createBackupSnapshot(
          { db: deps.db, logger: deps.logger },
          validated.projectId,
          typeof label === "string" ? label : undefined,
        );
        return { ok: true, data: snapshot };
      } catch (error) {
        deps.logger.error("ipc_backup_create_error", {
          message: error instanceof Error ? error.message : String(error),
        });
        return { ok: false, error: toBackupError(error) };
      }
    },
  );

  deps.ipcMain.handle(
    "backup:snapshot:list",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<BackupSnapshot[]>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const validated = validateProjectPayload(payload);
      if (!validated.ok) {
        return { ok: false, error: validated.error };
      }
      try {
        const snapshots = listBackupSnapshots(
          { db: deps.db, logger: deps.logger },
          validated.projectId,
        );
        return { ok: true, data: snapshots };
      } catch (error) {
        deps.logger.error("ipc_backup_list_error", {
          message: error instanceof Error ? error.message : String(error),
        });
        return { ok: false, error: toBackupError(error) };
      }
    },
  );

  deps.ipcMain.handle(
    "backup:snapshot:restore",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<BackupSnapshot>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const validated = validateBackupIdPayload(payload);
      if (!validated.ok) {
        return { ok: false, error: validated.error };
      }
      try {
        const snapshot = restoreBackupSnapshot(
          { db: deps.db, logger: deps.logger },
          validated.backupId,
        );
        return { ok: true, data: snapshot };
      } catch (error) {
        deps.logger.error("ipc_backup_restore_error", {
          message: error instanceof Error ? error.message : String(error),
        });
        return { ok: false, error: toBackupError(error) };
      }
    },
  );

  deps.ipcMain.handle(
    "backup:snapshot:delete",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<{ deleted: boolean }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const validated = validateBackupIdPayload(payload);
      if (!validated.ok) {
        return { ok: false, error: validated.error };
      }
      try {
        deleteBackupSnapshot(
          { db: deps.db, logger: deps.logger },
          validated.backupId,
        );
        return { ok: true, data: { deleted: true } };
      } catch (error) {
        deps.logger.error("ipc_backup_delete_error", {
          message: error instanceof Error ? error.message : String(error),
        });
        return { ok: false, error: toBackupError(error) };
      }
    },
  );
}
