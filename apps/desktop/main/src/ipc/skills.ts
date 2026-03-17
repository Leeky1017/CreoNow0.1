import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import {
  createSkillService,
  type CustomSkillInputType,
  type SkillListItem,
} from "../services/skills/skillService";
import { createDbNotReadyError } from "./dbError";

function createInvalidArgument(message: string) {
  return {
    ok: false as const,
    error: {
      code: "INVALID_ARGUMENT" as const,
      message,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type SkillHandlerDeps = {
  ipcMain: IpcMain;
  db: Database.Database | null;
  userDataDir: string;
  builtinSkillsDir: string;
  logger: Logger;
  dataProcess?: Parameters<typeof createSkillService>[0]["dataProcess"];
};

function registerSkillRegistryHandlers(deps: SkillHandlerDeps): void {
  deps.ipcMain.handle(
    "skill:registry:list",
    async (
      _e,
      payload: { includeDisabled?: boolean },
    ): Promise<IpcResponse<{ items: SkillListItem[] }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      if (!isRecord(payload)) {
        return createInvalidArgument("payload must be an object");
      }
      if (
        "includeDisabled" in payload &&
        typeof payload.includeDisabled !== "boolean"
      ) {
        return createInvalidArgument("includeDisabled must be a boolean");
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const res = svc.list({ includeDisabled: payload.includeDisabled });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "skill:registry:read",
    async (
      _e,
      payload: { id: string },
    ): Promise<IpcResponse<{ id: string; content: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      if (!isRecord(payload)) {
        return createInvalidArgument("payload must be an object");
      }
      if (typeof payload.id !== "string") {
        return createInvalidArgument("id must be a string");
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const res = await svc.read({ id: payload.id });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "skill:registry:write",
    async (
      _e,
      payload: { id: string; content: string },
    ): Promise<
      IpcResponse<{
        id: string;
        scope: "builtin" | "global" | "project";
        written: true;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      if (!isRecord(payload)) {
        return createInvalidArgument("payload must be an object");
      }
      if (typeof payload.id !== "string") {
        return createInvalidArgument("id must be a string");
      }
      if (typeof payload.content !== "string") {
        return createInvalidArgument("content must be a string");
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const res = await svc.write({ id: payload.id, content: payload.content });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "skill:registry:toggle",
    async (
      _e,
      payload: { id?: string; skillId?: string; enabled: boolean },
    ): Promise<IpcResponse<{ id: string; enabled: boolean }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      if (!isRecord(payload)) {
        return createInvalidArgument("payload must be an object");
      }
      if (typeof payload.enabled !== "boolean") {
        return createInvalidArgument("enabled must be a boolean");
      }
      if (
        "id" in payload &&
        payload.id !== undefined &&
        typeof payload.id !== "string"
      ) {
        return createInvalidArgument("id must be a string");
      }
      if (
        "skillId" in payload &&
        payload.skillId !== undefined &&
        typeof payload.skillId !== "string"
      ) {
        return createInvalidArgument("skillId must be a string");
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const idValue = typeof payload.id === "string" ? payload.id.trim() : "";
      const skillIdValue =
        typeof payload.skillId === "string" ? payload.skillId.trim() : "";
      if (idValue.length === 0 && skillIdValue.length > 0) {
        deps.logger.info("deprecated_field", {
          channel: "skill:registry:toggle",
          field: "skillId",
        });
      }
      const id = idValue.length > 0 ? idValue : skillIdValue;
      const res = svc.toggle({ id, enabled: payload.enabled });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}

function registerSkillCustomHandlers(deps: SkillHandlerDeps): void {
  deps.ipcMain.handle(
    "skill:custom:update",
    async (
      _e,
      payload: {
        id: string;
        scope?: "global" | "project";
        name?: string;
        description?: string;
        promptTemplate?: string;
        inputType?: CustomSkillInputType;
        contextRules?: Record<string, unknown>;
        enabled?: boolean;
      },
    ): Promise<IpcResponse<{ id: string; scope: "global" | "project" }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      if (!isRecord(payload)) {
        return createInvalidArgument("payload must be an object");
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const res = await svc.updateCustom(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "skill:custom:create",
    async (
      _e,
      payload: {
        name: string;
        description: string;
        promptTemplate: string;
        inputType: CustomSkillInputType;
        contextRules: Record<string, unknown>;
        scope: "global" | "project";
        enabled?: boolean;
      },
    ): Promise<
      IpcResponse<{
        skill: {
          id: string;
          name: string;
          description: string;
          promptTemplate: string;
          inputType: CustomSkillInputType;
          contextRules: Record<string, unknown>;
          scope: "global" | "project";
          enabled: boolean;
          createdAt: number;
          updatedAt: number;
        };
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      if (!isRecord(payload)) {
        return createInvalidArgument("payload must be an object");
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const res = svc.createCustom(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "skill:custom:list",
    async (): Promise<
      IpcResponse<{
        items: Array<{
          id: string;
          name: string;
          description: string;
          promptTemplate: string;
          inputType: CustomSkillInputType;
          contextRules: Record<string, unknown>;
          scope: "global" | "project";
          enabled: boolean;
          createdAt: number;
          updatedAt: number;
        }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const res = svc.listCustom();
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "skill:custom:delete",
    async (
      _e,
      payload: { id: string },
    ): Promise<IpcResponse<{ id: string; deleted: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      if (!isRecord(payload)) {
        return createInvalidArgument("payload must be an object");
      }
      if (typeof payload.id !== "string") {
        return createInvalidArgument("id must be a string");
      }

      const svc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
        dataProcess: deps.dataProcess,
      });
      const res = svc.deleteCustom(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}

/**
 * Register `skill:*` IPC handlers.
 *
 * Why: skills are loaded/validated in the main process (filesystem + DB + logs),
 * while the renderer only consumes typed, deterministic results.
 */
export function registerSkillIpcHandlers(deps: SkillHandlerDeps): void {
  registerSkillRegistryHandlers(deps);
  registerSkillCustomHandlers(deps);
}
