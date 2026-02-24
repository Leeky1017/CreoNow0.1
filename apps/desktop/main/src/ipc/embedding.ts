import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import {
  createEmbeddingComputeOffload,
  type EmbeddingComputeRunner,
} from "../services/embedding/embeddingComputeOffload";
import type { EmbeddingService } from "../services/embedding/embeddingService";
import {
  createSemanticChunkIndexService,
  type SemanticChunkIndexService,
} from "../services/embedding/semanticChunkIndexService";
import { createFtsService } from "../services/search/ftsService";

type DocumentIndexRow = {
  documentId: string;
  contentText: string;
  updatedAt: number;
};

const DEFAULT_TOP_K = 20;
const DEFAULT_MIN_SCORE = 0.55;

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

function normalizeTopK(topK?: number): number {
  if (typeof topK !== "number" || !Number.isFinite(topK) || topK <= 0) {
    return DEFAULT_TOP_K;
  }
  return Math.floor(topK);
}

function normalizeMinScore(minScore?: number): number {
  if (
    typeof minScore !== "number" ||
    !Number.isFinite(minScore) ||
    minScore < -1 ||
    minScore > 1
  ) {
    return DEFAULT_MIN_SCORE;
  }
  return minScore;
}

function hasCorruptedOffsets(chunk: {
  startOffset: number;
  endOffset: number;
}) {
  return chunk.startOffset < 0 || chunk.endOffset < chunk.startOffset;
}

/**
 * Register `embedding:*` IPC handlers.
 *
 * Why: SR2 requires deterministic semantic retrieval contracts with explicit
 * fallback behavior when embedding model is unavailable.
 */
export function registerEmbeddingIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  embedding: EmbeddingService;
  semanticIndex?: SemanticChunkIndexService;
  computeRunner?: EmbeddingComputeRunner | null;
  defaultModel?: string;
}): void {
  const semanticIndex =
    deps.semanticIndex ??
    createSemanticChunkIndexService({
      logger: deps.logger,
      embedding: deps.embedding,
      defaultModel: deps.defaultModel ?? "default",
    });
  const embeddingTextOffload = deps.computeRunner
    ? createEmbeddingComputeOffload({
        computeRunner: deps.computeRunner,
        encodeOnCompute: ({ texts, model }) =>
          deps.embedding.encode({
            texts,
            model,
          }),
      })
    : null;

  deps.ipcMain.handle(
    "embedding:text:generate",
    async (
      _e,
      payload: { texts: string[]; model?: string },
      signal?: AbortSignal,
    ): Promise<IpcResponse<{ vectors: number[][]; dimension: number }>> => {
      if (!deps.db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      if (embeddingTextOffload) {
        return await embeddingTextOffload.encode({
          texts: payload.texts,
          model: payload.model,
          signal,
        });
      }

      const encoded = deps.embedding.encode({
        texts: payload.texts,
        model: payload.model,
      });
      return encoded.ok
        ? { ok: true, data: encoded.data }
        : { ok: false, error: encoded.error };
    },
  );

  deps.ipcMain.handle(
    "embedding:semantic:search",
    async (
      _e,
      payload: {
        projectId: string;
        queryText: string;
        topK?: number;
        minScore?: number;
        model?: string;
      },
    ): Promise<
      IpcResponse<{
        mode: "semantic" | "fts-fallback";
        notice?: string;
        fallback?: {
          from: "semantic";
          to: "fts";
          reason: string;
        };
        isolation?: {
          code: "SEARCH_DATA_CORRUPTED";
          isolatedChunkIds: string[];
        };
        results: Array<{
          chunkId: string;
          documentId: string;
          text: string;
          score: number;
          startOffset: number;
          endOffset: number;
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
      if (payload.queryText.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "queryText is required" },
        };
      }

      const topK = normalizeTopK(payload.topK);
      const minScore = normalizeMinScore(payload.minScore);

      const docs = listProjectDocuments({
        db: deps.db,
        projectId: payload.projectId,
      });
      for (const doc of docs) {
        const upserted = semanticIndex.upsertDocument({
          projectId: payload.projectId,
          documentId: doc.documentId,
          contentText: doc.contentText,
          updatedAt: doc.updatedAt,
          model: payload.model,
        });
        if (
          !upserted.ok &&
          upserted.error.code !== "MODEL_NOT_READY" &&
          upserted.error.code !== "EMBEDDING_PROVIDER_UNAVAILABLE"
        ) {
          return { ok: false, error: upserted.error };
        }
      }

      const semantic = semanticIndex.search({
        projectId: payload.projectId,
        queryText: payload.queryText,
        topK,
        minScore,
        model: payload.model,
      });

      if (!semantic.ok) {
        if (
          semantic.error.code !== "MODEL_NOT_READY" &&
          semantic.error.code !== "EMBEDDING_PROVIDER_UNAVAILABLE"
        ) {
          return { ok: false, error: semantic.error };
        }

        const fts = createFtsService({ db: deps.db, logger: deps.logger });
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
          deps.logger.error("embedding_project_forbidden_audit", {
            operation: "embedding:semantic:search",
            requestedProjectId: payload.projectId,
            rowProjectId: crossProjectItem.projectId,
            documentId: crossProjectItem.documentId,
          });
          return {
            ok: false,
            error: {
              code: "SEARCH_PROJECT_FORBIDDEN",
              message: "Cross-project semantic retrieval is forbidden",
              details: {
                requestedProjectId: payload.projectId,
                rowProjectId: crossProjectItem.projectId,
              },
            },
          };
        }

        deps.logger.info("embedding_search_fallback_fts", {
          projectId: payload.projectId,
          reason: semantic.error.code,
          queryLength: payload.queryText.trim().length,
          resultCount: ftsRes.data.items.length,
        });

        return {
          ok: true,
          data: {
            mode: "fts-fallback",
            notice: "语义搜索暂时不可用，已切换为关键词搜索",
            fallback: {
              from: "semantic",
              to: "fts",
              reason: semantic.error.code,
            },
            results: ftsRes.data.items.map((item) => ({
              chunkId: `fts:${item.documentId}:0`,
              documentId: item.documentId,
              text: item.snippet,
              score: item.score,
              startOffset: 0,
              endOffset: item.snippet.length,
            })),
          },
        };
      }

      const crossProjectChunk = semantic.data.chunks.find(
        (chunk) => chunk.projectId !== payload.projectId,
      );
      if (crossProjectChunk) {
        deps.logger.error("embedding_project_forbidden_audit", {
          operation: "embedding:semantic:search",
          requestedProjectId: payload.projectId,
          rowProjectId: crossProjectChunk.projectId,
          documentId: crossProjectChunk.documentId,
        });
        return {
          ok: false,
          error: {
            code: "SEARCH_PROJECT_FORBIDDEN",
            message: "Cross-project semantic retrieval is forbidden",
            details: {
              requestedProjectId: payload.projectId,
              rowProjectId: crossProjectChunk.projectId,
            },
          },
        };
      }

      const isolatedChunkIds: string[] = [];
      const validChunks = semantic.data.chunks.filter((chunk) => {
        if (hasCorruptedOffsets(chunk)) {
          isolatedChunkIds.push(chunk.chunkId);
          return false;
        }
        return true;
      });

      if (isolatedChunkIds.length > 0) {
        deps.logger.error("embedding_data_corrupted_isolated", {
          projectId: payload.projectId,
          isolatedChunkIds,
        });
      }

      deps.logger.info("embedding_search_semantic", {
        projectId: payload.projectId,
        queryLength: payload.queryText.trim().length,
        resultCount: validChunks.length,
      });

      return {
        ok: true,
        data: {
          mode: "semantic",
          ...(isolatedChunkIds.length > 0
            ? {
                isolation: {
                  code: "SEARCH_DATA_CORRUPTED" as const,
                  isolatedChunkIds,
                },
              }
            : {}),
          results: validChunks.map((chunk) => ({
            chunkId: chunk.chunkId,
            documentId: chunk.documentId,
            text: chunk.text,
            score: chunk.score,
            startOffset: chunk.startOffset,
            endOffset: chunk.endOffset,
          })),
        },
      };
    },
  );

  deps.ipcMain.handle(
    "embedding:index:reindex",
    async (
      _e,
      payload: { projectId: string; batchSize?: number; model?: string },
    ): Promise<
      IpcResponse<{
        indexedDocuments: number;
        indexedChunks: number;
        changedChunks: number;
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

      const docs = listProjectDocuments({
        db: deps.db,
        projectId: payload.projectId,
      });
      const reindexed = semanticIndex.reindexProject({
        projectId: payload.projectId,
        documents: docs,
        model: payload.model,
      });
      if (!reindexed.ok) {
        return { ok: false, error: reindexed.error };
      }

      deps.logger.info("embedding_reindex", {
        projectId: payload.projectId,
        indexedDocuments: reindexed.data.indexedDocuments,
        indexedChunks: reindexed.data.indexedChunks,
      });

      return {
        ok: true,
        data: reindexed.data,
      };
    },
  );
}
