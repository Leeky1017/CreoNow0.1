import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";
import { hashJson } from "@shared/hashUtils";

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

type SearchReplacePreviewArgs = Parameters<SearchReplaceService["preview"]>[0];

type SearchReplaceExecuteArgs = Parameters<SearchReplaceService["execute"]>[0];

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

type SearchReplaceDeps = {
  db: Database.Database;
  logger: Logger;
  previewStore: PreviewTokenStore;
};

type NormalizedSearchReplaceArgs = {
  projectId: string;
  query: string;
  scope: SearchReplaceScope;
  options: ReplaceOptions;
  matcher: RegExp;
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

function normalizeSearchReplaceArgs(args: {
  projectId: string;
  query: string;
  scope: SearchReplaceScope;
  regex?: boolean;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}): ServiceResult<NormalizedSearchReplaceArgs> {
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

  return {
    ok: true,
    data: {
      projectId: projectIdRes.data,
      query: queryRes.data,
      scope: scopeRes.data,
      options,
      matcher: matcherRes.data,
    },
  };
}

function loadPreviewRows(args: {
  db: Database.Database;
  projectId: string;
  scope: SearchReplaceScope;
  documentId?: string;
}): ServiceResult<DocumentRow[]> {
  if (args.scope === "wholeProject") {
    return {
      ok: true,
      data: loadProjectDocuments({ db: args.db, projectId: args.projectId }),
    };
  }

  const documentIdRes = normalizeDocumentId(args.documentId);
  if (!documentIdRes.ok) {
    return documentIdRes;
  }
  const row = loadDocumentById({
    db: args.db,
    projectId: args.projectId,
    documentId: documentIdRes.data,
  });
  if (!row) {
    return ipcError("NOT_FOUND", "Document not found");
  }
  return { ok: true, data: [row] };
}

function collectPreviewItems(args: {
  rows: DocumentRow[];
  matcher: RegExp;
}): { items: SearchReplacePreviewItem[]; totalMatches: number } {
  const items: SearchReplacePreviewItem[] = [];
  let totalMatches = 0;

  for (const row of args.rows) {
    const matchCount = countMatches(row.contentText, args.matcher);
    if (matchCount <= 0) {
      continue;
    }
    totalMatches += matchCount;
    items.push({
      documentId: row.documentId,
      title: row.title,
      matchCount,
      sample: buildSample(row.contentText, args.matcher),
    });
  }

  return { items, totalMatches };
}

function storePreviewIfNeeded(args: {
  previewStore: PreviewTokenStore;
  projectId: string;
  scope: SearchReplaceScope;
  query: string;
  replaceWith: string;
  options: ReplaceOptions;
  items: SearchReplacePreviewItem[];
}): string | undefined {
  if (args.scope !== "wholeProject") {
    return undefined;
  }

  const previewId = randomUUID();
  args.previewStore.set(previewId, {
    previewId,
    projectId: args.projectId,
    documentId: undefined,
    scope: args.scope,
    query: args.query,
    replaceWith: args.replaceWith,
    regex: args.options.regex,
    caseSensitive: args.options.caseSensitive,
    wholeWord: args.options.wholeWord,
    documentIds: args.items.map((item) => item.documentId),
  });
  return previewId;
}

function previewSearchReplace(
  deps: SearchReplaceDeps,
  args: SearchReplacePreviewArgs,
): ServiceResult<SearchReplacePreview> {
  const normalizedRes = normalizeSearchReplaceArgs(args);
  if (!normalizedRes.ok) {
    return normalizedRes;
  }

  const { projectId, query, scope, options, matcher } = normalizedRes.data;
  try {
    const rowsRes = loadPreviewRows({
      db: deps.db,
      projectId,
      scope,
      documentId: args.documentId,
    });
    if (!rowsRes.ok) {
      return rowsRes;
    }

    const { items, totalMatches } = collectPreviewItems({
      rows: rowsRes.data,
      matcher,
    });
    const previewId = storePreviewIfNeeded({
      previewStore: deps.previewStore,
      projectId,
      scope,
      query,
      replaceWith: args.replaceWith,
      options,
      items,
    });

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
}

function resolveExecuteDocumentIds(args: {
  executeArgs: SearchReplaceExecuteArgs;
  normalized: NormalizedSearchReplaceArgs;
  previewStore: PreviewTokenStore;
}): ServiceResult<string[]> {
  const { executeArgs, normalized, previewStore } = args;
  if (normalized.scope === "currentDocument") {
    const documentIdRes = normalizeDocumentId(executeArgs.documentId);
    if (!documentIdRes.ok) {
      return documentIdRes;
    }
    return { ok: true, data: [documentIdRes.data] };
  }

  if (!executeArgs.confirmed) {
    return ipcError(
      "VALIDATION_ERROR",
      "Whole-project replace requires explicit confirmation",
    );
  }
  const previewId = executeArgs.previewId?.trim() ?? "";
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
      projectId: normalized.projectId,
      documentId: undefined,
      scope: normalized.scope,
      query: normalized.query,
      replaceWith: executeArgs.replaceWith,
      options: normalized.options,
    })
  ) {
    return ipcError("VALIDATION_ERROR", "Preview context does not match");
  }

  previewStore.delete(previewId);
  return { ok: true, data: [...preview.documentIds] };
}

type ExecuteFailureCode =
  | "SEARCH_CONCURRENT_WRITE_CONFLICT"
  | "NOT_FOUND"
  | "DB_ERROR";

function mapExecuteErrorCode(message: string): ExecuteFailureCode {
  if (message === "WRITE_CONFLICT") {
    return "SEARCH_CONCURRENT_WRITE_CONFLICT";
  }
  if (message === "NOT_FOUND") {
    return "NOT_FOUND";
  }
  return "DB_ERROR";
}

function mapWholeProjectSkipReason(message: string): string {
  if (message.startsWith("SNAPSHOT_FAILED")) {
    return "SNAPSHOT_FAILED";
  }
  return mapExecuteErrorCode(message);
}

function buildCurrentScopeExecuteError(
  message: string,
  documentId: string,
): ServiceResult<SearchReplaceExecute> {
  if (message === "WRITE_CONFLICT") {
    return ipcError(
      "SEARCH_CONCURRENT_WRITE_CONFLICT",
      "Concurrent write conflict during replace",
      { documentId },
      { retryable: true },
    );
  }
  if (message === "NOT_FOUND") {
    return ipcError("NOT_FOUND", "Document not found");
  }
  return ipcError("DB_ERROR", "Search replace execute failed");
}

type PreparedReplacement =
  | { status: "unchanged" }
  | { status: "skipped"; skipped: SearchReplaceSkippedItem }
  | {
      status: "ready";
      nextRow: DocumentRow;
      replacedCount: number;
      now: number;
    };

function prepareReplacementRow(args: {
  row: DocumentRow;
  matcher: RegExp;
  replaceWith: string;
}): PreparedReplacement {
  const replaced = replaceInJsonValue(
    JSON.parse(args.row.contentJson) as unknown,
    args.matcher,
    args.replaceWith,
  );
  if (replaced.replacedCount === 0) {
    return { status: "unchanged" };
  }

  const derived = deriveContent({ contentJson: replaced.contentJson });
  if (!derived.ok) {
    return {
      status: "skipped",
      skipped: {
        documentId: args.row.documentId,
        reason: "ENCODING_FAILED",
        message: derived.error.message,
      },
    };
  }

  let contentJson: string;
  try {
    contentJson = JSON.stringify(replaced.contentJson);
  } catch (error) {
    return {
      status: "skipped",
      skipped: {
        documentId: args.row.documentId,
        reason: "ENCODING_FAILED",
        message: error instanceof Error ? error.message : String(error),
      },
    };
  }

  const now = Date.now();
  return {
    status: "ready",
    replacedCount: replaced.replacedCount,
    now,
    nextRow: {
      ...args.row,
      contentJson,
      contentText: derived.data.contentText,
      contentMd: derived.data.contentMd,
      contentHash: hashJson(contentJson),
      updatedAt: now,
    },
  };
}

function applyReplacementTransaction(args: {
  db: Database.Database;
  row: DocumentRow;
  nextRow: DocumentRow;
  now: number;
  scope: SearchReplaceScope;
  snapshotIds: string[];
}): { ok: true } | { ok: false; message: string } {
  try {
    args.db.transaction(() => {
      if (args.scope === "wholeProject") {
        const snapshotId = insertVersion({
          db: args.db,
          row: args.row,
          actor: "user",
          reason: "pre-search-replace",
          createdAt: args.now,
        });
        args.snapshotIds.push(snapshotId);
      }

      const updated = args.db
        .prepare<
          [string, string, string, string, number, string, string, number]
        >("UPDATE documents SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, updated_at = ? WHERE project_id = ? AND document_id = ? AND updated_at = ?")
        .run(
          args.nextRow.contentJson,
          args.nextRow.contentText,
          args.nextRow.contentMd,
          args.nextRow.contentHash,
          args.now,
          args.nextRow.projectId,
          args.nextRow.documentId,
          args.row.updatedAt,
        );

      if (updated.changes === 0) {
        const latest = loadDocumentById({
          db: args.db,
          projectId: args.row.projectId,
          documentId: args.row.documentId,
        });
        if (latest) {
          throw new Error("WRITE_CONFLICT");
        }
        throw new Error("NOT_FOUND");
      }

      insertVersion({
        db: args.db,
        row: args.nextRow,
        actor: "user",
        reason: "search-replace",
        createdAt: args.now + 1,
      });
    })();
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function executeSearchReplace(
  deps: SearchReplaceDeps,
  args: SearchReplaceExecuteArgs,
): ServiceResult<SearchReplaceExecute> {
  const normalizedRes = normalizeSearchReplaceArgs(args);
  if (!normalizedRes.ok) {
    return normalizedRes;
  }

  const documentIdsRes = resolveExecuteDocumentIds({
    executeArgs: args,
    normalized: normalizedRes.data,
    previewStore: deps.previewStore,
  });
  if (!documentIdsRes.ok) {
    return documentIdsRes;
  }

  const { projectId, scope, matcher } = normalizedRes.data;
  const skipped: SearchReplaceSkippedItem[] = [];
  const snapshotIds: string[] = [];
  let replacedCount = 0;
  let affectedDocumentCount = 0;

  try {
    for (const documentId of documentIdsRes.data) {
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

      const prepared = prepareReplacementRow({
        row,
        matcher,
        replaceWith: args.replaceWith,
      });
      if (prepared.status === "unchanged") {
        continue;
      }
      if (prepared.status === "skipped") {
        skipped.push(prepared.skipped);
        continue;
      }

      const writeRes = applyReplacementTransaction({
        db: deps.db,
        row,
        nextRow: prepared.nextRow,
        now: prepared.now,
        scope,
        snapshotIds,
      });
      if (!writeRes.ok) {
        if (scope === "wholeProject") {
          skipped.push({
            documentId: row.documentId,
            reason: mapWholeProjectSkipReason(writeRes.message),
            message: writeRes.message,
          });
          continue;
        }

        deps.logger.error("search_replace_execute_failed", {
          code: mapExecuteErrorCode(writeRes.message),
          message: writeRes.message,
        });
        return buildCurrentScopeExecuteError(writeRes.message, row.documentId);
      }

      replacedCount += prepared.replacedCount;
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
  const runtimeDeps: SearchReplaceDeps = {
    db: deps.db,
    logger: deps.logger,
    previewStore: deps.previewStore ?? new Map<string, StoredPreview>(),
  };

  return {
    preview: (args) => previewSearchReplace(runtimeDeps, args),
    execute: (args) => executeSearchReplace(runtimeDeps, args),
  };
}
