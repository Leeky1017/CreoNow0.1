import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type FtsHighlightRange = {
  start: number;
  end: number;
};

export type FtsAnchor = {
  start: number;
  end: number;
};

export type FtsSearchResult = {
  projectId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  snippet: string;
  highlights: FtsHighlightRange[];
  anchor: FtsAnchor;
  score: number;
  updatedAt: number;
};

export type FulltextSearchItem = {
  projectId: string;
  documentId: string;
  title: string;
  snippet: string;
  score: number;
  updatedAt: number;
};

export type FtsService = {
  search: (args: {
    projectId: string;
    query: string;
    limit?: number;
    offset?: number;
    scope?: "current" | "all";
  }) => ServiceResult<{
    results: FtsSearchResult[];
    total: number;
    hasMore: boolean;
    indexState: "ready" | "rebuilding";
  }>;
  reindex: (args: { projectId: string }) => ServiceResult<{
    indexState: "ready";
    reindexed: number;
  }>;
  searchFulltext: (args: {
    projectId: string;
    query: string;
    limit?: number;
  }) => ServiceResult<{ items: FulltextSearchItem[] }>;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_QUERY_LENGTH = 1024;
const DEFAULT_OFFSET = 0;

/**
 * Normalize and validate a user query.
 *
 * Why: empty/overlong queries must fail deterministically with INVALID_ARGUMENT.
 */
/**
 * Detect whether a string contains CJK ideographs.
 *
 * Why: CJK text lacks whitespace word boundaries, so FTS5 unicode61 tokenizer
 * cannot split terms effectively without additional preprocessing.
 */
const CJK_RANGE =
  /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}]/u;

export function containsCjk(text: string): boolean {
  return CJK_RANGE.test(text);
}

/**
 * Rewrite CJK portions of a query into individual character tokens joined by OR.
 *
 * Why: FTS5 default unicode61 tokenizer treats CJK runs as single tokens.
 * Splitting into per-character tokens enables substring matching.
 * Mixed queries (e.g. "react 组件") split only the CJK portion.
 */
export function expandCjkQuery(query: string): string {
  const CJK_CHAR =
    /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u{20000}-\u{2A6DF}\u{2A700}-\u{2B73F}]/gu;
  const cjkChars = query.match(CJK_CHAR);
  if (!cjkChars || cjkChars.length === 0) return query;

  // Remove CJK characters from query to get non-CJK tokens
  const nonCjk = query.replace(CJK_CHAR, " ").trim();
  const nonCjkTokens = nonCjk
    .split(/\s+/)
    .filter((t) => t.length > 0);

  // Build OR-joined CJK character tokens
  const cjkTokens = cjkChars.map((c) => `"${c}"`);

  // Combine: non-CJK tokens AND each CJK char OR'd
  const parts = [...nonCjkTokens, ...cjkTokens];
  return parts.join(" OR ");
}

function normalizeQuery(query: string): ServiceResult<string> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return ipcError("INVALID_ARGUMENT", "query is required");
  }
  if (trimmed.length > MAX_QUERY_LENGTH) {
    return ipcError("INVALID_ARGUMENT", "query is too long", {
      maxLength: MAX_QUERY_LENGTH,
    });
  }
  const normalized = containsCjk(trimmed) ? expandCjkQuery(trimmed) : trimmed;
  return { ok: true, data: normalized };
}

/**
 * Normalize and validate a project id.
 *
 * Why: IPC boundaries must reject empty identifiers deterministically.
 */
function normalizeProjectId(projectId: string): ServiceResult<string> {
  const trimmed = projectId.trim();
  if (trimmed.length === 0) {
    return ipcError("INVALID_ARGUMENT", "projectId is required");
  }
  return { ok: true, data: trimmed };
}

/**
 * Normalize and validate a limit.
 *
 * Why: uncontrolled limits can cause slow queries and unstable UI.
 */
function normalizeLimit(limit?: number): ServiceResult<number> {
  if (typeof limit === "undefined") {
    return { ok: true, data: DEFAULT_LIMIT };
  }
  if (!Number.isFinite(limit) || !Number.isInteger(limit)) {
    return ipcError("INVALID_ARGUMENT", "limit must be an integer");
  }
  if (limit <= 0) {
    return ipcError("INVALID_ARGUMENT", "limit must be positive");
  }
  if (limit > MAX_LIMIT) {
    return ipcError("INVALID_ARGUMENT", "limit is too large", {
      maxLimit: MAX_LIMIT,
    });
  }
  return { ok: true, data: limit };
}

/**
 * Normalize and validate an offset.
 *
 * Why: pagination cursor must be deterministic and non-negative.
 */
function normalizeOffset(offset?: number): ServiceResult<number> {
  if (typeof offset === "undefined") {
    return { ok: true, data: DEFAULT_OFFSET };
  }
  if (!Number.isFinite(offset) || !Number.isInteger(offset)) {
    return ipcError("INVALID_ARGUMENT", "offset must be an integer");
  }
  if (offset < 0) {
    return ipcError("INVALID_ARGUMENT", "offset must be non-negative");
  }
  return { ok: true, data: offset };
}

/**
 * Best-effort classify a full-text query error as a user input error.
 *
 * Why: invalid FTS syntax must map to INVALID_ARGUMENT (CNWB-REQ-100).
 */
function isFtsSyntaxError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("fts5:") ||
    m.includes("syntax error") ||
    m.includes("unterminated") ||
    m.includes("parse error")
  );
}

/**
 * Best-effort classify index corruption signals.
 *
 * Why: broken index must trigger reindex and return a retriable rebuilding state.
 */
function isFtsCorruptionError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("database disk image is malformed") ||
    m.includes("malformed database schema") ||
    m.includes("no such table: documents_fts") ||
    m.includes("corrupt")
  );
}

function isReindexIoError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("i/o error") ||
    m.includes("io error") ||
    m.includes("disk i/o") ||
    m.includes("disk io")
  );
}

/**
 * Extract a simple lexical term for snippet highlight.
 *
 * Why: UI requires deterministic hit highlights even when query contains FTS operators.
 */
function extractHighlightTerm(query: string): string {
  const cleaned = query
    .replace(/"/g, " ")
    .replace(/[()]/g, " ")
    .replace(/\b(?:AND|OR|NOT)\b/gi, " ")
    .trim();

  const token = cleaned.split(/\s+/).find((part) => part.trim().length > 0);
  return token ?? "";
}

/**
 * Compute match ranges within a snippet.
 *
 * Why: SearchPanel needs explicit highlight ranges instead of parsing snippet markup.
 */
function computeHighlights(snippet: string, term: string): FtsHighlightRange[] {
  if (term.trim().length === 0) {
    return [];
  }
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(escaped, "gi");
  const ranges: FtsHighlightRange[] = [];

  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(snippet)) !== null) {
    ranges.push({
      start: match.index,
      end: match.index + match[0].length,
    });
    if (ranges.length >= 16) {
      break;
    }
  }
  return ranges;
}

/**
 * Derive anchor from highlight ranges.
 *
 * Why: Search result click must provide a deterministic jump target.
 */
function toAnchor(highlights: FtsHighlightRange[]): FtsAnchor {
  const first = highlights[0];
  if (!first) {
    return { start: 0, end: 0 };
  }
  return { start: first.start, end: first.end };
}

type FulltextRow = {
  projectId: string;
  documentId: string;
  documentTitle: string;
  documentType: string;
  snippet: string;
  score: number;
  updatedAt: number;
};

type CountRow = {
  total: number;
};

/**
 * Create a minimal full-text search (FTS5) service.
 *
 * Why: keep DB details inside main process and expose deterministic errors over IPC.
 */
export function createFtsService(deps: {
  db: Database.Database;
  logger: Logger;
}): FtsService {
  function runQuery(args: {
    projectId: string;
    query: string;
    limit?: number;
    offset?: number;
    scope?: "current" | "all";
  }): ServiceResult<{
    results: FtsSearchResult[];
    total: number;
    hasMore: boolean;
    indexState: "ready" | "rebuilding";
  }> {
    const projectIdRes = normalizeProjectId(args.projectId);
    if (!projectIdRes.ok) {
      return projectIdRes;
    }
    const queryRes = normalizeQuery(args.query);
    if (!queryRes.ok) {
      return queryRes;
    }
    const limitRes = normalizeLimit(args.limit);
    if (!limitRes.ok) {
      return limitRes;
    }
    const offsetRes = normalizeOffset(args.offset);
    if (!offsetRes.ok) {
      return offsetRes;
    }

    const projectId = projectIdRes.data;
    const query = queryRes.data;
    const limit = limitRes.data;
    const offset = offsetRes.data;

    const isAllScope = args.scope === "all";

    try {
      const rows = isAllScope
        ? deps.db
            .prepare<[string, number, number], FulltextRow>(
              `SELECT
                d.project_id as projectId,
                d.document_id as documentId,
                d.title as documentTitle,
                COALESCE(d.type, 'chapter') as documentType,
                snippet(documents_fts, -1, '', '', '…', 24) as snippet,
                (-bm25(documents_fts)) as score,
                d.updated_at as updatedAt
              FROM documents_fts
              JOIN documents d ON d.rowid = documents_fts.rowid
              WHERE documents_fts MATCH ?
              ORDER BY bm25(documents_fts)
              LIMIT ? OFFSET ?`,
            )
            .all(query, limit, offset)
        : deps.db
            .prepare<[string, string, number, number], FulltextRow>(
              `SELECT
                d.project_id as projectId,
                d.document_id as documentId,
                d.title as documentTitle,
                COALESCE(d.type, 'chapter') as documentType,
                snippet(documents_fts, -1, '', '', '…', 24) as snippet,
                (-bm25(documents_fts)) as score,
                d.updated_at as updatedAt
              FROM documents_fts
              JOIN documents d ON d.rowid = documents_fts.rowid
              WHERE documents_fts.project_id = ? AND documents_fts MATCH ?
              ORDER BY bm25(documents_fts)
              LIMIT ? OFFSET ?`,
            )
            .all(projectId, query, limit, offset);

      const count = isAllScope
        ? deps.db
            .prepare<[string], CountRow>(
              `SELECT COUNT(*) as total
               FROM documents_fts
               WHERE documents_fts MATCH ?`,
            )
            .get(query)
        : deps.db
            .prepare<[string, string], CountRow>(
              `SELECT COUNT(*) as total
               FROM documents_fts
               WHERE project_id = ? AND documents_fts MATCH ?`,
            )
            .get(projectId, query);

      if (!isAllScope) {
        const crossProjectRow = rows.find((row) => row.projectId !== projectId);
        if (crossProjectRow) {
          deps.logger.error("search_project_forbidden_audit", {
            operation: "search:fts:query",
            requestedProjectId: projectId,
            rowProjectId: crossProjectRow.projectId,
            documentId: crossProjectRow.documentId,
          });
          return ipcError(
            "SEARCH_PROJECT_FORBIDDEN",
            "Cross-project search query is forbidden",
            {
              requestedProjectId: projectId,
              rowProjectId: crossProjectRow.projectId,
            },
          );
        }
      }

      const highlightTerm = extractHighlightTerm(query);
      const results: FtsSearchResult[] = rows.map((row) => {
        const snippet = typeof row.snippet === "string" ? row.snippet : "";
        const highlights = computeHighlights(snippet, highlightTerm);
        return {
          projectId: row.projectId,
          documentId: row.documentId,
          documentTitle: row.documentTitle,
          documentType: row.documentType,
          snippet,
          highlights,
          anchor: toAnchor(highlights),
          score: row.score,
          updatedAt: row.updatedAt,
        };
      });

      const total = count?.total ?? 0;
      return {
        ok: true,
        data: {
          results,
          total,
          hasMore: offset + results.length < total,
          indexState: "ready",
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isFtsCorruptionError(message)) {
        const reindexRes = runReindex({ projectId });
        if (!reindexRes.ok) {
          return reindexRes;
        }
        return {
          ok: true,
          data: {
            results: [],
            total: 0,
            hasMore: false,
            indexState: "rebuilding",
          },
        };
      }

      if (isFtsSyntaxError(message)) {
        return ipcError("INVALID_ARGUMENT", "Invalid fulltext query syntax", {
          cause: message,
        });
      }

      deps.logger.error("fts_search_failed", {
        code: "DB_ERROR",
        message,
      });
      return ipcError("DB_ERROR", "Fulltext search failed");
    }
  }

  function runReindex(args: {
    projectId: string;
  }): ServiceResult<{ indexState: "ready"; reindexed: number }> {
    const projectIdRes = normalizeProjectId(args.projectId);
    if (!projectIdRes.ok) {
      return projectIdRes;
    }

    const projectId = projectIdRes.data;
    try {
      deps.db
        .prepare<[string]>("DELETE FROM documents_fts WHERE project_id = ?")
        .run(projectId);

      const inserted = deps.db
        .prepare<[string]>(
          `INSERT OR REPLACE INTO documents_fts(rowid, title, content_text, document_id, project_id)
           SELECT rowid, title, content_text, document_id, project_id
           FROM documents
           WHERE project_id = ?`,
        )
        .run(projectId);

      return {
        ok: true,
        data: {
          indexState: "ready",
          reindexed: Number(inserted.changes ?? 0),
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      deps.logger.error("fts_reindex_failed", {
        code: isReindexIoError(message)
          ? "SEARCH_REINDEX_IO_ERROR"
          : "DB_ERROR",
        message,
      });
      if (isReindexIoError(message)) {
        return {
          ok: false,
          error: {
            code: "SEARCH_REINDEX_IO_ERROR",
            message: "Fulltext reindex failed due to IO error",
            details: { cause: message },
            retryable: true,
          },
        };
      }
      return ipcError("DB_ERROR", "Fulltext reindex failed");
    }
  }

  return {
    search: (args) => runQuery(args),
    reindex: (args) => runReindex(args),
    searchFulltext: (args) => {
      const res = runQuery({
        projectId: args.projectId,
        query: args.query,
        limit: args.limit,
      });
      if (!res.ok) {
        return res;
      }
      return {
        ok: true,
        data: {
          items: res.data.results.map((item) => ({
            projectId: item.projectId,
            documentId: item.documentId,
            title: item.documentTitle,
            snippet: item.snippet,
            score: item.score,
            updatedAt: item.updatedAt,
          })),
        },
      };
    },
  };
}
