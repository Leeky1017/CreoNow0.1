import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { IpcError, IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import { ensureCreonowDirStructure } from "../services/context/contextFs";
import {
  ipcError,
  type ServiceResult,
  type Err,
} from "../services/shared/ipcResult";

type ConstraintSource = "user" | "kg";

type ConstraintItem = {
  id: string;
  text: string;
  source: ConstraintSource;
  priority: number;
  updatedAt: string;
  degradable: boolean;
};

type ConstraintsStore = {
  version: 2;
  items: ConstraintItem[];
};

type LegacyConstraintsConfig = {
  version: 1;
  items: string[];
};

type ProjectRow = {
  rootPath: string;
};

type ConstraintCreateInput = {
  text: string;
  source?: ConstraintSource;
  priority?: number;
  degradable?: boolean;
};

type ConstraintPatchInput = {
  text?: string;
  priority?: number;
  degradable?: boolean;
};

/**
 * Return a new default constraints document.
 *
 * Why: handlers must never share mutable singleton state across IPC requests.
 */
function getDefaultConstraintsStore(): ConstraintsStore {
  return { version: 2, items: [] };
}

/**
 * Narrow unknown to an object record.
 */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function invalidArgument(message: string): Err {
  return ipcError("INVALID_ARGUMENT", message);
}

function readPayloadObject(
  payload: unknown,
): ServiceResult<Record<string, unknown>> {
  if (!isRecord(payload)) {
    return invalidArgument("payload must be an object");
  }
  return { ok: true, data: payload };
}

function readStringField(args: {
  payload: Record<string, unknown>;
  field: string;
}): ServiceResult<string> {
  const value = args.payload[args.field];
  if (typeof value !== "string") {
    return invalidArgument(`${args.field} must be a string`);
  }
  return { ok: true, data: value };
}

function readObjectField(args: {
  payload: Record<string, unknown>;
  field: string;
}): ServiceResult<Record<string, unknown>> {
  const value = args.payload[args.field];
  if (!isRecord(value)) {
    return invalidArgument(`${args.field} must be an object`);
  }
  return { ok: true, data: value };
}

function parsePolicyListPayload(
  payload: unknown,
): ServiceResult<{ projectId: string }> {
  const payloadObj = readPayloadObject(payload);
  if (!payloadObj.ok) {
    return payloadObj;
  }

  const projectId = readStringField({
    payload: payloadObj.data,
    field: "projectId",
  });
  if (!projectId.ok) {
    return projectId;
  }

  return { ok: true, data: { projectId: projectId.data } };
}

function parsePolicyCreatePayload(payload: unknown): ServiceResult<{
  projectId: string;
  constraint: ConstraintCreateInput;
}> {
  const payloadObj = readPayloadObject(payload);
  if (!payloadObj.ok) {
    return payloadObj;
  }

  const projectId = readStringField({
    payload: payloadObj.data,
    field: "projectId",
  });
  if (!projectId.ok) {
    return projectId;
  }

  const constraintObj = readObjectField({
    payload: payloadObj.data,
    field: "constraint",
  });
  if (!constraintObj.ok) {
    return constraintObj;
  }

  if (typeof constraintObj.data.text !== "string") {
    return invalidArgument("constraint.text must be a string");
  }
  if (
    constraintObj.data.source !== undefined &&
    typeof constraintObj.data.source !== "string"
  ) {
    return invalidArgument("constraint.source must be a string");
  }
  if (
    constraintObj.data.priority !== undefined &&
    typeof constraintObj.data.priority !== "number"
  ) {
    return invalidArgument("constraint.priority must be a number");
  }
  if (
    constraintObj.data.degradable !== undefined &&
    typeof constraintObj.data.degradable !== "boolean"
  ) {
    return invalidArgument("constraint.degradable must be a boolean");
  }

  return {
    ok: true,
    data: {
      projectId: projectId.data,
      constraint: constraintObj.data as ConstraintCreateInput,
    },
  };
}

function parsePolicyUpdatePayload(payload: unknown): ServiceResult<{
  projectId: string;
  constraintId: string;
  patch: ConstraintPatchInput;
}> {
  const payloadObj = readPayloadObject(payload);
  if (!payloadObj.ok) {
    return payloadObj;
  }

  const projectId = readStringField({
    payload: payloadObj.data,
    field: "projectId",
  });
  if (!projectId.ok) {
    return projectId;
  }
  const constraintId = readStringField({
    payload: payloadObj.data,
    field: "constraintId",
  });
  if (!constraintId.ok) {
    return constraintId;
  }

  const patchObj = readObjectField({
    payload: payloadObj.data,
    field: "patch",
  });
  if (!patchObj.ok) {
    return patchObj;
  }
  if (
    patchObj.data.text !== undefined &&
    typeof patchObj.data.text !== "string"
  ) {
    return invalidArgument("patch.text must be a string");
  }
  if (
    patchObj.data.priority !== undefined &&
    typeof patchObj.data.priority !== "number"
  ) {
    return invalidArgument("patch.priority must be a number");
  }
  if (
    patchObj.data.degradable !== undefined &&
    typeof patchObj.data.degradable !== "boolean"
  ) {
    return invalidArgument("patch.degradable must be a boolean");
  }

  return {
    ok: true,
    data: {
      projectId: projectId.data,
      constraintId: constraintId.data,
      patch: patchObj.data as ConstraintPatchInput,
    },
  };
}

function parsePolicyDeletePayload(payload: unknown): ServiceResult<{
  projectId: string;
  constraintId: string;
}> {
  const payloadObj = readPayloadObject(payload);
  if (!payloadObj.ok) {
    return payloadObj;
  }

  const projectId = readStringField({
    payload: payloadObj.data,
    field: "projectId",
  });
  if (!projectId.ok) {
    return projectId;
  }
  const constraintId = readStringField({
    payload: payloadObj.data,
    field: "constraintId",
  });
  if (!constraintId.ok) {
    return constraintId;
  }

  return {
    ok: true,
    data: { projectId: projectId.data, constraintId: constraintId.data },
  };
}

function parsePolicySetPayload(payload: unknown): ServiceResult<{
  projectId: string;
  constraints: LegacyConstraintsConfig;
}> {
  const payloadObj = readPayloadObject(payload);
  if (!payloadObj.ok) {
    return payloadObj;
  }

  const projectId = readStringField({
    payload: payloadObj.data,
    field: "projectId",
  });
  if (!projectId.ok) {
    return projectId;
  }

  if (!isRecord(payloadObj.data.constraints)) {
    return invalidArgument("constraints must be an object");
  }

  return {
    ok: true,
    data: {
      projectId: projectId.data,
      constraints: payloadObj.data.constraints as LegacyConstraintsConfig,
    },
  };
}

/**
 * Validate allowed constraint source values.
 */
function isConstraintSource(value: unknown): value is ConstraintSource {
  return value === "user" || value === "kg";
}

/**
 * Parse updatedAt into epoch ms.
 *
 * Why: sort order must stay deterministic even with malformed timestamps.
 */
function toUpdatedAtMs(updatedAt: string): number {
  const ms = Date.parse(updatedAt);
  return Number.isFinite(ms) ? ms : 0;
}

/**
 * Stable comparator used by rules injection and list responses.
 *
 * Why: CE4 requires `user > kg`, then `updatedAt desc`, then `id asc`.
 */
function compareConstraintsForRules(
  left: ConstraintItem,
  right: ConstraintItem,
): number {
  const leftSourceRank = left.source === "user" ? 0 : 1;
  const rightSourceRank = right.source === "user" ? 0 : 1;
  if (leftSourceRank !== rightSourceRank) {
    return leftSourceRank - rightSourceRank;
  }

  const leftUpdatedAt = toUpdatedAtMs(left.updatedAt);
  const rightUpdatedAt = toUpdatedAtMs(right.updatedAt);
  if (leftUpdatedAt !== rightUpdatedAt) {
    return rightUpdatedAt - leftUpdatedAt;
  }

  return left.id.localeCompare(right.id);
}

/**
 * Build deterministic IDs when migrating legacy string constraints.
 */
function legacyConstraintId(text: string, index: number): string {
  const digest = createHash("sha256")
    .update(`${index.toString()}:${text}`, "utf8")
    .digest("hex")
    .slice(0, 12);
  return `legacy-${digest}`;
}

/**
 * Convert V2 store to legacy V1 shape for compatibility channels.
 */
function toLegacyConstraintsConfig(
  store: ConstraintsStore,
): LegacyConstraintsConfig {
  return {
    version: 1,
    items: store.items
      .filter((item) => item.source === "user")
      .map((item) => item.text),
  };
}

/**
 * Convert legacy V1 shape to V2 store.
 */
function fromLegacyConstraintsConfig(
  legacy: LegacyConstraintsConfig,
): ConstraintsStore {
  const items: ConstraintItem[] = [];
  legacy.items.forEach((text, index) => {
    const normalizedText = text.trim();
    if (normalizedText.length === 0) {
      return;
    }

    items.push({
      id: legacyConstraintId(normalizedText, index),
      text: normalizedText,
      source: "user",
      priority: 100,
      updatedAt: "1970-01-01T00:00:00.000Z",
      degradable: false,
    });
  });
  items.sort(compareConstraintsForRules);

  return {
    version: 2,
    items,
  };
}

/**
 * Validate the legacy constraints JSON shape.
 */
function isLegacyConstraintsConfig(x: unknown): x is LegacyConstraintsConfig {
  if (!isRecord(x)) {
    return false;
  }
  if (x.version !== 1) {
    return false;
  }
  if (!Array.isArray(x.items)) {
    return false;
  }
  return x.items.every((v) => typeof v === "string");
}

/**
 * Validate constraint item payload shape.
 */
function isConstraintItem(x: unknown): x is ConstraintItem {
  if (!isRecord(x)) {
    return false;
  }

  return (
    typeof x.id === "string" &&
    x.id.trim().length > 0 &&
    typeof x.text === "string" &&
    x.text.trim().length > 0 &&
    isConstraintSource(x.source) &&
    typeof x.priority === "number" &&
    Number.isFinite(x.priority) &&
    typeof x.updatedAt === "string" &&
    x.updatedAt.trim().length > 0 &&
    typeof x.degradable === "boolean"
  );
}

/**
 * Validate the V2 constraints JSON shape.
 */
function isConstraintsStore(x: unknown): x is ConstraintsStore {
  if (!isRecord(x)) {
    return false;
  }
  if (x.version !== 2) {
    return false;
  }
  if (!Array.isArray(x.items)) {
    return false;
  }
  return x.items.every((item) => isConstraintItem(item));
}

/**
 * Normalize incoming constraints list.
 */
function normalizeConstraints(items: ConstraintItem[]): ConstraintItem[] {
  return [...items]
    .map((item) => ({
      ...item,
      id: item.id.trim(),
      text: item.text.trim(),
      updatedAt: item.updatedAt.trim(),
    }))
    .filter((item) => item.id.length > 0 && item.text.length > 0)
    .sort(compareConstraintsForRules);
}

/**
 * Compute the constraints SSOT absolute path.
 */
function getConstraintsPath(projectRootPath: string): string {
  return path.join(projectRootPath, ".creonow", "rules", "constraints.json");
}

/**
 * Read and validate constraints from disk.
 */
async function readConstraintsFile(
  constraintsPath: string,
): Promise<ServiceResult<ConstraintsStore>> {
  try {
    const raw = await fs.readFile(constraintsPath, "utf8");
    const parsed: unknown = JSON.parse(raw);

    if (isConstraintsStore(parsed)) {
      return {
        ok: true,
        data: {
          version: 2,
          items: normalizeConstraints(parsed.items),
        },
      };
    }

    if (isLegacyConstraintsConfig(parsed)) {
      return { ok: true, data: fromLegacyConstraintsConfig(parsed) };
    }

    return ipcError(
      "CONSTRAINT_VALIDATION_ERROR",
      "constraints.json has invalid schema",
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { ok: true, data: getDefaultConstraintsStore() };
    }
    if (error instanceof Error && error.name === "SyntaxError") {
      return ipcError(
        "CONSTRAINT_VALIDATION_ERROR",
        "constraints.json is not valid JSON",
      );
    }
    return ipcError("IO_ERROR", "Failed to read constraints");
  }
}

/**
 * Write constraints SSOT to disk (overwriting previous content).
 */
async function writeConstraintsFile(args: {
  constraintsPath: string;
  constraints: ConstraintsStore;
}): Promise<ServiceResult<true>> {
  try {
    const normalized: ConstraintsStore = {
      version: 2,
      items: normalizeConstraints(args.constraints.items),
    };
    const json = JSON.stringify(normalized, null, 2) + "\n";
    await fs.writeFile(args.constraintsPath, json, "utf8");
    return { ok: true, data: true };
  } catch {
    return ipcError("IO_ERROR", "Failed to write constraints");
  }
}

/**
 * Ensure project id is present.
 */
function validateProjectId(projectId: string): Err | null {
  if (projectId.trim().length === 0) {
    return ipcError("CONSTRAINT_VALIDATION_ERROR", "projectId is required");
  }
  return null;
}

/**
 * Read project root path from DB.
 */
function getProjectRootPath(args: {
  db: Database.Database;
  projectId: string;
}): ServiceResult<string> {
  const row = args.db
    .prepare<
      [string],
      ProjectRow
    >("SELECT root_path as rootPath FROM projects WHERE project_id = ?")
    .get(args.projectId);
  if (!row) {
    return ipcError("NOT_FOUND", "Project not found");
  }
  return { ok: true, data: row.rootPath };
}

/**
 * Validate create payload.
 */
function validateCreatePayload(
  payload: ConstraintCreateInput,
): ServiceResult<ConstraintCreateInput> {
  const text = payload.text.trim();
  if (text.length === 0) {
    return ipcError(
      "CONSTRAINT_VALIDATION_ERROR",
      "constraint text is required",
    );
  }

  const source = payload.source ?? "user";
  if (source !== "user") {
    return ipcError(
      "CONTEXT_SCOPE_VIOLATION",
      "Only user constraints can be created via IPC",
    );
  }

  if (payload.priority !== undefined) {
    if (!Number.isFinite(payload.priority) || payload.priority < 0) {
      return ipcError(
        "CONSTRAINT_VALIDATION_ERROR",
        "constraint priority must be a non-negative number",
      );
    }
  }

  if (
    payload.degradable !== undefined &&
    typeof payload.degradable !== "boolean"
  ) {
    return ipcError(
      "CONSTRAINT_VALIDATION_ERROR",
      "constraint degradable must be boolean",
    );
  }

  return {
    ok: true,
    data: {
      text,
      source,
      priority: payload.priority,
      degradable: payload.degradable,
    },
  };
}

/**
 * Validate update payload.
 */
function validatePatchPayload(
  patch: ConstraintPatchInput,
): ServiceResult<ConstraintPatchInput> {
  const hasAnyField =
    patch.text !== undefined ||
    patch.priority !== undefined ||
    patch.degradable !== undefined;
  if (!hasAnyField) {
    return ipcError(
      "CONSTRAINT_VALIDATION_ERROR",
      "constraint patch must contain at least one field",
    );
  }

  if (patch.text !== undefined && patch.text.trim().length === 0) {
    return ipcError(
      "CONSTRAINT_VALIDATION_ERROR",
      "constraint text must not be empty",
    );
  }

  if (patch.priority !== undefined) {
    if (!Number.isFinite(patch.priority) || patch.priority < 0) {
      return ipcError(
        "CONSTRAINT_VALIDATION_ERROR",
        "constraint priority must be a non-negative number",
      );
    }
  }

  if (patch.degradable !== undefined && typeof patch.degradable !== "boolean") {
    return ipcError(
      "CONSTRAINT_VALIDATION_ERROR",
      "constraint degradable must be boolean",
    );
  }

  return {
    ok: true,
    data: {
      ...(patch.text !== undefined ? { text: patch.text.trim() } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      ...(patch.degradable !== undefined
        ? { degradable: patch.degradable }
        : {}),
    },
  };
}

/**
 * Detect duplicate constraints by source + normalized text.
 */
function hasDuplicateConstraint(args: {
  items: ConstraintItem[];
  source: ConstraintSource;
  text: string;
  exceptId?: string;
}): boolean {
  return args.items.some((item) => {
    if (args.exceptId && item.id === args.exceptId) {
      return false;
    }
    return item.source === args.source && item.text === args.text;
  });
}

/**
 * Map modern constraint errors to legacy get/set error envelope.
 */
function toLegacyError(error: IpcError): IpcError {
  if (error.code === "CONSTRAINT_VALIDATION_ERROR") {
    return { code: "INVALID_ARGUMENT", message: error.message };
  }

  if (error.code === "CONSTRAINT_NOT_FOUND") {
    return { code: "NOT_FOUND", message: error.message };
  }

  if (error.code === "CONSTRAINT_CONFLICT") {
    return { code: "CONFLICT", message: error.message };
  }

  return error;
}

type ConstraintsHandlerDeps = {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
};

function registerConstraintsCrudHandlers(deps: ConstraintsHandlerDeps): void {
  deps.ipcMain.handle(
    "constraints:policy:list",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<{ constraints: ConstraintItem[] }>> => {
      const parsedPayload = parsePolicyListPayload(payload);
      if (!parsedPayload.ok) {
        return parsedPayload;
      }
      const { projectId } = parsedPayload.data;
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      const projectIdValidation = validateProjectId(projectId);
      if (projectIdValidation) {
        return projectIdValidation;
      }

      try {
        const rootRes = getProjectRootPath({
          db: deps.db,
          projectId,
        });
        if (!rootRes.ok) {
          return rootRes;
        }

        const constraintsPath = getConstraintsPath(rootRes.data);
        const res = await readConstraintsFile(constraintsPath);
        if (!res.ok) {
          deps.logger.error("constraints_list_failed", {
            projectId,
            code: res.error.code,
          });
          return { ok: false, error: res.error };
        }

        return {
          ok: true,
          data: {
            constraints: normalizeConstraints(res.data.items),
          },
        };
      } catch (error) {
        deps.logger.error("constraints_list_unhandled", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to list constraints" },
        };
      }
    },
  );

  deps.ipcMain.handle(
    "constraints:policy:create",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<{ constraint: ConstraintItem }>> => {
      const parsedPayload = parsePolicyCreatePayload(payload);
      if (!parsedPayload.ok) {
        return parsedPayload;
      }
      const { projectId, constraint } = parsedPayload.data;
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      const projectIdValidation = validateProjectId(projectId);
      if (projectIdValidation) {
        return projectIdValidation;
      }

      const createValidation = validateCreatePayload(constraint);
      if (!createValidation.ok) {
        return createValidation;
      }

      try {
        const rootRes = getProjectRootPath({
          db: deps.db,
          projectId,
        });
        if (!rootRes.ok) {
          return rootRes;
        }

        const ensured = ensureCreonowDirStructure(rootRes.data);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const constraintsPath = getConstraintsPath(rootRes.data);
        const readRes = await readConstraintsFile(constraintsPath);
        if (!readRes.ok) {
          return { ok: false, error: readRes.error };
        }

        const current = readRes.data.items;
        if (
          hasDuplicateConstraint({
            items: current,
            source: "user",
            text: createValidation.data.text,
          })
        ) {
          return ipcError("CONSTRAINT_CONFLICT", "Constraint already exists");
        }

        const created: ConstraintItem = {
          id: randomUUID(),
          text: createValidation.data.text,
          source: "user",
          priority: createValidation.data.priority ?? 100,
          updatedAt: new Date().toISOString(),
          degradable: createValidation.data.degradable ?? false,
        };

        const next: ConstraintsStore = {
          version: 2,
          items: normalizeConstraints([...current, created]),
        };
        const writeRes = await writeConstraintsFile({
          constraintsPath,
          constraints: next,
        });
        if (!writeRes.ok) {
          return { ok: false, error: writeRes.error };
        }

        deps.logger.info("constraints_created", {
          projectId,
          constraintId: created.id,
          source: created.source,
          priority: created.priority,
        });

        return { ok: true, data: { constraint: created } };
      } catch (error) {
        deps.logger.error("constraints_create_unhandled", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to create constraint" },
        };
      }
    },
  );

  deps.ipcMain.handle(
    "constraints:policy:update",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<{ constraint: ConstraintItem }>> => {
      const parsedPayload = parsePolicyUpdatePayload(payload);
      if (!parsedPayload.ok) {
        return parsedPayload;
      }
      const { projectId, constraintId, patch } = parsedPayload.data;
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      const projectIdValidation = validateProjectId(projectId);
      if (projectIdValidation) {
        return projectIdValidation;
      }

      if (constraintId.trim().length === 0) {
        return ipcError(
          "CONSTRAINT_VALIDATION_ERROR",
          "constraintId is required",
        );
      }

      const patchValidation = validatePatchPayload(patch);
      if (!patchValidation.ok) {
        return patchValidation;
      }

      try {
        const rootRes = getProjectRootPath({
          db: deps.db,
          projectId,
        });
        if (!rootRes.ok) {
          return rootRes;
        }

        const ensured = ensureCreonowDirStructure(rootRes.data);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const constraintsPath = getConstraintsPath(rootRes.data);
        const readRes = await readConstraintsFile(constraintsPath);
        if (!readRes.ok) {
          return { ok: false, error: readRes.error };
        }

        const index = readRes.data.items.findIndex(
          (item) => item.id === constraintId,
        );
        if (index < 0) {
          return ipcError("CONSTRAINT_NOT_FOUND", "Constraint not found");
        }

        const current = readRes.data.items[index];
        if (current.source === "kg") {
          return ipcError(
            "CONTEXT_SCOPE_VIOLATION",
            "KG constraints are read-only",
          );
        }

        const updated: ConstraintItem = {
          ...current,
          ...(patchValidation.data.text !== undefined
            ? { text: patchValidation.data.text }
            : {}),
          ...(patchValidation.data.priority !== undefined
            ? { priority: patchValidation.data.priority }
            : {}),
          ...(patchValidation.data.degradable !== undefined
            ? { degradable: patchValidation.data.degradable }
            : {}),
          updatedAt: new Date().toISOString(),
        };

        if (
          hasDuplicateConstraint({
            items: readRes.data.items,
            source: updated.source,
            text: updated.text,
            exceptId: updated.id,
          })
        ) {
          return ipcError("CONSTRAINT_CONFLICT", "Constraint already exists");
        }

        const nextItems = [...readRes.data.items];
        nextItems[index] = updated;

        const writeRes = await writeConstraintsFile({
          constraintsPath,
          constraints: {
            version: 2,
            items: nextItems,
          },
        });
        if (!writeRes.ok) {
          return { ok: false, error: writeRes.error };
        }

        deps.logger.info("constraints_updated", {
          projectId,
          constraintId: updated.id,
        });

        return { ok: true, data: { constraint: updated } };
      } catch (error) {
        deps.logger.error("constraints_update_unhandled", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to update constraint" },
        };
      }
    },
  );
}

function registerConstraintsDeleteAndLegacyHandlers(
  deps: ConstraintsHandlerDeps,
): void {
  deps.ipcMain.handle(
    "constraints:policy:delete",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<{ deletedConstraintId: string }>> => {
      const parsedPayload = parsePolicyDeletePayload(payload);
      if (!parsedPayload.ok) {
        return parsedPayload;
      }
      const { projectId, constraintId } = parsedPayload.data;
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      const projectIdValidation = validateProjectId(projectId);
      if (projectIdValidation) {
        return projectIdValidation;
      }

      if (constraintId.trim().length === 0) {
        return ipcError(
          "CONSTRAINT_VALIDATION_ERROR",
          "constraintId is required",
        );
      }

      try {
        const rootRes = getProjectRootPath({
          db: deps.db,
          projectId,
        });
        if (!rootRes.ok) {
          return rootRes;
        }

        const ensured = ensureCreonowDirStructure(rootRes.data);
        if (!ensured.ok) {
          return { ok: false, error: ensured.error };
        }

        const constraintsPath = getConstraintsPath(rootRes.data);
        const readRes = await readConstraintsFile(constraintsPath);
        if (!readRes.ok) {
          return { ok: false, error: readRes.error };
        }

        const current = readRes.data.items.find(
          (item) => item.id === constraintId,
        );
        if (!current) {
          return ipcError("CONSTRAINT_NOT_FOUND", "Constraint not found");
        }

        if (current.source === "kg") {
          return ipcError(
            "CONTEXT_SCOPE_VIOLATION",
            "KG constraints are read-only",
          );
        }

        const writeRes = await writeConstraintsFile({
          constraintsPath,
          constraints: {
            version: 2,
            items: readRes.data.items.filter(
              (item) => item.id !== constraintId,
            ),
          },
        });
        if (!writeRes.ok) {
          return { ok: false, error: writeRes.error };
        }

        deps.logger.info("constraints_deleted", {
          projectId,
          constraintId,
        });

        return {
          ok: true,
          data: { deletedConstraintId: constraintId },
        };
      } catch (error) {
        deps.logger.error("constraints_delete_unhandled", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to delete constraint" },
        };
      }
    },
  );

  // Legacy compatibility channels (`constraints:policy:get/set`)
  deps.ipcMain.handle(
    "constraints:policy:get",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<{ constraints: LegacyConstraintsConfig }>> => {
      const parsedPayload = parsePolicyListPayload(payload);
      if (!parsedPayload.ok) {
        return parsedPayload;
      }
      const { projectId } = parsedPayload.data;
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      if (projectId.trim().length === 0) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId is required",
          },
        };
      }

      try {
        const rootRes = getProjectRootPath({
          db: deps.db,
          projectId,
        });
        if (!rootRes.ok) {
          return rootRes;
        }

        const constraintsPath = getConstraintsPath(rootRes.data);
        const readRes = await readConstraintsFile(constraintsPath);
        if (!readRes.ok) {
          deps.logger.error("constraints_read_failed", {
            projectId,
            code: readRes.error.code,
          });
          return { ok: false, error: toLegacyError(readRes.error) };
        }

        return {
          ok: true,
          data: { constraints: toLegacyConstraintsConfig(readRes.data) },
        };
      } catch (error) {
        deps.logger.error("constraints_get_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to get constraints" },
        };
      }
    },
  );

  deps.ipcMain.handle(
    "constraints:policy:set",
    async (
      _e,
      payload: unknown,
    ): Promise<IpcResponse<{ constraints: LegacyConstraintsConfig }>> => {
      const parsedPayload = parsePolicySetPayload(payload);
      if (!parsedPayload.ok) {
        return parsedPayload;
      }
      const { projectId, constraints } = parsedPayload.data;
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (projectId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }
      if (!isLegacyConstraintsConfig(constraints)) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "constraints must match schema",
          },
        };
      }

      try {
        const rootRes = getProjectRootPath({
          db: deps.db,
          projectId,
        });
        if (!rootRes.ok) {
          return rootRes;
        }

        const ensured = ensureCreonowDirStructure(rootRes.data);
        if (!ensured.ok) {
          deps.logger.error("constraints_ensure_creonow_failed", {
            projectId,
            code: ensured.error.code,
          });
          return { ok: false, error: ensured.error };
        }

        const constraintsPath = getConstraintsPath(rootRes.data);
        const store = fromLegacyConstraintsConfig(constraints);
        const writeRes = await writeConstraintsFile({
          constraintsPath,
          constraints: store,
        });
        if (!writeRes.ok) {
          deps.logger.error("constraints_write_failed", {
            projectId,
            code: writeRes.error.code,
          });
          return { ok: false, error: toLegacyError(writeRes.error) };
        }

        deps.logger.info("constraints_updated", {
          projectId,
          items_count: constraints.items.length,
        });

        return { ok: true, data: { constraints } };
      } catch (error) {
        deps.logger.error("constraints_set_failed", {
          code: "IO_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "IO_ERROR", message: "Failed to set constraints" },
        };
      }
    },
  );
}

/**
 * Register `constraints:*` IPC handlers.
 *
 * Why: constraints are project-scoped rules with SSOT at
 * `.creonow/rules/constraints.json`.
 */
export function registerConstraintsIpcHandlers(
  deps: ConstraintsHandlerDeps,
): void {
  registerConstraintsCrudHandlers(deps);
  registerConstraintsDeleteAndLegacyHandlers(deps);
}
