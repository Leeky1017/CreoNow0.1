import { createHash } from "node:crypto";

import type { Logger } from "../../logging/logger";
import type { EmbeddingService } from "./embeddingService";
import {
  createSemanticChunkIndexCache,
  type SemanticChunkIndexCache,
} from "./semanticChunkIndexCache";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type SemanticChunk = {
  chunkId: string;
  documentId: string;
  projectId: string;
  text: string;
  embedding: number[];
  startOffset: number;
  endOffset: number;
  updatedAt: number;
};

export type ScoredSemanticChunk = Omit<SemanticChunk, "embedding"> & {
  score: number;
};

type ParagraphSegment = {
  index: number;
  text: string;
  startOffset: number;
  endOffset: number;
};

const DEFAULT_CHUNK_HASH_CACHE_MAX_SIZE = 20_000;
const DEFAULT_CHUNK_HASH_CACHE_TTL_MS = 15 * 60 * 1000;

export type SemanticChunkIndexService = {
  upsertDocument: (args: {
    projectId: string;
    documentId: string;
    contentText: string;
    updatedAt: number;
    model?: string;
  }) => ServiceResult<{
    changedChunkIds: string[];
    unchangedChunkIds: string[];
    removedChunkIds: string[];
    totalChunks: number;
  }>;
  reindexProject: (args: {
    projectId: string;
    documents: Array<{
      documentId: string;
      contentText: string;
      updatedAt: number;
    }>;
    model?: string;
  }) => ServiceResult<{
    indexedDocuments: number;
    indexedChunks: number;
    changedChunks: number;
  }>;
  search: (args: {
    projectId: string;
    queryText: string;
    topK: number;
    minScore: number;
    model?: string;
  }) => ServiceResult<{ chunks: ScoredSemanticChunk[] }>;
  listProjectChunks: (args: { projectId: string }) => SemanticChunk[];
};

function normalizeNewline(text: string): string {
  return text.replaceAll("\r\n", "\n");
}

function normalizeModel(args: {
  defaultModel: string;
  model?: string;
}): string {
  const model = args.model?.trim();
  return model && model.length > 0 ? model : args.defaultModel;
}

function makeChunkId(documentId: string, paragraphIndex: number): string {
  return `${documentId}:${paragraphIndex}`;
}

function hashText(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function splitParagraphs(contentText: string): ParagraphSegment[] {
  const normalized = normalizeNewline(contentText);
  const segments: ParagraphSegment[] = [];

  const parts = normalized.split(/\n{2,}/g);
  let cursor = 0;

  for (const rawPart of parts) {
    const text = rawPart.trim();
    if (text.length === 0) {
      cursor += rawPart.length + 2;
      continue;
    }

    const startOffset = normalized.indexOf(text, cursor);
    const safeStart = startOffset >= 0 ? startOffset : cursor;
    const endOffset = safeStart + text.length;

    segments.push({
      index: segments.length,
      text,
      startOffset: safeStart,
      endOffset,
    });

    cursor = endOffset + 2;
  }

  return segments;
}

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let aNorm = 0;
  let bNorm = 0;

  for (let i = 0; i < n; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    aNorm += x * x;
    bNorm += y * y;
  }

  const denom = Math.sqrt(aNorm) * Math.sqrt(bNorm);
  if (!Number.isFinite(denom) || denom <= 0) {
    return 0;
  }

  return dot / denom;
}

/**
 * Create an in-memory semantic chunk index with deterministic update behavior.
 *
 * Why: SR2 requires incremental paragraph embedding update and semantic ranking,
 * while keeping IPC contracts deterministic without external vector dependencies.
 */
export function createSemanticChunkIndexService(deps: {
  logger: Logger;
  embedding: EmbeddingService;
  defaultModel?: string;
  chunkHashCache?: SemanticChunkIndexCache<string>;
}): SemanticChunkIndexService {
  const defaultModel = deps.defaultModel?.trim() || "default";
  const byProject = new Map<string, Map<string, SemanticChunk[]>>();
  const byChunkHash =
    deps.chunkHashCache ??
    createSemanticChunkIndexCache<string>({
      maxSize: DEFAULT_CHUNK_HASH_CACHE_MAX_SIZE,
      ttlMs: DEFAULT_CHUNK_HASH_CACHE_TTL_MS,
    });

  const getProjectIndex = (projectId: string): Map<string, SemanticChunk[]> => {
    const existing = byProject.get(projectId);
    if (existing) {
      return existing;
    }
    const created = new Map<string, SemanticChunk[]>();
    byProject.set(projectId, created);
    return created;
  };

  const upsertDocument: SemanticChunkIndexService["upsertDocument"] = (
    args,
  ) => {
    if (args.projectId.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }
    if (args.documentId.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "documentId is required");
    }

    const model = normalizeModel({ defaultModel, model: args.model });
    const projectIndex = getProjectIndex(args.projectId);
    const previous = projectIndex.get(args.documentId) ?? [];
    const previousByChunkId = new Map(
      previous.map((chunk) => [chunk.chunkId, chunk]),
    );

    const paragraphs = splitParagraphs(args.contentText);
    const changedChunkIds: string[] = [];
    const unchangedChunkIds: string[] = [];

    const toEncode: ParagraphSegment[] = [];
    const nextChunks = new Array<SemanticChunk>(paragraphs.length);

    for (const paragraph of paragraphs) {
      const chunkId = makeChunkId(args.documentId, paragraph.index);
      const previousChunk = previousByChunkId.get(chunkId);
      const hashKey = `${args.projectId}:${chunkId}`;
      const nextHash = hashText(paragraph.text);
      const previousHash = byChunkHash.get(hashKey);

      if (
        previousChunk &&
        previousHash === nextHash &&
        previousChunk.startOffset === paragraph.startOffset &&
        previousChunk.endOffset === paragraph.endOffset
      ) {
        unchangedChunkIds.push(chunkId);
        nextChunks[paragraph.index] = previousChunk;
      } else {
        changedChunkIds.push(chunkId);
        toEncode.push(paragraph);
      }
    }

    if (toEncode.length > 0) {
      const encoded = deps.embedding.encode({
        texts: toEncode.map((segment) => segment.text),
        model,
      });
      if (!encoded.ok) {
        return encoded;
      }

      for (let i = 0; i < toEncode.length; i += 1) {
        const segment = toEncode[i];
        if (!segment) {
          continue;
        }
        const chunkId = makeChunkId(args.documentId, segment.index);
        const vector = encoded.data.vectors[i] ?? [];
        const hashKey = `${args.projectId}:${chunkId}`;
        byChunkHash.set(hashKey, hashText(segment.text));

        nextChunks[segment.index] = {
          chunkId,
          documentId: args.documentId,
          projectId: args.projectId,
          text: segment.text,
          embedding: vector,
          startOffset: segment.startOffset,
          endOffset: segment.endOffset,
          updatedAt: args.updatedAt,
        };
      }
    }

    const removedChunkIds = previous
      .map((chunk) => chunk.chunkId)
      .filter(
        (chunkId) => !nextChunks.some((chunk) => chunk?.chunkId === chunkId),
      );
    for (const chunkId of removedChunkIds) {
      byChunkHash.delete(`${args.projectId}:${chunkId}`);
    }

    const compacted = nextChunks.filter(
      (chunk): chunk is SemanticChunk => typeof chunk !== "undefined",
    );
    projectIndex.set(args.documentId, compacted);

    deps.logger.info("embedding_index_upsert", {
      projectId: args.projectId,
      documentId: args.documentId,
      changedChunks: changedChunkIds.length,
      unchangedChunks: unchangedChunkIds.length,
      removedChunks: removedChunkIds.length,
      model,
    });

    return {
      ok: true,
      data: {
        changedChunkIds,
        unchangedChunkIds,
        removedChunkIds,
        totalChunks: compacted.length,
      },
    };
  };

  const reindexProject: SemanticChunkIndexService["reindexProject"] = (
    args,
  ) => {
    if (args.projectId.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }

    const projectIndex = getProjectIndex(args.projectId);
    projectIndex.clear();

    let indexedChunks = 0;
    let changedChunks = 0;

    for (const document of args.documents) {
      const upserted = upsertDocument({
        projectId: args.projectId,
        documentId: document.documentId,
        contentText: document.contentText,
        updatedAt: document.updatedAt,
        model: args.model,
      });
      if (!upserted.ok) {
        return upserted;
      }

      indexedChunks += upserted.data.totalChunks;
      changedChunks += upserted.data.changedChunkIds.length;
    }

    return {
      ok: true,
      data: {
        indexedDocuments: args.documents.length,
        indexedChunks,
        changedChunks,
      },
    };
  };

  const search: SemanticChunkIndexService["search"] = (args) => {
    if (args.projectId.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }
    if (args.queryText.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "queryText is required");
    }
    if (
      !Number.isFinite(args.topK) ||
      !Number.isInteger(args.topK) ||
      args.topK <= 0
    ) {
      return ipcError("INVALID_ARGUMENT", "topK must be a positive integer");
    }
    if (
      !Number.isFinite(args.minScore) ||
      args.minScore < -1 ||
      args.minScore > 1
    ) {
      return ipcError("INVALID_ARGUMENT", "minScore must be between -1 and 1");
    }

    const model = normalizeModel({ defaultModel, model: args.model });
    const encoded = deps.embedding.encode({ texts: [args.queryText], model });
    if (!encoded.ok) {
      return encoded;
    }

    const queryVector = encoded.data.vectors[0] ?? [];
    const projectIndex = getProjectIndex(args.projectId);
    const chunks = [...projectIndex.values()].flat();

    const ranked = chunks
      .map((chunk) => ({
        ...chunk,
        score: cosineSimilarity(queryVector, chunk.embedding),
      }))
      .filter((chunk) => chunk.score >= args.minScore)
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        if (b.updatedAt !== a.updatedAt) {
          return b.updatedAt - a.updatedAt;
        }
        return a.chunkId.localeCompare(b.chunkId);
      })
      .slice(0, args.topK)
      .map(({ embedding: _embedding, ...chunk }) => chunk);

    return {
      ok: true,
      data: {
        chunks: ranked,
      },
    };
  };

  const listProjectChunks: SemanticChunkIndexService["listProjectChunks"] = (
    args,
  ) => {
    return [...(byProject.get(args.projectId)?.values() ?? [])].flat();
  };

  return {
    upsertDocument,
    reindexProject,
    search,
    listProjectChunks,
  };
}
