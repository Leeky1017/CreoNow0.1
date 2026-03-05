import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import { redactText } from "@shared/redaction/redact";
import { redactUserDataPath } from "../db/paths";
import type { Logger } from "../logging/logger";
import {
  ensureCreonowDirStructureAsync,
  getCreonowDirStatusAsync,
  getCreonowRootPath,
  listCreonowFilesAsync,
  readCreonowTextFileAsync,
} from "../services/context/contextFs";
import type { CreonowWatchService } from "../services/context/watchService";
import { guardAndNormalizeProjectAccess } from "./projectAccessGuard";
import type { ProjectSessionBindingRegistry } from "./projectSessionBinding";

type ProjectRow = {
  rootPath: string;
};

type ContextFsRegistrarDeps = {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  userDataDir: string;
  watchService: CreonowWatchService;
  projectSessionBinding?: ProjectSessionBindingRegistry;
};

function isReadWithinScope(args: {
  scope: "rules" | "settings";
  p: unknown;
}): boolean {
  return typeof args.p === "string" && args.p.startsWith(`.creonow/${args.scope}/`);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

type HandleWithProjectAccess = <TPayload, TResponse>(
  channel: string,
  listener: (
    event: unknown,
    payload: TPayload,
  ) => Promise<IpcResponse<TResponse>>,
) => void;

function registerContextFsStructureHandlers(
  deps: ContextFsRegistrarDeps,
  handleWithProjectAccess: HandleWithProjectAccess,
): void {
  handleWithProjectAccess(
    "context:creonow:ensure",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<IpcResponse<{ rootPath: string; ensured: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      try {
        const row = deps.db
          .prepare<
            [string],
            ProjectRow
          >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
          .get(payload.projectId);
        if (!row) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const ensured = await ensureCreonowDirStructureAsync(row.rootPath);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        deps.logger.info("context_ensure", {
          projectId: payload.projectId,
          rootPath: redactUserDataPath(deps.userDataDir, row.rootPath),
        });

        return { ok: true, data: { rootPath: row.rootPath, ensured: true } };
      } catch (error) {
        deps.logger.error("creonow_ensure_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to ensure .creonow" },
        };
      }
    },
  );

  handleWithProjectAccess(
    "context:creonow:status",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<
      IpcResponse<{ exists: boolean; watching: boolean; rootPath?: string }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      try {
        const row = deps.db
          .prepare<
            [string],
            ProjectRow
          >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
          .get(payload.projectId);
        if (!row) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const status = await getCreonowDirStatusAsync(row.rootPath);
        if (!status.ok) {
          return { ok: false, error: status.error };
        }

        return {
          ok: true,
          data: {
            exists: status.data.exists,
            watching: deps.watchService.isWatching({
              projectId: payload.projectId,
            }),
            rootPath: row.rootPath,
          },
        };
      } catch (error) {
        deps.logger.error("creonow_status_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: {
            code: "IO_ERROR",
            message: "Failed to read .creonow status",
          },
        };
      }
    },
  );

  handleWithProjectAccess(
    "context:watch:start",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<IpcResponse<{ watching: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      try {
        const row = deps.db
          .prepare<
            [string],
            ProjectRow
          >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
          .get(payload.projectId);
        if (!row) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const ensured = await ensureCreonowDirStructureAsync(row.rootPath);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const creonowRootPath = getCreonowRootPath(row.rootPath);
        const started = deps.watchService.start({
          projectId: payload.projectId,
          creonowRootPath,
        });
        if (!started.ok) {
          return { ok: false, error: started.error };
        }

        deps.logger.info("context_watch_started", {
          projectId: payload.projectId,
        });
        return { ok: true, data: started.data };
      } catch (error) {
        deps.logger.error("context_watch_start_ipc_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: {
            code: "IO_ERROR",
            message: "Failed to start .creonow watch",
          },
        };
      }
    },
  );

  handleWithProjectAccess(
    "context:watch:stop",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<IpcResponse<{ watching: false }>> => {
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      try {
        const stopped = deps.watchService.stop({
          projectId: payload.projectId,
        });
        if (!stopped.ok) {
          return { ok: false, error: stopped.error };
        }

        deps.logger.info("context_watch_stopped", {
          projectId: payload.projectId,
        });
        return { ok: true, data: stopped.data };
      } catch (error) {
        deps.logger.error("context_watch_stop_ipc_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to stop .creonow watch" },
        };
      }
    },
  );
}

function registerContextFsFileHandlers(
  deps: ContextFsRegistrarDeps,
  handleWithProjectAccess: HandleWithProjectAccess,
): void {
  handleWithProjectAccess(
    "context:rules:list",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<
      IpcResponse<{
        items: Array<{ path: string; sizeBytes: number; updatedAtMs: number }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      try {
        const row = deps.db
          .prepare<
            [string],
            ProjectRow
          >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
          .get(payload.projectId);
        if (!row) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const ensured = await ensureCreonowDirStructureAsync(row.rootPath);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const listed = await listCreonowFilesAsync({
          projectRootPath: row.rootPath,
          scope: "rules",
        });
        return listed.ok
          ? { ok: true, data: { items: listed.data.items } }
          : { ok: false, error: listed.error };
      } catch (error) {
        deps.logger.error("context_rules_list_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to list rules" },
        };
      }
    },
  );

  handleWithProjectAccess(
    "context:settings:list",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<
      IpcResponse<{
        items: Array<{ path: string; sizeBytes: number; updatedAtMs: number }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      try {
        const row = deps.db
          .prepare<
            [string],
            ProjectRow
          >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
          .get(payload.projectId);
        if (!row) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const ensured = await ensureCreonowDirStructureAsync(row.rootPath);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const listed = await listCreonowFilesAsync({
          projectRootPath: row.rootPath,
          scope: "settings",
        });
        return listed.ok
          ? { ok: true, data: { items: listed.data.items } }
          : { ok: false, error: listed.error };
      } catch (error) {
        deps.logger.error("context_settings_list_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to list settings" },
        };
      }
    },
  );
}

function registerContextFsReadHandlers(
  deps: ContextFsRegistrarDeps,
  handleWithProjectAccess: HandleWithProjectAccess,
): void {
  handleWithProjectAccess(
    "context:rules:read",
    async (
      _e,
      payload: { projectId: string; path: string },
    ): Promise<
      IpcResponse<{
        path: string;
        content: string;
        sizeBytes: number;
        updatedAtMs: number;
        redactionEvidence: Array<{
          patternId: string;
          sourceRef: string;
          matchCount: number;
        }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }
      if (!isReadWithinScope({ scope: "rules", p: payload.path })) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "Invalid rules path" },
        };
      }

      try {
        const row = deps.db
          .prepare<
            [string],
            ProjectRow
          >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
          .get(payload.projectId);
        if (!row) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const ensured = await ensureCreonowDirStructureAsync(row.rootPath);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const file = await readCreonowTextFileAsync({
          projectRootPath: row.rootPath,
          path: payload.path,
        });
        if (!file.ok) {
          return { ok: false, error: file.error };
        }

        const redacted = redactText({
          text: file.data.content,
          sourceRef: payload.path,
        });
        for (const item of redacted.evidence) {
          deps.logger.info("context_redaction_applied", {
            projectId: payload.projectId,
            patternId: item.patternId,
            matchCount: item.matchCount,
          });
        }

        return {
          ok: true,
          data: {
            path: payload.path,
            content: redacted.redactedText,
            sizeBytes: file.data.sizeBytes,
            updatedAtMs: file.data.updatedAtMs,
            redactionEvidence: redacted.evidence,
          },
        };
      } catch (error) {
        deps.logger.error("context_rules_read_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to read rules file" },
        };
      }
    },
  );

  handleWithProjectAccess(
    "context:settings:read",
    async (
      _e,
      payload: { projectId: string; path: string },
    ): Promise<
      IpcResponse<{
        path: string;
        content: string;
        sizeBytes: number;
        updatedAtMs: number;
        redactionEvidence: Array<{
          patternId: string;
          sourceRef: string;
          matchCount: number;
        }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (!isNonEmptyString(payload.projectId)) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }
      if (!isReadWithinScope({ scope: "settings", p: payload.path })) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "Invalid settings path" },
        };
      }

      try {
        const row = deps.db
          .prepare<
            [string],
            ProjectRow
          >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
          .get(payload.projectId);
        if (!row) {
          return {
            ok: false,
            error: { code: "NOT_FOUND", message: "Project not found" },
          };
        }

        const ensured = await ensureCreonowDirStructureAsync(row.rootPath);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const file = await readCreonowTextFileAsync({
          projectRootPath: row.rootPath,
          path: payload.path,
        });
        if (!file.ok) {
          return { ok: false, error: file.error };
        }

        const redacted = redactText({
          text: file.data.content,
          sourceRef: payload.path,
        });
        for (const item of redacted.evidence) {
          deps.logger.info("context_redaction_applied", {
            projectId: payload.projectId,
            patternId: item.patternId,
            matchCount: item.matchCount,
          });
        }

        return {
          ok: true,
          data: {
            path: payload.path,
            content: redacted.redactedText,
            sizeBytes: file.data.sizeBytes,
            updatedAtMs: file.data.updatedAtMs,
            redactionEvidence: redacted.evidence,
          },
        };
      } catch (error) {
        deps.logger.error("context_settings_read_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to read settings file" },
        };
      }
    },
  );
}

export function registerContextFsHandlers(deps: ContextFsRegistrarDeps): void {
  const handleWithProjectAccess: HandleWithProjectAccess = (channel, listener) => {
    deps.ipcMain.handle(channel, async (event, payload) => {
      const guarded = guardAndNormalizeProjectAccess({
        event,
        payload,
        projectSessionBinding: deps.projectSessionBinding,
      });
      if (!guarded.ok) {
        return guarded.response;
      }
      return listener(event, payload);
    });
  };

  registerContextFsStructureHandlers(deps, handleWithProjectAccess);
  registerContextFsFileHandlers(deps, handleWithProjectAccess);
  registerContextFsReadHandlers(deps, handleWithProjectAccess);
}
