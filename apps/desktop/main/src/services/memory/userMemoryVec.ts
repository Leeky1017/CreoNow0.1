import fs from "node:fs";
import path from "node:path";

import type Database from "better-sqlite3";
import { getLoadablePath } from "sqlite-vec";

import type { Logger } from "../../logging/logger";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type UserMemoryVecSource = {
  memoryId: string;
  content: string;
};

export type UserMemoryVecMatch = {
  memoryId: string;
  score: number;
  distance: number;
};

export type UserMemoryVecService = {
  /**
   * Return topK semantic matches for the given queryText.
   *
   * Why: memory injection preview needs semantic ordering when sqlite-vec is available.
   */
  topK: (args: {
    sources: readonly UserMemoryVecSource[];
    queryText: string;
    k: number;
    ts: number;
  }) => ServiceResult<{ matches: UserMemoryVecMatch[]; dimension: number }>;
};

const SETTINGS_SCOPE = "app" as const;
const DIMENSION_KEY = "creonow.user_memory_vec.dimension" as const;

const DEFAULT_DIMENSION = 64;
const DEFAULT_TOPK = 8;

const LOADED_DBS = new WeakSet<Database.Database>();

function nowTs(): number {
  return Date.now();
}

function readSetting(db: Database.Database, key: string): unknown | null {
  try {
    const row = db
      .prepare<
        [string, string],
        { valueJson: string }
      >("SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?")
      .get(SETTINGS_SCOPE, key);
    if (!row) {
      return null;
    }
    return JSON.parse(row.valueJson) as unknown;
  } catch {
    return null;
  }
}

function writeSetting(
  db: Database.Database,
  key: string,
  value: number,
  ts: number,
): void {
  db.prepare(
    "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
  ).run(SETTINGS_SCOPE, key, JSON.stringify(value), ts);
}

function resolveLoadablePath(): ServiceResult<string> {
  try {
    const raw = getLoadablePath();
    const unpacked = raw.replace(
      `${path.sep}app.asar${path.sep}`,
      `${path.sep}app.asar.unpacked${path.sep}`,
    );
    if (raw !== unpacked && fs.existsSync(unpacked)) {
      return { ok: true, data: unpacked };
    }
    return { ok: true, data: raw };
  } catch (error) {
    return ipcError("MODEL_NOT_READY", "sqlite-vec extension not available", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Detect whether sqlite-vec is already loaded for this DB connection.
 *
 * Why: the DB bootstrap may have already loaded the extension; double-loading can
 * fail on some platforms/builds and would incorrectly force deterministic fallback.
 */
function isSqliteVecLoaded(db: Database.Database): boolean {
  try {
    const row = db
      .prepare<[], { version: string }>("SELECT vec_version() as version")
      .get();
    return typeof row?.version === "string" && row.version.length > 0;
  } catch {
    return false;
  }
}

function ensureSqliteVecLoaded(args: {
  db: Database.Database;
  logger: Logger;
}): ServiceResult<true> {
  if (LOADED_DBS.has(args.db)) {
    return { ok: true, data: true };
  }

  if (isSqliteVecLoaded(args.db)) {
    LOADED_DBS.add(args.db);
    return { ok: true, data: true };
  }

  const pathRes = resolveLoadablePath();
  if (!pathRes.ok) {
    return pathRes;
  }

  try {
    args.db.loadExtension(pathRes.data);
    LOADED_DBS.add(args.db);
    return { ok: true, data: true };
  } catch (error) {
    args.logger.info("sqlite_vec_load_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return ipcError("MODEL_NOT_READY", "sqlite-vec extension failed to load");
  }
}

function ensureSchema(args: {
  db: Database.Database;
  logger: Logger;
  dimension: number;
  ts: number;
}): ServiceResult<true> {
  const loaded = ensureSqliteVecLoaded({ db: args.db, logger: args.logger });
  if (!loaded.ok) {
    return loaded;
  }

  const stored = readSetting(args.db, DIMENSION_KEY);
  if (typeof stored === "number" && Number.isFinite(stored) && stored > 0) {
    if (stored !== args.dimension) {
      return ipcError("CONFLICT", "user_memory_vec dimension mismatch", {
        stored,
        expected: args.dimension,
        recovery: "clear vector index and rebuild",
      });
    }
  } else {
    writeSetting(args.db, DIMENSION_KEY, args.dimension, args.ts);
  }

  try {
    args.db.exec(
      `CREATE VIRTUAL TABLE IF NOT EXISTS user_memory_vec USING vec0(memory_id TEXT PRIMARY KEY, embedding float[${args.dimension}])`,
    );
    return { ok: true, data: true };
  } catch (error) {
    args.logger.error("user_memory_vec_schema_failed", {
      code: "DB_ERROR",
      message: error instanceof Error ? error.message : String(error),
    });
    return ipcError("DB_ERROR", "Failed to initialize user_memory_vec");
  }
}

function fnv1a32(text: string): number {
  const data = new TextEncoder().encode(text);
  let hash = 0x811c9dc5;
  for (const b of data) {
    hash ^= b;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function embedText(text: string, dimension: number): number[] {
  const dim = Math.max(1, Math.floor(dimension));
  const v = new Array<number>(dim).fill(0);
  const tokens = tokenize(text);
  for (const token of tokens) {
    const idx = fnv1a32(token) % dim;
    v[idx] = (v[idx] ?? 0) + 1;
  }

  let norm = 0;
  for (const x of v) {
    norm += x * x;
  }
  norm = Math.sqrt(norm);

  if (!Number.isFinite(norm) || norm <= 0) {
    return v;
  }

  return v.map((x) => x / norm);
}

function distanceToScore(distance: number): number {
  const d = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  return 1 / (1 + d);
}

/**
 * Create a semantic recall helper backed by sqlite-vec.
 */
export function createUserMemoryVecService(deps: {
  db: Database.Database;
  logger: Logger;
}): UserMemoryVecService {
  return {
    topK: ({ sources, queryText, k, ts }) => {
      const dimension = DEFAULT_DIMENSION;
      const ensure = ensureSchema({
        db: deps.db,
        logger: deps.logger,
        dimension,
        ts,
      });
      if (!ensure.ok) {
        return ensure;
      }

      const effectiveK = Math.max(
        1,
        Math.min(
          sources.length,
          Math.floor(Number.isFinite(k) ? k : DEFAULT_TOPK),
        ),
      );

      const queryVec = embedText(queryText, dimension);

      try {
        deps.db.transaction(() => {
          deps.db.exec("DELETE FROM user_memory_vec");
          const insert = deps.db.prepare<[string, string]>(
            "INSERT INTO user_memory_vec(memory_id, embedding) VALUES (?, vec_f32(?))",
          );

          const ordered = [...sources].sort((a, b) =>
            a.memoryId.localeCompare(b.memoryId),
          );
          for (const src of ordered) {
            insert.run(
              src.memoryId,
              JSON.stringify(embedText(src.content, dimension)),
            );
          }
        })();

        const rows = deps.db
          .prepare<
            [string, number],
            { memoryId: string; distance: number }
          >("SELECT memory_id as memoryId, distance FROM user_memory_vec WHERE embedding MATCH vec_f32(?) ORDER BY distance LIMIT ?")
          .all(JSON.stringify(queryVec), effectiveK);

        const matches = rows.map((r) => ({
          memoryId: r.memoryId,
          distance: r.distance,
          score: distanceToScore(r.distance),
        }));

        deps.logger.info("memory_semantic_recall", {
          mode: "semantic",
          topK: effectiveK,
          count: matches.length,
          ts: ts ?? nowTs(),
        });

        return { ok: true, data: { matches, dimension } };
      } catch (error) {
        deps.logger.error("memory_semantic_recall_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed to run semantic recall");
      }
    },
  };
}
