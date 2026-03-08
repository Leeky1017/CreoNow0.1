import type Database from "better-sqlite3";

import type { VersionDiffPayload } from "@shared/types/version-diff";
import type { Logger } from "../../logging/logger";
import type { ConflictResolutionInput } from "./threeWayMerge";

type Ok<T> = { ok: true; data: T };
export type DocumentErrorCode =
  | "ALREADY_EXISTS"
  | "CONFLICT"
  | "DB_ERROR"
  | "DOCUMENT_SIZE_EXCEEDED"
  | "ENCODING_FAILED"
  | "INVALID_ARGUMENT"
  | "NOT_FOUND"
  | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
  | "VERSION_MERGE_TIMEOUT";

export type DocumentError = {
  code: DocumentErrorCode;
  message: string;
  traceId?: string;
  details?: unknown;
  retryable?: boolean;
};

type Err = { ok: false; error: DocumentError };
export type ServiceResult<T> = Ok<T> | Err;

export type DocumentType =
  | "chapter"
  | "note"
  | "setting"
  | "timeline"
  | "character";

export type DocumentStatus = "draft" | "final";
export type VersionSnapshotActor = "user" | "auto" | "ai";
export type VersionSnapshotReason =
  | "manual-save"
  | "autosave"
  | "ai-accept"
  | "status-change"
  | "branch-merge";

export type DocumentListItem = {
  documentId: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  sortOrder: number;
  parentId?: string;
  updatedAt: number;
};

export type DocumentRead = {
  documentId: string;
  projectId: string;
  type: DocumentType;
  title: string;
  status: DocumentStatus;
  sortOrder: number;
  parentId?: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  createdAt: number;
  updatedAt: number;
};

export type VersionListItem = {
  versionId: string;
  actor: VersionSnapshotActor;
  reason: string;
  contentHash: string;
  wordCount: number;
  createdAt: number;
};

export type VersionRead = {
  documentId: string;
  projectId: string;
  versionId: string;
  actor: VersionSnapshotActor;
  reason: string;
  contentJson: string;
  contentText: string;
  contentMd: string;
  contentHash: string;
  wordCount: number;
  createdAt: number;
};

export type BranchListItem = {
  id: string;
  documentId: string;
  name: string;
  baseSnapshotId: string;
  headSnapshotId: string;
  createdBy: string;
  createdAt: number;
  isCurrent: boolean;
};

export type BranchMergeConflict = {
  conflictId: string;
  index: number;
  baseText: string;
  oursText: string;
  theirsText: string;
};

export type BranchConflictResolutionInput = ConflictResolutionInput;

export type SnapshotCompactionEvent = {
  code: "VERSION_SNAPSHOT_COMPACTED";
  deletedCount: number;
  remainingCount: number;
};

export type DocumentService = {
  create: (args: {
    projectId: string;
    title?: string;
    type?: DocumentType;
  }) => ServiceResult<{
    documentId: string;
  }>;
  list: (args: { projectId: string }) => ServiceResult<{
    items: DocumentListItem[];
  }>;
  read: (args: {
    projectId: string;
    documentId: string;
  }) => ServiceResult<DocumentRead>;
  update: (args: {
    projectId: string;
    documentId: string;
    title?: string;
    type?: DocumentType;
    status?: DocumentStatus;
    sortOrder?: number;
    parentId?: string;
  }) => ServiceResult<{ updated: true }>;
  save: (args: {
    projectId: string;
    documentId: string;
    contentJson: unknown;
    actor: VersionSnapshotActor;
    reason: VersionSnapshotReason;
  }) => ServiceResult<{
    updatedAt: number;
    contentHash: string;
    compaction?: SnapshotCompactionEvent;
  }>;
  delete: (args: {
    projectId: string;
    documentId: string;
  }) => ServiceResult<{ deleted: true }>;
  reorder: (args: {
    projectId: string;
    orderedDocumentIds: string[];
  }) => ServiceResult<{ updated: true }>;
  updateStatus: (args: {
    projectId: string;
    documentId: string;
    status: DocumentStatus;
  }) => ServiceResult<{ updated: true; status: DocumentStatus }>;
  getCurrent: (args: { projectId: string }) => ServiceResult<{
    documentId: string;
  }>;
  setCurrent: (args: {
    projectId: string;
    documentId: string;
  }) => ServiceResult<{ documentId: string }>;
  listVersions: (args: { documentId: string }) => ServiceResult<{
    items: VersionListItem[];
  }>;
  readVersion: (args: {
    documentId: string;
    versionId: string;
  }) => ServiceResult<VersionRead>;
  diffVersions: (args: {
    documentId: string;
    baseVersionId: string;
    targetVersionId?: string;
  }) => ServiceResult<VersionDiffPayload>;
  rollbackVersion: (args: {
    documentId: string;
    versionId: string;
  }) => ServiceResult<{
    restored: true;
    preRollbackVersionId: string;
    rollbackVersionId: string;
  }>;
  restoreVersion: (args: {
    documentId: string;
    versionId: string;
  }) => ServiceResult<{ restored: true }>;
  createBranch: (args: {
    documentId: string;
    name: string;
    createdBy: string;
  }) => ServiceResult<{ branch: BranchListItem }>;
  listBranches: (args: { documentId: string }) => ServiceResult<{
    branches: BranchListItem[];
  }>;
  switchBranch: (args: {
    documentId: string;
    name: string;
  }) => ServiceResult<{ currentBranch: string; headSnapshotId: string }>;
  mergeBranch: (args: {
    documentId: string;
    sourceBranchName: string;
    targetBranchName: string;
    timeoutMs?: number;
  }) => ServiceResult<{ status: "merged"; mergeSnapshotId: string }>;
  resolveMergeConflict: (args: {
    documentId: string;
    mergeSessionId: string;
    resolutions: BranchConflictResolutionInput[];
    resolvedBy: string;
  }) => ServiceResult<{ status: "merged"; mergeSnapshotId: string }>;
};

export type DocumentServiceFactoryArgs = {
  db: Database.Database;
  logger: Logger;
  maxSnapshotsPerDocument?: number;
  autosaveCompactionAgeMs?: number;
  maxDiffPayloadBytes?: number;
};

export type DocumentCrudService = Pick<
  DocumentService,
  | "create"
  | "list"
  | "read"
  | "update"
  | "save"
  | "delete"
  | "reorder"
  | "updateStatus"
  | "getCurrent"
  | "setCurrent"
>;

export type VersionService = Pick<
  DocumentService,
  | "listVersions"
  | "readVersion"
  | "diffVersions"
  | "rollbackVersion"
  | "restoreVersion"
>;

export type BranchService = Pick<
  DocumentService,
  | "createBranch"
  | "listBranches"
  | "switchBranch"
  | "mergeBranch"
  | "resolveMergeConflict"
>;

export type SubServiceFactoryArgs = DocumentServiceFactoryArgs & {
  baseService?: DocumentService;
};
