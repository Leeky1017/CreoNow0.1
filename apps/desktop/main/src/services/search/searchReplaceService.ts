import { createHash, randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { deriveContent } from "../documents/derive";
import { ipcError, type ServiceResult } from "../shared/ipcResult";

type SearchReplaceScope = "currentDocument" | "wholeProject";

type SearchReplacePreviewItem = {
  documentId: string;
  title: string;
  matchCount: number;
  sample: string;
};

type SearchReplaceSkippedItem = {
  documentId: string;
  reason: string;
  message?: string;
};

type SearchReplacePreview = {
  affectedDocuments: number;
  totalMatches: number;
  items: SearchReplacePreviewItem[];
  warnings: string[];
  previewId?: string;
};

type SearchReplaceExecute = {
  replacedCount: number;
  affectedDocumentCount: number;
  snapshotIds: string[];
  skipped: SearchReplaceSkippedItem[];
};

type SearchReplaceService = {
  preview: (args: {
    projectId: string;
    documentId?: string;
    scope: SearchReplaceScope;
    query: string;
    replaceWith: string;
    regex?: boolean;
    caseSensitive?: boolean;
    wholeWord?: boolean;
  }) => ServiceResult<SearchReplacePreview>;
  execute: (args: {
    projectId: string;
    documentId?: string;
    scope: SearchReplaceScope;
    query: string;
    replaceWith: string;
    regex?: boolean;
    caseSensitive?: boolean;
    wholeWord?: boolean;
    previewId?: string;
    confirmed?: boolean;
  }) => ServiceResult<SearchReplaceExecute>;
};

type StoredPreview = {
  previewId: string;
  projectId: string;
  documentId?: string;
  scope: SearchReplaceScope;
  query: string;
  replaceWith: string;
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  documentIds: string[];
};

type ReplaceOptions = {
  regex: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
};

type DocumentRow = {
  documentId: string;
  projectId: string;
  title: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  type: string;
  updatedAt: number;
};

type ReplaceJsonResult = {
  contentJson: unknown;
  replacedCount: number;
};

type PreviewTokenStore = Map<string, StoredPreview>;

function hashJson(contentJson: string): string {
  return createHash("sha256").update(contentJson, "utf8").digest("hex");
}

function normalizeProjectId(projectId: string): ServiceResult<string> {
  const trimmed = projectId.trim();
  if (trimmed.length === 0) {
    return ipcError("INVALID_ARGUMENT", "projectId is required");
  }
  return { ok: true, data: trimmed };
}

function normalizeDocumentId(
  documentId: string | undefined,
): ServiceResult<string> {
  const trimmed = documentId?.trim() ?? "";
  if (trimmed.length === 0) {
    return ipcError("INVALID_ARGUMENT", "documentId is required");
  }
  return { ok: true, data: trimmed };
}

function normalizeQuery(query: string): ServiceResult<string> {
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    return ipcError("INVALID_ARGUMENT", "query is required");
  }
  return { ok: true, data: trimmed };
}

function normalizeScope(
  scope: SearchReplaceScope,
): ServiceResult<SearchReplaceScope> {
  if (scope === "currentDocument" || scope === "wholeProject") {
    return { ok: true, data: scope };
  }
  return ipcError("INVALID_ARGUMENT", "scope is invalid");
}

function normalizeOptions(args: {
  regex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}): ReplaceOptions {
  return {
    regex: args.regex ?? false,
    caseSensitive: args.caseSensitive ?? false,
    wholeWord: args.wholeWord ?? false,
  };
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatcher(
  query: string,
  options: ReplaceOptions,
): ServiceResult<RegExp> {
  const rawPattern = options.regex ? query : escapeRegExp(query);
  const wholeWordPattern = options.wholeWord
    ? `\\b(?:${rawPattern})\\b`
    : rawPattern;
  const flags = options.caseSensitive ? "g" : "gi";

  try {
    return { ok: true, data: new RegExp(wholeWordPattern, flags) };
  } catch (error) {
    return ipcError("INVALID_ARGUMENT", "Invalid replace query", {
      query,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function countMatches(text: string, matcher: RegExp): number {
  const probe = new RegExp(matcher.source, matcher.flags);
  let total = 0;
  let match: RegExpExecArray | null = null;
  while ((match = probe.exec(text)) !== null) {
    total += 1;
    if (match[0].length === 0) {
      probe.lastIndex += 1;
    }
  }
  return total;
}

function firstMatchIndex(text: string, matcher: RegExp): number | null {
  const probe = new RegExp(matcher.source, matcher.flags);
  const found = probe.exec(text);
  if (!found) {
    return null;
  }
  return found.index;
}

function buildSample(text: string, matcher: RegExp): string {
  const index = firstMatchIndex(text, matcher);
  if (index === null) {
    return "";
  }
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + 60);
  return text.slice(start, end);
}

function replaceInString(
  text: string,
  matcher: RegExp,
  replaceWith: string,
): { value: string; count: number } {
  const count = countMatches(text, matcher);
  if (count === 0) {
    return { value: text, count: 0 };
  }
  const runtime = new RegExp(matcher.source, matcher.flags);
  return { value: text.replace(runtime, replaceWith), count };
}

function replaceInJsonValue(
  value: unknown,
  matcher: RegExp,
  replaceWith: string,
): ReplaceJsonResult {
  if (Array.isArray(value)) {
    let replacedCount = 0;
    const replacedArray = value.map((item) => {
      const replaced = replaceInJsonValue(item, matcher, replaceWith);
      replacedCount += replaced.replacedCount;
      return replaced.contentJson;
    });
    return { contentJson: replacedArray, replacedCount };
  }

  if (typeof value !== "object" || value === null) {
    return { contentJson: value, replacedCount: 0 };
  }

  const payload = value as Record<string, unknown>;
  const isTextNode =
    payload.type === "text" && typeof payload.text === "string";

  if (isTextNode) {
    const replaced = replaceInString(
      payload.text as string,
      matcher,
      replaceWith,
    );
    return {
      contentJson: {
        ...payload,
        text: replaced.value,
      },
      replacedCount: replaced.count,
    };
  }

  let replacedCount = 0;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(payload)) {
    const replaced = replaceInJsonValue(child, matcher, replaceWith);
    next[key] = replaced.contentJson;
    replacedCount += replaced.replacedCount;
  }
  return { contentJson: next, replacedCount };
}

function insertVersion(args: {
  db: Database.Database;
  row: DocumentRow;
  actor: "user" | "auto" | "ai";
  reason: string;
  createdAt: number;
}): string {
  const versionId = randomUUID();
  args.db
    .prepare(
      "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .run(
      versionId,
      args.row.projectId,
      args.row.documentId,
      args.actor,
      args.reason,
      args.row.contentJson,
      args.row.contentText,
      args.row.contentMd,
      args.row.contentHash,
      "",
      "",
      args.createdAt,
    );
  return versionId;
}

function loadDocumentById(args: {
  db: Database.Database;
  projectId: string;
  documentId: string;
}): DocumentRow | undefined {
  return args.db
    .prepare<
      [string, string],
      DocumentRow
    >("SELECT document_id as documentId, project_id as projectId, title, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash, COALESCE(type, 'chapter') as type, updated_at as updatedAt FROM documents WHERE project_id = ? AND document_id = ?")
    .get(args.projectId, args.documentId);
}

function loadProjectDocuments(args: {
  db: Database.Database;
  projectId: string;
}): DocumentRow[] {
  return args.db
    .prepare<
      [string],
      DocumentRow
    >("SELECT document_id as documentId, project_id as projectId, title, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash, COALESCE(type, 'chapter') as type, updated_at as updatedAt FROM documents WHERE project_id = ? ORDER BY updated_at DESC, document_id ASC")
    .all(args.projectId);
}

function matchesPreview(
  preview: StoredPreview,
  args: {
    projectId: string;
    documentId?: string;
    scope: SearchReplaceScope;
    query: string;
    replaceWith: string;
    options: ReplaceOptions;
  },
): boolean {
  return (
    preview.projectId === args.projectId &&
    preview.documentId === args.documentId &&
    preview.scope === args.scope &&
    preview.query === args.query &&
    preview.replaceWith === args.replaceWith &&
    preview.regex === args.options.regex &&
    preview.caseSensitive === args.options.caseSensitive &&
    preview.wholeWord === args.options.wholeWord
  );
}

/**
 * Create search replace service.
 *
 * Why: keep preview/execute state and DB operations inside main-process service.
 */
export function createSearchReplaceService(deps: {
  db: Database.Database;
  logger: Logger;
  previewStore?: PreviewTokenStore;
}): SearchReplaceService {
  const previewStore = deps.previewStore ?? new Map<string, StoredPreview>();

  return {
    preview: (args) => {
      const projectIdRes = normalizeProjectId(args.projectId);
      if (!projectIdRes.ok) {
        return projectIdRes;
      }
      const queryRes = normalizeQuery(args.query);
      if (!queryRes.ok) {
        return queryRes;
      }
      const scopeRes = normalizeScope(args.scope);
      if (!scopeRes.ok) {
        return scopeRes;
      }

      const options = normalizeOptions(args);
      const matcherRes = buildMatcher(queryRes.data, options);
      if (!matcherRes.ok) {
        return matcherRes;
      }
      const matcher = matcherRes.data;
      const projectId = projectIdRes.data;
      const scope = scopeRes.data;

      try {
        const rows =
          scope === "currentDocument"
            ? (() => {
                const documentIdRes = normalizeDocumentId(args.documentId);
                if (!documentIdRes.ok) {
                  return documentIdRes;
                }
                const row = loadDocumentById({
                  db: deps.db,
                  projectId,
                  documentId: documentIdRes.data,
                });
                if (!row) {
                  return ipcError("NOT_FOUND", "Document not found");
                }
                return { ok: true, data: [row] } as ServiceResult<
                  DocumentRow[]
                >;
              })()
            : ({
                ok: true,
                data: loadProjectDocuments({
                  db: deps.db,
                  projectId,
                }),
              } as ServiceResult<DocumentRow[]>);

        if (!rows.ok) {
          return rows;
        }

        const items: SearchReplacePreviewItem[] = [];
        let totalMatches = 0;
        for (const row of rows.data) {
          const matchCount = countMatches(row.contentText, matcher);
          if (matchCount <= 0) {
            continue;
          }
          totalMatches += matchCount;
          items.push({
            documentId: row.documentId,
            title: row.title,
            matchCount,
            sample: buildSample(row.contentText, matcher),
          });
        }

        let previewId: string | undefined;
        if (scope === "wholeProject") {
          previewId = randomUUID();
          previewStore.set(previewId, {
            previewId,
            projectId,
            documentId: undefined,
            scope,
            query: queryRes.data,
            replaceWith: args.replaceWith,
            regex: options.regex,
            caseSensitive: options.caseSensitive,
            wholeWord: options.wholeWord,
            documentIds: items.map((item) => item.documentId),
          });
        }

        deps.logger.info("search_replace_preview", {
          projectId,
          scope,
          affectedDocuments: items.length,
          totalMatches,
        });
        return {
          ok: true,
          data: {
            affectedDocuments: items.length,
            totalMatches,
            items,
            warnings: [],
            previewId,
          },
        };
      } catch (error) {
        deps.logger.error("search_replace_preview_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Search replace preview failed");
      }
    },

    execute: (args) => {
      const projectIdRes = normalizeProjectId(args.projectId);
      if (!projectIdRes.ok) {
        return projectIdRes;
      }
      const queryRes = normalizeQuery(args.query);
      if (!queryRes.ok) {
        return queryRes;
      }
      const scopeRes = normalizeScope(args.scope);
      if (!scopeRes.ok) {
        return scopeRes;
      }
      const options = normalizeOptions(args);
      const matcherRes = buildMatcher(queryRes.data, options);
      if (!matcherRes.ok) {
        return matcherRes;
      }

      const projectId = projectIdRes.data;
      const scope = scopeRes.data;
      const matcher = matcherRes.data;
      const skipped: SearchReplaceSkippedItem[] = [];
      const snapshotIds: string[] = [];
      let replacedCount = 0;
      let affectedDocumentCount = 0;

      let documentIds: string[] = [];
      if (scope === "currentDocument") {
        const documentIdRes = normalizeDocumentId(args.documentId);
        if (!documentIdRes.ok) {
          return documentIdRes;
        }
        documentIds = [documentIdRes.data];
      } else {
        if (!args.confirmed) {
          return ipcError(
            "VALIDATION_ERROR",
            "Whole-project replace requires explicit confirmation",
          );
        }
        const previewId = args.previewId?.trim() ?? "";
        if (previewId.length === 0) {
          return ipcError(
            "VALIDATION_ERROR",
            "Whole-project replace requires previewId",
          );
        }
        const preview = previewStore.get(previewId);
        if (!preview) {
          return ipcError("VALIDATION_ERROR", "Preview context not found");
        }
        if (
          !matchesPreview(preview, {
            projectId,
            documentId: undefined,
            scope,
            query: queryRes.data,
            replaceWith: args.replaceWith,
            options,
          })
        ) {
          return ipcError("VALIDATION_ERROR", "Preview context does not match");
        }
        documentIds = [...preview.documentIds];
        previewStore.delete(previewId);
      }

      try {
        for (const documentId of documentIds) {
          const row = loadDocumentById({
            db: deps.db,
            projectId,
            documentId,
          });
          if (!row) {
            skipped.push({
              documentId,
              reason: "NOT_FOUND",
              message: "Document not found",
            });
            continue;
          }

          const replaced = replaceInJsonValue(
            JSON.parse(row.contentJson) as unknown,
            matcher,
            args.replaceWith,
          );
          if (replaced.replacedCount === 0) {
            continue;
          }

          const derived = deriveContent({ contentJson: replaced.contentJson });
          if (!derived.ok) {
            skipped.push({
              documentId: row.documentId,
              reason: "ENCODING_FAILED",
              message: derived.error.message,
            });
            continue;
          }

          let contentJson: string;
          try {
            contentJson = JSON.stringify(replaced.contentJson);
          } catch (error) {
            skipped.push({
              documentId: row.documentId,
              reason: "ENCODING_FAILED",
              message: error instanceof Error ? error.message : String(error),
            });
            continue;
          }

          const now = Date.now();
          const nextRow: DocumentRow = {
            ...row,
            contentJson,
            contentText: derived.data.contentText,
            contentMd: derived.data.contentMd,
            contentHash: hashJson(contentJson),
            updatedAt: now,
          };

          try {
            deps.db.transaction(() => {
              if (scope === "wholeProject") {
                const snapshotId = insertVersion({
                  db: deps.db,
                  row,
                  actor: "user",
                  reason: "pre-search-replace",
                  createdAt: now,
                });
                snapshotIds.push(snapshotId);
              }

              const updated = deps.db
                .prepare<
                  [
                    string,
                    string,
                    string,
                    string,
                    number,
                    string,
                    string,
                    number,
                  ]
                >("UPDATE documents SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, updated_at = ? WHERE project_id = ? AND document_id = ? AND updated_at = ?")
                .run(
                  nextRow.contentJson,
                  nextRow.contentText,
                  nextRow.contentMd,
                  nextRow.contentHash,
                  now,
                  nextRow.projectId,
                  nextRow.documentId,
                  row.updatedAt,
                );

              if (updated.changes === 0) {
                const latest = loadDocumentById({
                  db: deps.db,
                  projectId: row.projectId,
                  documentId: row.documentId,
                });
                if (latest) {
                  throw new Error("WRITE_CONFLICT");
                }
                throw new Error("NOT_FOUND");
              }

              insertVersion({
                db: deps.db,
                row: nextRow,
                actor: "user",
                reason: "search-replace",
                createdAt: now + 1,
              });
            })();
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error);
            if (scope === "wholeProject") {
              const reason = message.startsWith("SNAPSHOT_FAILED")
                ? "SNAPSHOT_FAILED"
                : message === "WRITE_CONFLICT"
                  ? "SEARCH_CONCURRENT_WRITE_CONFLICT"
                  : message === "NOT_FOUND"
                    ? "NOT_FOUND"
                    : "DB_ERROR";
              skipped.push({
                documentId: row.documentId,
                reason,
                message,
              });
              continue;
            }
            deps.logger.error("search_replace_execute_failed", {
              code:
                message === "WRITE_CONFLICT"
                  ? "SEARCH_CONCURRENT_WRITE_CONFLICT"
                  : message === "NOT_FOUND"
                    ? "NOT_FOUND"
                    : "DB_ERROR",
              message,
            });
            if (message === "WRITE_CONFLICT") {
              return ipcError(
                "SEARCH_CONCURRENT_WRITE_CONFLICT",
                "Concurrent write conflict during replace",
                { documentId: row.documentId },
                { retryable: true },
              );
            }
            return message === "NOT_FOUND"
              ? ipcError("NOT_FOUND", "Document not found")
              : ipcError("DB_ERROR", "Search replace execute failed");
          }

          replacedCount += replaced.replacedCount;
          affectedDocumentCount += 1;
        }

        deps.logger.info("search_replace_execute", {
          projectId,
          scope,
          replacedCount,
          affectedDocumentCount,
          skippedCount: skipped.length,
        });
        return {
          ok: true,
          data: {
            replacedCount,
            affectedDocumentCount,
            snapshotIds,
            skipped,
          },
        };
      } catch (error) {
        deps.logger.error("search_replace_execute_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Search replace execute failed");
      }
    },
  };
}
