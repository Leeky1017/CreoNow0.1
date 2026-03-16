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
