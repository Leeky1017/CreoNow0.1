import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";
import { hashJson } from "@shared/hashUtils";
import { nowTs } from "@shared/timeUtils";

import type { Logger } from "../../logging/logger";
import { deriveContent } from "./derive";
import { buildUnifiedDiff } from "./documentDiffHelpers";
import { applyConflictResolutions, runThreeWayMerge } from "./threeWayMerge";
import type {
  BranchListItem,
  DocumentError,
  DocumentErrorCode,
  DocumentListItem,
  DocumentService,
  DocumentStatus,
  DocumentType,
  ServiceResult,
  SnapshotCompactionEvent,
  VersionRead,
  VersionSnapshotActor,
  VersionSnapshotReason,
} from "./types";

type Err = { ok: false; error: DocumentError };

const EMPTY_DOC = {
  type: "doc",
  content: [{ type: "paragraph" }],
} as const;

const SETTINGS_SCOPE_PREFIX = "project:" as const;
const CURRENT_DOCUMENT_ID_KEY = "creonow.document.currentId" as const;
const BRANCH_SETTINGS_SCOPE_PREFIX = "version:branch:" as const;
const CURRENT_BRANCH_KEY = "creonow.version.currentBranch" as const;
const MAX_TITLE_LENGTH = 200;
const AUTOSAVE_MERGE_WINDOW_MS = 5 * 60 * 1000;
const AUTOSAVE_COMPACT_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_MAX_SNAPSHOTS_PER_DOCUMENT = 50_000;
const DEFAULT_MAX_DIFF_PAYLOAD_BYTES = 2 * 1024 * 1024;
const DEFAULT_BRANCH_MERGE_TIMEOUT_MS = 5_000;
const BRANCH_NAME_PATTERN = /^[a-z0-9-]{3,32}$/u;

const DOCUMENT_TYPE_SET = new Set<DocumentType>([
  "chapter",
  "note",
  "setting",
  "timeline",
  "character",
]);

const DOCUMENT_STATUS_SET = new Set<DocumentStatus>(["draft", "final"]);

/**
 * Build a stable document domain error object.
 *
 * Why: services return domain errors and keep IPC transport concerns outside.
 */
function documentError(
  code: DocumentErrorCode,
  message: string,
  details?: unknown,
): Err {
  return { ok: false, error: { code, message, details } };
}

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return 0;
  }
  return trimmed.split(/\s+/u).length;
}

function normalizeNewlines(text: string): string {
  return text.replaceAll("\r\n", "\n");
}

function splitLines(text: string): string[] {
  if (text.length === 0) {
    return [];
  }
  return normalizeNewlines(text).split("\n");
}

function isReasonValidForActor(
  actor: VersionSnapshotActor,
  reason: VersionSnapshotReason,
): boolean {
  if (actor === "auto") {
    return reason === "autosave";
  }
  if (actor === "ai") {
    return reason === "ai-accept";
  }
  return (
    reason === "manual-save" ||
    reason === "status-change" ||
    reason === "branch-merge"
  );
}

function serializeJson(value: unknown): ServiceResult<string> {
  try {
    return { ok: true, data: JSON.stringify(value) };
  } catch (error) {
    return documentError(
      "ENCODING_FAILED",
      "Failed to encode document JSON",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Resolve a valid document type with a deterministic default.
 *
 * Why: create/update operations must reject unsupported types explicitly.
 */
function normalizeDocumentType(
  type: string | undefined,
): ServiceResult<DocumentType> {
  if (!type) {
    return { ok: true, data: "chapter" };
  }
  if (DOCUMENT_TYPE_SET.has(type as DocumentType)) {
    return { ok: true, data: type as DocumentType };
  }
  return documentError("INVALID_ARGUMENT", "Unsupported document type");
}

/**
 * Resolve a valid document status value.
 *
 * Why: status transitions must be explicit and deterministic for UI guards.
 */
function normalizeDocumentStatus(
  status: string | undefined,
): ServiceResult<DocumentStatus> {
  if (!status) {
    return documentError("INVALID_ARGUMENT", "status is required");
  }
  if (DOCUMENT_STATUS_SET.has(status as DocumentStatus)) {
    return { ok: true, data: status as DocumentStatus };
  }
  return documentError("INVALID_ARGUMENT", "Unsupported document status");
}

/**
 * Produce default untitled title by document type.
 *
 * Why: different creation entries must render meaningful default titles.
 */
function defaultTitleByType(type: DocumentType): string {
  switch (type) {
    case "chapter":
      return "Untitled Chapter";
    case "note":
      return "Untitled Note";
    case "setting":
      return "Untitled Setting";
    case "timeline":
      return "Untitled Timeline";
    case "character":
      return "Untitled Character";
    default:
      return "Untitled";
  }
}

function normalizeParentId(
  parentId: string | null | undefined,
): string | undefined {
  return typeof parentId === "string" ? parentId : undefined;
}

type SettingsRow = {
  valueJson: string;
};

type DocumentRow = {
  documentId: string;
  projectId: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  sortOrder: number;
  parentId: string | null;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  createdAt: number;
  updatedAt: number;
};

type LatestVersionRow = {
  versionId: string;
  reason: string;
  contentHash: string;
  createdAt: number;
};

type VersionListRow = {
  versionId: string;
  actor: VersionSnapshotActor;
  reason: string;
  contentHash: string;
  wordCount: number;
  createdAt: number;
};

type VersionRestoreRow = {
  projectId: string;
  documentId: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
};

type VersionDiffRow = {
  actor: VersionSnapshotActor;
  contentText: string;
};

type CurrentDocumentDiffRow = {
  contentText: string;
};

type DocumentContentRow = {
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
};

type RollbackCurrentDocumentRow = {
  projectId: string;
  documentId: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
};

type BranchRow = {
  id: string;
  documentId: string;
  name: string;
  baseSnapshotId: string;
  headSnapshotId: string;
  createdBy: string;
  createdAt: number;
};

type VersionContentRow = {
  projectId: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
};

type MergeSessionRow = {
  mergeSessionId: string;
  sourceBranchName: string;
  targetBranchName: string;
  mergedTemplateText: string;
};

type MergeConflictRow = {
  conflictId: string;
  conflictIndex: number;
  baseText: string;
  oursText: string;
  theirsText: string;
};

/**
 * Compute a project-scoped settings namespace.
 *
 * Why: current document must never leak across projects.
 */
function getProjectSettingsScope(projectId: string): string {
  return `${SETTINGS_SCOPE_PREFIX}${projectId}`;
}

/**
 * Read the current documentId for a project from settings.
 *
 * Why: current document must persist across restarts for a stable workbench entry.
 */
function readCurrentDocumentId(
  db: Database.Database,
  projectId: string,
): ServiceResult<string> {
  const scope = getProjectSettingsScope(projectId);

  try {
    const row = db
      .prepare<
        [string, string],
        SettingsRow
      >("SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?")
      .get(scope, CURRENT_DOCUMENT_ID_KEY);
    if (!row) {
      return documentError("NOT_FOUND", "No current document");
    }
    const parsed: unknown = JSON.parse(row.valueJson);
    if (typeof parsed !== "string" || parsed.trim().length === 0) {
      return documentError("DB_ERROR", "Invalid current document setting");
    }
    return { ok: true, data: parsed };
  } catch (error) {
    return documentError(
      "DB_ERROR",
      "Failed to read current document setting",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Persist the current documentId for a project.
 *
 * Why: renderer needs a stable restore point across restarts.
 */
function writeCurrentDocumentId(
  db: Database.Database,
  projectId: string,
  documentId: string,
): ServiceResult<true> {
  const scope = getProjectSettingsScope(projectId);

  try {
    const ts = nowTs();
    db.prepare(
      "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
    ).run(scope, CURRENT_DOCUMENT_ID_KEY, JSON.stringify(documentId), ts);
    return { ok: true, data: true };
  } catch (error) {
    return documentError(
      "DB_ERROR",
      "Failed to persist current document",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Clear the current documentId for a project.
 *
 * Why: deleting the last document must leave a deterministic "no current document" state.
 */
function clearCurrentDocumentId(
  db: Database.Database,
  projectId: string,
): ServiceResult<true> {
  const scope = getProjectSettingsScope(projectId);

  try {
    db.prepare("DELETE FROM settings WHERE scope = ? AND key = ?").run(
      scope,
      CURRENT_DOCUMENT_ID_KEY,
    );
    return { ok: true, data: true };
  } catch (error) {
    return documentError(
      "DB_ERROR",
      "Failed to clear current document",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Compute a document-scoped settings namespace for branch state.
 *
 * Why: each document branch pointer must stay isolated and deterministic.
 */
function getBranchSettingsScope(documentId: string): string {
  return `${BRANCH_SETTINGS_SCOPE_PREFIX}${documentId}`;
}

/**
 * Read persisted current branch name for one document.
 *
 * Why: branch switch must survive process restarts and reopen flows.
 */
function readCurrentBranchName(
  db: Database.Database,
  documentId: string,
): ServiceResult<string> {
  const scope = getBranchSettingsScope(documentId);
  try {
    const row = db
      .prepare<
        [string, string],
        SettingsRow
      >("SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?")
      .get(scope, CURRENT_BRANCH_KEY);
    if (!row) {
      return documentError("NOT_FOUND", "No current branch");
    }
    const parsed: unknown = JSON.parse(row.valueJson);
    if (typeof parsed !== "string" || parsed.trim().length === 0) {
      return documentError("DB_ERROR", "Invalid current branch setting");
    }
    return { ok: true, data: parsed };
  } catch (error) {
    return documentError(
      "DB_ERROR",
      "Failed to read current branch setting",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Persist current branch name for one document.
 *
 * Why: merge/switch operations must expose one stable branch cursor.
 */
function writeCurrentBranchName(
  db: Database.Database,
  documentId: string,
  branchName: string,
  ts: number,
): ServiceResult<true> {
  const scope = getBranchSettingsScope(documentId);
  try {
    db.prepare(
      "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
    ).run(scope, CURRENT_BRANCH_KEY, JSON.stringify(branchName), ts);
    return { ok: true, data: true };
  } catch (error) {
    return documentError(
      "DB_ERROR",
      "Failed to persist current branch",
      error instanceof Error ? { message: error.message } : { error },
    );
  }
}

/**
 * Validate branch name against governance regex.
 *
 * Why: branch IPC must reject invalid names deterministically.
 */
function normalizeBranchName(name: string): ServiceResult<string> {
  const trimmed = name.trim();
  if (!BRANCH_NAME_PATTERN.test(trimmed)) {
    return documentError(
      "INVALID_ARGUMENT",
      "branch name must match [a-z0-9-]{3,32}",
    );
  }
  return { ok: true, data: trimmed };
}

/**
 * Convert merged plain text to a minimal TipTap JSON document.
 *
 * Why: merge result snapshot must remain compatible with editor serializer.
 */
function buildContentJsonFromText(text: string): unknown {
  const lines = splitLines(text);
  const content =
    lines.length === 0
      ? [{ type: "paragraph" }]
      : lines.map((line) => {
          if (line.length === 0) {
            return { type: "paragraph" };
          }
          return {
            type: "paragraph",
            content: [{ type: "text", text: line }],
          };
        });
  return { type: "doc", content };
}

/**
 * Attach current-branch marker to one branch row.
 *
 * Why: list payload must support renderer-side current badge rendering.
 */
function toBranchListItem(
  row: BranchRow,
  currentBranchName: string,
): BranchListItem {
  return {
    ...row,
    isCurrent: row.name === currentBranchName,
  };
}

/**
 * Create a document service backed by SQLite (SSOT).
 */

function createDocUtilityHelpers(args: { db: Database.Database; logger: Logger }) {
  const rollbackToVersion = (params: {
    documentId: string;
    versionId: string;
  }): ServiceResult<{
    restored: true;
    preRollbackVersionId: string;
    rollbackVersionId: string;
  }> => {
    const ts = nowTs();
    let preRollbackVersionId = "";
    let rollbackVersionId = "";

    try {
      args.db.transaction(() => {
        const target = args.db
          .prepare<
            [string, string],
            VersionRestoreRow
          >("SELECT project_id as projectId, document_id as documentId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM document_versions WHERE document_id = ? AND version_id = ?")
          .get(params.documentId, params.versionId);
        if (!target) {
          throw new Error("NOT_FOUND");
        }

        const current = args.db
          .prepare<
            [string],
            RollbackCurrentDocumentRow
          >("SELECT project_id as projectId, document_id as documentId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM documents WHERE document_id = ?")
          .get(params.documentId);
        if (!current) {
          throw new Error("NOT_FOUND");
        }

        preRollbackVersionId = randomUUID();
        args.db
          .prepare(
            "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, word_count, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            preRollbackVersionId,
            current.projectId,
            current.documentId,
            "user",
            "pre-rollback",
            current.contentJson,
            current.contentText,
            current.contentMd,
            current.contentHash,
            countWords(current.contentText),
            "",
            "",
            ts,
          );

        const updated = args.db
          .prepare<
            [string, string, string, string, number, string]
          >("UPDATE documents SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, updated_at = ? WHERE document_id = ?")
          .run(
            target.contentJson,
            target.contentText,
            target.contentMd,
            target.contentHash,
            ts,
            target.documentId,
          );
        if (updated.changes === 0) {
          throw new Error("NOT_FOUND");
        }

        rollbackVersionId = randomUUID();
        args.db
          .prepare(
            "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, word_count, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            rollbackVersionId,
            target.projectId,
            target.documentId,
            "user",
            "rollback",
            target.contentJson,
            target.contentText,
            target.contentMd,
            target.contentHash,
            countWords(target.contentText),
            "",
            "",
            ts,
          );

        args.logger.info("version_rollback_applied", {
          document_id: target.documentId,
          from_version_id: params.versionId,
          pre_rollback_version_id: preRollbackVersionId,
          rollback_version_id: rollbackVersionId,
        });
      })();

      return {
        ok: true,
        data: { restored: true, preRollbackVersionId, rollbackVersionId },
      };
    } catch (error) {
      const code =
        error instanceof Error && error.message === "NOT_FOUND"
          ? ("NOT_FOUND" as const)
          : ("DB_ERROR" as const);
      args.logger.error("version_rollback_failed", {
        code,
        message: error instanceof Error ? error.message : String(error),
        document_id: params.documentId,
        version_id: params.versionId,
      });
      return documentError(
        code,
        code === "NOT_FOUND"
          ? "Version not found"
          : "Failed to rollback version",
      );
    }
  };

  const readBranch = (params: {
    documentId: string;
    name: string;
  }): ServiceResult<BranchRow> => {
    try {
      const row = args.db
        .prepare<
          [string, string],
          BranchRow
        >("SELECT branch_id as id, document_id as documentId, name, base_snapshot_id as baseSnapshotId, head_snapshot_id as headSnapshotId, created_by as createdBy, created_at as createdAt FROM document_branches WHERE document_id = ? AND name = ?")
        .get(params.documentId, params.name);
      if (!row) {
        return documentError("NOT_FOUND", "Branch not found");
      }
      return { ok: true, data: row };
    } catch (error) {
      return documentError(
        "DB_ERROR",
        "Failed to read branch",
        error instanceof Error ? { message: error.message } : { error },
      );
    }
  };

  const resolveCurrentBranchName = (
    documentId: string,
  ): ServiceResult<string> => {
    const current = readCurrentBranchName(args.db, documentId);
    if (current.ok) {
      return current;
    }
    if (current.error.code === "NOT_FOUND") {
      return { ok: true, data: "main" };
    }
    return current;
  };

  return { rollbackToVersion, readBranch, resolveCurrentBranchName };
}

function createDocBranchHelpers(
  args: { db: Database.Database; logger: Logger },
  readBranch: ReturnType<typeof createDocUtilityHelpers>['readBranch'],
) {
  const ensureMainBranch = (params: {
    documentId: string;
    createdBy: string;
  }): ServiceResult<BranchRow> => {
    const existing = readBranch({
      documentId: params.documentId,
      name: "main",
    });
    if (existing.ok) {
      return existing;
    }
    if (existing.error.code !== "NOT_FOUND") {
      return existing;
    }

    let created: BranchRow | null = null;
    const ts = nowTs();

    try {
      args.db.transaction(() => {
        const latest = args.db
          .prepare<
            [string],
            { versionId: string }
          >("SELECT version_id as versionId FROM document_versions WHERE document_id = ? ORDER BY created_at DESC, version_id ASC LIMIT 1")
          .get(params.documentId);

        let headSnapshotId = latest?.versionId ?? "";
        if (!headSnapshotId) {
          const doc = args.db
            .prepare<
              [string],
              VersionContentRow
            >("SELECT project_id as projectId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM documents WHERE document_id = ?")
            .get(params.documentId);
          if (!doc) {
            throw new Error("NOT_FOUND");
          }
          const bootstrapVersionId = randomUUID();
          args.db
            .prepare(
              "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, word_count, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .run(
              bootstrapVersionId,
              doc.projectId,
              params.documentId,
              "user",
              "manual-save",
              doc.contentJson,
              doc.contentText,
              doc.contentMd,
              doc.contentHash,
              countWords(doc.contentText),
              "",
              "",
              ts,
            );
          headSnapshotId = bootstrapVersionId;
        }

        const branchId = randomUUID();
        args.db
          .prepare(
            "INSERT INTO document_branches (branch_id, document_id, name, base_snapshot_id, head_snapshot_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            branchId,
            params.documentId,
            "main",
            headSnapshotId,
            headSnapshotId,
            params.createdBy,
            ts,
          );

        const persisted = writeCurrentBranchName(
          args.db,
          params.documentId,
          "main",
          ts,
        );
        if (!persisted.ok) {
          throw new Error("DB_ERROR");
        }

        created = {
          id: branchId,
          documentId: params.documentId,
          name: "main",
          baseSnapshotId: headSnapshotId,
          headSnapshotId,
          createdBy: params.createdBy,
          createdAt: ts,
        };
      })();
    } catch (error) {
      const code =
        error instanceof Error && error.message === "NOT_FOUND"
          ? ("NOT_FOUND" as const)
          : ("DB_ERROR" as const);
      return documentError(
        code,
        code === "NOT_FOUND"
          ? "Document not found"
          : "Failed to ensure main branch",
      );
    }

    if (!created) {
      return documentError("DB_ERROR", "Failed to ensure main branch");
    }
    return { ok: true, data: created };
  };

  const persistBranchMerge = (params: {
    documentId: string;
    targetBranchName: string;
    mergedText: string;
  }): ServiceResult<{ status: "merged"; mergeSnapshotId: string }> => {
    const ts = nowTs();
    let mergeSnapshotId = "";

    try {
      args.db.transaction(() => {
        const targetBranch = args.db
          .prepare<
            [string, string],
            BranchRow
          >("SELECT branch_id as id, document_id as documentId, name, base_snapshot_id as baseSnapshotId, head_snapshot_id as headSnapshotId, created_by as createdBy, created_at as createdAt FROM document_branches WHERE document_id = ? AND name = ?")
          .get(params.documentId, params.targetBranchName);
        if (!targetBranch) {
          throw new Error("NOT_FOUND");
        }

        const doc = args.db
          .prepare<
            [string],
            { projectId: string }
          >("SELECT project_id as projectId FROM documents WHERE document_id = ?")
          .get(params.documentId);
        if (!doc) {
          throw new Error("NOT_FOUND");
        }

        const mergedContentJson = buildContentJsonFromText(params.mergedText);
        const derived = deriveContent({ contentJson: mergedContentJson });
        if (!derived.ok) {
          throw new Error("DERIVE_FAILED");
        }
        const encoded = serializeJson(mergedContentJson);
        if (!encoded.ok) {
          throw new Error("ENCODING_FAILED");
        }
        const contentHash = hashJson(encoded.data);

        const updated = args.db
          .prepare<
            [string, string, string, string, number, string]
          >("UPDATE documents SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, updated_at = ? WHERE document_id = ?")
          .run(
            encoded.data,
            derived.data.contentText,
            derived.data.contentMd,
            contentHash,
            ts,
            params.documentId,
          );
        if (updated.changes === 0) {
          throw new Error("NOT_FOUND");
        }

        mergeSnapshotId = randomUUID();
        args.db
          .prepare(
            "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, word_count, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            mergeSnapshotId,
            doc.projectId,
            params.documentId,
            "user",
            "branch-merge",
            encoded.data,
            derived.data.contentText,
            derived.data.contentMd,
            contentHash,
            countWords(derived.data.contentText),
            "",
            "",
            ts,
          );

        const branchUpdated = args.db
          .prepare<
            [string, string, string]
          >("UPDATE document_branches SET head_snapshot_id = ? WHERE document_id = ? AND name = ?")
          .run(mergeSnapshotId, params.documentId, params.targetBranchName);
        if (branchUpdated.changes === 0) {
          throw new Error("NOT_FOUND");
        }

        const persisted = writeCurrentBranchName(
          args.db,
          params.documentId,
          params.targetBranchName,
          ts,
        );
        if (!persisted.ok) {
          throw new Error("DB_ERROR");
        }

        args.logger.info("version_branch_merge_saved", {
          document_id: params.documentId,
          target_branch: params.targetBranchName,
          merge_snapshot_id: mergeSnapshotId,
        });
      })();
    } catch (error) {
      const code =
        error instanceof Error && error.message === "NOT_FOUND"
          ? ("NOT_FOUND" as const)
          : ("DB_ERROR" as const);
      return documentError(
        code,
        code === "NOT_FOUND"
          ? "Branch or document not found"
          : "Failed to persist branch merge",
      );
    }

    return { ok: true, data: { status: "merged", mergeSnapshotId } };
  };

  return { ensureMainBranch, persistBranchMerge };
}

type DocHelpers = ReturnType<typeof createDocUtilityHelpers> &
  ReturnType<typeof createDocBranchHelpers>;

type DocCoreCtx = {
  db: Database.Database;
  logger: Logger;
  maxSnapshotsPerDocument: number;
  autosaveCompactionAgeMs: number;
  maxDiffPayloadBytes: number;
} & DocHelpers;

function createDocCrudOps(
  ctx: DocCoreCtx,
): Pick<
  DocumentService,
  "create" | "list" | "read" | "update"
> {
  const args = ctx;
  return {
    create: ({ projectId, title, type }) => {
      const normalizedType = normalizeDocumentType(type);
      if (!normalizedType.ok) {
        return normalizedType;
      }
      const safeTitle = title?.trim().length
        ? title.trim()
        : defaultTitleByType(normalizedType.data);

      const derived = deriveContent({ contentJson: EMPTY_DOC });
      if (!derived.ok) {
        return derived;
      }
      const encoded = serializeJson(EMPTY_DOC);
      if (!encoded.ok) {
        return encoded;
      }
      const contentHash = hashJson(encoded.data);

      const documentId = randomUUID();
      const ts = nowTs();

      try {
        const maxSortRow = args.db
          .prepare<
            [string],
            { maxSortOrder: number | null }
          >("SELECT MAX(sort_order) as maxSortOrder FROM documents WHERE project_id = ?")
          .get(projectId);
        const nextSortOrder = (maxSortRow?.maxSortOrder ?? -1) + 1;

        args.db
          .prepare(
            "INSERT INTO documents (document_id, project_id, type, title, content_json, content_text, content_md, content_hash, status, sort_order, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            documentId,
            projectId,
            normalizedType.data,
            safeTitle,
            encoded.data,
            derived.data.contentText,
            derived.data.contentMd,
            contentHash,
            "draft",
            nextSortOrder,
            null,
            ts,
            ts,
          );

        args.logger.info("document_created", {
          project_id: projectId,
          document_id: documentId,
        });

        return { ok: true, data: { documentId } };
      } catch (error) {
        args.logger.error("document_create_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return documentError("DB_ERROR", "Failed to create document");
      }
    },

    list: ({ projectId }) => {
      try {
        const rows = args.db
          .prepare<
            [string],
            DocumentListItem & { parentId: string | null }
          >("SELECT document_id as documentId, type, title, status, sort_order as sortOrder, parent_id as parentId, updated_at as updatedAt FROM documents WHERE project_id = ? ORDER BY sort_order ASC, updated_at DESC, document_id ASC")
          .all(projectId);
        return {
          ok: true,
          data: {
            items: rows.map((row) => ({
              ...row,
              parentId: normalizeParentId(row.parentId),
            })),
          },
        };
      } catch (error) {
        args.logger.error("document_list_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return documentError("DB_ERROR", "Failed to list documents");
      }
    },

    read: ({ projectId, documentId }) => {
      try {
        const row = args.db
          .prepare<
            [string, string],
            DocumentRow
          >("SELECT document_id as documentId, project_id as projectId, type, title, status, sort_order as sortOrder, parent_id as parentId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash, created_at as createdAt, updated_at as updatedAt FROM documents WHERE project_id = ? AND document_id = ?")
          .get(projectId, documentId);
        if (!row) {
          return documentError("NOT_FOUND", "Document not found");
        }

        return {
          ok: true,
          data: {
            ...row,
            parentId: normalizeParentId(row.parentId),
          },
        };
      } catch (error) {
        args.logger.error("document_read_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return documentError("DB_ERROR", "Failed to read document");
      }
    },

    update: ({
      projectId,
      documentId,
      title,
      type,
      status,
      sortOrder,
      parentId,
    }) => {
      if (projectId.trim().length === 0 || documentId.trim().length === 0) {
        return documentError(
          "INVALID_ARGUMENT",
          "projectId/documentId is required",
        );
      }

      const setParts: string[] = [];
      const params: Array<string | number | null> = [];

      if (title !== undefined) {
        const trimmedTitle = title.trim();
        if (trimmedTitle.length === 0) {
          return documentError("INVALID_ARGUMENT", "title is required");
        }
        if (trimmedTitle.length > MAX_TITLE_LENGTH) {
          return documentError(
            "INVALID_ARGUMENT",
            `title too long (max ${MAX_TITLE_LENGTH})`,
          );
        }
        setParts.push("title = ?");
        params.push(trimmedTitle);
      }

      if (type !== undefined) {
        const normalized = normalizeDocumentType(type);
        if (!normalized.ok) {
          return normalized;
        }
        setParts.push("type = ?");
        params.push(normalized.data);
      }

      if (status !== undefined) {
        const normalized = normalizeDocumentStatus(status);
        if (!normalized.ok) {
          return normalized;
        }
        setParts.push("status = ?");
        params.push(normalized.data);
      }

      if (sortOrder !== undefined) {
        if (!Number.isInteger(sortOrder) || sortOrder < 0) {
          return documentError(
            "INVALID_ARGUMENT",
            "sortOrder must be a non-negative integer",
          );
        }
        setParts.push("sort_order = ?");
        params.push(sortOrder);
      }

      if (parentId !== undefined) {
        if (parentId.trim().length === 0) {
          return documentError(
            "INVALID_ARGUMENT",
            "parentId must be non-empty",
          );
        }
        setParts.push("parent_id = ?");
        params.push(parentId);
      }

      if (setParts.length === 0) {
        return documentError(
          "INVALID_ARGUMENT",
          "at least one mutable field is required",
        );
      }

      const ts = nowTs();
      setParts.push("updated_at = ?");
      params.push(ts);
      params.push(projectId);
      params.push(documentId);
      try {
        const stmt = args.db.prepare(
          `UPDATE documents SET ${setParts.join(", ")} WHERE project_id = ? AND document_id = ?`,
        );
        const res = stmt.run(...params);
        if (res.changes === 0) {
          return documentError("NOT_FOUND", "Document not found");
        }

        args.logger.info("document_updated", { document_id: documentId });
        return { ok: true, data: { updated: true } };
      } catch (error) {
        args.logger.error("document_update_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return documentError("DB_ERROR", "Failed to update document");
      }
    },

  };
}

function createDocSaveOps(
  ctx: DocCoreCtx,
): Pick<
  DocumentService,
  "save"
> {
  const args = ctx;
  const { maxSnapshotsPerDocument, autosaveCompactionAgeMs } = ctx;
  return {
    save: ({ projectId, documentId, contentJson, actor, reason }) => {
      if (!isReasonValidForActor(actor, reason)) {
        return documentError("INVALID_ARGUMENT", "actor/reason mismatch");
      }

      const derived = deriveContent({ contentJson });
      if (!derived.ok) {
        return derived;
      }

      const encoded = serializeJson(contentJson);
      if (!encoded.ok) {
        return encoded;
      }
      const contentHash = hashJson(encoded.data);
      const wordCount = countWords(derived.data.contentText);
      const ts = nowTs();

      if (actor === "ai") {
        args.logger.info("ai_apply_started", { document_id: documentId });
      }
      args.logger.info("doc_save_started", {
        document_id: documentId,
        actor,
        reason,
      });

      let compaction: SnapshotCompactionEvent | undefined;
      try {
        args.db.transaction(() => {
          const exists = args.db
            .prepare<
              [string, string],
              { documentId: string }
            >("SELECT document_id as documentId FROM documents WHERE project_id = ? AND document_id = ?")
            .get(projectId, documentId);
          if (!exists) {
            throw new Error("NOT_FOUND");
          }

          args.db
            .prepare(
              "UPDATE documents SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, updated_at = ? WHERE project_id = ? AND document_id = ?",
            )
            .run(
              encoded.data,
              derived.data.contentText,
              derived.data.contentMd,
              contentHash,
              ts,
              projectId,
              documentId,
            );

          const latest = args.db
            .prepare<
              [string],
              LatestVersionRow
            >("SELECT version_id as versionId, reason, content_hash as contentHash, created_at as createdAt FROM document_versions WHERE document_id = ? ORDER BY created_at DESC, version_id ASC LIMIT 1")
            .get(documentId);

          const shouldMergeAutosave =
            actor === "auto" &&
            latest?.reason === "autosave" &&
            ts - latest.createdAt < AUTOSAVE_MERGE_WINDOW_MS;

          if (shouldMergeAutosave && latest) {
            args.db
              .prepare(
                "UPDATE document_versions SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, word_count = ?, created_at = ? WHERE version_id = ?",
              )
              .run(
                encoded.data,
                derived.data.contentText,
                derived.data.contentMd,
                contentHash,
                wordCount,
                ts,
                latest.versionId,
              );

            args.logger.info("version_autosave_merged", {
              version_id: latest.versionId,
              document_id: documentId,
              content_hash: contentHash,
            });
          } else {
            const shouldInsertVersion =
              actor === "auto" ? latest?.contentHash !== contentHash : true;
            if (!shouldInsertVersion) {
              return;
            }

            const versionId = randomUUID();
            args.db
              .prepare(
                "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, word_count, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
              )
              .run(
                versionId,
                projectId,
                documentId,
                actor,
                reason,
                encoded.data,
                derived.data.contentText,
                derived.data.contentMd,
                contentHash,
                wordCount,
                "",
                "",
                ts,
              );

            args.logger.info("version_created", {
              version_id: versionId,
              actor,
              reason,
              document_id: documentId,
              content_hash: contentHash,
            });
          }

          const totalSnapshots = args.db
            .prepare<
              [string],
              { count: number }
            >("SELECT COUNT(*) as count FROM document_versions WHERE document_id = ?")
            .get(documentId);
          const overflowCount =
            (totalSnapshots?.count ?? 0) - maxSnapshotsPerDocument;

          if (overflowCount > 0) {
            const compactBeforeTs = ts - autosaveCompactionAgeMs;
            const candidates = args.db
              .prepare<
                [string, number, number],
                { versionId: string }
              >("SELECT version_id as versionId FROM document_versions WHERE document_id = ? AND reason = 'autosave' AND created_at < ? ORDER BY created_at ASC, version_id ASC LIMIT ?")
              .all(documentId, compactBeforeTs, overflowCount);

            if (candidates.length > 0) {
              const deleteStmt = args.db.prepare<[string]>(
                "DELETE FROM document_versions WHERE version_id = ?",
              );
              for (const candidate of candidates) {
                deleteStmt.run(candidate.versionId);
              }

              const remainingSnapshots = args.db
                .prepare<
                  [string],
                  { count: number }
                >("SELECT COUNT(*) as count FROM document_versions WHERE document_id = ?")
                .get(documentId);
              compaction = {
                code: "VERSION_SNAPSHOT_COMPACTED",
                deletedCount: candidates.length,
                remainingCount: remainingSnapshots?.count ?? 0,
              };
              args.logger.info("version_snapshot_compacted", {
                document_id: documentId,
                deleted_count: candidates.length,
                remaining_count: compaction.remainingCount,
                max_snapshots_per_document: maxSnapshotsPerDocument,
              });
            }
          }
        })();
      } catch (error) {
        const code =
          error instanceof Error && error.message === "NOT_FOUND"
            ? ("NOT_FOUND" as const)
            : ("DB_ERROR" as const);
        args.logger.error("doc_save_failed", {
          code,
          message: error instanceof Error ? error.message : String(error),
          document_id: documentId,
        });
        return documentError(
          code,
          code === "NOT_FOUND"
            ? "Document not found"
            : "Failed to save document",
        );
      }

      args.logger.info("doc_save_succeeded", {
        document_id: documentId,
        content_hash: contentHash,
      });
      if (actor === "ai") {
        args.logger.info("ai_apply_succeeded", {
          document_id: documentId,
          content_hash: contentHash,
        });
      }
      return { ok: true, data: { updatedAt: ts, contentHash, compaction } };
    },

  };
}

function createDocLifecycleOps(
  ctx: DocCoreCtx,
): Pick<
  DocumentService,
  "delete" | "reorder" | "updateStatus"
> {
  const args = ctx;
  return {
    delete: ({ projectId, documentId }) => {
      if (projectId.trim().length === 0 || documentId.trim().length === 0) {
        return documentError(
          "INVALID_ARGUMENT",
          "projectId/documentId is required",
        );
      }

      const scope = getProjectSettingsScope(projectId);
      const expectedValueJson = JSON.stringify(documentId);
      const ts = nowTs();

      let switchedTo: string | null = null;
      try {
        args.db.transaction(() => {
          const currentRow = args.db
            .prepare<
              [string, string],
              SettingsRow
            >("SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?")
            .get(scope, CURRENT_DOCUMENT_ID_KEY);
          const isDeletingCurrent = currentRow?.valueJson === expectedValueJson;

          const res = args.db
            .prepare<
              [string, string]
            >("DELETE FROM documents WHERE project_id = ? AND document_id = ?")
            .run(projectId, documentId);
          if (res.changes === 0) {
            throw new Error("NOT_FOUND");
          }

          const next = args.db
            .prepare<
              [string],
              { documentId: string }
            >("SELECT document_id as documentId FROM documents WHERE project_id = ? ORDER BY updated_at DESC, document_id ASC LIMIT 1")
            .get(projectId);

          if (next) {
            if (isDeletingCurrent) {
              switchedTo = next.documentId;
              args.db
                .prepare(
                  "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
                )
                .run(
                  scope,
                  CURRENT_DOCUMENT_ID_KEY,
                  JSON.stringify(next.documentId),
                  ts,
                );
            }
            return;
          }

          const replacementId = randomUUID();
          const derived = deriveContent({ contentJson: EMPTY_DOC });
          if (!derived.ok) {
            throw new Error("DERIVE_FAILED");
          }
          const encoded = serializeJson(EMPTY_DOC);
          if (!encoded.ok) {
            throw new Error("ENCODING_FAILED");
          }
          const contentHash = hashJson(encoded.data);

          args.db
            .prepare(
              "INSERT INTO documents (document_id, project_id, type, title, content_json, content_text, content_md, content_hash, status, sort_order, parent_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .run(
              replacementId,
              projectId,
              "chapter",
              defaultTitleByType("chapter"),
              encoded.data,
              derived.data.contentText,
              derived.data.contentMd,
              contentHash,
              "draft",
              0,
              null,
              ts,
              ts,
            );

          switchedTo = replacementId;
          args.db
            .prepare(
              "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
            )
            .run(
              scope,
              CURRENT_DOCUMENT_ID_KEY,
              JSON.stringify(replacementId),
              ts,
            );
        })();

        args.logger.info("document_deleted", { document_id: documentId });
        if (switchedTo) {
          args.logger.info("document_set_current", {
            project_id: projectId,
            document_id: switchedTo,
          });
        }
        return { ok: true, data: { deleted: true } };
      } catch (error) {
        const code =
          error instanceof Error && error.message === "NOT_FOUND"
            ? ("NOT_FOUND" as const)
            : ("DB_ERROR" as const);
        args.logger.error("document_delete_failed", {
          code,
          message: error instanceof Error ? error.message : String(error),
          document_id: documentId,
        });
        return documentError(
          code,
          code === "NOT_FOUND"
            ? "Document not found"
            : "Failed to delete document",
        );
      }
    },

    reorder: ({ projectId, orderedDocumentIds }) => {
      if (projectId.trim().length === 0) {
        return documentError("INVALID_ARGUMENT", "projectId is required");
      }
      if (orderedDocumentIds.length === 0) {
        return documentError(
          "INVALID_ARGUMENT",
          "orderedDocumentIds is required",
        );
      }

      const unique = new Set(orderedDocumentIds);
      if (unique.size !== orderedDocumentIds.length) {
        return documentError(
          "INVALID_ARGUMENT",
          "orderedDocumentIds must not contain duplicates",
        );
      }

      const ts = nowTs();
      try {
        args.db.transaction(() => {
          orderedDocumentIds.forEach((docId, index) => {
            const updated = args.db
              .prepare<
                [number, number, string, string]
              >("UPDATE documents SET sort_order = ?, updated_at = ? WHERE project_id = ? AND document_id = ?")
              .run(index, ts, projectId, docId);
            if (updated.changes === 0) {
              throw new Error("NOT_FOUND");
            }
          });
        })();
        return { ok: true, data: { updated: true } };
      } catch (error) {
        const code =
          error instanceof Error && error.message === "NOT_FOUND"
            ? ("NOT_FOUND" as const)
            : ("DB_ERROR" as const);
        return documentError(
          code,
          code === "NOT_FOUND"
            ? "Document not found"
            : "Failed to reorder documents",
        );
      }
    },

    updateStatus: ({ projectId, documentId, status }) => {
      if (projectId.trim().length === 0 || documentId.trim().length === 0) {
        return documentError(
          "INVALID_ARGUMENT",
          "projectId/documentId is required",
        );
      }
      const normalized = normalizeDocumentStatus(status);
      if (!normalized.ok) {
        return normalized;
      }

      const ts = nowTs();
      try {
        args.db.transaction(() => {
          const current = args.db
            .prepare<
              [string, string],
              DocumentContentRow
            >("SELECT content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM documents WHERE project_id = ? AND document_id = ?")
            .get(projectId, documentId);
          if (!current) {
            throw new Error("NOT_FOUND");
          }

          const updated = args.db
            .prepare<
              [string, number, string, string]
            >("UPDATE documents SET status = ?, updated_at = ? WHERE project_id = ? AND document_id = ?")
            .run(normalized.data, ts, projectId, documentId);
          if (updated.changes === 0) {
            throw new Error("NOT_FOUND");
          }

          const versionId = randomUUID();
          const wordCount = countWords(current.contentText);
          args.db
            .prepare(
              "INSERT INTO document_versions (version_id, project_id, document_id, actor, reason, content_json, content_text, content_md, content_hash, word_count, diff_format, diff_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .run(
              versionId,
              projectId,
              documentId,
              "user",
              "status-change",
              current.contentJson,
              current.contentText,
              current.contentMd,
              current.contentHash,
              wordCount,
              "",
              "",
              ts,
            );
        })();

        return { ok: true, data: { updated: true, status: normalized.data } };
      } catch (error) {
        const code =
          error instanceof Error && error.message === "NOT_FOUND"
            ? ("NOT_FOUND" as const)
            : ("DB_ERROR" as const);
        return documentError(
          code,
          code === "NOT_FOUND"
            ? "Document not found"
            : "Failed to update document status",
        );
      }
    },

  };
}

function createDocNavigationOps(
  ctx: DocCoreCtx,
): Pick<
  DocumentService,
  "getCurrent" | "setCurrent"
> {
  const args = ctx;
  return {
    getCurrent: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return documentError("INVALID_ARGUMENT", "projectId is required");
      }

      const current = readCurrentDocumentId(args.db, projectId);
      if (!current.ok) {
        return current;
      }

      try {
        const exists = args.db
          .prepare<
            [string, string],
            { documentId: string }
          >("SELECT document_id as documentId FROM documents WHERE project_id = ? AND document_id = ?")
          .get(projectId, current.data);
        if (!exists) {
          void clearCurrentDocumentId(args.db, projectId);
          return documentError("NOT_FOUND", "Current document not found");
        }

        return { ok: true, data: { documentId: current.data } };
      } catch (error) {
        args.logger.error("document_get_current_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return documentError("DB_ERROR", "Failed to resolve current document");
      }
    },

    setCurrent: ({ projectId, documentId }) => {
      if (projectId.trim().length === 0 || documentId.trim().length === 0) {
        return documentError(
          "INVALID_ARGUMENT",
          "projectId/documentId is required",
        );
      }

      try {
        const exists = args.db
          .prepare<
            [string, string],
            { documentId: string }
          >("SELECT document_id as documentId FROM documents WHERE project_id = ? AND document_id = ?")
          .get(projectId, documentId);
        if (!exists) {
          return documentError("NOT_FOUND", "Document not found");
        }
      } catch (error) {
        args.logger.error("document_set_current_lookup_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return documentError("DB_ERROR", "Failed to load document");
      }

      const persisted = writeCurrentDocumentId(args.db, projectId, documentId);
      if (!persisted.ok) {
        return persisted;
      }

      args.logger.info("document_set_current", {
        project_id: projectId,
        document_id: documentId,
      });
      return { ok: true, data: { documentId } };
    },

  };
}

function createVersionOps(
  ctx: DocCoreCtx,
): Pick<
  DocumentService,
  "listVersions" | "readVersion" | "diffVersions" | "rollbackVersion" | "restoreVersion"
> {
  const args = ctx;
  const { maxDiffPayloadBytes, rollbackToVersion } = ctx;
  return {
    listVersions: ({ documentId }) => {
      try {
        const rows = args.db
          .prepare<
            [string],
            VersionListRow
          >("SELECT version_id as versionId, actor, reason, content_hash as contentHash, COALESCE(word_count, 0) as wordCount, created_at as createdAt FROM document_versions WHERE document_id = ? ORDER BY created_at DESC, version_id ASC")
          .all(documentId);
        return { ok: true, data: { items: rows } };
      } catch (error) {
        args.logger.error("version_list_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
        return documentError("DB_ERROR", "Failed to list versions");
      }
    },

    readVersion: ({ documentId, versionId }) => {
      try {
        const row = args.db
          .prepare<
            [string, string],
            VersionRead
          >("SELECT document_id as documentId, project_id as projectId, version_id as versionId, actor, reason, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash, COALESCE(word_count, 0) as wordCount, created_at as createdAt FROM document_versions WHERE document_id = ? AND version_id = ?")
          .get(documentId, versionId);
        if (!row) {
          return documentError("NOT_FOUND", "Version not found");
        }

        args.logger.info("version_read", {
          document_id: documentId,
          version_id: versionId,
        });
        return { ok: true, data: row };
      } catch (error) {
        args.logger.error("version_read_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
          document_id: documentId,
          version_id: versionId,
        });
        return documentError("DB_ERROR", "Failed to read version");
      }
    },

    diffVersions: ({ documentId, baseVersionId, targetVersionId }) => {
      try {
        const base = args.db
          .prepare<
            [string, string],
            VersionDiffRow
          >("SELECT actor, content_text as contentText FROM document_versions WHERE document_id = ? AND version_id = ?")
          .get(documentId, baseVersionId);
        if (!base) {
          return documentError("NOT_FOUND", "Version not found");
        }

        let targetText = "";
        let targetActor: VersionSnapshotActor | null = null;

        if (targetVersionId) {
          const target = args.db
            .prepare<
              [string, string],
              VersionDiffRow
            >("SELECT actor, content_text as contentText FROM document_versions WHERE document_id = ? AND version_id = ?")
            .get(documentId, targetVersionId);
          if (!target) {
            return documentError("NOT_FOUND", "Target version not found");
          }
          targetText = target.contentText;
          targetActor = target.actor;
        } else {
          const current = args.db
            .prepare<
              [string],
              CurrentDocumentDiffRow
            >("SELECT content_text as contentText FROM documents WHERE document_id = ?")
            .get(documentId);
          if (!current) {
            return documentError("NOT_FOUND", "Document not found");
          }
          targetText = current.contentText;
        }

        const payloadBytes =
          Buffer.byteLength(base.contentText, "utf8") +
          Buffer.byteLength(targetText, "utf8");
        if (payloadBytes > maxDiffPayloadBytes) {
          return documentError(
            "VERSION_DIFF_PAYLOAD_TOO_LARGE",
            "Diff payload exceeds size limit",
            {
              payloadBytes,
              maxPayloadBytes: maxDiffPayloadBytes,
            },
          );
        }

        const diff = buildUnifiedDiff({
          oldText: base.contentText,
          newText: targetText,
          oldLabel: baseVersionId,
          newLabel: targetVersionId ?? "current",
        });
        return {
          ok: true,
          data: {
            diffText: diff.diffText,
            hasDifferences: diff.diffText.length > 0,
            stats: diff.stats,
            aiMarked: base.actor === "ai" || targetActor === "ai",
          },
        };
      } catch (error) {
        args.logger.error("version_diff_failed", {
          code: "DB_ERROR",
          message: error instanceof Error ? error.message : String(error),
          document_id: documentId,
          version_id: baseVersionId,
          target_version_id: targetVersionId,
        });
        return documentError("DB_ERROR", "Failed to compute version diff");
      }
    },

    rollbackVersion: ({ documentId, versionId }) =>
      rollbackToVersion({ documentId, versionId }),

    restoreVersion: ({ documentId, versionId }) => {
      const rollback = rollbackToVersion({ documentId, versionId });
      if (!rollback.ok) {
        return rollback;
      }
      return { ok: true, data: { restored: true } };
    },
  };
}

function createBranchCrudOps(
  ctx: DocCoreCtx,
): Pick<
  DocumentService,
  "createBranch" | "listBranches" | "switchBranch"
> {
  const args = ctx;
  const { readBranch, ensureMainBranch, resolveCurrentBranchName } = ctx;
  return {
    createBranch: ({ documentId, name, createdBy }) => {
      if (documentId.trim().length === 0 || createdBy.trim().length === 0) {
        return documentError(
          "INVALID_ARGUMENT",
          "documentId/createdBy is required",
        );
      }

      const normalizedName = normalizeBranchName(name);
      if (!normalizedName.ok) {
        return normalizedName;
      }

      const ensured = ensureMainBranch({ documentId, createdBy });
      if (!ensured.ok) {
        return ensured;
      }

      const currentBranch = resolveCurrentBranchName(documentId);
      if (!currentBranch.ok) {
        return currentBranch;
      }

      const baseBranch =
        currentBranch.data === "main"
          ? ensured
          : readBranch({ documentId, name: currentBranch.data });
      if (!baseBranch.ok) {
        return baseBranch;
      }

      const ts = nowTs();
      const branchId = randomUUID();
      try {
        args.db
          .prepare(
            "INSERT INTO document_branches (branch_id, document_id, name, base_snapshot_id, head_snapshot_id, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          )
          .run(
            branchId,
            documentId,
            normalizedName.data,
            baseBranch.data.headSnapshotId,
            baseBranch.data.headSnapshotId,
            createdBy,
            ts,
          );
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes("UNIQUE constraint failed")
        ) {
          return documentError("ALREADY_EXISTS", "Branch already exists");
        }
        return documentError(
          "DB_ERROR",
          "Failed to create branch",
          error instanceof Error ? { message: error.message } : { error },
        );
      }

      return {
        ok: true,
        data: {
          branch: {
            id: branchId,
            documentId,
            name: normalizedName.data,
            baseSnapshotId: baseBranch.data.headSnapshotId,
            headSnapshotId: baseBranch.data.headSnapshotId,
            createdBy,
            createdAt: ts,
            isCurrent: false,
          },
        },
      };
    },

    listBranches: ({ documentId }) => {
      if (documentId.trim().length === 0) {
        return documentError("INVALID_ARGUMENT", "documentId is required");
      }

      const ensured = ensureMainBranch({ documentId, createdBy: "system" });
      if (!ensured.ok) {
        return ensured;
      }

      const current = resolveCurrentBranchName(documentId);
      if (!current.ok) {
        return current;
      }

      try {
        const rows = args.db
          .prepare<
            [string],
            BranchRow
          >("SELECT branch_id as id, document_id as documentId, name, base_snapshot_id as baseSnapshotId, head_snapshot_id as headSnapshotId, created_by as createdBy, created_at as createdAt FROM document_branches WHERE document_id = ? ORDER BY created_at ASC, name ASC")
          .all(documentId);
        return {
          ok: true,
          data: {
            branches: rows.map((row) => toBranchListItem(row, current.data)),
          },
        };
      } catch (error) {
        return documentError(
          "DB_ERROR",
          "Failed to list branches",
          error instanceof Error ? { message: error.message } : { error },
        );
      }
    },

    switchBranch: ({ documentId, name }) => {
      if (documentId.trim().length === 0) {
        return documentError("INVALID_ARGUMENT", "documentId is required");
      }

      const normalizedName = normalizeBranchName(name);
      if (!normalizedName.ok) {
        return normalizedName;
      }

      const ensured = ensureMainBranch({ documentId, createdBy: "system" });
      if (!ensured.ok) {
        return ensured;
      }

      const branch =
        normalizedName.data === "main"
          ? ensured
          : readBranch({ documentId, name: normalizedName.data });
      if (!branch.ok) {
        return branch;
      }

      const ts = nowTs();
      try {
        args.db.transaction(() => {
          const snapshot = args.db
            .prepare<
              [string, string],
              VersionContentRow
            >("SELECT project_id as projectId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM document_versions WHERE document_id = ? AND version_id = ?")
            .get(documentId, branch.data.headSnapshotId);
          if (!snapshot) {
            throw new Error("NOT_FOUND");
          }

          const updated = args.db
            .prepare<
              [string, string, string, string, number, string]
            >("UPDATE documents SET content_json = ?, content_text = ?, content_md = ?, content_hash = ?, updated_at = ? WHERE document_id = ?")
            .run(
              snapshot.contentJson,
              snapshot.contentText,
              snapshot.contentMd,
              snapshot.contentHash,
              ts,
              documentId,
            );
          if (updated.changes === 0) {
            throw new Error("NOT_FOUND");
          }

          const persisted = writeCurrentBranchName(
            args.db,
            documentId,
            normalizedName.data,
            ts,
          );
          if (!persisted.ok) {
            throw new Error("DB_ERROR");
          }
        })();
      } catch (error) {
        const code =
          error instanceof Error && error.message === "NOT_FOUND"
            ? ("NOT_FOUND" as const)
            : ("DB_ERROR" as const);
        return documentError(
          code,
          code === "NOT_FOUND"
            ? "Branch head snapshot not found"
            : "Failed to switch branch",
        );
      }

      return {
        ok: true,
        data: {
          currentBranch: normalizedName.data,
          headSnapshotId: branch.data.headSnapshotId,
        },
      };
    },

  };
}

function createBranchMergeOps(
  ctx: DocCoreCtx,
): Pick<
  DocumentService,
  "mergeBranch" | "resolveMergeConflict"
> {
  const args = ctx;
  const { readBranch, ensureMainBranch, persistBranchMerge } = ctx;
  return {
    mergeBranch: ({
      documentId,
      sourceBranchName,
      targetBranchName,
      timeoutMs,
    }) => {
      if (documentId.trim().length === 0) {
        return documentError("INVALID_ARGUMENT", "documentId is required");
      }

      const source = normalizeBranchName(sourceBranchName);
      if (!source.ok) {
        return source;
      }
      const target = normalizeBranchName(targetBranchName);
      if (!target.ok) {
        return target;
      }
      if (source.data === target.data) {
        return documentError(
          "INVALID_ARGUMENT",
          "sourceBranchName and targetBranchName must differ",
        );
      }

      const effectiveTimeoutMs = timeoutMs ?? DEFAULT_BRANCH_MERGE_TIMEOUT_MS;
      if (effectiveTimeoutMs <= 0) {
        return documentError(
          "VERSION_MERGE_TIMEOUT",
          "Branch merge timed out",
          {
            timeoutMs: effectiveTimeoutMs,
          },
        );
      }

      const startedAt = nowTs();
      const ensured = ensureMainBranch({ documentId, createdBy: "system" });
      if (!ensured.ok) {
        return ensured;
      }

      const sourceBranch =
        source.data === "main"
          ? ensured
          : readBranch({ documentId, name: source.data });
      if (!sourceBranch.ok) {
        return sourceBranch;
      }
      const targetBranch =
        target.data === "main"
          ? ensured
          : readBranch({ documentId, name: target.data });
      if (!targetBranch.ok) {
        return targetBranch;
      }

      let baseText = "";
      let oursText = "";
      let theirsText = "";
      try {
        const base = args.db
          .prepare<
            [string, string],
            VersionContentRow
          >("SELECT project_id as projectId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM document_versions WHERE document_id = ? AND version_id = ?")
          .get(documentId, sourceBranch.data.baseSnapshotId);
        const ours = args.db
          .prepare<
            [string, string],
            VersionContentRow
          >("SELECT project_id as projectId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM document_versions WHERE document_id = ? AND version_id = ?")
          .get(documentId, targetBranch.data.headSnapshotId);
        const theirs = args.db
          .prepare<
            [string, string],
            VersionContentRow
          >("SELECT project_id as projectId, content_json as contentJson, content_text as contentText, content_md as contentMd, content_hash as contentHash FROM document_versions WHERE document_id = ? AND version_id = ?")
          .get(documentId, sourceBranch.data.headSnapshotId);
        if (!base || !ours || !theirs) {
          return documentError("NOT_FOUND", "Branch snapshot not found");
        }
        baseText = base.contentText;
        oursText = ours.contentText;
        theirsText = theirs.contentText;
      } catch (error) {
        return documentError(
          "DB_ERROR",
          "Failed to load branch snapshots",
          error instanceof Error ? { message: error.message } : { error },
        );
      }

      const merge = runThreeWayMerge({
        baseText,
        oursText,
        theirsText,
        createConflictId: () => randomUUID(),
      });
      if (nowTs() - startedAt > effectiveTimeoutMs) {
        return documentError(
          "VERSION_MERGE_TIMEOUT",
          "Branch merge timed out",
          {
            timeoutMs: effectiveTimeoutMs,
          },
        );
      }

      if (merge.conflicts.length > 0) {
        const mergeSessionId = randomUUID();
        const ts = nowTs();
        try {
          args.db.transaction(() => {
            args.db
              .prepare(
                "INSERT INTO document_merge_sessions (merge_session_id, document_id, source_branch_name, target_branch_name, merged_template_text, created_at) VALUES (?, ?, ?, ?, ?, ?)",
              )
              .run(
                mergeSessionId,
                documentId,
                source.data,
                target.data,
                merge.mergedText,
                ts,
              );

            for (const conflict of merge.conflicts) {
              args.db
                .prepare(
                  "INSERT INTO document_merge_conflicts (conflict_id, merge_session_id, document_id, source_branch_name, target_branch_name, conflict_index, base_text, ours_text, theirs_text, selected_resolution, manual_text, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                )
                .run(
                  conflict.conflictId,
                  mergeSessionId,
                  documentId,
                  source.data,
                  target.data,
                  conflict.index,
                  conflict.baseText,
                  conflict.oursText,
                  conflict.theirsText,
                  null,
                  null,
                  ts,
                );
            }
          })();
        } catch (error) {
          return documentError(
            "DB_ERROR",
            "Failed to persist merge conflict session",
            error instanceof Error ? { message: error.message } : { error },
          );
        }

        return documentError("CONFLICT", "Merge conflict detected", {
          mergeSessionId,
          conflicts: merge.conflicts.map((item) => ({
            conflictId: item.conflictId,
            index: item.index,
            baseText: item.baseText,
            oursText: item.oursText,
            theirsText: item.theirsText,
          })),
        });
      }

      return persistBranchMerge({
        documentId,
        targetBranchName: target.data,
        mergedText: merge.mergedText,
      });
    },

    resolveMergeConflict: ({ documentId, mergeSessionId, resolutions }) => {
      if (
        documentId.trim().length === 0 ||
        mergeSessionId.trim().length === 0
      ) {
        return documentError(
          "INVALID_ARGUMENT",
          "documentId/mergeSessionId is required",
        );
      }

      let session: MergeSessionRow | undefined;
      let conflicts: MergeConflictRow[] = [];
      try {
        session = args.db
          .prepare<
            [string, string],
            MergeSessionRow
          >("SELECT merge_session_id as mergeSessionId, source_branch_name as sourceBranchName, target_branch_name as targetBranchName, merged_template_text as mergedTemplateText FROM document_merge_sessions WHERE document_id = ? AND merge_session_id = ?")
          .get(documentId, mergeSessionId);
        if (!session) {
          return documentError("NOT_FOUND", "Merge session not found");
        }

        conflicts = args.db
          .prepare<
            [string, string],
            MergeConflictRow
          >("SELECT conflict_id as conflictId, conflict_index as conflictIndex, base_text as baseText, ours_text as oursText, theirs_text as theirsText FROM document_merge_conflicts WHERE document_id = ? AND merge_session_id = ? ORDER BY conflict_index ASC")
          .all(documentId, mergeSessionId);
      } catch (error) {
        return documentError(
          "DB_ERROR",
          "Failed to load merge session",
          error instanceof Error ? { message: error.message } : { error },
        );
      }

      const resolved = applyConflictResolutions({
        templateText: session.mergedTemplateText,
        conflicts,
        resolutions,
      });
      if (!resolved.ok) {
        return documentError("INVALID_ARGUMENT", resolved.message, {
          code: resolved.code,
        });
      }

      const merged = persistBranchMerge({
        documentId,
        targetBranchName: session.targetBranchName,
        mergedText: resolved.mergedText,
      });
      if (!merged.ok) {
        return merged;
      }

      try {
        args.db
          .prepare(
            "DELETE FROM document_merge_conflicts WHERE document_id = ? AND merge_session_id = ?",
          )
          .run(documentId, mergeSessionId);
        args.db
          .prepare(
            "DELETE FROM document_merge_sessions WHERE document_id = ? AND merge_session_id = ?",
          )
          .run(documentId, mergeSessionId);
      } catch (error) {
        args.logger.error("version_conflict_cleanup_failed", {
          document_id: documentId,
          merge_session_id: mergeSessionId,
          message: error instanceof Error ? error.message : String(error),
        });
      }

      return merged;
    },

  };
}

export function createDocumentCoreService(args: {
  db: Database.Database;
  logger: Logger;
  maxSnapshotsPerDocument?: number;
  autosaveCompactionAgeMs?: number;
  maxDiffPayloadBytes?: number;
}): DocumentService {
  const maxSnapshotsPerDocument = Math.max(
    1,
    args.maxSnapshotsPerDocument ?? DEFAULT_MAX_SNAPSHOTS_PER_DOCUMENT,
  );
  const autosaveCompactionAgeMs = Math.max(
    0,
    args.autosaveCompactionAgeMs ?? AUTOSAVE_COMPACT_AGE_MS,
  );
  const maxDiffPayloadBytes = Math.max(
    1,
    args.maxDiffPayloadBytes ?? DEFAULT_MAX_DIFF_PAYLOAD_BYTES,
  );


  const { rollbackToVersion, readBranch, resolveCurrentBranchName } = createDocUtilityHelpers(args);
  const { ensureMainBranch, persistBranchMerge } = createDocBranchHelpers(args, readBranch);

  const ctx: DocCoreCtx = {
    db: args.db,
    logger: args.logger,
    maxSnapshotsPerDocument,
    autosaveCompactionAgeMs,
    maxDiffPayloadBytes,
    rollbackToVersion,
    readBranch,
    ensureMainBranch,
    resolveCurrentBranchName,
    persistBranchMerge,
  };

  return {
    ...createDocCrudOps(ctx),
    ...createDocSaveOps(ctx),
    ...createDocLifecycleOps(ctx),
    ...createDocNavigationOps(ctx),
    ...createVersionOps(ctx),
    ...createBranchCrudOps(ctx),
    ...createBranchMergeOps(ctx),
  };
}
