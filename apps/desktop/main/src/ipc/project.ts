import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import { createProjectService } from "../services/projects/projectService";
import type { ProjectLifecycle } from "../services/projects/projectLifecycle";
import type { ProjectSessionBindingRegistry } from "./projectSessionBinding";

type ProjectHandlerDeps = {
  ipcMain: IpcMain;
  db: Database.Database | null;
  userDataDir: string;
  logger: Logger;
  projectSessionBinding?: ProjectSessionBindingRegistry;
  projectLifecycle?: ProjectLifecycle;
};

function registerProjectCrudHandlers(deps: ProjectHandlerDeps): void {
  deps.ipcMain.handle(
    "project:project:create",
    async (
      _e,
      payload: {
        name?: string;
        type?: "novel" | "screenplay" | "media";
        description?: string;
        template?:
          | {
              kind: "builtin";
              id: string;
            }
          | {
              kind: "custom";
              structure: {
                folders: string[];
                files: Array<{ path: string; content?: string }>;
              };
            };
      },
    ): Promise<IpcResponse<{ projectId: string; rootPath: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.create({
        name: payload.name,
        type: payload.type,
        description: payload.description,
        template: payload.template,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:createaiassist",
    async (
      _e,
      payload: { prompt: string },
    ): Promise<
      IpcResponse<{
        name: string;
        type: "novel" | "screenplay" | "media";
        description: string;
        chapterOutlines: string[];
        characters: string[];
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.createAiAssistDraft({ prompt: payload.prompt });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:list",
    async (
      _e,
      payload: { includeArchived?: boolean },
    ): Promise<
      IpcResponse<{
        items: Array<{
          projectId: string;
          name: string;
          rootPath: string;
          type: "novel" | "screenplay" | "media";
          stage: "outline" | "draft" | "revision" | "final";
          updatedAt: number;
          archivedAt?: number;
        }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.list({ includeArchived: payload.includeArchived });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:update",
    async (
      _e,
      payload: {
        projectId: string;
        patch: {
          type?: "novel" | "screenplay" | "media";
          description?: string;
          stage?: "outline" | "draft" | "revision" | "final";
          targetWordCount?: number | null;
          targetChapterCount?: number | null;
          narrativePerson?: "first" | "third-limited" | "third-omniscient";
          languageStyle?: string;
          targetAudience?: string;
          defaultSkillSetId?: string | null;
          knowledgeGraphId?: string | null;
        };
      },
    ): Promise<IpcResponse<{ updated: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.update({
        projectId: payload.projectId,
        patch: payload.patch,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:stats",
    async (): Promise<
      IpcResponse<{ total: number; active: number; archived: number }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.stats();
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:rename",
    async (
      _e,
      payload: { projectId: string; name: string },
    ): Promise<
      IpcResponse<{ projectId: string; name: string; updatedAt: number }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.rename({
        projectId: payload.projectId,
        name: payload.name,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:duplicate",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<
      IpcResponse<{ projectId: string; rootPath: string; name: string }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.duplicate({ projectId: payload.projectId });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:archive",
    async (
      _e,
      payload: { projectId: string; archived: boolean },
    ): Promise<
      IpcResponse<{ projectId: string; archived: boolean; archivedAt?: number }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.archive({
        projectId: payload.projectId,
        archived: payload.archived,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}

function registerProjectSessionAndLifecycleHandlers(
  deps: ProjectHandlerDeps,
): void {
  deps.ipcMain.handle(
    "project:project:getcurrent",
    async (
      event,
    ): Promise<IpcResponse<{ projectId: string; rootPath: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.getCurrent();
      if (res.ok) {
        deps.projectSessionBinding?.bind({
          webContentsId: event.sender.id,
          projectId: res.data.projectId,
        });
      }
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:setcurrent",
    async (
      event,
      payload: { projectId: string },
    ): Promise<IpcResponse<{ projectId: string; rootPath: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.setCurrent({ projectId: payload.projectId });
      if (res.ok) {
        deps.projectSessionBinding?.bind({
          webContentsId: event.sender.id,
          projectId: res.data.projectId,
        });
      }
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:switch",
    async (
      event,
      payload: {
        projectId: string;
        fromProjectId: string;
        operatorId: string;
        traceId: string;
      },
    ): Promise<
      IpcResponse<{
        currentProjectId: string;
        switchedAt: string;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });

      const traceId = payload.traceId;
      const lifecycle = deps.projectLifecycle;
      const res = lifecycle
        ? await lifecycle.switchProject({
            fromProjectId: payload.fromProjectId,
            toProjectId: payload.projectId,
            traceId,
            persist: async () => {
              return svc.switchProject({
                projectId: payload.projectId,
                fromProjectId: payload.fromProjectId,
                operatorId: payload.operatorId,
                traceId,
              });
            },
            resolveBindProjectId: ({ fromProjectId, toProjectId, result }) => {
              return result.ok ? toProjectId : fromProjectId;
            },
          })
        : svc.switchProject({
            projectId: payload.projectId,
            fromProjectId: payload.fromProjectId,
            operatorId: payload.operatorId,
            traceId,
          });
      if (res.ok) {
        deps.projectSessionBinding?.bind({
          webContentsId: event.sender.id,
          projectId: res.data.currentProjectId,
        });
      }
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:project:delete",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<IpcResponse<{ deleted: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.delete({ projectId: payload.projectId });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:lifecycle:archive",
    async (
      _e,
      payload: { projectId: string; traceId?: string },
    ): Promise<
      IpcResponse<{
        projectId: string;
        state: "active" | "archived" | "deleted";
        archivedAt?: number;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.lifecycleArchive({
        projectId: payload.projectId,
        traceId: payload.traceId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:lifecycle:restore",
    async (
      _e,
      payload: { projectId: string; traceId?: string },
    ): Promise<
      IpcResponse<{
        projectId: string;
        state: "active" | "archived" | "deleted";
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.lifecycleRestore({
        projectId: payload.projectId,
        traceId: payload.traceId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:lifecycle:purge",
    async (
      _e,
      payload: { projectId: string; traceId?: string },
    ): Promise<
      IpcResponse<{
        projectId: string;
        state: "active" | "archived" | "deleted";
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.lifecyclePurge({
        projectId: payload.projectId,
        traceId: payload.traceId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "project:lifecycle:get",
    async (
      _e,
      payload: { projectId: string; traceId?: string },
    ): Promise<
      IpcResponse<{
        projectId: string;
        state: "active" | "archived" | "deleted";
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createProjectService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        logger: deps.logger,
      });
      const res = svc.lifecycleGet({
        projectId: payload.projectId,
        traceId: payload.traceId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}

/**
 * Register `project:*` IPC handlers.
 *
 * Why: project lifecycle is the stable V1 entry point for documents/context.
 */
export function registerProjectIpcHandlers(deps: ProjectHandlerDeps): void {
  registerProjectCrudHandlers(deps);
  registerProjectSessionAndLifecycleHandlers(deps);
}
