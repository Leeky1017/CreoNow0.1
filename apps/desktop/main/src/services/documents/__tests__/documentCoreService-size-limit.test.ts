import { describe, expect, it, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";

import { createDocumentCoreService, MAX_DOCUMENT_SIZE_BYTES } from "../documentCoreService";

/**
 * S-SIZE-6: documentCoreService.save() 独立体积校验（第二道防线）
 */

const fakeLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
};

function createInMemoryDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");

  // 建表（最小化所需 schema）
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      document_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'chapter',
      title TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft',
      sort_order INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      content_json TEXT NOT NULL DEFAULT '{}',
      content_text TEXT NOT NULL DEFAULT '',
      content_md TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS document_versions (
      version_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      reason TEXT NOT NULL,
      content_json TEXT NOT NULL DEFAULT '{}',
      content_text TEXT NOT NULL DEFAULT '',
      content_md TEXT NOT NULL DEFAULT '',
      content_hash TEXT NOT NULL DEFAULT '',
      word_count INTEGER NOT NULL DEFAULT 0,
      diff_format TEXT NOT NULL DEFAULT '',
      diff_text TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      scope TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      PRIMARY KEY (scope, key)
    );

    CREATE TABLE IF NOT EXISTS version_branches (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      name TEXT NOT NULL,
      base_snapshot_id TEXT NOT NULL,
      head_snapshot_id TEXT NOT NULL,
      created_by TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL DEFAULT 0,
      is_current INTEGER NOT NULL DEFAULT 0
    );
  `);

  return db;
}

function seedDocument(db: Database.Database, projectId: string, documentId: string): void {
  db.prepare(
    "INSERT INTO documents (document_id, project_id, type, title, status, sort_order, content_json, content_text, content_md, content_hash, created_at, updated_at) VALUES (?, ?, 'chapter', 'Test', 'draft', 0, '{}', '', '', '', 0, 0)",
  ).run(documentId, projectId);
}

describe("documentCoreService.save() — 文档大小限制（第二道防线）", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createInMemoryDb();
    seedDocument(db, "proj-1", "doc-1");
  });

  afterEach(() => {
    db.close();
  });

  it("AC-4: 6 MB contentJson 被 Service 层拦截", () => {
    const svc = createDocumentCoreService({ db, logger: fakeLogger as never });
    // Build a ProseMirror doc whose JSON serialization exceeds 5 MB
    const sixMB = 6 * 1024 * 1024;
    const bigText = "x".repeat(sixMB);
    const bigContent = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: bigText }] }],
    };

    const result = svc.save({
      projectId: "proj-1",
      documentId: "doc-1",
      contentJson: bigContent,
      actor: "user",
      reason: "manual-save",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DOCUMENT_SIZE_EXCEEDED");
    }
  });

  it("AC-4: 2 MB contentJson 正常保存", () => {
    const svc = createDocumentCoreService({ db, logger: fakeLogger as never });
    const normalContent = {
      type: "doc",
      content: [{ type: "paragraph", content: [{ type: "text", text: "Hello World" }] }],
    };

    const result = svc.save({
      projectId: "proj-1",
      documentId: "doc-1",
      contentJson: normalContent,
      actor: "user",
      reason: "manual-save",
    });

    expect(result.ok).toBe(true);
  });

  it("AC-6: MAX_DOCUMENT_SIZE_BYTES 常量存在且值为 5 * 1024 * 1024", () => {
    expect(MAX_DOCUMENT_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });
});
