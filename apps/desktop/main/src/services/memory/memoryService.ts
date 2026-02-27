import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { createUserMemoryVecService } from "./userMemoryVec";
import {
  DegradationCounter,
  logWarn,
} from "../shared/degradationCounter";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type MemoryType = "preference" | "fact" | "note";
export type MemoryScope = "global" | "project" | "document";
export type MemoryOrigin = "manual" | "learned";

export type UserMemoryItem = {
  memoryId: string;
  type: MemoryType;
  scope: MemoryScope;
  projectId?: string;
  documentId?: string;
  origin: MemoryOrigin;
  sourceRef?: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
};

export type MemorySettings = {
  injectionEnabled: boolean;
  preferenceLearningEnabled: boolean;
  privacyModeEnabled: boolean;
  preferenceLearningThreshold: number;
};

export type MemoryInjectionMode = "deterministic" | "semantic";

export type MemoryInjectionReason =
  | { kind: "deterministic" }
  | { kind: "semantic"; score: number };

export type MemoryInjectionItem = {
  id: string;
  type: MemoryType;
  scope: MemoryScope;
  origin: MemoryOrigin;
  content: string;
  reason: MemoryInjectionReason;
};

export type MemoryInjectionPreview = {
  items: MemoryInjectionItem[];
  mode: MemoryInjectionMode;
  diagnostics?: { degradedFrom: "semantic"; reason: string };
};

export type MemoryService = {
  create: (args: {
    type: MemoryType;
    scope: MemoryScope;
    projectId?: string;
    documentId?: string;
    content: string;
  }) => ServiceResult<UserMemoryItem>;
  list: (args: {
    projectId?: string;
    documentId?: string;
    includeDeleted?: boolean;
  }) => ServiceResult<{ items: UserMemoryItem[] }>;
  update: (args: {
    memoryId: string;
    patch: {
      type?: MemoryType;
      scope?: MemoryScope;
      projectId?: string;
      documentId?: string;
      content?: string;
    };
  }) => ServiceResult<UserMemoryItem>;
  delete: (args: { memoryId: string }) => ServiceResult<{ deleted: true }>;
  getSettings: () => ServiceResult<MemorySettings>;
  updateSettings: (args: {
    patch: Partial<MemorySettings>;
  }) => ServiceResult<MemorySettings>;
  previewInjection: (args: {
    projectId?: string;
    documentId?: string;
    queryText?: string;
  }) => ServiceResult<MemoryInjectionPreview>;
};

const SETTINGS_SCOPE = "app" as const;
const SETTINGS_PREFIX = "creonow.memory." as const;

const DEFAULT_SETTINGS: MemorySettings = {
  injectionEnabled: true,
  preferenceLearningEnabled: true,
  privacyModeEnabled: false,
  preferenceLearningThreshold: 3,
};

const SCOPE_RANK: Readonly<Record<MemoryScope, number>> = {
  document: 0,
  project: 1,
  global: 2,
};

const TYPE_RANK: Readonly<Record<MemoryType, number>> = {
  preference: 0,
  fact: 1,
  note: 2,
};

function nowTs(): number {
  return Date.now();
}

function isMemoryType(x: string): x is MemoryType {
  return x === "preference" || x === "fact" || x === "note";
}

function isMemoryScope(x: string): x is MemoryScope {
  return x === "global" || x === "project" || x === "document";
}

function isMemoryOrigin(x: string): x is MemoryOrigin {
  return x === "manual" || x === "learned";
}

type MemoryRow = {
  memoryId: string;
  type: string;
  scope: string;
  projectId: string | null;
  documentId: string | null;
  origin: string;
  sourceRef: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

/**
 * Normalize optional identifiers from IPC inputs.
 *
 * Why: keep trimming rules consistent and prevent empty-string identifiers from
 * leaking into DB constraints and uniqueness rules.
 */
function normalizeOptionalId(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Verify a (projectId, documentId) pair exists in `documents`.
 *
 * Why: SQLite cannot add the FK constraint via ALTER TABLE, so we enforce
 * referential integrity at write-time for document-scoped memories.
 */
function documentExistsInProject(
  db: Database.Database,
  projectId: string,
  documentId: string,
): boolean {
  const row = db
    .prepare<
      [string, string],
      { exists: 1 }
    >("SELECT 1 as exists FROM documents WHERE document_id = ? AND project_id = ? LIMIT 1")
    .get(documentId, projectId);
  return row?.exists === 1;
}

function rowToMemory(row: MemoryRow): ServiceResult<UserMemoryItem> {
  if (!isMemoryType(row.type)) {
    return ipcError("DB_ERROR", "Invalid memory type", { type: row.type });
  }
  if (!isMemoryScope(row.scope)) {
    return ipcError("DB_ERROR", "Invalid memory scope", { scope: row.scope });
  }
  if (!isMemoryOrigin(row.origin)) {
    return ipcError("DB_ERROR", "Invalid memory origin", {
      origin: row.origin,
    });
  }

  if (row.scope === "global") {
    if (row.projectId !== null || row.documentId !== null) {
      return ipcError("DB_ERROR", "Invalid global memory row", {
        memoryId: row.memoryId,
        projectId: row.projectId,
        documentId: row.documentId,
      });
    }
  }
  if (row.scope === "project") {
    if (!row.projectId || row.projectId.trim().length === 0) {
      return ipcError("DB_ERROR", "Invalid project memory row", {
        memoryId: row.memoryId,
        projectId: row.projectId,
      });
    }
    if (row.documentId !== null) {
      return ipcError(
        "DB_ERROR",
        "Invalid project memory row (documentId set)",
        {
          memoryId: row.memoryId,
          documentId: row.documentId,
        },
      );
    }
  }
  if (row.scope === "document") {
    if (!row.projectId || row.projectId.trim().length === 0) {
      return ipcError(
        "DB_ERROR",
        "Invalid document memory row (missing projectId)",
        {
          memoryId: row.memoryId,
          projectId: row.projectId,
        },
      );
    }
    if (!row.documentId || row.documentId.trim().length === 0) {
      return ipcError(
        "DB_ERROR",
        "Invalid document memory row (missing documentId)",
        {
          memoryId: row.memoryId,
          documentId: row.documentId,
        },
      );
    }
  }

  return {
    ok: true,
    data: {
      memoryId: row.memoryId,
      type: row.type,
      scope: row.scope,
      projectId: row.projectId ?? undefined,
      documentId: row.documentId ?? undefined,
      origin: row.origin,
      sourceRef: row.sourceRef ?? undefined,
      content: row.content,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt ?? undefined,
    },
  };
}

function compareDeterministic(a: UserMemoryItem, b: UserMemoryItem): number {
  const scopeDiff = SCOPE_RANK[a.scope] - SCOPE_RANK[b.scope];
  if (scopeDiff !== 0) {
    return scopeDiff;
  }
  const typeDiff = TYPE_RANK[a.type] - TYPE_RANK[b.type];
  if (typeDiff !== 0) {
    return typeDiff;
  }
  if (a.updatedAt !== b.updatedAt) {
    return b.updatedAt - a.updatedAt;
  }
  return a.memoryId.localeCompare(b.memoryId);
}

/**
 * Deterministically sort memory items for list/preview.
 *
 * Why: injection preview MUST be fully deterministic for stable prompt caching
 * and Windows E2E assertions.
 */
export function deterministicMemorySort(
  items: readonly UserMemoryItem[],
): UserMemoryItem[] {
  return [...items].sort(compareDeterministic);
}

type SettingsRow = { valueJson: string };

function getSettingKey(name: keyof MemorySettings): string {
  return `${SETTINGS_PREFIX}${name}`;
}

function readSetting(db: Database.Database, key: string): unknown | null {
  const row = db
    .prepare<
      [string, string],
      SettingsRow
    >("SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?")
    .get(SETTINGS_SCOPE, key);
  if (!row) {
    return null;
  }
  try {
    return JSON.parse(row.valueJson) as unknown;
  } catch {
    return null;
  }
}

function readBoolSetting(
  db: Database.Database,
  key: string,
  fallback: boolean,
): boolean {
  const value = readSetting(db, key);
  return typeof value === "boolean" ? value : fallback;
}

function readNumberSetting(
  db: Database.Database,
  key: string,
  fallback: number,
): number {
  const value = readSetting(db, key);
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function writeSetting(
  db: Database.Database,
  key: string,
  value: boolean | number,
  ts: number,
): void {
  db.prepare(
    "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
  ).run(SETTINGS_SCOPE, key, JSON.stringify(value), ts);
}

function selectMemoryById(
  db: Database.Database,
  memoryId: string,
): MemoryRow | undefined {
  return db
    .prepare<
      [string],
      MemoryRow
    >("SELECT memory_id as memoryId, type, scope, project_id as projectId, document_id as documentId, origin, source_ref as sourceRef, content, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt FROM user_memory WHERE memory_id = ?")
    .get(memoryId);
}

/**
 * Create a MemoryService backed by SQLite (SSOT).
 */
export function createMemoryService(args: {
  db: Database.Database;
  logger: Logger;
  degradationCounter?: DegradationCounter;
  degradationEscalationThreshold?: number;
}): MemoryService {
  const degradationCounter =
    args.degradationCounter ??
    new DegradationCounter({
      threshold: args.degradationEscalationThreshold,
    });

  const reportSemanticDegradation = (args2: {
    projectId: string | null;
    reason: string;
  }): void => {
    const tracked = degradationCounter.record("memoryService.semanticFallback");
    const payload: Record<string, unknown> = {
      module: "memory-system",
      service: "memoryService",
      reason: args2.reason,
      count: tracked.count,
      firstDegradedAt: tracked.firstDegradedAt,
      ...(args2.projectId ? { projectId: args2.projectId } : {}),
    };
    logWarn(
      args.logger as Logger & {
        warn?: (event: string, data?: Record<string, unknown>) => void;
      },
      "memory_service_degradation",
      payload,
    );
    if (tracked.escalated) {
      args.logger.error("memory_service_degradation_escalation", payload);
    }
  };

  const resetSemanticDegradation = (): void => {
    degradationCounter.reset("memoryService.semanticFallback");
  };

  function getSettings(): ServiceResult<MemorySettings> {
    try {
      return {
        ok: true,
        data: {
          injectionEnabled: readBoolSetting(
            args.db,
            getSettingKey("injectionEnabled"),
            DEFAULT_SETTINGS.injectionEnabled,
          ),
          preferenceLearningEnabled: readBoolSetting(
            args.db,
            getSettingKey("preferenceLearningEnabled"),
            DEFAULT_SETTINGS.preferenceLearningEnabled,
          ),
          privacyModeEnabled: readBoolSetting(
            args.db,
            getSettingKey("privacyModeEnabled"),
            DEFAULT_SETTINGS.privacyModeEnabled,
          ),
          preferenceLearningThreshold: readNumberSetting(
            args.db,
            getSettingKey("preferenceLearningThreshold"),
            DEFAULT_SETTINGS.preferenceLearningThreshold,
          ),
        },
      };
    } catch (error) {
      return ipcError(
        "DB_ERROR",
        "Failed to read memory settings",
        error instanceof Error ? { message: error.message } : { error },
      );
    }
  }

  function updateSettings(args2: {
    patch: Partial<MemorySettings>;
  }): ServiceResult<MemorySettings> {
    const keys = Object.keys(args2.patch) as Array<keyof MemorySettings>;
    if (keys.length === 0) {
      return ipcError("INVALID_ARGUMENT", "patch is required");
    }

    const threshold = args2.patch.preferenceLearningThreshold;
    if (
      typeof threshold === "number" &&
      (!Number.isFinite(threshold) ||
        !Number.isInteger(threshold) ||
        threshold < 1 ||
        threshold > 100)
    ) {
      return ipcError(
        "INVALID_ARGUMENT",
        "preferenceLearningThreshold must be an integer between 1 and 100",
      );
    }

    const ts = nowTs();
    try {
      args.db.transaction(() => {
        for (const key of keys) {
          const value = args2.patch[key];
          if (typeof value !== "boolean" && typeof value !== "number") {
            throw new Error(`Invalid setting value for ${String(key)}`);
          }
          writeSetting(args.db, getSettingKey(key), value, ts);
        }
      })();
    } catch (error) {
      args.logger.error("memory_settings_update_failed", {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
      return ipcError("DB_ERROR", "Failed to update memory settings");
    }

    return getSettings();
  }

  return {
    getSettings,
    updateSettings,

    create: ({ type, scope, projectId, documentId, content }) => {
      if (!isMemoryType(type)) {
        return ipcError("INVALID_ARGUMENT", "type is invalid");
      }
      if (!isMemoryScope(scope)) {
        return ipcError("INVALID_ARGUMENT", "scope is invalid");
      }
      if (content.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "content is required");
      }
      const normalizedProjectId = normalizeOptionalId(projectId);
      const normalizedDocumentId = normalizeOptionalId(documentId);

      if (scope === "global") {
        if (normalizedProjectId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "projectId is not allowed for global scope",
          );
        }
        if (normalizedDocumentId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "documentId is not allowed for global scope",
          );
        }
      }
      if (scope === "project") {
        if (!normalizedProjectId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "projectId is required for project scope",
          );
        }
        if (normalizedDocumentId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "documentId is not allowed for project scope",
          );
        }
      }
      if (scope === "document") {
        if (!normalizedProjectId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "projectId is required for document scope",
          );
        }
        if (!normalizedDocumentId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "documentId is required for document scope",
          );
        }
      }

      const memoryId = randomUUID();
      const ts = nowTs();
      const scopedProjectId =
        scope === "project" || scope === "document"
          ? normalizedProjectId!
          : null;
      const scopedDocumentId =
        scope === "document" ? normalizedDocumentId! : null;

      try {
        if (
          scope === "document" &&
          !documentExistsInProject(args.db, scopedProjectId!, scopedDocumentId!)
        ) {
          return ipcError("NOT_FOUND", "Document not found", {
            projectId: scopedProjectId,
            documentId: scopedDocumentId,
          });
        }

        args.db
          .prepare(
            "INSERT INTO user_memory (memory_id, type, scope, project_id, document_id, origin, source_ref, content, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, 'manual', NULL, ?, ?, ?, NULL)",
          )
          .run(
            memoryId,
            type,
            scope,
            scopedProjectId,
            scopedDocumentId,
            content.trim(),
            ts,
            ts,
          );

        args.logger.info("memory_create", {
          memory_id: memoryId,
          type,
          scope,
          project_id: scopedProjectId,
          document_id: scopedDocumentId,
          origin: "manual",
          content_len: content.trim().length,
        });
      } catch (error) {
        args.logger.error("memory_create_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to create memory");
      }

      const row = selectMemoryById(args.db, memoryId);
      if (!row) {
        return ipcError("DB_ERROR", "Failed to load created memory");
      }
      return rowToMemory(row);
    },

    list: ({ projectId, documentId, includeDeleted }) => {
      const scopedProjectId = normalizeOptionalId(projectId);
      const scopedDocumentId = normalizeOptionalId(documentId);
      if (scopedDocumentId && !scopedProjectId) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is required when documentId is provided",
        );
      }
      const whereDeleted = includeDeleted ? "" : "AND deleted_at IS NULL";
      const whereScope = scopedProjectId
        ? scopedDocumentId
          ? "AND (scope = 'global' OR (scope = 'project' AND project_id = ?) OR (scope = 'document' AND project_id = ? AND document_id = ?))"
          : "AND (scope = 'global' OR (scope = 'project' AND project_id = ?))"
        : "AND scope = 'global'";

      try {
        const stmt = args.db.prepare<unknown[], MemoryRow>(
          `SELECT memory_id as memoryId, type, scope, project_id as projectId, document_id as documentId, origin, source_ref as sourceRef, content, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
           FROM user_memory
           WHERE 1=1 ${whereDeleted} ${whereScope}`,
        );
        const rows = scopedProjectId
          ? scopedDocumentId
            ? stmt.all(scopedProjectId, scopedProjectId, scopedDocumentId)
            : stmt.all(scopedProjectId)
          : stmt.all();

        const parsed: UserMemoryItem[] = [];
        for (const row of rows) {
          const mapped = rowToMemory(row);
          if (!mapped.ok) {
            return mapped;
          }
          parsed.push(mapped.data);
        }
        return { ok: true, data: { items: deterministicMemorySort(parsed) } };
      } catch (error) {
        args.logger.error("memory_list_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to list memories");
      }
    },

    update: ({ memoryId, patch }) => {
      if (memoryId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "memoryId is required");
      }
      if (Object.keys(patch).length === 0) {
        return ipcError("INVALID_ARGUMENT", "patch is required");
      }

      const existing = selectMemoryById(args.db, memoryId);
      if (!existing) {
        return ipcError("NOT_FOUND", "Memory not found", { memoryId });
      }
      const parsed = rowToMemory(existing);
      if (!parsed.ok) {
        return parsed;
      }

      const current = parsed.data;
      const nextType = patch.type ?? current.type;
      const nextScope = patch.scope ?? current.scope;
      const nextContent = patch.content ?? current.content;
      if (typeof patch.documentId === "string" && nextScope !== "document") {
        return ipcError(
          "INVALID_ARGUMENT",
          "documentId is only allowed for document scope",
        );
      }
      if (typeof patch.projectId === "string" && nextScope === "global") {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is not allowed for global scope",
        );
      }

      const nextProjectId =
        nextScope === "project" || nextScope === "document"
          ? normalizeOptionalId(patch.projectId ?? current.projectId)
          : null;
      const nextDocumentId =
        nextScope === "document"
          ? normalizeOptionalId(patch.documentId ?? current.documentId)
          : null;

      if (!isMemoryType(nextType)) {
        return ipcError("INVALID_ARGUMENT", "type is invalid");
      }
      if (!isMemoryScope(nextScope)) {
        return ipcError("INVALID_ARGUMENT", "scope is invalid");
      }
      if (nextContent.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "content is required");
      }
      if (nextScope === "global") {
        if (nextProjectId !== null || nextDocumentId !== null) {
          return ipcError(
            "INVALID_ARGUMENT",
            "global scope cannot have projectId/documentId",
          );
        }
      }
      if (nextScope === "project") {
        if (!nextProjectId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "projectId is required for project scope",
          );
        }
        if (nextDocumentId !== null) {
          return ipcError(
            "INVALID_ARGUMENT",
            "documentId is not allowed for project scope",
          );
        }
      }
      if (nextScope === "document") {
        if (!nextProjectId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "projectId is required for document scope",
          );
        }
        if (!nextDocumentId) {
          return ipcError(
            "INVALID_ARGUMENT",
            "documentId is required for document scope",
          );
        }
      }

      const ts = nowTs();
      try {
        if (
          nextScope === "document" &&
          !documentExistsInProject(args.db, nextProjectId!, nextDocumentId!)
        ) {
          return ipcError("NOT_FOUND", "Document not found", {
            projectId: nextProjectId,
            documentId: nextDocumentId,
          });
        }

        args.db
          .prepare(
            "UPDATE user_memory SET type = ?, scope = ?, project_id = ?, document_id = ?, content = ?, updated_at = ? WHERE memory_id = ?",
          )
          .run(
            nextType,
            nextScope,
            nextScope === "project" || nextScope === "document"
              ? nextProjectId
              : null,
            nextScope === "document" ? nextDocumentId : null,
            nextContent.trim(),
            ts,
            memoryId,
          );

        args.logger.info("memory_update", {
          memory_id: memoryId,
          type: nextType,
          scope: nextScope,
          project_id:
            nextScope === "project" || nextScope === "document"
              ? nextProjectId
              : null,
          document_id: nextScope === "document" ? nextDocumentId : null,
          origin: current.origin,
          content_len: nextContent.trim().length,
        });
      } catch (error) {
        args.logger.error("memory_update_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to update memory");
      }

      const updated = selectMemoryById(args.db, memoryId);
      if (!updated) {
        return ipcError("DB_ERROR", "Failed to load updated memory");
      }
      return rowToMemory(updated);
    },

    delete: ({ memoryId }) => {
      if (memoryId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "memoryId is required");
      }

      const row = args.db
        .prepare<
          [string],
          { deletedAt: number | null }
        >("SELECT deleted_at as deletedAt FROM user_memory WHERE memory_id = ?")
        .get(memoryId);
      if (!row) {
        return ipcError("NOT_FOUND", "Memory not found", { memoryId });
      }

      const ts = nowTs();
      try {
        if (row.deletedAt === null) {
          args.db
            .prepare(
              "UPDATE user_memory SET deleted_at = ?, updated_at = ? WHERE memory_id = ?",
            )
            .run(ts, ts, memoryId);
        }

        args.logger.info("memory_delete", { memory_id: memoryId });
        return { ok: true, data: { deleted: true } };
      } catch (error) {
        args.logger.error("memory_delete_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to delete memory");
      }
    },

    previewInjection: ({ projectId, documentId, queryText }) => {
      const settings = getSettings();
      if (!settings.ok) {
        return settings;
      }

      if (!settings.data.injectionEnabled) {
        resetSemanticDegradation();
        args.logger.info("memory_injection_preview", {
          mode: "deterministic",
          count: 0,
          disabled: true,
        });
        return { ok: true, data: { items: [], mode: "deterministic" } };
      }

      const scopedProjectId = normalizeOptionalId(projectId);
      const scopedDocumentId = normalizeOptionalId(documentId);
      if (scopedDocumentId && !scopedProjectId) {
        return ipcError(
          "INVALID_ARGUMENT",
          "projectId is required when documentId is provided",
        );
      }
      const whereScope = scopedProjectId
        ? scopedDocumentId
          ? "AND (scope = 'global' OR (scope = 'project' AND project_id = ?) OR (scope = 'document' AND project_id = ? AND document_id = ?))"
          : "AND (scope = 'global' OR (scope = 'project' AND project_id = ?))"
        : "AND scope = 'global'";

      try {
        const stmt = args.db.prepare<unknown[], MemoryRow>(
          `SELECT memory_id as memoryId, type, scope, project_id as projectId, document_id as documentId, origin, source_ref as sourceRef, content, created_at as createdAt, updated_at as updatedAt, deleted_at as deletedAt
           FROM user_memory
           WHERE deleted_at IS NULL ${whereScope}`,
        );
        const rows = scopedProjectId
          ? scopedDocumentId
            ? stmt.all(scopedProjectId, scopedProjectId, scopedDocumentId)
            : stmt.all(scopedProjectId)
          : stmt.all();

        const parsed: UserMemoryItem[] = [];
        for (const row of rows) {
          const mapped = rowToMemory(row);
          if (!mapped.ok) {
            return mapped;
          }
          parsed.push(mapped.data);
        }

        const sorted = deterministicMemorySort(parsed);

        const trimmedQueryText =
          typeof queryText === "string" ? queryText.trim() : "";
        const wantsSemantic = trimmedQueryText.length > 0;

        if (!wantsSemantic) {
          resetSemanticDegradation();
          const items: MemoryInjectionItem[] = sorted.map((item) => ({
            id: item.memoryId,
            type: item.type,
            scope: item.scope,
            origin: item.origin,
            content: item.content,
            reason: { kind: "deterministic" },
          }));

          args.logger.info("memory_injection_preview", {
            mode: "deterministic",
            count: items.length,
          });
          return { ok: true, data: { items, mode: "deterministic" } };
        }

        const vec = createUserMemoryVecService({
          db: args.db,
          logger: args.logger,
        });
        const vecRes = vec.topK({
          sources: sorted.map((m) => ({
            memoryId: m.memoryId,
            content: m.content,
          })),
          queryText: trimmedQueryText,
          k: 8,
          ts: nowTs(),
        });

        if (!vecRes.ok) {
          reportSemanticDegradation({
            projectId: scopedProjectId,
            reason: `${vecRes.error.code}:${vecRes.error.message}`,
          });
          args.logger.info("memory_semantic_recall", {
            mode: "deterministic",
            reason: `${vecRes.error.code}:${vecRes.error.message}`,
          });

          const items: MemoryInjectionItem[] = sorted.map((item) => ({
            id: item.memoryId,
            type: item.type,
            scope: item.scope,
            origin: item.origin,
            content: item.content,
            reason: { kind: "deterministic" },
          }));

          args.logger.info("memory_injection_preview", {
            mode: "deterministic",
            count: items.length,
          });
          return {
            ok: true,
            data: {
              items,
              mode: "deterministic",
              diagnostics: {
                degradedFrom: "semantic",
                reason: vecRes.error.message,
              },
            },
          };
        }

        resetSemanticDegradation();
        const scores = new Map<string, number>();
        for (const m of vecRes.data.matches) {
          scores.set(m.memoryId, m.score);
        }

        const withScores = sorted.map((m) => ({
          memory: m,
          score: scores.get(m.memoryId) ?? 0,
        }));
        withScores.sort((a, b) => {
          if (a.score !== b.score) {
            return b.score - a.score;
          }
          return compareDeterministic(a.memory, b.memory);
        });

        const items: MemoryInjectionItem[] = withScores.map(
          ({ memory, score }) => ({
            id: memory.memoryId,
            type: memory.type,
            scope: memory.scope,
            origin: memory.origin,
            content: memory.content,
            reason:
              score > 0
                ? { kind: "semantic", score }
                : { kind: "deterministic" },
          }),
        );

        args.logger.info("memory_injection_preview", {
          mode: "semantic",
          count: items.length,
        });
        return { ok: true, data: { items, mode: "semantic" } };
      } catch (error) {
        args.logger.error("memory_injection_preview_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to preview memory injection");
      }
    },
  };
}

/**
 * Format memory items into a stable injection block.
 *
 * Why: when injection is disabled we still need a stable placeholder that can
 * be asserted in E2E and does not break prompt caching boundaries.
 */
export function formatMemoryInjectionBlock(args: {
  items: readonly Pick<MemoryInjectionItem, "type" | "scope" | "content">[];
}): string {
  const header = "=== CREONOW_MEMORY_START ===";
  const footer = "=== CREONOW_MEMORY_END ===";

  const lines = args.items.map((item) => {
    const tag = `${item.scope}/${item.type}`;
    return `- (${tag}) ${item.content}`;
  });

  return [header, ...lines, footer].join("\n");
}
