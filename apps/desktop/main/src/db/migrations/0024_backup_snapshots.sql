-- backup_snapshots table for local backup feature (#1126)
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
