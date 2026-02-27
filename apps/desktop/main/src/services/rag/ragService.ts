import type Database from "better-sqlite3";

import {
  estimateUtf8TokenCount as estimateTokens,
  trimUtf8ToTokenBudget,
} from "@shared/tokenBudget";
import type { Logger } from "../../logging/logger";
import type { EmbeddingService } from "../embedding/embeddingService";
import { createFtsService } from "../search/ftsService";
import type { LruCache } from "./lruCache";
import { planFtsQueries } from "./queryPlanner";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type RagRetrieveItem = {
  sourceRef: string;
  snippet: string;
  score: number;
};

export type RagRetrieveDiagnostics = {
  budgetTokens: number;
  usedTokens: number;
  droppedCount: number;
  trimmedCount: number;
  mode: "fulltext" | "fulltext_reranked";
  planner: {
    queries: string[];
    perQueryHits: number[];
    selectedQuery: string;
    selectedCount: number;
  };
  rerank: {
    enabled: boolean;
    reason?: string;
    model?: string;
  };
  degradedFrom?: "semantic";
  reason?: string;
};

export type RagService = {
  retrieve: (args: {
    projectId: string;
    queryText: string;
    limit?: number;
    budgetTokens?: number;
  }) => ServiceResult<{
    items: RagRetrieveItem[];
    diagnostics: RagRetrieveDiagnostics;
  }>;
};

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 50;

const CANDIDATE_MULTIPLIER = 6;
const MAX_CANDIDATES = 50;

const DEFAULT_BUDGET_TOKENS = 800;
const MIN_BUDGET_TOKENS = 50;
const MAX_BUDGET_TOKENS = 8000;

/**
 * Normalize and validate a limit.
 *
 * Why: rag retrieve must stay fast and predictable.
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
 * Normalize and validate a token budget.
 *
 * Why: budget must be deterministic and guard against pathological payloads.
 */
function normalizeBudgetTokens(budgetTokens?: number): ServiceResult<number> {
  if (typeof budgetTokens === "undefined") {
    return { ok: true, data: DEFAULT_BUDGET_TOKENS };
  }
  if (!Number.isFinite(budgetTokens) || !Number.isInteger(budgetTokens)) {
    return ipcError("INVALID_ARGUMENT", "budgetTokens must be an integer");
  }
  if (budgetTokens < MIN_BUDGET_TOKENS) {
    return ipcError("INVALID_ARGUMENT", "budgetTokens is too small", {
      min: MIN_BUDGET_TOKENS,
    });
  }
  if (budgetTokens > MAX_BUDGET_TOKENS) {
    return ipcError("INVALID_ARGUMENT", "budgetTokens is too large", {
      max: MAX_BUDGET_TOKENS,
    });
  }
  return { ok: true, data: budgetTokens };
}

/**
 * Build a portable source reference for retrieved items.
 *
 * Why: IPC must not leak absolute paths; references must be stable across machines.
 */
function buildSourceRef(args: { documentId: string; chunkId: string }): string {
  return `doc:${args.documentId}#chunk:${args.chunkId}`;
}

/**
 * Trim a snippet to fit in the remaining token budget.
 *
 * Why: keep rag responses bounded and stable without tokenizer deps.
 */
function trimToTokenBudget(args: { text: string; tokenBudget: number }): {
  text: string;
  usedTokens: number;
  trimmed: boolean;
} {
  const trimmedText = trimUtf8ToTokenBudget(args.text, args.tokenBudget);
  const usedTokens = estimateTokens(trimmedText);
  const trimmed = trimmedText !== args.text;
  return { text: trimmedText, usedTokens, trimmed };
}

type Candidate = {
  sourceRef: string;
  rawSnippet: string;
  ftsScore: number;
};

function cosineSimilarity(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (!Number.isFinite(denom) || denom <= 0) {
    return 0;
  }
  return dot / denom;
}

/**
 * Create a minimal RAG retrieval service (FTS fallback).
 *
 * Why: CNWB-REQ-100 requires a best-effort retrieve path that can be visualized
 * in the retrieved layer even when semantic/vector store is not ready on Windows.
 */
export function createRagService(deps: {
  db: Database.Database;
  logger: Logger;
  embedding: EmbeddingService;
  embeddingCache: LruCache<string, number[]>;
  rerank: { enabled: boolean; model?: string };
}): RagService {
  const fts = createFtsService({ db: deps.db, logger: deps.logger });

  return {
    retrieve: (args) => {
      const limitRes = normalizeLimit(args.limit);
      if (!limitRes.ok) {
        return limitRes;
      }
      const budgetRes = normalizeBudgetTokens(args.budgetTokens);
      if (!budgetRes.ok) {
        return budgetRes;
      }

      const planned = planFtsQueries({ queryText: args.queryText });
      const plannedQueries =
        planned.queries.length > 0 ? planned.queries : [args.queryText.trim()];

      const candidateLimit = Math.min(
        MAX_CANDIDATES,
        Math.max(limitRes.data, 1) * CANDIDATE_MULTIPLIER,
      );
      const targetHits = Math.min(
        candidateLimit,
        Math.max(1, limitRes.data) * 3,
      );

      const perQueryHits: number[] = [];
      const perQueryItems: Array<Candidate[]> = [];

      for (const query of plannedQueries) {
        const res = fts.searchFulltext({
          projectId: args.projectId,
          query,
          limit: candidateLimit,
        });

        if (!res.ok) {
          // Raw user query errors should be surfaced deterministically.
          if (query === plannedQueries[0]) {
            return res;
          }

          perQueryHits.push(0);
          perQueryItems.push([]);
          continue;
        }

        perQueryHits.push(res.data.items.length);
        perQueryItems.push(
          res.data.items.map((hit) => {
            const sourceRef = buildSourceRef({
              documentId: hit.documentId,
              chunkId: "0",
            });
            const rawSnippet = `${hit.title}\n${hit.snippet}`.trimEnd();
            return { sourceRef, rawSnippet, ftsScore: hit.score };
          }),
        );
      }

      let selectedIndex = 0;
      let bestHits = -1;
      for (let i = 0; i < plannedQueries.length; i += 1) {
        const hits = perQueryHits[i] ?? 0;
        if (hits > bestHits) {
          bestHits = hits;
          selectedIndex = i;
        }
        if (hits >= targetHits) {
          selectedIndex = i;
          break;
        }
      }

      const selectedQuery =
        plannedQueries[selectedIndex] ?? plannedQueries[0] ?? "";
      const baseCandidates = perQueryItems[selectedIndex] ?? [];
      const candidates: Candidate[] = [];
      const seen = new Set<string>();
      for (const c of baseCandidates) {
        if (seen.has(c.sourceRef)) {
          continue;
        }
        seen.add(c.sourceRef);
        candidates.push(c);
      }

      let remainingTokens = budgetRes.data;
      let usedTokens = 0;
      let droppedCount = 0;
      let trimmedCount = 0;

      const rerankModel = deps.rerank.model;
      let ordered: Array<{
        candidate: Candidate;
        score: number;
      }> = candidates.map((c) => ({ candidate: c, score: c.ftsScore }));

      const rerankDiagnostics: RagRetrieveDiagnostics["rerank"] = {
        enabled: false,
        model: rerankModel,
      };

      if (deps.rerank.enabled && candidates.length > 0) {
        const model = typeof rerankModel === "string" ? rerankModel : undefined;
        const texts = [args.queryText, ...candidates.map((c) => c.rawSnippet)];

        const cachedVectors: number[][] = [];
        const missing: Array<{ index: number; text: string }> = [];

        for (let i = 0; i < texts.length; i += 1) {
          const text = texts[i] ?? "";
          if (i === 0) {
            // Never cache query vectors (high-churn, low value).
            missing.push({ index: i, text });
            continue;
          }

          const cacheKey = `${model ?? "default"}:${text}`;
          const cached = deps.embeddingCache.get(cacheKey);
          if (cached) {
            cachedVectors[i] = cached;
          } else {
            missing.push({ index: i, text });
          }
        }

        const encodeRes = deps.embedding.encode({
          texts: missing.map((m) => m.text),
          model,
        });

        if (encodeRes.ok) {
          const vectors = [...cachedVectors];
          for (let i = 0; i < missing.length; i += 1) {
            const idx = missing[i]?.index ?? -1;
            const vec = encodeRes.data.vectors[i] ?? [];
            vectors[idx] = vec;
            if (idx > 0) {
              const cacheKey = `${model ?? "default"}:${texts[idx] ?? ""}`;
              deps.embeddingCache.set(cacheKey, vec);
            }
          }

          const queryVec = vectors[0] ?? [];
          ordered = candidates
            .map((c, idx) => ({
              idx,
              candidate: c,
              score: cosineSimilarity(queryVec, vectors[idx + 1] ?? []),
            }))
            .sort((a, b) => {
              if (b.score !== a.score) {
                return b.score - a.score;
              }
              return a.idx - b.idx;
            })
            .map((x) => ({ candidate: x.candidate, score: x.score }));

          rerankDiagnostics.enabled = true;
        } else {
          rerankDiagnostics.enabled = false;
          rerankDiagnostics.reason = encodeRes.error.code;
        }
      } else if (deps.rerank.enabled) {
        rerankDiagnostics.reason = "NO_CANDIDATES";
      } else {
        rerankDiagnostics.reason = "DISABLED";
      }

      const items: RagRetrieveItem[] = [];
      for (const entry of ordered) {
        if (items.length >= limitRes.data) {
          break;
        }
        if (remainingTokens <= 0) {
          droppedCount += 1;
          continue;
        }

        const trimmed = trimToTokenBudget({
          text: entry.candidate.rawSnippet,
          tokenBudget: remainingTokens,
        });
        if (trimmed.text.trim().length === 0) {
          droppedCount += 1;
          continue;
        }

        if (trimmed.trimmed) {
          trimmedCount += 1;
        }

        items.push({
          sourceRef: entry.candidate.sourceRef,
          snippet: trimmed.text,
          score: entry.score,
        });

        usedTokens += trimmed.usedTokens;
        remainingTokens = Math.max(0, budgetRes.data - usedTokens);
      }

      const mode: RagRetrieveDiagnostics["mode"] = rerankDiagnostics.enabled
        ? "fulltext_reranked"
        : "fulltext";

      return {
        ok: true,
        data: {
          items,
          diagnostics: {
            budgetTokens: budgetRes.data,
            usedTokens,
            droppedCount,
            trimmedCount,
            mode,
            planner: {
              queries: plannedQueries,
              perQueryHits,
              selectedQuery,
              selectedCount: items.length,
            },
            rerank: rerankDiagnostics,
          },
        },
      };
    },
  };
}
