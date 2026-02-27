import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { ipcError, type ServiceResult, type Err } from "../shared/ipcResult";
export type { ServiceResult };

export type SynopsisItem = {
  synopsisId: string;
  projectId: string;
  documentId: string;
  chapterOrder: number;
  synopsisText: string;
  createdAt: number;
  updatedAt: number;
};

export type SynopsisStore = {
  upsert: (args: {
    projectId: string;
    documentId: string;
    chapterOrder: number;
    synopsisText: string;
  }) => ServiceResult<{ synopsisId: string }>;
  listRecentByProject: (args: {
    projectId: string;
    excludeDocumentId?: string;
    limit: number;
  }) => ServiceResult<{ items: SynopsisItem[] }>;
};

type SynopsisRow = {
  synopsisId: string;
  projectId: string;
  documentId: string;
  chapterOrder: number;
  synopsisText: string;
  createdAt: number;
  updatedAt: number;
};

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function normalizeRequired(value: string): string {
  return value.trim();
}

function normalizeOptional(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function validateUpsertArgs(args: {
  projectId: string;
  documentId: string;
  chapterOrder: number;
  synopsisText: string;
}): Err | null {
  const projectId = normalizeRequired(args.projectId);
  if (projectId.length === 0) {
    return ipcError("INVALID_ARGUMENT", "projectId is required");
  }

  const documentId = normalizeRequired(args.documentId);
  if (documentId.length === 0) {
    return ipcError("INVALID_ARGUMENT", "documentId is required");
  }

  if (!Number.isInteger(args.chapterOrder) || args.chapterOrder <= 0) {
    return ipcError(
      "INVALID_ARGUMENT",
      "chapterOrder must be a positive integer",
    );
  }

  const synopsisText = normalizeRequired(args.synopsisText);
  if (synopsisText.length === 0) {
    return ipcError("INVALID_ARGUMENT", "synopsisText is required");
  }

  return null;
}

function validateListArgs(args: {
  projectId: string;
  limit: number;
}): Err | null {
  const projectId = normalizeRequired(args.projectId);
  if (projectId.length === 0) {
    return ipcError("INVALID_ARGUMENT", "projectId is required");
  }

  if (!Number.isInteger(args.limit) || args.limit <= 0) {
    return ipcError("INVALID_ARGUMENT", "limit must be a positive integer");
  }

  return null;
}

function toSynopsisItem(row: SynopsisRow): SynopsisItem {
  return {
    synopsisId: row.synopsisId,
    projectId: row.projectId,
    documentId: row.documentId,
    chapterOrder: row.chapterOrder,
    synopsisText: row.synopsisText,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Persist and read chapter synopsis data used by continue-writing context
 * assembly.
 */
export function createSqliteSynopsisStore(args: {
  db: Database.Database;
  logger: Logger;
  now?: () => number;
}): SynopsisStore {
  const now = args.now ?? (() => Date.now());

  return {
    upsert: (input) => {
      const validationError = validateUpsertArgs(input);
      if (validationError) {
        return validationError;
      }

      const projectId = normalizeRequired(input.projectId);
      const documentId = normalizeRequired(input.documentId);
      const synopsisText = normalizeRequired(input.synopsisText);
      const ts = now();

      try {
        const upsertStmt = args.db.prepare(`
          INSERT INTO chapter_synopses (
            synopsis_id,
            project_id,
            document_id,
            chapter_order,
            synopsis_text,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(project_id, document_id) DO UPDATE SET
            chapter_order = excluded.chapter_order,
            synopsis_text = excluded.synopsis_text,
            updated_at = excluded.updated_at
        `);
        const selectSynopsisIdStmt = args.db.prepare<
          [string, string],
          { synopsisId: string }
        >(`
          SELECT synopsis_id AS synopsisId
          FROM chapter_synopses
          WHERE project_id = ? AND document_id = ?
          LIMIT 1
        `);
        upsertStmt.run(
          randomUUID(),
          projectId,
          documentId,
          input.chapterOrder,
          synopsisText,
          ts,
          ts,
        );

        const row = selectSynopsisIdStmt.get(projectId, documentId);
        if (!row?.synopsisId) {
          args.logger.error("synopsis_store_upsert_failed", {
            projectId,
            documentId,
            reason: "missing_synopsis_id_after_upsert",
          });
          return ipcError(
            "DB_ERROR",
            "Failed to read synopsis row after upsert",
            {
              projectId,
              documentId,
            },
          );
        }

        return {
          ok: true,
          data: {
            synopsisId: row.synopsisId,
          },
        };
      } catch (error) {
        const message = normalizeErrorMessage(error);
        args.logger.error("synopsis_store_upsert_failed", {
          projectId,
          documentId,
          message,
        });
        return ipcError("DB_ERROR", "Failed to persist synopsis", {
          projectId,
          documentId,
          message,
        });
      }
    },

    listRecentByProject: (input) => {
      const validationError = validateListArgs(input);
      if (validationError) {
        return validationError;
      }

      const projectId = normalizeRequired(input.projectId);
      const excludeDocumentId = normalizeOptional(input.excludeDocumentId);

      try {
        const listStmt = args.db.prepare<
          [string, string | null, string | null, number],
          SynopsisRow
        >(`
          SELECT
            synopsis_id AS synopsisId,
            project_id AS projectId,
            document_id AS documentId,
            chapter_order AS chapterOrder,
            synopsis_text AS synopsisText,
            created_at AS createdAt,
            updated_at AS updatedAt
          FROM chapter_synopses
          WHERE project_id = ?
            AND (? IS NULL OR document_id <> ?)
          ORDER BY chapter_order DESC, updated_at DESC, synopsis_id ASC
          LIMIT ?
        `);
        const rows = listStmt.all(
          projectId,
          excludeDocumentId,
          excludeDocumentId,
          input.limit,
        );

        return {
          ok: true,
          data: {
            items: rows.map(toSynopsisItem),
          },
        };
      } catch (error) {
        const message = normalizeErrorMessage(error);
        args.logger.error("synopsis_store_list_failed", {
          projectId,
          excludeDocumentId,
          limit: input.limit,
          message,
        });
        return ipcError("DB_ERROR", "Failed to list synopsis records", {
          projectId,
          excludeDocumentId,
          limit: input.limit,
          message,
        });
      }
    },
  };
}
