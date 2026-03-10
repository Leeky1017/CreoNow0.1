import Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";

export function createNoopLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE projects (
      project_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      root_path TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'novel',
      description TEXT NOT NULL DEFAULT '',
      stage TEXT NOT NULL DEFAULT 'outline',
      target_word_count INTEGER,
      target_chapter_count INTEGER,
      narrative_person TEXT NOT NULL DEFAULT 'first',
      language_style TEXT NOT NULL DEFAULT '',
      target_audience TEXT NOT NULL DEFAULT '',
      default_skill_set_id TEXT,
      knowledge_graph_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      archived_at INTEGER
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

    CREATE TABLE settings (
      scope TEXT NOT NULL,
      key TEXT NOT NULL,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (scope, key)
    );
  `);
  return db;
}

export function seedProjectAndDocument(args: {
  db: Database.Database;
  projectId: string;
  documentId: string;
  title: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
}): void {
  const now = Date.now();
  args.db
    .prepare(
      `
      INSERT INTO projects (
        project_id, name, root_path, type, description, stage, created_at, updated_at
      ) VALUES (?, ?, ?, 'novel', '', 'outline', ?, ?)
    `,
    )
    .run(args.projectId, "Export Project", `/tmp/${args.projectId}`, now, now);

  args.db
    .prepare(
      `
      INSERT INTO documents (
        document_id, project_id, type, title, content_json, content_text, content_md,
        content_hash, status, sort_order, parent_id, created_at, updated_at
      ) VALUES (?, ?, 'chapter', ?, ?, ?, ?, 'hash', 'draft', 0, NULL, ?, ?)
    `,
    )
    .run(
      args.documentId,
      args.projectId,
      args.title,
      args.contentJson,
      args.contentText,
      args.contentMd,
      now,
      now,
    );
}