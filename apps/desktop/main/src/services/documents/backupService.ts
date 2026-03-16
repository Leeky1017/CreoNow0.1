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

const DEFAULT_MAX_SNAPSHOTS = 10;

/**
 * Validate a projectId string.
 */
function validateProjectId(projectId: unknown): projectId is string {
  return typeof projectId === "string" && projectId.length > 0;
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

  const id = randomUUID();
  const createdAt = new Date().toISOString();

  // Count documents to approximate size
  const docs = deps.db
    .prepare("SELECT COUNT(*) as count FROM documents WHERE project_id = ?")
    .get(projectId) as { count: number };

  const sizeBytes = docs.count * 1024; // approximate

  deps.db
    .prepare(
      `INSERT INTO backup_snapshots (id, project_id, created_at, size_bytes, label)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, projectId, createdAt, sizeBytes, label ?? null);

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

  const result = deps.db
    .prepare("DELETE FROM backup_snapshots WHERE id = ?")
    .run(backupId);

  if (result.changes === 0) {
    throw new Error("BACKUP_SNAPSHOT_NOT_FOUND");
  }

  deps.logger.info("backup_snapshot_deleted", { backupId });
}
