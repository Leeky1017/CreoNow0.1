import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { getLoadablePath } from "sqlite-vec";

import type { IpcError } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import { getDbPaths, redactUserDataPath } from "./paths";
import { applyRecommendedPragmas } from "./recommendedPragmas";
import {
  createDbInitIpcError,
  diagnoseDbInitFailure,
  toErrorMessage,
} from "./nativeDoctor";
import { setDbInitError } from "../ipc/dbError";

import initSql from "./migrations/0001_init.sql?raw";
import documentsSql from "./migrations/0002_documents_versioning.sql?raw";
import judgeSql from "./migrations/0003_judge.sql?raw";
import skillsSql from "./migrations/0004_skills.sql?raw";
import knowledgeGraphSql from "./migrations/0005_knowledge_graph.sql?raw";
import searchFtsSql from "./migrations/0006_search_fts.sql?raw";
import statsSql from "./migrations/0007_stats.sql?raw";
import userMemoryVecSql from "./migrations/0008_user_memory_vec.sql?raw";
import memoryDocumentScopeSql from "./migrations/0009_memory_document_scope.sql?raw";
import projectsArchiveSql from "./migrations/0010_projects_archive.sql?raw";
import documentTypeStatusSql from "./migrations/0011_document_type_status.sql?raw";
import episodicStorageSql from "./migrations/0012_memory_episodic_storage.sql?raw";
import knowledgeGraphP0Sql from "./migrations/0013_knowledge_graph_p0.sql?raw";
import projectMetadataSql from "./migrations/0014_project_metadata.sql?raw";
import versionSnapshotWordCountSql from "./migrations/0015_version_snapshot_word_count.sql?raw";
import skillCustomCrudSql from "./migrations/0016_skill_custom_crud.sql?raw";
import versionBranchMergeConflictSql from "./migrations/0017_version_branch_merge_conflict.sql?raw";
import kgAiContextLevelSql from "./migrations/0018_kg_ai_context_level.sql?raw";
import kgAliasesSql from "./migrations/0019_kg_aliases.sql?raw";
import kgLastSeenStateSql from "./migrations/0020_kg_last_seen_state.sql?raw";
import tracePersistenceSql from "./migrations/0021_s3_trace_persistence.sql?raw";
import synopsisInjectionSql from "./migrations/0022_s3_synopsis_injection.sql?raw";
import kgTypeOtherToFactionSql from "./migrations/0023_kg_type_other_to_faction.sql?raw";
import chatHistoryPersistenceSql from "./migrations/0024_chat_history_persistence.sql?raw";
import documentCoverImageSql from "./migrations/0025_document_cover_image.sql?raw";

export type DbInitOk = {
  ok: true;
  db: Database.Database;
  schemaVersion: number;
};

export type DbInitErr = {
  ok: false;
  error: IpcError;
};

export type DbInitResult = DbInitOk | DbInitErr;

type Migration = {
  version: number;
  name: string;
  sql: string;
};

const MIGRATIONS_BASE: readonly Migration[] = [
  { version: 1, name: "0001_init", sql: initSql },
  { version: 2, name: "0002_documents_versioning", sql: documentsSql },
  { version: 3, name: "0003_judge", sql: judgeSql },
  { version: 4, name: "0004_skills", sql: skillsSql },
  { version: 5, name: "0005_knowledge_graph", sql: knowledgeGraphSql },
  { version: 6, name: "0006_search_fts", sql: searchFtsSql },
  { version: 7, name: "0007_stats", sql: statsSql },
  {
    version: 9,
    name: "0009_memory_document_scope",
    sql: memoryDocumentScopeSql,
  },
  {
    version: 10,
    name: "0010_projects_archive",
    sql: projectsArchiveSql,
  },
  {
    version: 11,
    name: "0011_document_type_status",
    sql: documentTypeStatusSql,
  },
  {
    version: 12,
    name: "0012_memory_episodic_storage",
    sql: episodicStorageSql,
  },
  {
    version: 13,
    name: "0013_knowledge_graph_p0",
    sql: knowledgeGraphP0Sql,
  },
  {
    version: 14,
    name: "0014_project_metadata",
    sql: projectMetadataSql,
  },
  {
    version: 15,
    name: "0015_version_snapshot_word_count",
    sql: versionSnapshotWordCountSql,
  },
  {
    version: 16,
    name: "0016_skill_custom_crud",
    sql: skillCustomCrudSql,
  },
  {
    version: 17,
    name: "0017_version_branch_merge_conflict",
    sql: versionBranchMergeConflictSql,
  },
  {
    version: 18,
    name: "0018_kg_ai_context_level",
    sql: kgAiContextLevelSql,
  },
  {
    version: 19,
    name: "0019_kg_aliases",
    sql: kgAliasesSql,
  },
  {
    version: 20,
    name: "0020_kg_last_seen_state",
    sql: kgLastSeenStateSql,
  },
  {
    version: 21,
    name: "0021_s3_trace_persistence",
    sql: tracePersistenceSql,
  },
  {
    version: 22,
    name: "0022_s3_synopsis_injection",
    sql: synopsisInjectionSql,
  },
  {
    version: 23,
    name: "0023_kg_type_other_to_faction",
    sql: kgTypeOtherToFactionSql,
  },
  {
    version: 24,
    name: "0024_chat_history_persistence",
    sql: chatHistoryPersistenceSql,
  },
  {
    version: 25,
    name: "0025_document_cover_image",
    sql: documentCoverImageSql,
  },
];

const SQLITE_VEC_MIGRATION: Migration = {
  version: 8,
  name: "0008_user_memory_vec",
  sql: userMemoryVecSql,
};

/**
 * Best-effort load sqlite-vec for optional vec0 tables.
 *
 * Why: semantic recall should degrade without blocking app startup on platforms
 * where the extension cannot be loaded.
 */
function tryLoadSqliteVec(args: {
  db: Database.Database;
  logger: Logger;
}): boolean {
  try {
    const rawPath = getLoadablePath();
    const unpacked = rawPath.replace(
      `${path.sep}app.asar${path.sep}`,
      `${path.sep}app.asar.unpacked${path.sep}`,
    );
    const loadPath =
      rawPath !== unpacked && fs.existsSync(unpacked) ? unpacked : rawPath;
    args.db.loadExtension(loadPath);
    args.logger.info("sqlite_vec_loaded", {});
    return true;
  } catch (error) {
    args.logger.info("sqlite_vec_unavailable", {
      message: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Ensure a `schema_version` table exists and return its current version.
 *
 * Why: deterministic, recoverable migrations across launches and Windows E2E.
 */
function ensureSchemaVersion(db: Database.Database): number {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)",
  );
  const row = db.prepare("SELECT version FROM schema_version LIMIT 1").get() as
    | { version: number }
    | undefined;
  if (!row) {
    db.prepare("INSERT INTO schema_version (version) VALUES (0)").run();
    return 0;
  }
  return row.version;
}

/**
 * Persist the schema version.
 *
 * Why: the app must be able to resume migrations after an interrupted run.
 */
function setSchemaVersion(db: Database.Database, version: number): void {
  db.prepare("UPDATE schema_version SET version = ?").run(version);
}

/**
 * Open and migrate the application SQLite database.
 *
 * Why: P0 requires deterministic DB + migrations + logs evidence in Windows E2E.
 */
export function initDb(args: {
  userDataDir: string;
  logger: Logger;
}): DbInitResult {
  setDbInitError(null);
  const { dbDir, dbPath } = getDbPaths(args.userDataDir);
  const dbPathRedacted = redactUserDataPath(args.userDataDir, dbPath);
  let schemaVersion: number | null = null;
  let db: Database.Database | null = null;

  try {
    fs.mkdirSync(dbDir, { recursive: true });
    const conn = new Database(dbPath);
    db = conn;

    conn.pragma("foreign_keys = ON");
    conn.pragma("journal_mode = WAL");
    applyRecommendedPragmas(conn);

    const current = ensureSchemaVersion(conn);
    schemaVersion = current;

    const migrations = tryLoadSqliteVec({ db: conn, logger: args.logger })
      ? [...MIGRATIONS_BASE, SQLITE_VEC_MIGRATION]
      : MIGRATIONS_BASE;

    const pending = [...migrations]
      .filter((m) => m.version > current)
      .sort((a, b) => a.version - b.version);

    const appliedVersions: number[] = [];

    conn.transaction(() => {
      for (const m of pending) {
        conn.exec(m.sql);
        setSchemaVersion(conn, m.version);
        appliedVersions.push(m.version);
      }
    })();

    const finalSchemaVersion = ensureSchemaVersion(conn);
    schemaVersion = finalSchemaVersion;

    args.logger.info("db_ready", {
      db_path: dbPathRedacted,
      schema_version: finalSchemaVersion,
      migration_applied: appliedVersions,
    });

    return { ok: true, db: conn, schemaVersion: finalSchemaVersion };
  } catch (error) {
    try {
      db?.close();
    } catch (closeError) {
      args.logger.error("db_close_failed", {
        message:
          closeError instanceof Error ? closeError.message : String(closeError),
      });
    }

    const diagnosed = diagnoseDbInitFailure(error);
    args.logger.error("migration_failed", {
      code: "DB_ERROR",
      message: toErrorMessage(error),
      db_path: dbPathRedacted,
      schema_version: schemaVersion,
      details: diagnosed,
    });
    const ipcErr = createDbInitIpcError(error);
    setDbInitError(ipcErr);
    return {
      ok: false,
      error: ipcErr,
    };
  }
}
