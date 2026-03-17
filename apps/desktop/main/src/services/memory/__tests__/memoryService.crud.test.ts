import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import { createMemoryService } from "../memoryService";

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

type SettingsRow = {
  scope: string;
  key: string;
  valueJson: string;
};

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

/**
 * DB stub for CRUD + settings scenarios.
 *
 * Tracks inserts/updates via closures so tests can inspect what was written.
 */
function createCrudDbStub(args?: {
  memories?: MemoryRow[];
  settings?: SettingsRow[];
  onInsertMemory?: (params: unknown[]) => void;
  onUpdateMemory?: (params: unknown[]) => void;
  onSoftDelete?: (params: unknown[]) => void;
  onWriteSetting?: (params: unknown[]) => void;
}): Database.Database {
  const memories = [...(args?.memories ?? [])];
  const settings = [...(args?.settings ?? [])];

  const db = {
    prepare: (sql: string) => {
      // --- settings read ---
      if (
        sql.includes("FROM settings WHERE scope = ?") &&
        sql.includes("key = ?")
      ) {
        return {
          get: (scope: string, key: string) => {
            const row = settings.find(
              (s) => s.scope === scope && s.key === key,
            );
            return row ? { valueJson: row.valueJson } : undefined;
          },
        };
      }

      // --- settings upsert ---
      if (sql.includes("INSERT INTO settings")) {
        return {
          run: (...params: unknown[]) => {
            const [scope, key, valueJson] = params as [string, string, string];
            const idx = settings.findIndex(
              (s) => s.scope === scope && s.key === key,
            );
            if (idx >= 0) {
              settings[idx] = { scope, key, valueJson };
            } else {
              settings.push({ scope, key, valueJson });
            }
            args?.onWriteSetting?.(params);
            return { changes: 1 };
          },
        };
      }

      // --- document existence check ---
      if (
        sql.includes("FROM documents WHERE document_id = ?") &&
        sql.includes("project_id = ?")
      ) {
        return {
          get: () => ({ exists: 1 }),
        };
      }

      // --- memory insert ---
      if (sql.includes("INSERT INTO user_memory")) {
        return {
          run: (...params: unknown[]) => {
            const [
              memoryId,
              type,
              scope,
              projectId,
              documentId,
              content,
              createdAt,
              updatedAt,
            ] = params as [
              string,
              string,
              string,
              string | null,
              string | null,
              string,
              number,
              number,
            ];
            memories.push({
              memoryId,
              type,
              scope,
              projectId,
              documentId,
              origin: "manual",
              sourceRef: null,
              content,
              createdAt,
              updatedAt,
              deletedAt: null,
            });
            args?.onInsertMemory?.(params);
            return { changes: 1 };
          },
        };
      }

      // --- memory select by id (full row) ---
      if (
        sql.includes("memory_id as memoryId") &&
        sql.includes("FROM user_memory WHERE memory_id = ?")
      ) {
        return {
          get: (id: string) => {
            return memories.find((m) => m.memoryId === id) ?? undefined;
          },
        };
      }

      // --- delete: select deleted_at only ---
      if (
        sql.includes("deleted_at as deletedAt") &&
        sql.includes("FROM user_memory WHERE memory_id = ?") &&
        !sql.includes("memory_id as memoryId")
      ) {
        return {
          get: (id: string) => {
            const m = memories.find((r) => r.memoryId === id);
            return m ? { deletedAt: m.deletedAt } : undefined;
          },
        };
      }

      // --- soft delete ---
      if (
        sql.includes("UPDATE user_memory SET deleted_at") &&
        sql.includes("WHERE memory_id = ?")
      ) {
        return {
          run: (...params: unknown[]) => {
            const [ts, _updatedAt, memoryId] = params as [
              number,
              number,
              string,
            ];
            const m = memories.find((r) => r.memoryId === memoryId);
            if (m) {
              m.deletedAt = ts;
              m.updatedAt = ts;
            }
            args?.onSoftDelete?.(params);
            return { changes: m ? 1 : 0 };
          },
        };
      }

      // --- memory update ---
      if (
        sql.includes("UPDATE user_memory SET") &&
        sql.includes("WHERE memory_id = ?")
      ) {
        return {
          run: (...params: unknown[]) => {
            const [type, scope, projectId, documentId, content, updatedAt, id] =
              params as [
                string,
                string,
                string | null,
                string | null,
                string,
                number,
                string,
              ];
            const m = memories.find((r) => r.memoryId === id);
            if (m) {
              m.type = type;
              m.scope = scope;
              m.projectId = projectId;
              m.documentId = documentId;
              m.content = content;
              m.updatedAt = updatedAt;
            }
            args?.onUpdateMemory?.(params);
            return { changes: m ? 1 : 0 };
          },
        };
      }

      // --- list (with deleted_at IS NULL) ---
      if (
        sql.includes("FROM user_memory") &&
        sql.includes("deleted_at IS NULL")
      ) {
        return {
          all: (...params: unknown[]) => {
            const alive = memories.filter((m) => m.deletedAt === null);
            if (params.length === 0) {
              return alive.filter((m) => m.scope === "global");
            }
            if (params.length === 1) {
              const pid = params[0] as string;
              return alive.filter(
                (m) =>
                  m.scope === "global" ||
                  (m.scope === "project" && m.projectId === pid),
              );
            }
            const pid = params[0] as string;
            const did = params[2] as string;
            return alive.filter(
              (m) =>
                m.scope === "global" ||
                (m.scope === "project" && m.projectId === pid) ||
                (m.scope === "document" &&
                  m.projectId === pid &&
                  m.documentId === did),
            );
          },
        };
      }

      // --- list (includeDeleted — no deleted_at filter) ---
      if (sql.includes("FROM user_memory") && sql.includes("WHERE 1=1")) {
        return {
          all: (...params: unknown[]) => {
            if (params.length === 0) {
              return memories.filter((m) => m.scope === "global");
            }
            if (params.length === 1) {
              const pid = params[0] as string;
              return memories.filter(
                (m) =>
                  m.scope === "global" ||
                  (m.scope === "project" && m.projectId === pid),
              );
            }
            const pid = params[0] as string;
            const did = params[2] as string;
            return memories.filter(
              (m) =>
                m.scope === "global" ||
                (m.scope === "project" && m.projectId === pid) ||
                (m.scope === "document" &&
                  m.projectId === pid &&
                  m.documentId === did),
            );
          },
        };
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },

    transaction: (fn: () => void) => {
      return () => fn();
    },
  } as unknown as Database.Database;

  return db;
}

// ── S1: create happy path — returns UserMemoryItem with generated memoryId ──
{
  const svc = createMemoryService({
    db: createCrudDbStub(),
    logger: createLogger(),
  });

  const result = svc.create({
    type: "preference",
    scope: "global",
    content: "偏好短句叙事",
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(typeof result.data.memoryId, "string");
    assert.ok(result.data.memoryId.length > 0, "memoryId should be non-empty");
    assert.equal(result.data.type, "preference");
    assert.equal(result.data.scope, "global");
    assert.equal(result.data.origin, "manual");
    assert.equal(result.data.content, "偏好短句叙事");
    assert.equal(typeof result.data.createdAt, "number");
    assert.equal(result.data.createdAt, result.data.updatedAt);
    assert.equal(result.data.projectId, undefined);
    assert.equal(result.data.documentId, undefined);
  }
}

// ── S2: create with empty content — returns INVALID_ARGUMENT ──
{
  const svc = createMemoryService({
    db: createCrudDbStub(),
    logger: createLogger(),
  });

  const result = svc.create({
    type: "fact",
    scope: "global",
    content: "   ",
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "INVALID_ARGUMENT");
    assert.ok(
      result.error.message.toLowerCase().includes("content"),
      "error message should mention content",
    );
  }
}

// ── S3: list returns stored memories ──
{
  const memories: MemoryRow[] = [
    {
      memoryId: "m-1",
      type: "preference",
      scope: "global",
      projectId: null,
      documentId: null,
      origin: "manual",
      sourceRef: null,
      content: "第一条记忆",
      createdAt: 100,
      updatedAt: 100,
      deletedAt: null,
    },
    {
      memoryId: "m-2",
      type: "note",
      scope: "project",
      projectId: "proj-1",
      documentId: null,
      origin: "manual",
      sourceRef: null,
      content: "项目级记忆",
      createdAt: 200,
      updatedAt: 200,
      deletedAt: null,
    },
  ];

  const svc = createMemoryService({
    db: createCrudDbStub({ memories }),
    logger: createLogger(),
  });

  const result = svc.list({ projectId: "proj-1" });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.items.length, 2);
    const contents = result.data.items.map((i) => i.content);
    assert.ok(contents.includes("第一条记忆"));
    assert.ok(contents.includes("项目级记忆"));
  }
}

// ── S4: update happy path — returns updated item ──
{
  const memories: MemoryRow[] = [
    {
      memoryId: "u-1",
      type: "fact",
      scope: "global",
      projectId: null,
      documentId: null,
      origin: "manual",
      sourceRef: null,
      content: "原始内容",
      createdAt: 100,
      updatedAt: 100,
      deletedAt: null,
    },
  ];

  const svc = createMemoryService({
    db: createCrudDbStub({ memories }),
    logger: createLogger(),
  });

  const result = svc.update({
    memoryId: "u-1",
    patch: { content: "更新后的内容" },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.memoryId, "u-1");
    assert.equal(result.data.content, "更新后的内容");
    assert.equal(result.data.type, "fact");
    assert.equal(result.data.scope, "global");
    assert.ok(result.data.updatedAt >= 100, "updatedAt should be >= original");
  }
}

// ── S5: update non-existent memoryId — returns NOT_FOUND ──
{
  const svc = createMemoryService({
    db: createCrudDbStub(),
    logger: createLogger(),
  });

  const result = svc.update({
    memoryId: "does-not-exist",
    patch: { content: "不存在的记忆" },
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.error.code, "NOT_FOUND");
  }
}

// ── S6: delete happy path — returns { deleted: true } ──
{
  const memories: MemoryRow[] = [
    {
      memoryId: "d-1",
      type: "note",
      scope: "global",
      projectId: null,
      documentId: null,
      origin: "manual",
      sourceRef: null,
      content: "待删除",
      createdAt: 100,
      updatedAt: 100,
      deletedAt: null,
    },
  ];

  const svc = createMemoryService({
    db: createCrudDbStub({ memories }),
    logger: createLogger(),
  });

  const result = svc.delete({ memoryId: "d-1" });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, { deleted: true });
  }

  // verify soft-delete took effect in the stub
  assert.ok(memories[0]!.deletedAt !== null, "deletedAt should be set");
}

// ── S7: getSettings returns defaults when no settings stored ──
{
  const svc = createMemoryService({
    db: createCrudDbStub(),
    logger: createLogger(),
  });

  const result = svc.getSettings();

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.injectionEnabled, true);
    assert.equal(result.data.preferenceLearningEnabled, true);
    assert.equal(result.data.privacyModeEnabled, false);
    assert.equal(result.data.preferenceLearningThreshold, 3);
  }
}

// ── S8: updateSettings persists and returns merged settings ──
{
  const writtenKeys: string[] = [];

  const svc = createMemoryService({
    db: createCrudDbStub({
      onWriteSetting: (params) => {
        writtenKeys.push((params as string[])[1]!);
      },
    }),
    logger: createLogger(),
  });

  const result = svc.updateSettings({
    patch: { injectionEnabled: false, preferenceLearningThreshold: 5 },
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.injectionEnabled, false);
    assert.equal(result.data.preferenceLearningThreshold, 5);
    // untouched fields keep defaults
    assert.equal(result.data.preferenceLearningEnabled, true);
    assert.equal(result.data.privacyModeEnabled, false);
  }

  assert.ok(
    writtenKeys.some((k) => k.includes("injectionEnabled")),
    "should have written injectionEnabled",
  );
  assert.ok(
    writtenKeys.some((k) => k.includes("preferenceLearningThreshold")),
    "should have written preferenceLearningThreshold",
  );
}

console.log("memoryService.crud.test.ts: all assertions passed");
