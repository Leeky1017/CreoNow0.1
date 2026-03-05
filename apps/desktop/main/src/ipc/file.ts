import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcError, IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import {
  createDocumentService,
  type DocumentError,
  type DocumentStatus,
  type DocumentType,
} from "../services/documents/documentService";
import { deriveContent } from "../services/documents/derive";
import type { EmbeddingComputeRunner } from "../services/embedding/embeddingComputeOffload";
import {
  createEmbeddingQueue,
  type EmbeddingQueue,
  type EmbeddingQueueTask,
} from "../services/embedding/embeddingQueue";
import type { SemanticChunkIndexService } from "../services/embedding/semanticChunkIndexService";
import type { KgRecognitionRuntime } from "../services/kg/kgRecognitionRuntime";
import {
  runStateExtractionForChapterCompletion,
  type StateExtractor,
} from "../services/kg/stateExtractor";
import { createStatsService } from "../services/stats/statsService";

type Actor = "user" | "auto" | "ai";
type SaveReason = "manual-save" | "autosave" | "ai-accept" | "status-change";

const WORDS_PER_SECOND = 3;

type SemanticAutosaveEmbeddingRuntime = Pick<EmbeddingQueue, "enqueue">;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }
  return "unknown error";
}

function logSemanticUpsertFailed(args: {
  logger: Logger;
  projectId: string;
  documentId: string;
  code: string;
  message: string;
}): void {
  args.logger.error("embedding_index_upsert_failed", {
    code: args.code,
    message: args.message,
    project_id: args.projectId,
    document_id: args.documentId,
  });
}

/**
 * Create autosave runtime for semantic embedding upsert.
 *
 * Why: BE-EMR-S1/S2 requires autosave enqueue + compute offload instead of
 * synchronous upsert on file IPC save path.
 */
export function createSemanticAutosaveEmbeddingRuntime(args: {
  logger: Logger;
  semanticIndex?: SemanticChunkIndexService;
  computeRunner?: EmbeddingComputeRunner | null;
  embeddingQueue?: Pick<EmbeddingQueue, "enqueue">;
  debounceMs?: number;
}): SemanticAutosaveEmbeddingRuntime | null {
  const embeddingQueue = args.embeddingQueue;
  if (embeddingQueue) {
    return {
      enqueue: (task) => {
        embeddingQueue.enqueue(task);
      },
    };
  }

  const semanticIndex = args.semanticIndex;
  const computeRunner = args.computeRunner;
  if (!semanticIndex || !computeRunner) {
    return null;
  }

  const queue = createEmbeddingQueue({
    debounceMs: args.debounceMs,
    run: async (task) => {
      const runResult = await computeRunner.run({
        execute: async (signal) => {
          if (signal.aborted) {
            return;
          }
          const upserted = semanticIndex.upsertDocument({
            projectId: task.projectId,
            documentId: task.documentId,
            contentText: task.contentText,
            updatedAt: task.updatedAt,
          });
          if (upserted && !upserted.ok) {
            logSemanticUpsertFailed({
              logger: args.logger,
              projectId: task.projectId,
              documentId: task.documentId,
              code: upserted.error.code,
              message: upserted.error.message,
            });
          }
        },
      });

      if (runResult.status !== "completed") {
        args.logger.error("embedding_index_upsert_runner_failed", {
          status: runResult.status,
          message: toErrorMessage(runResult.error),
          project_id: task.projectId,
          document_id: task.documentId,
        });
      }
    },
    onError: (error, task) => {
      args.logger.error("embedding_index_upsert_queue_failed", {
        message: toErrorMessage(error),
        project_id: task.projectId,
        document_id: task.documentId,
      });
    },
  });

  return {
    enqueue: (task: EmbeddingQueueTask): void => {
      queue.enqueue(task);
    },
  };
}

export function mapDocumentErrorToIpcError(error: DocumentError): IpcError {
  return {
    code: error.code,
    message: error.message,
    traceId: error.traceId,
    details: error.details,
    retryable: error.retryable,
  };
}

function isSaveReasonValidForActor(actor: Actor, reason: SaveReason): boolean {
  if (actor === "auto") {
    return reason === "autosave";
  }
  if (actor === "ai") {
    return reason === "ai-accept";
  }
  return reason === "manual-save" || reason === "status-change";
}

function countWords(text: string): number {
  const tokens = text
    .trim()
    .split(/\s+/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return tokens.length;
}

function estimateWritingSeconds(wordsAdded: number): number {
  const words = Math.max(0, Math.floor(wordsAdded));
  return words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_SECOND));
}

type FileHandlerDeps = {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  recognitionRuntime?: KgRecognitionRuntime | null;
  stateExtractor?: StateExtractor | null;
  semanticIndex?: SemanticChunkIndexService;
  computeRunner?: EmbeddingComputeRunner | null;
};

function registerFileDocumentCrudHandlers(deps: FileHandlerDeps): void {
  deps.ipcMain.handle(
    "file:document:create",
    async (
      _e,
      payload: { projectId: string; title?: string; type?: DocumentType },
    ): Promise<IpcResponse<{ documentId: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.projectId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.create({
        projectId: payload.projectId,
        title: payload.title,
        type: payload.type,
      });

      if (res.ok) {
        const stats = createStatsService({ db: deps.db, logger: deps.logger });
        const inc = stats.increment({
          ts: Date.now(),
          delta: { documentsCreated: 1 },
        });
        if (!inc.ok) {
          deps.logger.error("stats_increment_documents_created_failed", {
            code: inc.error.code,
            message: inc.error.message,
          });
        }
      }

      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );

  deps.ipcMain.handle(
    "file:document:list",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<
      IpcResponse<{
        items: Array<{
          documentId: string;
          type: DocumentType;
          title: string;
          status: DocumentStatus;
          sortOrder: number;
          parentId?: string;
          updatedAt: number;
        }>;
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.projectId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.list({ projectId: payload.projectId });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );

  deps.ipcMain.handle(
    "file:document:read",
    async (
      _e,
      payload: { projectId: string; documentId: string },
    ): Promise<
      IpcResponse<{
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
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.projectId.trim().length === 0 ||
        payload.documentId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId/documentId is required",
          },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.read({
        projectId: payload.projectId,
        documentId: payload.documentId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );

  deps.ipcMain.handle(
    "file:document:update",
    async (
      _e,
      payload: {
        projectId: string;
        documentId: string;
        title?: string;
        type?: DocumentType;
        status?: DocumentStatus;
        sortOrder?: number;
        parentId?: string;
      },
    ): Promise<IpcResponse<{ updated: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.projectId.trim().length === 0 ||
        payload.documentId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId/documentId is required",
          },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.update({
        projectId: payload.projectId,
        documentId: payload.documentId,
        title: payload.title,
        type: payload.type,
        status: payload.status,
        sortOrder: payload.sortOrder,
        parentId: payload.parentId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );
}

function registerFileDocumentContentHandlers(
  deps: FileHandlerDeps,
  semanticAutosaveEmbeddingRuntime: SemanticAutosaveEmbeddingRuntime | null,
): void {
  deps.ipcMain.handle(
    "file:document:save",
    async (
      _e,
      payload: {
        projectId: string;
        documentId: string;
        contentJson: string;
        actor: Actor;
        reason: SaveReason;
      },
    ): Promise<IpcResponse<{ updatedAt: number; contentHash: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.projectId.trim().length === 0 ||
        payload.documentId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId/documentId is required",
          },
        };
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(payload.contentJson);
      } catch {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "contentJson must be valid JSON",
          },
        };
      }

      if (!isSaveReasonValidForActor(payload.actor, payload.reason)) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "actor/reason mismatch",
          },
        };
      }

      type ContentTextRow = { contentText: string };
      const beforeRow = deps.db
        .prepare<
          [string, string],
          ContentTextRow
        >("SELECT content_text as contentText FROM documents WHERE project_id = ? AND document_id = ?")
        .get(payload.projectId, payload.documentId);
      const beforeWords = beforeRow ? countWords(beforeRow.contentText) : 0;

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.save({
        projectId: payload.projectId,
        documentId: payload.documentId,
        contentJson: parsed,
        actor: payload.actor,
        reason: payload.reason,
      });

      if (res.ok) {
        const derived = deriveContent({ contentJson: parsed });
        if (derived.ok) {
          const normalizedContentText = derived.data.contentText.trim();
          const afterWords = countWords(derived.data.contentText);
          const deltaWords = Math.max(0, afterWords - beforeWords);
          if (deltaWords > 0) {
            const stats = createStatsService({
              db: deps.db,
              logger: deps.logger,
            });
            const inc = stats.increment({
              ts: res.data.updatedAt,
              delta: {
                wordsWritten: deltaWords,
                writingSeconds: estimateWritingSeconds(deltaWords),
              },
            });
            if (!inc.ok) {
              deps.logger.error("stats_increment_words_failed", {
                code: inc.error.code,
                message: inc.error.message,
              });
            }
          }

          if (
            deps.recognitionRuntime &&
            payload.actor === "auto" &&
            payload.reason === "autosave" &&
            normalizedContentText.length > 0
          ) {
            queueMicrotask(() => {
              const enqueueRes = deps.recognitionRuntime?.enqueue({
                projectId: payload.projectId,
                documentId: payload.documentId,
                sessionId: `autosave:${payload.documentId}`,
                contentText: normalizedContentText,
                traceId: `kg-autosave-${payload.documentId}-${res.data.updatedAt}`,
                sender: null,
              });
              if (enqueueRes && !enqueueRes.ok) {
                deps.logger.error("kg_recognition_enqueue_failed", {
                  code: enqueueRes.error.code,
                  message: enqueueRes.error.message,
                  project_id: payload.projectId,
                  document_id: payload.documentId,
                });
              }
            });
          }

          if (
            semanticAutosaveEmbeddingRuntime &&
            payload.actor === "auto" &&
            payload.reason === "autosave" &&
            normalizedContentText.length > 0
          ) {
            queueMicrotask(() => {
              semanticAutosaveEmbeddingRuntime.enqueue({
                projectId: payload.projectId,
                documentId: payload.documentId,
                contentText: normalizedContentText,
                updatedAt: res.data.updatedAt,
              });
            });
          }
        } else {
          deps.logger.error("stats_derive_failed", {
            code: derived.error.code,
            message: derived.error.message,
          });
        }
      }

      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );
}

function registerFileDocumentOperationHandlers(deps: FileHandlerDeps): void {
  deps.ipcMain.handle(
    "file:document:getcurrent",
    async (
      _e,
      payload: { projectId: string },
    ): Promise<IpcResponse<{ documentId: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.projectId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.getCurrent({ projectId: payload.projectId });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );

  deps.ipcMain.handle(
    "file:document:setcurrent",
    async (
      _e,
      payload: { projectId: string; documentId: string },
    ): Promise<IpcResponse<{ documentId: string }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.projectId.trim().length === 0 ||
        payload.documentId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId/documentId is required",
          },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.setCurrent({
        projectId: payload.projectId,
        documentId: payload.documentId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );

  deps.ipcMain.handle(
    "file:document:reorder",
    async (
      _e,
      payload: { projectId: string; orderedDocumentIds: string[] },
    ): Promise<IpcResponse<{ updated: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (payload.projectId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.reorder({
        projectId: payload.projectId,
        orderedDocumentIds: payload.orderedDocumentIds,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );

  deps.ipcMain.handle(
    "file:document:updatestatus",
    async (
      _e,
      payload: {
        projectId: string;
        documentId: string;
        status: DocumentStatus;
      },
    ): Promise<IpcResponse<{ updated: true; status: DocumentStatus }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.projectId.trim().length === 0 ||
        payload.documentId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId/documentId is required",
          },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.updateStatus({
        projectId: payload.projectId,
        documentId: payload.documentId,
        status: payload.status,
      });

      if (res.ok && deps.db && deps.stateExtractor) {
        queueMicrotask(() => {
          void runStateExtractionForChapterCompletion({
            db: deps.db as Database.Database,
            logger: deps.logger,
            stateExtractor: deps.stateExtractor ?? null,
            projectId: payload.projectId,
            documentId: payload.documentId,
            status: res.data.status,
            traceId: `kg-state-extract-${payload.documentId}-${Date.now()}`,
          });
        });
      }

      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );

  deps.ipcMain.handle(
    "file:document:delete",
    async (
      _e,
      payload: { projectId: string; documentId: string },
    ): Promise<IpcResponse<{ deleted: true }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      if (
        payload.projectId.trim().length === 0 ||
        payload.documentId.trim().length === 0
      ) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "projectId/documentId is required",
          },
        };
      }

      const svc = createDocumentService({ db: deps.db, logger: deps.logger });
      const res = svc.delete({
        projectId: payload.projectId,
        documentId: payload.documentId,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: mapDocumentErrorToIpcError(res.error) };
    },
  );
}

/**
 * Register `file:document:*` IPC handlers.
 *
 * Why: documents are DB SSOT in V1; renderer must persist TipTap JSON and read it
 * back across restarts without leaking DB details across IPC.
 */
export function registerFileIpcHandlers(deps: FileHandlerDeps): void {
  const semanticAutosaveEmbeddingRuntime =
    createSemanticAutosaveEmbeddingRuntime({
      logger: deps.logger,
      semanticIndex: deps.semanticIndex,
      computeRunner: deps.computeRunner,
    });

  registerFileDocumentCrudHandlers(deps);
  registerFileDocumentContentHandlers(deps, semanticAutosaveEmbeddingRuntime);
  registerFileDocumentOperationHandlers(deps);
}
