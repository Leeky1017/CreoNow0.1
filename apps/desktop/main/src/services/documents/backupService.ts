import type Database from "better-sqlite3";
import { randomUUID } from "node:crypto";

import type { Logger } from "../../logging/logger";

/**
 * Backup snapshot metadata row.
 */
export interface BackupSnapshot {
  id: string;
  projectId: string;
  createdAt: string;
  sizeBytes: number;
  label: string | null;
}

/**
 * BackupService — local project backup & restore.
 *
 * Persists snapshots as DB-internal copies of the project's documents
 * and metadata. Supports manual trigger & scheduled invocations.
 */
export interface BackupServiceDeps {
  db: Database.Database;
  logger: Logger;
  maxSnapshotsPerProject?: number;
}

interface BackupSnapshotDocumentRow {
  documentId: string;
  projectId: string;
  type: string;
  title: string;
  status: string;
  sortOrder: number;
  parentId: string | null;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  createdAt: number;
  updatedAt: number;
}

const DEFAULT_MAX_SNAPSHOTS = 10;

/**
 * Validate a projectId string.
 */
function validateProjectId(projectId: unknown): projectId is string {
  return typeof projectId === "string" && projectId.length > 0;
}

function ensureBackupTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS backup_snapshots (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
      size_bytes  INTEGER NOT NULL DEFAULT 0,
      label       TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_backup_snapshots_project
      ON backup_snapshots(project_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS backup_snapshot_documents (
      snapshot_id  TEXT NOT NULL,
      document_id  TEXT NOT NULL,
      project_id   TEXT NOT NULL,
      type         TEXT NOT NULL,
      title        TEXT NOT NULL,
      status       TEXT NOT NULL,
      sort_order   INTEGER NOT NULL,
      parent_id    TEXT,
      content_json TEXT NOT NULL,
      content_text TEXT NOT NULL,
      content_md   TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      created_at   INTEGER NOT NULL,
      updated_at   INTEGER NOT NULL,
      PRIMARY KEY (snapshot_id, document_id),
      FOREIGN KEY (snapshot_id) REFERENCES backup_snapshots(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_backup_snapshot_documents_snapshot
      ON backup_snapshot_documents(snapshot_id, sort_order ASC);
  `);
}

/**
 * Create a backup snapshot for the given project.
 */
export function createBackupSnapshot(
  deps: BackupServiceDeps,
  projectId: string,
  label?: string,
): BackupSnapshot {
  if (!validateProjectId(projectId)) {
    throw new Error("BACKUP_INVALID_PROJECT");
  }

  const project = deps.db
    .prepare("SELECT id FROM projects WHERE id = ?")
    .get(projectId) as { id: string } | undefined;

  if (!project) {
    throw new Error("BACKUP_PROJECT_NOT_FOUND");
  }

  ensureBackupTables(deps.db);

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  // Count documents to approximate size
  const docs = deps.db
    .prepare("SELECT COUNT(*) as count FROM documents WHERE project_id = ?")
    .get(projectId) as { count: number };

  const sizeBytes = docs.count * 1024; // approximate

  deps.db.transaction(() => {
    deps.db
      .prepare(
        `INSERT INTO backup_snapshots (id, project_id, created_at, size_bytes, label)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(id, projectId, createdAt, sizeBytes, label ?? null);

    deps.db
      .prepare(
        `INSERT INTO backup_snapshot_documents (
           snapshot_id, document_id, project_id, type, title, status,
           sort_order, parent_id, content_json, content_text, content_md,
           content_hash, created_at, updated_at
         )
         SELECT ?, document_id, project_id, type, title, status,
                sort_order, parent_id, content_json, content_text, content_md,
                content_hash, created_at, updated_at
           FROM documents
          WHERE project_id = ?`,
      )
      .run(id, projectId);

    // Prune old snapshots beyond max
    const maxSnapshots = deps.maxSnapshotsPerProject ?? DEFAULT_MAX_SNAPSHOTS;
    deps.db
      .prepare(
        `DELETE FROM backup_snapshots
         WHERE project_id = ? AND id NOT IN (
           SELECT id FROM backup_snapshots
           WHERE project_id = ?
           ORDER BY created_at DESC, rowid DESC
           LIMIT ?
         )`,
      )
      .run(projectId, projectId, maxSnapshots);

    deps.db
      .prepare(
        `DELETE FROM backup_snapshot_documents
         WHERE snapshot_id NOT IN (SELECT id FROM backup_snapshots)`,
      )
      .run();
  })();

  deps.logger.info("backup_snapshot_created", {
    backupId: id,
    projectId,
    sizeBytes,
  });

  return { id, projectId, createdAt, sizeBytes, label: label ?? null };
}

/**
 * List backup snapshots for a project, newest first.
 */
export function listBackupSnapshots(
  deps: BackupServiceDeps,
  projectId: string,
): BackupSnapshot[] {
  if (!validateProjectId(projectId)) {
    return [];
  }

  ensureBackupTables(deps.db);

  return deps.db
    .prepare(
      `SELECT id, project_id AS projectId, created_at AS createdAt,
              size_bytes AS sizeBytes, label
       FROM backup_snapshots
       WHERE project_id = ?
       ORDER BY created_at DESC, rowid DESC`,
    )
    .all(projectId) as BackupSnapshot[];
}

/**
 * Restore from a backup snapshot.
 *
 * In v0.2 this is a metadata-only operation — the snapshot record
 * is verified to exist and the restore event is logged.
 * Full content restore will ship with the file-level backup feature.
 */
export function restoreBackupSnapshot(
  deps: BackupServiceDeps,
  backupId: string,
): BackupSnapshot {
  if (typeof backupId !== "string" || backupId.length === 0) {
    throw new Error("BACKUP_INVALID_ID");
  }

  ensureBackupTables(deps.db);

  const snapshot = deps.db
    .prepare(
      `SELECT id, project_id AS projectId, created_at AS createdAt,
              size_bytes AS sizeBytes, label
       FROM backup_snapshots
       WHERE id = ?`,
    )
    .get(backupId) as BackupSnapshot | undefined;

  if (!snapshot) {
    throw new Error("BACKUP_SNAPSHOT_NOT_FOUND");
  }

  const snapshotDocs = deps.db
    .prepare(
      `SELECT
         document_id AS documentId,
         project_id AS projectId,
         type,
         title,
         status,
         sort_order AS sortOrder,
         parent_id AS parentId,
         content_json AS contentJson,
         content_text AS contentText,
         content_md AS contentMd,
         content_hash AS contentHash,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM backup_snapshot_documents
       WHERE snapshot_id = ?
       ORDER BY sort_order ASC, document_id ASC`,
    )
    .all(backupId) as BackupSnapshotDocumentRow[];

  if (snapshotDocs.length === 0) {
    throw new Error("BACKUP_SNAPSHOT_CONTENT_MISSING");
  }

  deps.db.transaction(() => {
    for (const doc of snapshotDocs) {
      deps.db
        .prepare(
          `INSERT INTO documents (
             document_id, project_id, type, title, status,
             sort_order, parent_id, content_json, content_text,
             content_md, content_hash, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(document_id) DO UPDATE SET
             project_id = excluded.project_id,
             type = excluded.type,
             title = excluded.title,
             status = excluded.status,
             sort_order = excluded.sort_order,
             parent_id = excluded.parent_id,
             content_json = excluded.content_json,
             content_text = excluded.content_text,
             content_md = excluded.content_md,
             content_hash = excluded.content_hash,
             created_at = excluded.created_at,
             updated_at = excluded.updated_at`,
        )
        .run(
          doc.documentId,
          doc.projectId,
          doc.type,
          doc.title,
          doc.status,
          doc.sortOrder,
          doc.parentId,
          doc.contentJson,
          doc.contentText,
          doc.contentMd,
          doc.contentHash,
          doc.createdAt,
          doc.updatedAt,
        );
    }

    deps.db
      .prepare(
        `DELETE FROM documents
         WHERE project_id = ?
           AND document_id NOT IN (
             SELECT document_id
             FROM backup_snapshot_documents
             WHERE snapshot_id = ?
           )`,
      )
      .run(snapshot.projectId, backupId);
  })();

  deps.logger.info("backup_snapshot_restored", {
    backupId,
    projectId: snapshot.projectId,
  });

  return snapshot;
}

/**
 * Delete a specific backup snapshot.
 */
export function deleteBackupSnapshot(
  deps: BackupServiceDeps,
  backupId: string,
): void {
  if (typeof backupId !== "string" || backupId.length === 0) {
    throw new Error("BACKUP_INVALID_ID");
  }

  ensureBackupTables(deps.db);

  const result = deps.db
    .prepare("DELETE FROM backup_snapshots WHERE id = ?")
    .run(backupId);

  if (result.changes === 0) {
    throw new Error("BACKUP_SNAPSHOT_NOT_FOUND");
  }

  deps.db
    .prepare("DELETE FROM backup_snapshot_documents WHERE snapshot_id = ?")
    .run(backupId);

  deps.logger.info("backup_snapshot_deleted", { backupId });
}
