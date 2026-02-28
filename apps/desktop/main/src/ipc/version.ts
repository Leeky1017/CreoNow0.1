import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { VersionDiffPayload } from "@shared/types/version-diff";
import type { Logger } from "../logging/logger";
import {
  createDocumentService,
  type DocumentService,
  type SnapshotCompactionEvent,
  type VersionSnapshotActor,
  type VersionSnapshotReason,
} from "../services/documents/documentService";

const DEFAULT_IO_RETRY_MAX_ATTEMPTS = 3;
const DEFAULT_IO_TIMEOUT_MS = 5_000;
const DEFAULT_MAX_PARALLEL_DOCUMENT_OPS = 8;
const DEFAULT_MAX_DIFF_PAYLOAD_BYTES = 2 * 1024 * 1024;

class IoTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IoTimeoutError";
  }
}

function isRetriableIoError(code: string): boolean {
  return code === "DB_ERROR" || code === "IO_ERROR";
}

function normalizeRetryMaxAttempts(maxAttempts?: number): number {
  if (typeof maxAttempts !== "number" || !Number.isFinite(maxAttempts)) {
    return DEFAULT_IO_RETRY_MAX_ATTEMPTS;
  }
  return Math.max(1, Math.trunc(maxAttempts));
}

function normalizeTimeoutMs(timeoutMs?: number): number {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs)) {
    return DEFAULT_IO_TIMEOUT_MS;
  }
  return Math.max(1, Math.trunc(timeoutMs));
}

function normalizeParallelOps(maxParallelOps?: number): number {
  if (typeof maxParallelOps !== "number" || !Number.isFinite(maxParallelOps)) {
    return DEFAULT_MAX_PARALLEL_DOCUMENT_OPS;
  }
  return Math.max(1, Math.trunc(maxParallelOps));
}

function sleep(ms?: number): Promise<void> {
  if (!ms || ms <= 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function readNonEmptyStringField(
  payload: unknown,
  key: string,
): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const value = (payload as Record<string, unknown>)[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }
  return value;
}

async function withTimeout<T>(
  run: () => Promise<T>,
  timeoutMs: number,
): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new IoTimeoutError(`operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([run(), timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

class VersionOperationCoordinator {
  private readonly queueByDocument = new Map<string, Promise<void>>();
  private readonly busyDocuments = new Set<string>();
  private readonly globalWaiters: Array<() => void> = [];
  private activeGlobalOps = 0;

  constructor(private readonly maxParallelOps: number) {}

  isBusy(documentId: string): boolean {
    return (
      this.busyDocuments.has(documentId) || this.queueByDocument.has(documentId)
    );
  }

  async withSerializedDocument<T>(
    documentId: string,
    run: () => Promise<T>,
  ): Promise<T> {
    const previous = this.queueByDocument.get(documentId) ?? Promise.resolve();
    let releaseDocumentQueue: () => void = () => {};
    const current = new Promise<void>((resolve) => {
      releaseDocumentQueue = resolve;
    });
    const tail = previous.then(
      () => current,
      () => current,
    );
    this.queueByDocument.set(documentId, tail);

    await previous;
    await this.acquireGlobalSlot();
    this.busyDocuments.add(documentId);
    try {
      return await run();
    } finally {
      this.busyDocuments.delete(documentId);
      this.releaseGlobalSlot();
      releaseDocumentQueue();
      if (this.queueByDocument.get(documentId) === tail) {
        this.queueByDocument.delete(documentId);
      }
    }
  }

  private async acquireGlobalSlot(): Promise<void> {
    if (this.activeGlobalOps < this.maxParallelOps) {
      this.activeGlobalOps += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.globalWaiters.push(resolve);
    });
    this.activeGlobalOps += 1;
  }

  private releaseGlobalSlot(): void {
    this.activeGlobalOps = Math.max(0, this.activeGlobalOps - 1);
    const waiter = this.globalWaiters.shift();
    if (waiter) {
      waiter();
    }
  }
}

/**
 * Register `version:*` IPC handlers (minimal subset for P0).
 *
 * Why: autosave evidence and restores must be observable and testable via IPC.
 */
export function registerVersionIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  mergeTimeoutMs?: number;
  maxSnapshotsPerDocument?: number;
  maxDiffPayloadBytes?: number;
  ioRetryMaxAttempts?: number;
  ioTimeoutMs?: number;
  maxParallelDocumentOps?: number;
  serviceFactory?: typeof createDocumentService;
  simulateLatencyMs?: {
    snapshot?: number;
    rollback?: number;
    merge?: number;
  };
}): void {
  const serviceFactory = deps.serviceFactory ?? createDocumentService;
  const ioRetryMaxAttempts = normalizeRetryMaxAttempts(deps.ioRetryMaxAttempts);
  const ioTimeoutMs = normalizeTimeoutMs(deps.ioTimeoutMs);
  const coordinator = new VersionOperationCoordinator(
    normalizeParallelOps(deps.maxParallelDocumentOps),
  );

  const createService = (): DocumentService =>
    serviceFactory({
      db: deps.db as Database.Database,
      logger: deps.logger,
      maxSnapshotsPerDocument: deps.maxSnapshotsPerDocument,
      maxDiffPayloadBytes:
        deps.maxDiffPayloadBytes ?? DEFAULT_MAX_DIFF_PAYLOAD_BYTES,
    });

  const rollbackConflict = (documentId: string): IpcResponse<never> => ({
    ok: false,
    error: {
      code: "VERSION_ROLLBACK_CONFLICT",
      message: "Concurrent rollback conflict",
      details: { documentId },
    },
  });

  const withIoRetry = async <T>(args: {
    operation: string;
    documentId: string;
    run: () => Promise<IpcResponse<T>>;
  }): Promise<IpcResponse<T>> => {
    let lastError: IpcResponse<T> | null = null;
    for (let attempt = 1; attempt <= ioRetryMaxAttempts; attempt += 1) {
      try {
        const res = await withTimeout(args.run, ioTimeoutMs);
        if (res.ok) {
          return res;
        }
        lastError = res;
        if (
          !isRetriableIoError(res.error.code) ||
          attempt === ioRetryMaxAttempts
        ) {
          return res;
        }
        deps.logger.error("version_io_retry", {
          operation: args.operation,
          document_id: args.documentId,
          attempt,
          code: res.error.code,
        });
      } catch (error) {
        if (
          !(error instanceof IoTimeoutError) ||
          attempt === ioRetryMaxAttempts
        ) {
          return {
            ok: false,
            error: {
              code: "DB_ERROR",
              message:
                error instanceof Error
                  ? error.message
                  : "Version operation failed",
              retryable: true,
              details: {
                operation: args.operation,
                attempt,
                timeoutMs: ioTimeoutMs,
              },
            },
          };
        }
        deps.logger.error("version_io_retry_timeout", {
          operation: args.operation,
          document_id: args.documentId,
          attempt,
          timeout_ms: ioTimeoutMs,
        });
      }
    }
    return (
      lastError ?? {
        ok: false,
        error: {
          code: "DB_ERROR",
          message: "Version operation failed",
        },
      }
    );
  };

  deps.ipcMain.handle(
    "version:snapshot:create",
    async (_e, payload: unknown): Promise<
      IpcResponse<{
        versionId: string;
        contentHash: string;
        wordCount: number;
        createdAt: number;
        compaction?: SnapshotCompactionEvent;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      const projectId = readNonEmptyStringField(payload, "projectId");
      const documentId = readNonEmptyStringField(payload, "documentId");
      if (!projectId || !documentId) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId/documentId is required",
          },
        };
      }

      const contentJson =
        payload && typeof payload === "object"
          ? (payload as { contentJson?: unknown }).contentJson
          : undefined;
      if (typeof contentJson !== "string") {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "contentJson must be valid JSON",
          },
        };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(contentJson);
      } catch {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "contentJson must be valid JSON",
          },
        };
      }

      const actor =
        payload && typeof payload === "object"
          ? (payload as { actor?: VersionSnapshotActor }).actor
          : undefined;
      const reason =
        payload && typeof payload === "object"
          ? (payload as { reason?: VersionSnapshotReason }).reason
          : undefined;

      return coordinator.withSerializedDocument(
        documentId,
        async () => {
          await sleep(deps.simulateLatencyMs?.snapshot);
          return withIoRetry({
            operation: "version:snapshot:create",
            documentId,
            run: async (): Promise<
              IpcResponse<{
                versionId: string;
                contentHash: string;
                wordCount: number;
                createdAt: number;
                compaction?: SnapshotCompactionEvent;
              }>
            > => {
              const svc = createService();
              const saved = svc.save({
                projectId,
                documentId,
                contentJson: parsed,
                actor: actor as VersionSnapshotActor,
                reason: reason as VersionSnapshotReason,
              });
              if (!saved.ok) {
                return { ok: false, error: saved.error };
              }

              const listed = svc.listVersions({
                documentId,
              });
              if (!listed.ok) {
                return { ok: false, error: listed.error };
              }
              const latest = listed.data.items[0];
              if (!latest) {
                return {
                  ok: false,
                  error: {
                    code: "DB_ERROR",
                    message: "Snapshot create succeeded but no snapshot found",
                  },
                };
              }

              return {
                ok: true,
                data: {
                  versionId: latest.versionId,
                  contentHash: latest.contentHash,
                  wordCount: latest.wordCount,
                  createdAt: latest.createdAt,
                  compaction: saved.data.compaction,
                },
              };
            },
          });
        },
      );
    },
  );

  deps.ipcMain.handle(
    "version:snapshot:list",
    async (
      _e,
      payload: { documentId: string },
    ): Promise<
      IpcResponse<{
        items: Array<{
          versionId: string;
          actor: "user" | "auto" | "ai";
          reason: string;
          contentHash: string;
          wordCount: number;
          createdAt: number;
        }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.documentId.trim().length === 0) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId is required",
          },
        };
      }

      const svc = createService();
      const res = svc.listVersions({ documentId: payload.documentId });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "version:snapshot:read",
    async (
      _e,
      payload: { documentId: string; versionId: string },
    ): Promise<
      IpcResponse<{
        documentId: string;
        projectId: string;
        versionId: string;
        actor: "user" | "auto" | "ai";
        reason: string;
        contentJson: string;
        contentText: string;
        contentMd: string;
        contentHash: string;
        wordCount: number;
        createdAt: number;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.versionId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/versionId is required",
          },
        };
      }

      const svc = createService();
      const res = svc.readVersion({
        documentId: payload.documentId,
        versionId: payload.versionId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "version:snapshot:diff",
    async (
      _e,
      payload: {
        documentId: string;
        baseVersionId: string;
        targetVersionId?: string;
      },
    ): Promise<IpcResponse<VersionDiffPayload>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.baseVersionId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/baseVersionId is required",
          },
        };
      }
      if (
        payload.targetVersionId !== undefined &&
        payload.targetVersionId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "targetVersionId must be a non-empty string when provided",
          },
        };
      }

      const svc = createService();
      const res = svc.diffVersions({
        documentId: payload.documentId,
        baseVersionId: payload.baseVersionId,
        targetVersionId: payload.targetVersionId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "version:snapshot:rollback",
    async (
      _e,
      payload: { documentId: string; versionId: string },
    ): Promise<
      IpcResponse<{
        restored: true;
        preRollbackVersionId: string;
        rollbackVersionId: string;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.versionId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/versionId is required",
          },
        };
      }

      if (coordinator.isBusy(payload.documentId)) {
        return rollbackConflict(payload.documentId);
      }

      return coordinator.withSerializedDocument(
        payload.documentId,
        async () => {
          await sleep(deps.simulateLatencyMs?.rollback);
          return withIoRetry({
            operation: "version:snapshot:rollback",
            documentId: payload.documentId,
            run: async () => {
              const svc = createService();
              const res = svc.rollbackVersion({
                documentId: payload.documentId,
                versionId: payload.versionId,
              });
              return res.ok
                ? { ok: true, data: res.data }
                : { ok: false, error: res.error };
            },
          });
        },
      );
    },
  );

  deps.ipcMain.handle(
    "version:snapshot:restore",
    async (
      _e,
      payload: { documentId: string; versionId: string },
    ): Promise<IpcResponse<{ restored: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.versionId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/versionId is required",
          },
        };
      }

      if (coordinator.isBusy(payload.documentId)) {
        return rollbackConflict(payload.documentId);
      }

      return coordinator.withSerializedDocument(
        payload.documentId,
        async () => {
          await sleep(deps.simulateLatencyMs?.rollback);
          return withIoRetry({
            operation: "version:snapshot:restore",
            documentId: payload.documentId,
            run: async () => {
              const svc = createService();
              const res = svc.restoreVersion({
                documentId: payload.documentId,
                versionId: payload.versionId,
              });
              return res.ok
                ? { ok: true, data: res.data }
                : { ok: false, error: res.error };
            },
          });
        },
      );
    },
  );

  deps.ipcMain.handle(
    "version:branch:create",
    async (
      _e,
      payload: { documentId: string; name: string; createdBy: string },
    ): Promise<
      IpcResponse<{
        branch: {
          id: string;
          documentId: string;
          name: string;
          baseSnapshotId: string;
          headSnapshotId: string;
          createdBy: string;
          createdAt: number;
          isCurrent: boolean;
        };
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.name.trim().length === 0 ||
        payload.createdBy.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/name/createdBy is required",
          },
        };
      }

      const svc = createService();
      const res = svc.createBranch({
        documentId: payload.documentId,
        name: payload.name,
        createdBy: payload.createdBy,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "version:branch:list",
    async (
      _e,
      payload: { documentId: string },
    ): Promise<
      IpcResponse<{
        branches: Array<{
          id: string;
          documentId: string;
          name: string;
          baseSnapshotId: string;
          headSnapshotId: string;
          createdBy: string;
          createdAt: number;
          isCurrent: boolean;
        }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.documentId.trim().length === 0) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId is required",
          },
        };
      }

      const svc = createService();
      const res = svc.listBranches({ documentId: payload.documentId });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "version:branch:switch",
    async (
      _e,
      payload: { documentId: string; name: string },
    ): Promise<
      IpcResponse<{
        currentBranch: string;
        headSnapshotId: string;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.name.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/name is required",
          },
        };
      }

      const svc = createService();
      const res = svc.switchBranch({
        documentId: payload.documentId,
        name: payload.name,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "version:branch:merge",
    async (
      _e,
      payload: {
        documentId: string;
        sourceBranchName: string;
        targetBranchName: string;
      },
    ): Promise<IpcResponse<{ status: "merged"; mergeSnapshotId: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.sourceBranchName.trim().length === 0 ||
        payload.targetBranchName.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/sourceBranchName/targetBranchName is required",
          },
        };
      }

      return coordinator.withSerializedDocument(
        payload.documentId,
        async () => {
          await sleep(deps.simulateLatencyMs?.merge);
          return withIoRetry({
            operation: "version:branch:merge",
            documentId: payload.documentId,
            run: async () => {
              const svc = createService();
              const res = svc.mergeBranch({
                documentId: payload.documentId,
                sourceBranchName: payload.sourceBranchName,
                targetBranchName: payload.targetBranchName,
                timeoutMs: deps.mergeTimeoutMs,
              });
              return res.ok
                ? { ok: true, data: res.data }
                : { ok: false, error: res.error };
            },
          });
        },
      );
    },
  );

  deps.ipcMain.handle(
    "version:conflict:resolve",
    async (
      _e,
      payload: {
        documentId: string;
        mergeSessionId: string;
        resolutions: Array<{
          conflictId: string;
          resolution: "ours" | "theirs" | "manual";
          manualText?: string;
        }>;
        resolvedBy: string;
      },
    ): Promise<IpcResponse<{ status: "merged"; mergeSnapshotId: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.documentId.trim().length === 0 ||
        payload.mergeSessionId.trim().length === 0 ||
        payload.resolvedBy.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/mergeSessionId/resolvedBy is required",
          },
        };
      }

      const svc = createService();
      const res = svc.resolveMergeConflict({
        documentId: payload.documentId,
        mergeSessionId: payload.mergeSessionId,
        resolutions: payload.resolutions,
        resolvedBy: payload.resolvedBy,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "version:aiapply:logconflict",
    async (
      _e,
      payload: { documentId: string; runId: string },
    ): Promise<IpcResponse<{ logged: true }>> => {
      if (
        payload.documentId.trim().length === 0 ||
        payload.runId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "documentId/runId is required",
          },
        };
      }

      deps.logger.info("ai_apply_conflict", {
        runId: payload.runId,
        document_id: payload.documentId,
      });
      return { ok: true, data: { logged: true } };
    },
  );
}
