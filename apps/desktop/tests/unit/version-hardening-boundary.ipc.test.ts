import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import Database from "better-sqlite3";
import type { IpcMain } from "electron";

import { registerVersionIpcHandlers } from "../../main/src/ipc/version";
import type { Logger } from "../../main/src/logging/logger";
import type { DocumentService } from "../../main/src/services/documents/documentService";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

type IpcErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: IpcErrorPayload };

function createNoopLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createIpcHarness(): {
  ipcMain: IpcMain;
  handlers: Map<string, Handler>;
} {
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle(channel: string, handler: Handler) {
      handlers.set(channel, handler);
    },
  } as unknown as IpcMain;

  return { ipcMain, handlers };
}

function hashJson(contentJson: string): string {
  return createHash("sha256").update(contentJson, "utf8").digest("hex");
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/u).length;
}

function toContentJson(text: string): string {
  return JSON.stringify({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });
}

function createVersionDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE projects (
      project_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      root_path TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE documents (
      document_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'chapter',
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      content_text TEXT NOT NULL,
      content_md TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      sort_order INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE TABLE document_versions (
      version_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      reason TEXT NOT NULL,
      content_json TEXT NOT NULL,
      content_text TEXT NOT NULL,
      content_md TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      word_count INTEGER NOT NULL DEFAULT 0,
      diff_format TEXT NOT NULL DEFAULT '',
      diff_text TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE,
      FOREIGN KEY(document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );

    CREATE TABLE settings (
      scope TEXT NOT NULL,
      key TEXT NOT NULL,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (scope, key)
    );

    CREATE TABLE document_branches (
      branch_id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      name TEXT NOT NULL,
      base_snapshot_id TEXT NOT NULL,
      head_snapshot_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(document_id, name),
      FOREIGN KEY(document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
      FOREIGN KEY(base_snapshot_id) REFERENCES document_versions(version_id),
      FOREIGN KEY(head_snapshot_id) REFERENCES document_versions(version_id)
    );

    CREATE TABLE document_merge_sessions (
      merge_session_id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      source_branch_name TEXT NOT NULL,
      target_branch_name TEXT NOT NULL,
      merged_template_text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );

    CREATE TABLE document_merge_conflicts (
      conflict_id TEXT PRIMARY KEY,
      merge_session_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      source_branch_name TEXT NOT NULL,
      target_branch_name TEXT NOT NULL,
      conflict_index INTEGER NOT NULL,
      base_text TEXT NOT NULL,
      ours_text TEXT NOT NULL,
      theirs_text TEXT NOT NULL,
      selected_resolution TEXT,
      manual_text TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY(merge_session_id) REFERENCES document_merge_sessions(merge_session_id) ON DELETE CASCADE,
      FOREIGN KEY(document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );

    CREATE INDEX idx_document_versions_document_created
      ON document_versions (document_id, created_at DESC, version_id ASC);
  `);
  return db;
}

function seedProjectAndDocument(
  db: Database.Database,
  args: {
    projectId: string;
    documentId: string;
    text: string;
    createdAt: number;
  },
): void {
  const contentJson = toContentJson(args.text);
  const contentHash = hashJson(contentJson);

  db.prepare(
    "INSERT INTO projects (project_id, name, root_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
  ).run(
    args.projectId,
    `Project ${args.projectId}`,
    `/tmp/${args.projectId}`,
    args.createdAt,
    args.createdAt,
  );

  db.prepare(
    "INSERT INTO documents (document_id, project_id, type, title, content_json, content_text, content_md, content_hash, status, sort_order, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    args.documentId,
    args.projectId,
    "chapter",
    `Doc ${args.documentId}`,
    contentJson,
    args.text,
    args.text,
    contentHash,
    "draft",
    0,
    null,
    args.createdAt,
    args.createdAt,
  );
}

function insertVersion(
  db: Database.Database,
  args: {
    versionId: string;
    projectId: string;
    documentId: string;
    text: string;
    actor: "user" | "auto" | "ai";
    reason: string;
    createdAt: number;
  },
): void {
  const contentJson = toContentJson(args.text);
  db.prepare(
    "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, word_count, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    args.versionId,
    args.projectId,
    args.documentId,
    args.actor,
    args.reason,
    contentJson,
    args.text,
    args.text,
    hashJson(contentJson),
    countWords(args.text),
    "",
    "",
    args.createdAt,
  );
}

async function testLargeDiffPayloadRejected(): Promise<void> {
  const db = createVersionDb();
  const now = Date.now();
  seedProjectAndDocument(db, {
    projectId: "proj-large-diff",
    documentId: "doc-large-diff",
    text: "seed",
    createdAt: now - 10_000,
  });

  const hugeA = `A${"x".repeat(1_200_000)}`;
  const hugeB = `B${"y".repeat(1_200_000)}`;

  insertVersion(db, {
    versionId: "v-large-a",
    projectId: "proj-large-diff",
    documentId: "doc-large-diff",
    text: hugeA,
    actor: "user",
    reason: "manual-save",
    createdAt: now - 9_000,
  });
  insertVersion(db, {
    versionId: "v-large-b",
    projectId: "proj-large-diff",
    documentId: "doc-large-diff",
    text: hugeB,
    actor: "user",
    reason: "manual-save",
    createdAt: now - 8_000,
  });

  const { ipcMain, handlers } = createIpcHarness();
  registerVersionIpcHandlers({ ipcMain, db, logger: createNoopLogger() });

  const diffHandler = handlers.get("version:snapshot:diff");
  assert.ok(diffHandler, "version:snapshot:diff handler should be registered");
  if (!diffHandler) {
    throw new Error("missing version:snapshot:diff handler");
  }

  const res = (await diffHandler(
    {},
    {
      documentId: "doc-large-diff",
      baseVersionId: "v-large-a",
      targetVersionId: "v-large-b",
    },
  )) as IpcResult<unknown>;

  assert.equal(res.ok, false, "large diff payload should be rejected");
  if (!res.ok) {
    assert.equal(res.error.code, "VERSION_DIFF_PAYLOAD_TOO_LARGE");
  }

  db.close();
}

async function testSnapshotCompactionAtCapacityBoundary(): Promise<void> {
  const db = createVersionDb();
  const now = Date.now();
  seedProjectAndDocument(db, {
    projectId: "proj-compact",
    documentId: "doc-compact",
    text: "seed",
    createdAt: now - 10_000,
  });

  for (let index = 0; index < 9; index += 1) {
    insertVersion(db, {
      versionId: `v-auto-${index}`,
      projectId: "proj-compact",
      documentId: "doc-compact",
      text: `autosave-${index}`,
      actor: "auto",
      reason: "autosave",
      createdAt: now - 8 * 24 * 60 * 60 * 1000 - index,
    });
  }

  insertVersion(db, {
    versionId: "v-manual-keep",
    projectId: "proj-compact",
    documentId: "doc-compact",
    text: "manual keep",
    actor: "user",
    reason: "manual-save",
    createdAt: now - 5_000,
  });

  const { ipcMain, handlers } = createIpcHarness();
  registerVersionIpcHandlers({
    ipcMain,
    db,
    logger: createNoopLogger(),
    maxSnapshotsPerDocument: 8,
  });

  const createHandler = handlers.get("version:snapshot:create");
  assert.ok(
    createHandler,
    "version:snapshot:create handler should be registered",
  );
  if (!createHandler) {
    throw new Error("missing version:snapshot:create handler");
  }

  const res = (await createHandler(
    {},
    {
      projectId: "proj-compact",
      documentId: "doc-compact",
      contentJson: toContentJson("new incoming snapshot"),
      actor: "auto",
      reason: "autosave",
    },
  )) as IpcResult<{
    compaction?: { code: string; deletedCount: number; remainingCount: number };
  }>;

  assert.equal(res.ok, true, "snapshot create should succeed");
  if (res.ok) {
    assert.equal(
      res.data.compaction?.code,
      "VERSION_SNAPSHOT_COMPACTED",
      "snapshot create should report compaction event",
    );
  }

  const count = db
    .prepare<
      [string],
      { count: number }
    >("SELECT COUNT(*) as count FROM document_versions WHERE document_id = ?")
    .get("doc-compact");
  assert.ok(count, "snapshot count row should exist");
  assert.ok(
    (count?.count ?? 0) <= 8,
    "snapshot count should be compacted to boundary",
  );

  const preservedManual = db
    .prepare<
      [string],
      { count: number }
    >("SELECT COUNT(*) as count FROM document_versions WHERE document_id = ? AND reason = 'manual-save'")
    .get("doc-compact");
  assert.ok(
    (preservedManual?.count ?? 0) >= 1,
    "manual-save snapshots must be preserved during compaction",
  );

  db.close();
}

async function testConcurrentRollbackConflict(): Promise<void> {
  const db = createVersionDb();
  const now = Date.now();
  seedProjectAndDocument(db, {
    projectId: "proj-rollback",
    documentId: "doc-rollback",
    text: "current content",
    createdAt: now - 20_000,
  });

  insertVersion(db, {
    versionId: "v-rollback-target",
    projectId: "proj-rollback",
    documentId: "doc-rollback",
    text: "target content",
    actor: "user",
    reason: "manual-save",
    createdAt: now - 19_000,
  });

  const { ipcMain, handlers } = createIpcHarness();
  registerVersionIpcHandlers({
    ipcMain,
    db,
    logger: createNoopLogger(),
    simulateLatencyMs: { rollback: 50 },
  });

  const rollbackHandler = handlers.get("version:snapshot:rollback");
  assert.ok(
    rollbackHandler,
    "version:snapshot:rollback handler should be registered",
  );
  if (!rollbackHandler) {
    throw new Error("missing version:snapshot:rollback handler");
  }

  const [first, second] = (await Promise.all([
    rollbackHandler(
      {},
      {
        documentId: "doc-rollback",
        versionId: "v-rollback-target",
      },
    ),
    rollbackHandler(
      {},
      {
        documentId: "doc-rollback",
        versionId: "v-rollback-target",
      },
    ),
  ])) as [IpcResult<unknown>, IpcResult<unknown>];

  const errors = [first, second].filter(
    (item): item is { ok: false; error: IpcErrorPayload } => !item.ok,
  );
  assert.equal(
    errors.length,
    1,
    "one concurrent rollback must fail with conflict",
  );
  assert.equal(errors[0]?.error.code, "VERSION_ROLLBACK_CONFLICT");

  db.close();
}

async function testSnapshotCreateRejectsNonStringIdsWithoutThrowing(): Promise<void> {
  const db = createVersionDb();
  const now = Date.now();
  seedProjectAndDocument(db, {
    projectId: "proj-invalid-payload",
    documentId: "doc-invalid-payload",
    text: "seed",
    createdAt: now - 10_000,
  });

  const { ipcMain, handlers } = createIpcHarness();
  registerVersionIpcHandlers({ ipcMain, db, logger: createNoopLogger() });

  const createHandler = handlers.get("version:snapshot:create");
  assert.ok(
    createHandler,
    "version:snapshot:create handler should be registered",
  );
  if (!createHandler) {
    throw new Error("missing version:snapshot:create handler");
  }

  const res = (await createHandler(
    {},
    {
      projectId: 1,
      documentId: "doc-invalid-payload",
      contentJson: toContentJson("payload"),
      actor: "user",
      reason: "manual-save",
    },
  )) as IpcResult<unknown>;

  assert.equal(
    res.ok,
    false,
    "snapshot create should map invalid payload to INVALID_ARGUMENT",
  );
  if (!res.ok) {
    assert.equal(res.error.code, "INVALID_ARGUMENT");
    assert.equal(res.error.message, "projectId/documentId is required");
  }

  db.close();
}

async function testSnapshotCreateIoRetry(): Promise<void> {
  const db = createVersionDb();
  const now = Date.now();
  seedProjectAndDocument(db, {
    projectId: "proj-retry",
    documentId: "doc-retry",
    text: "retry content",
    createdAt: now - 10_000,
  });

  let saveAttempts = 0;
  const fakeService = {
    save: () => {
      saveAttempts += 1;
      if (saveAttempts < 3) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "transient write failure" },
        };
      }
      return {
        ok: true,
        data: {
          updatedAt: Date.now(),
          contentHash: "content-hash",
        },
      };
    },
    listVersions: () => ({
      ok: true,
      data: {
        items: [
          {
            versionId: "v-retry",
            actor: "user",
            reason: "manual-save",
            contentHash: "content-hash",
            wordCount: 2,
            createdAt: Date.now(),
          },
        ],
      },
    }),
  };

  const { ipcMain, handlers } = createIpcHarness();
  registerVersionIpcHandlers({
    ipcMain,
    db,
    logger: createNoopLogger(),
    serviceFactory: () => fakeService as unknown as DocumentService,
    ioRetryMaxAttempts: 3,
  });

  const createHandler = handlers.get("version:snapshot:create");
  assert.ok(
    createHandler,
    "version:snapshot:create handler should be registered",
  );
  if (!createHandler) {
    throw new Error("missing version:snapshot:create handler");
  }

  const res = (await createHandler(
    {},
    {
      projectId: "proj-retry",
      documentId: "doc-retry",
      contentJson: toContentJson("retry content"),
      actor: "user",
      reason: "manual-save",
    },
  )) as IpcResult<unknown>;

  assert.equal(res.ok, true, "snapshot create should succeed after retries");
  assert.equal(saveAttempts, 3, "snapshot create should retry exactly 3 times");

  db.close();
}

const checks: Array<{ name: string; run: () => Promise<void> }> = [
  {
    name: "large diff payload rejected",
    run: testLargeDiffPayloadRejected,
  },
  {
    name: "snapshot compaction at capacity boundary",
    run: testSnapshotCompactionAtCapacityBoundary,
  },
  {
    name: "concurrent rollback conflict",
    run: testConcurrentRollbackConflict,
  },
  {
    name: "snapshot create io retry",
    run: testSnapshotCreateIoRetry,
  },
  {
    name: "snapshot create rejects non-string ids without throwing",
    run: testSnapshotCreateRejectsNonStringIdsWithoutThrowing,
  },
];

const failures: Array<{ name: string; error: unknown }> = [];
for (const check of checks) {
  try {
    await check.run();
    console.log(`[PASS] ${check.name}`);
  } catch (error) {
    failures.push({ name: check.name, error });
    console.error(`[FAIL] ${check.name}`);
    console.error(error);
  }
}

if (failures.length > 0) {
  const names = failures.map((item) => item.name).join(", ");
  throw new Error(`version hardening boundary checks failed: ${names}`);
}

console.log("version-hardening-boundary.ipc.test.ts: all assertions passed");
