import assert from "node:assert/strict";

import Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import {
  createStateExtractor,
  runStateExtractionForChapterCompletion,
} from "../stateExtractor";

type LogEntry = {
  event: string;
  data?: Record<string, unknown>;
};

function createLogger(entries: {
  info: LogEntry[];
  error: LogEntry[];
}): Logger {
  return {
    logPath: "<test>",
    info: (event, data) => entries.info.push({ event, data }),
    error: (event, data) => entries.error.push({ event, data }),
  };
}

function createDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE projects (
      project_id TEXT PRIMARY KEY
    );

    CREATE TABLE documents (
      document_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content_json TEXT NOT NULL,
      content_text TEXT NOT NULL,
      content_md TEXT NOT NULL,
      content_hash TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'chapter',
      status TEXT NOT NULL DEFAULT 'draft',
      sort_order INTEGER NOT NULL DEFAULT 0,
      parent_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      cover_image_url TEXT,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE TABLE kg_entities (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      attributes_json TEXT NOT NULL DEFAULT '{}',
      ai_context_level TEXT NOT NULL DEFAULT 'when_detected',
      aliases TEXT NOT NULL DEFAULT '[]',
      last_seen_state TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(project_id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX idx_kg_entities_project_type_name
      ON kg_entities(project_id, type, lower(trim(name)));
  `);

  return db;
}

// S3-STE-S3
// chapter-complete flow degrades gracefully when extraction fails
{
  const db = createDb();
  const logs = { info: [] as LogEntry[], error: [] as LogEntry[] };
  const logger = createLogger(logs);
  const projectId = "proj-state-s3";
  const documentId = "chapter-12";

  db.prepare("INSERT INTO projects (project_id) VALUES (?)").run(projectId);
  db.prepare(
    "INSERT INTO documents (document_id, project_id, title, content_json, content_text, content_md, content_hash, type, status, sort_order, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    documentId,
    projectId,
    "第十二章",
    "{}",
    "林远状态变化明显。",
    "",
    "hash",
    "chapter",
    "final",
    0,
    null,
    1,
    1,
  );

  const extractor = createStateExtractor({
    db,
    logger,
    llmClient: {
      extract: async () => ({
        ok: false,
        error: {
          code: "TIMEOUT",
          message: "state extraction timeout",
        },
      }),
    },
  });

  const result = await runStateExtractionForChapterCompletion({
    db,
    logger,
    stateExtractor: extractor,
    projectId,
    documentId,
    status: "final",
    traceId: "trace-s3-ste-s3",
  });

  assert.ok(result, "chapter-complete path should return structured outcome");
  assert.equal(result?.status, "degraded");
  assert.equal(result?.errorCode, "KG_STATE_EXTRACT_TIMEOUT");

  const degradedLog = logs.error.find(
    (entry) => entry.event === "kg_state_extraction_degraded",
  );
  assert.ok(degradedLog, "must log structured degraded signal");
  assert.equal(degradedLog?.data?.error_code, "KG_STATE_EXTRACT_TIMEOUT");
  assert.equal(degradedLog?.data?.document_id, documentId);

  const row = db
    .prepare<
      [string],
      { status: string }
    >("SELECT status FROM documents WHERE document_id = ?")
    .get(documentId);
  assert.equal(row?.status, "final");

  db.close();
}
