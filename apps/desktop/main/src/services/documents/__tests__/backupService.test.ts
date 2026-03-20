import { describe, expect, it, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";

import {
  createBackupSnapshot,
  listBackupSnapshots,
  restoreBackupSnapshot,
  deleteBackupSnapshot,
  type BackupServiceDeps,
} from "../backupService";

const fakeLogger = {
  info: () => {},
  error: () => {},
  warn: () => {},
  debug: () => {},
  logPath: ":memory:",
};

function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE documents (
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
      updated_at INTEGER NOT NULL DEFAULT 0,
      cover_image_url TEXT
    );
    CREATE TABLE backup_snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      size_bytes INTEGER NOT NULL DEFAULT 0,
      label TEXT
    );
    CREATE TABLE backup_snapshot_documents (
      snapshot_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      parent_id TEXT,
      content_json TEXT NOT NULL,
      content_text TEXT NOT NULL,
      content_md TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (snapshot_id, document_id)
    );
    CREATE INDEX idx_backup_snapshots_project_created
      ON backup_snapshots(project_id, created_at DESC);
  `);
  return db;
}

function seedProject(db: Database.Database, projectId: string): void {
  db.prepare("INSERT INTO projects (id, title) VALUES (?, ?)").run(
    projectId,
    "Test Project",
  );
}

function insertDocument(args: {
  db: Database.Database;
  documentId: string;
  projectId: string;
  contentText: string;
}): void {
  args.db
    .prepare(
      `INSERT INTO documents (
         document_id, project_id, type, title, status,
         sort_order, parent_id, content_json, content_text,
         content_md, content_hash, created_at, updated_at
       ) VALUES (?, ?, 'chapter', ?, 'draft', 0, NULL, '{}', ?, ?, ?, 1, 1)`,
    )
    .run(
      args.documentId,
      args.projectId,
      args.documentId,
      args.contentText,
      args.contentText,
      `${args.documentId}-hash`,
    );
}

describe("BackupService", () => {
  let db: Database.Database;
  let deps: BackupServiceDeps;

  beforeEach(() => {
    db = createTestDb();
    deps = { db, logger: fakeLogger };
  });

  afterEach(() => {
    db.close();
  });

  describe("createBackupSnapshot", () => {
    it("creates a snapshot for existing project", () => {
      seedProject(db, "proj-1");
      const snapshot = createBackupSnapshot(deps, "proj-1");

      expect(snapshot.id).toBeDefined();
      expect(snapshot.projectId).toBe("proj-1");
      expect(snapshot.createdAt).toBeDefined();
      expect(snapshot.sizeBytes).toEqual(0);
      expect(snapshot.label).toBeNull();
    });

    it("creates a snapshot with label", () => {
      seedProject(db, "proj-1");
      const snapshot = createBackupSnapshot(deps, "proj-1", "before-refactor");

      expect(snapshot.label).toBe("before-refactor");
    });

    it("throws BACKUP_PROJECT_NOT_FOUND for missing project", () => {
      expect(() => createBackupSnapshot(deps, "missing")).toThrow(
        "BACKUP_PROJECT_NOT_FOUND",
      );
    });

    it("throws BACKUP_INVALID_PROJECT for empty projectId", () => {
      expect(() => createBackupSnapshot(deps, "")).toThrow(
        "BACKUP_INVALID_PROJECT",
      );
    });

    it("prunes old snapshots beyond max", () => {
      seedProject(db, "proj-1");
      const smallDeps = { ...deps, maxSnapshotsPerProject: 2 };

      createBackupSnapshot(smallDeps, "proj-1", "snap-1");
      createBackupSnapshot(smallDeps, "proj-1", "snap-2");
      createBackupSnapshot(smallDeps, "proj-1", "snap-3");

      const list = listBackupSnapshots(deps, "proj-1");
      expect(list).toHaveLength(2);
      expect(list[0].label).toBe("snap-3");
      expect(list[1].label).toBe("snap-2");
    });
  });

  describe("listBackupSnapshots", () => {
    it("returns empty array for unknown project", () => {
      expect(listBackupSnapshots(deps, "proj-x")).toEqual([]);
    });

    it("returns snapshots ordered newest first", () => {
      seedProject(db, "proj-1");
      createBackupSnapshot(deps, "proj-1", "first");
      createBackupSnapshot(deps, "proj-1", "second");

      const list = listBackupSnapshots(deps, "proj-1");
      expect(list).toHaveLength(2);
      expect(list[0].label).toBe("second");
      expect(list[1].label).toBe("first");
    });

    it("returns empty for invalid projectId", () => {
      expect(listBackupSnapshots(deps, "")).toEqual([]);
    });
  });

  describe("restoreBackupSnapshot", () => {
    it("returns snapshot on valid restore", () => {
      seedProject(db, "proj-1");
      insertDocument({
        db,
        documentId: "doc-restore-1",
        projectId: "proj-1",
        contentText: "restore-content",
      });
      const created = createBackupSnapshot(deps, "proj-1", "restore-me");
      const restored = restoreBackupSnapshot(deps, created.id);

      expect(restored.id).toBe(created.id);
      expect(restored.projectId).toBe("proj-1");
      expect(restored.label).toBe("restore-me");
    });

    it("throws BACKUP_SNAPSHOT_NOT_FOUND for unknown id", () => {
      expect(() => restoreBackupSnapshot(deps, "nonexistent")).toThrow(
        "BACKUP_SNAPSHOT_NOT_FOUND",
      );
    });

    it("throws BACKUP_INVALID_ID for empty id", () => {
      expect(() => restoreBackupSnapshot(deps, "")).toThrow(
        "BACKUP_INVALID_ID",
      );
    });

    it("restores document content and removes docs created after snapshot", () => {
      seedProject(db, "proj-1");
      insertDocument({
        db,
        documentId: "doc-1",
        projectId: "proj-1",
        contentText: "draft-v1",
      });

      const snapshot = createBackupSnapshot(deps, "proj-1", "checkpoint");

      db.prepare(
        "UPDATE documents SET content_text = ?, content_md = ?, content_hash = ? WHERE document_id = ?",
      ).run("draft-v2", "draft-v2", "doc-1-hash-v2", "doc-1");
      insertDocument({
        db,
        documentId: "doc-2",
        projectId: "proj-1",
        contentText: "new-content",
      });

      restoreBackupSnapshot(deps, snapshot.id);

      const restoredDoc1 = db
        .prepare(
          "SELECT content_text AS contentText, content_hash AS contentHash FROM documents WHERE document_id = ?",
        )
        .get("doc-1") as { contentText: string; contentHash: string };
      const restoredDoc2 = db
        .prepare("SELECT document_id FROM documents WHERE document_id = ?")
        .get("doc-2") as { document_id: string } | undefined;

      expect(restoredDoc1.contentText).toBe("draft-v1");
      expect(restoredDoc1.contentHash).toBe("doc-1-hash");
      expect(restoredDoc2).toBeUndefined();
    });
  });

  describe("deleteBackupSnapshot", () => {
    it("deletes an existing snapshot", () => {
      seedProject(db, "proj-1");
      const created = createBackupSnapshot(deps, "proj-1");
      deleteBackupSnapshot(deps, created.id);

      expect(listBackupSnapshots(deps, "proj-1")).toHaveLength(0);
    });

    it("throws BACKUP_SNAPSHOT_NOT_FOUND for unknown id", () => {
      expect(() => deleteBackupSnapshot(deps, "missing")).toThrow(
        "BACKUP_SNAPSHOT_NOT_FOUND",
      );
    });

    it("throws BACKUP_INVALID_ID for empty id", () => {
      expect(() => deleteBackupSnapshot(deps, "")).toThrow("BACKUP_INVALID_ID");
    });
  });
});
