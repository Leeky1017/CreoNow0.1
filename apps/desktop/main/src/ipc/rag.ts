import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import { resolveRuntimeGovernanceFromEnv } from "../config/runtimeGovernance";
import type { EmbeddingService } from "../services/embedding/embeddingService";
import {
  createSemanticChunkIndexService,
  type SemanticChunkIndexService,
} from "../services/embedding/semanticChunkIndexService";
import {
  rankHybridRagCandidates,
  truncateHybridRagCandidates,
} from "../services/rag/hybridRagRanking";
import type { RagComputeRunner } from "../services/rag/ragComputeOffload";
import { createFtsService } from "../services/search/ftsService";

type DocumentIndexRow = {
  documentId: string;
  contentText: string;
  updatedAt: number;
};

type RagChunk = {
  chunkId: string;
  documentId: string;
  text: string;
  score: number;
  tokenEstimate: number;
};

type RagConfig = {
  topK: number;
  minScore: number;
  maxTokens: number;
  model?: string;
};

type RagRetrievePayload = {
  projectId: string;
  queryText: string;
  topK?: number;
  minScore?: number;
  maxTokens?: number;
  model?: string;
};

const DEFAULT_RAG_CONFIG: RagConfig = {
  topK: 5,
  minScore: 0.7,
  maxTokens: 1500,
};

function listProjectDocuments(args: {
  db: Database.Database;
  projectId: string;
}): DocumentIndexRow[] {
  return args.db
    .prepare<
      [string],
      DocumentIndexRow
    >("SELECT document_id as documentId, content_text as contentText, updated_at as updatedAt FROM documents WHERE project_id = ? ORDER BY updated_at DESC, document_id ASC")
    .all(args.projectId);
}

function estimateTokens(text: string): number {
  const bytes = Buffer.from(text, "utf8").byteLength;
  return Math.ceil(bytes / 4);
}

function normalizeTopK(value: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return DEFAULT_RAG_CONFIG.topK;
  }
  return Math.floor(value);
}

function normalizeMinScore(value: number): number {
  if (!Number.isFinite(value) || value < -1 || value > 1) {
    return DEFAULT_RAG_CONFIG.minScore;
  }
  return value;
}

function normalizeMaxTokens(value: number, fallback: number): number {
  if (!Number.isFinite(value) || !Number.isInteger(value) || value <= 0) {
    return fallback;
  }
  return Math.floor(value);
}

function validateRagRetrievePayload(
  payload: RagRetrievePayload,
): IpcResponse<never> | null {
  if (payload.projectId.trim().length === 0) {
    return {
      ok: false,
      error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
    };
  }
  if (payload.queryText.trim().length === 0) {
    return {
      ok: false,
      error: { code: "INVALID_ARGUMENT", message: "queryText is required" },
    };
  }
  return null;
}

function prepareSemanticDocuments(args: {
  db: Database.Database;
  projectId: string;
  model?: string;
  semanticIndex: SemanticChunkIndexService;
}): IpcResponse<never> | null {
  const docs = listProjectDocuments({
    db: args.db,
    projectId: args.projectId,
  });

  for (const doc of docs) {
    const upserted = args.semanticIndex.upsertDocument({
      projectId: args.projectId,
      documentId: doc.documentId,
      contentText: doc.contentText,
      updatedAt: doc.updatedAt,
      model: args.model,
    });
    if (
      !upserted.ok &&
      upserted.error.code !== "MODEL_NOT_READY" &&
      upserted.error.code !== "EMBEDDING_PROVIDER_UNAVAILABLE"
    ) {
      return { ok: false, error: upserted.error };
    }
  }

  return null;
}

function toRagComputeRunnerError(
  status: "error" | "timeout" | "aborted" | "crashed",
  error: Error,
): IpcResponse<never> {
  const code =
    status === "timeout"
      ? "SEARCH_TIMEOUT"
      : status === "aborted"
        ? "CANCELED"
        : "INTERNAL_ERROR";

  return {
    ok: false,
    error: {
      code,
      message: "RAG retrieve compute runner failed",
      details: {
        status,
        error: error.message,
      },
    },
  };
}

function toRagCanceledError(): IpcResponse<never> {
  return {
    ok: false,
    error: {
      code: "CANCELED",
      message: "RAG retrieve canceled",
    },
  };
}

/**
 * Register `rag:*` IPC handlers.
 *
 * Why: SR2 requires deterministic semantic retrieve, empty-result tolerance, and
 * explicit token-budget truncation without blocking AI main flow.
 */
export function registerRagIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  embedding: EmbeddingService;
  ragRerank: { enabled: boolean; model?: string };
  semanticIndex?: SemanticChunkIndexService;
  computeRunner?: RagComputeRunner | null;
  defaultModel?: string;
}): void {
  const runtimeGovernance = resolveRuntimeGovernanceFromEnv(process.env);
  const semanticIndex =
    deps.semanticIndex ??
    createSemanticChunkIndexService({
      logger: deps.logger,
      embedding: deps.embedding,
      defaultModel: deps.defaultModel ?? "default",
    });

  const ragConfig: RagConfig = {
    ...DEFAULT_RAG_CONFIG,
    maxTokens: runtimeGovernance.rag.maxTokens,
  };

  deps.ipcMain.handle(
    "rag:config:get",
    async (): Promise<IpcResponse<RagConfig>> => {
      return {
        ok: true,
        data: { ...ragConfig },
      };
    },
  );

  deps.ipcMain.handle(
    "rag:config:update",
    async (
      _e,
      payload: Partial<RagConfig>,
    ): Promise<IpcResponse<RagConfig>> => {
      ragConfig.topK = normalizeTopK(payload.topK ?? ragConfig.topK);
      ragConfig.minScore = normalizeMinScore(
        payload.minScore ?? ragConfig.minScore,
      );
      ragConfig.maxTokens = normalizeMaxTokens(
        payload.maxTokens ?? ragConfig.maxTokens,
        ragConfig.maxTokens,
      );
      ragConfig.model = payload.model?.trim() || ragConfig.model;

      return {
        ok: true,
        data: { ...ragConfig },
      };
    },
  );

  deps.ipcMain.handle(
    "rag:context:retrieve",
    async (
      _e,
      payload: RagRetrievePayload,
      signal?: AbortSignal,
    ): Promise<
      IpcResponse<{
        chunks: RagChunk[];
        truncated: boolean;
        usedTokens: number;
        fallback?: {
          from: "semantic";
          to: "fts";
          reason: string;
        };
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const db = deps.db;
      const payloadError = validateRagRetrievePayload(payload);
      if (payloadError) {
        return payloadError;
      }

      const topK = normalizeTopK(payload.topK ?? ragConfig.topK);
      const minScore = normalizeMinScore(
        payload.minScore ?? ragConfig.minScore,
      );
      const maxTokens = normalizeMaxTokens(
        payload.maxTokens ?? ragConfig.maxTokens,
        ragConfig.maxTokens,
      );
      const model = payload.model ?? ragConfig.model;

      const retrieveWithCurrentConfig = async (
        runtimeSignal?: AbortSignal,
      ): Promise<
        IpcResponse<{
          chunks: RagChunk[];
          truncated: boolean;
          usedTokens: number;
          fallback?: {
            from: "semantic";
            to: "fts";
            reason: string;
          };
        }>
      > => {
        if (runtimeSignal?.aborted) {
          return toRagCanceledError();
        }

        const semanticPrepareError = prepareSemanticDocuments({
          db,
          projectId: payload.projectId,
          model,
          semanticIndex,
        });
        if (semanticPrepareError) {
          return semanticPrepareError;
        }
        if (runtimeSignal?.aborted) {
          return toRagCanceledError();
        }

        const semantic = semanticIndex.search({
          projectId: payload.projectId,
          queryText: payload.queryText,
          topK,
          minScore,
          model,
        });
        if (runtimeSignal?.aborted) {
          return toRagCanceledError();
        }

        let candidates: RagChunk[] = [];
        let fallback:
          | {
              from: "semantic";
              to: "fts";
              reason: string;
            }
          | undefined;

        if (!semantic.ok) {
          if (
            semantic.error.code !== "MODEL_NOT_READY" &&
            semantic.error.code !== "EMBEDDING_PROVIDER_UNAVAILABLE"
          ) {
            return { ok: false, error: semantic.error };
          }

          const fts = createFtsService({ db, logger: deps.logger });
          const ftsRes = fts.searchFulltext({
            projectId: payload.projectId,
            query: payload.queryText,
            limit: topK,
          });
          if (!ftsRes.ok) {
            return { ok: false, error: ftsRes.error };
          }

          const crossProjectItem = ftsRes.data.items.find(
            (item) => item.projectId !== payload.projectId,
          );
          if (crossProjectItem) {
            deps.logger.error("rag_project_forbidden_audit", {
              operation: "rag:context:retrieve",
              requestedProjectId: payload.projectId,
              rowProjectId: crossProjectItem.projectId,
              documentId: crossProjectItem.documentId,
            });
            return {
              ok: false,
              error: {
                code: "SEARCH_PROJECT_FORBIDDEN",
                message: "Cross-project rag retrieval is forbidden",
                details: {
                  requestedProjectId: payload.projectId,
                  rowProjectId: crossProjectItem.projectId,
                },
              },
            };
          }

          fallback = {
            from: "semantic",
            to: "fts",
            reason: semantic.error.code,
          };
          candidates = ftsRes.data.items.map((item) => ({
            chunkId: `fts:${item.documentId}:0`,
            documentId: item.documentId,
            text: item.snippet,
            score: item.score,
            tokenEstimate: estimateTokens(item.snippet),
          }));
        } else {
          const crossProjectChunk = semantic.data.chunks.find(
            (chunk) => chunk.projectId !== payload.projectId,
          );
          if (crossProjectChunk) {
            deps.logger.error("rag_project_forbidden_audit", {
              operation: "rag:context:retrieve",
              requestedProjectId: payload.projectId,
              rowProjectId: crossProjectChunk.projectId,
              documentId: crossProjectChunk.documentId,
            });
            return {
              ok: false,
              error: {
                code: "SEARCH_PROJECT_FORBIDDEN",
                message: "Cross-project rag retrieval is forbidden",
                details: {
                  requestedProjectId: payload.projectId,
                  rowProjectId: crossProjectChunk.projectId,
                },
              },
            };
          }

          const fts = createFtsService({ db, logger: deps.logger });
          const ftsRes = fts.searchFulltext({
            projectId: payload.projectId,
            query: payload.queryText,
            limit: topK,
          });
          if (!ftsRes.ok) {
            return { ok: false, error: ftsRes.error };
          }

          const crossProjectItem = ftsRes.data.items.find(
            (item) => item.projectId !== payload.projectId,
          );
          if (crossProjectItem) {
            deps.logger.error("rag_project_forbidden_audit", {
              operation: "rag:context:retrieve",
              requestedProjectId: payload.projectId,
              rowProjectId: crossProjectItem.projectId,
              documentId: crossProjectItem.documentId,
            });
            return {
              ok: false,
              error: {
                code: "SEARCH_PROJECT_FORBIDDEN",
                message: "Cross-project rag retrieval is forbidden",
                details: {
                  requestedProjectId: payload.projectId,
                  rowProjectId: crossProjectItem.projectId,
                },
              },
            };
          }

          const ranked = rankHybridRagCandidates({
            ftsCandidates: ftsRes.data.items.map((item) => ({
              documentId: item.documentId,
              chunkId: `fts:${item.documentId}:0`,
              text: item.snippet,
              score: item.score,
              updatedAt: item.updatedAt,
            })),
            semanticCandidates: semantic.data.chunks.map((chunk) => ({
              documentId: chunk.documentId,
              chunkId: chunk.chunkId,
              text: chunk.text,
              score: chunk.score,
              updatedAt: chunk.updatedAt,
            })),
            minFinalScore: 0.25,
          });

          const truncatedHybrid = truncateHybridRagCandidates({
            ranked,
            topK,
            maxTokens,
            estimateTokens,
          });

          deps.logger.info("rag_retrieve_complete", {
            projectId: payload.projectId,
            queryLength: payload.queryText.trim().length,
            topK,
            minScore,
            maxTokens,
            fallbackReason: fallback?.reason,
            returnedChunks: truncatedHybrid.chunks.length,
            truncated: truncatedHybrid.truncated,
            strategy: "hybrid",
          });

          return {
            ok: true,
            data: {
              chunks: truncatedHybrid.chunks,
              truncated: truncatedHybrid.truncated,
              usedTokens: truncatedHybrid.usedTokens,
            },
          };
        }

        let usedTokens = 0;
        let truncated = false;
        const accepted: RagChunk[] = [];

        for (const chunk of candidates) {
          if (runtimeSignal?.aborted) {
            return toRagCanceledError();
          }

          if (accepted.length >= topK) {
            break;
          }

          if (usedTokens + chunk.tokenEstimate > maxTokens) {
            truncated = true;
            break;
          }

          accepted.push(chunk);
          usedTokens += chunk.tokenEstimate;
        }

        if (!truncated && accepted.length < candidates.length) {
          truncated = true;
        }

        deps.logger.info("rag_retrieve_complete", {
          projectId: payload.projectId,
          queryLength: payload.queryText.trim().length,
          topK,
          minScore,
          maxTokens,
          fallbackReason: fallback?.reason,
          returnedChunks: accepted.length,
          truncated,
        });

        return {
          ok: true,
          data: {
            chunks: accepted,
            truncated,
            usedTokens,
            ...(fallback ? { fallback } : {}),
          },
        };
      };

      if (!deps.computeRunner) {
        return await retrieveWithCurrentConfig(signal);
      }

      const runResult = await deps.computeRunner.run({
        signal,
        execute: async (runtimeSignal) =>
          await retrieveWithCurrentConfig(runtimeSignal),
      });
      if (runResult.status !== "completed") {
        return toRagComputeRunnerError(runResult.status, runResult.error);
      }
      return runResult.value;
    },
  );
}
