import assert from "node:assert/strict";

import type { Logger } from "../../../logging/logger";
import type { FtsSearchResult } from "../ftsService";
import type { FtsService } from "../ftsService";
import {
  createHybridRankingService,
  type SemanticRetriever,
  type SemanticRetrieveItem,
  type HybridRankingService,
} from "../hybridRankingService";

// ── helpers ─────────────────────────────────────────────────────────────

function createLogger(): Logger {
  return { logPath: "<test>", info: () => {}, error: () => {} };
}

function makeFtsResult(overrides?: Partial<FtsSearchResult>): FtsSearchResult {
  return {
    projectId: "proj-1",
    documentId: "doc-1",
    documentTitle: "Test Doc",
    documentType: "chapter",
    snippet: "hello world",
    highlights: [{ start: 0, end: 5 }],
    anchor: { start: 0, end: 100 },
    score: 5.0,
    updatedAt: 1_700_000_000,
    ...overrides,
  };
}

function makeSemanticItem(
  overrides?: Partial<SemanticRetrieveItem>,
): SemanticRetrieveItem {
  return {
    projectId: "proj-1",
    documentId: "doc-1",
    chunkId: "chunk-1",
    snippet: "hello world",
    score: 0.9,
    updatedAt: 1_700_000_000,
    ...overrides,
  };
}

function createFtsStub(results: FtsSearchResult[]): FtsService {
  return {
    search: () => ({
      ok: true as const,
      data: {
        results,
        total: results.length,
        hasMore: false,
        indexState: "ready" as const,
      },
    }),
    reindex: () => ({
      ok: true as const,
      data: { indexState: "ready" as const, reindexed: 0 },
    }),
    searchFulltext: () => ({
      ok: true as const,
      data: { items: [] },
    }),
  };
}

function createSemanticStub(items: SemanticRetrieveItem[]): SemanticRetriever {
  return { search: () => ({ ok: true as const, data: { items } }) };
}

function createService(overrides?: {
  fts?: FtsService;
  semantic?: SemanticRetriever;
}): HybridRankingService {
  return createHybridRankingService({
    ftsService: overrides?.fts ?? createFtsStub([]),
    semanticRetriever: overrides?.semantic ?? createSemanticStub([]),
    logger: createLogger(),
  });
}

// ── Scenario 1: input validation ────────────────────────────────────────
{
  const svc = createService();

  // empty projectId
  const r1 = svc.queryByStrategy({
    projectId: "",
    query: "hello",
    strategy: "fts",
  });
  assert.equal(r1.ok, false);
  if (!r1.ok) assert.equal(r1.error.code, "INVALID_ARGUMENT");

  // empty query
  const r2 = svc.queryByStrategy({
    projectId: "proj-1",
    query: "   ",
    strategy: "fts",
  });
  assert.equal(r2.ok, false);
  if (!r2.ok) assert.equal(r2.error.code, "INVALID_ARGUMENT");

  // invalid strategy
  const r3 = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "bogus" as "fts",
  });
  assert.equal(r3.ok, false);
  if (!r3.ok) assert.equal(r3.error.code, "INVALID_ARGUMENT");

  // limit too large
  const r4 = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "fts",
    limit: 999,
  });
  assert.equal(r4.ok, false);
  if (!r4.ok) assert.equal(r4.error.code, "INVALID_ARGUMENT");

  // negative offset
  const r5 = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "fts",
    offset: -1,
  });
  assert.equal(r5.ok, false);
  if (!r5.ok) assert.equal(r5.error.code, "INVALID_ARGUMENT");

  // rankExplain: same validation
  const r6 = svc.rankExplain({
    projectId: "",
    query: "hello",
    strategy: "fts",
  });
  assert.equal(r6.ok, false);
  if (!r6.ok) assert.equal(r6.error.code, "INVALID_ARGUMENT");
}

// ── Scenario 2: FTS-only strategy ──────────────────────────────────────
{
  let semanticCalled = false;
  const fts = createFtsStub([
    makeFtsResult({ documentId: "d1", score: 10.0, updatedAt: 1_700_000_002 }),
    makeFtsResult({ documentId: "d2", score: 10.0, updatedAt: 1_700_000_001 }),
  ]);
  const semantic: SemanticRetriever = {
    search: () => {
      semanticCalled = true;
      return { ok: true as const, data: { items: [] } };
    },
  };

  const svc = createService({ fts, semantic });
  const res = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "fts",
  });

  assert.equal(res.ok, true);
  assert.equal(semanticCalled, false, "semantic should not be called for fts strategy");
  if (res.ok) {
    assert.equal(res.data.strategy, "fts");
    assert.equal(res.data.fallback, "none");
    assert.equal(res.data.results.length, 2);
    // same BM25 but d1 has more recent updatedAt → first
    assert.equal(res.data.results[0].documentId, "d1");
    assert.equal(res.data.results[1].documentId, "d2");
  }
}

// ── Scenario 3: semantic-only strategy ─────────────────────────────────
{
  let ftsCalled = false;
  const fts: FtsService = {
    search: () => {
      ftsCalled = true;
      return {
        ok: true as const,
        data: { results: [], total: 0, hasMore: false, indexState: "ready" as const },
      };
    },
    reindex: () => ({
      ok: true as const,
      data: { indexState: "ready" as const, reindexed: 0 },
    }),
    searchFulltext: () => ({
      ok: true as const,
      data: { items: [] },
    }),
  };
  const semantic = createSemanticStub([
    makeSemanticItem({ documentId: "s1", chunkId: "c1", score: 0.95 }),
    makeSemanticItem({ documentId: "s2", chunkId: "c2", score: 0.80 }),
  ]);

  const svc = createService({ fts, semantic });
  const res = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "semantic",
  });

  assert.equal(res.ok, true);
  assert.equal(ftsCalled, false, "fts should not be called for semantic strategy");
  if (res.ok) {
    assert.equal(res.data.strategy, "semantic");
    assert.equal(res.data.results.length, 2);
    // higher semantic score → first
    assert.equal(res.data.results[0].documentId, "s1");
  }
}

// ── Scenario 4: hybrid strategy merges FTS + semantic ──────────────────
{
  const fts = createFtsStub([
    makeFtsResult({ documentId: "d1", score: 10.0, updatedAt: 1_700_000_100 }),
  ]);
  const semantic = createSemanticStub([
    makeSemanticItem({
      documentId: "d1",
      chunkId: "fts:d1:0",
      score: 0.9,
      updatedAt: 1_700_000_100,
    }),
    makeSemanticItem({
      documentId: "d2",
      chunkId: "c2",
      score: 0.85,
      updatedAt: 1_700_000_050,
    }),
  ]);

  const svc = createService({ fts, semantic });
  const res = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "hybrid",
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.strategy, "hybrid");
    assert.equal(res.data.fallback, "none");
    // d1 appears in both FTS and semantic → merged with both scores
    // d2 appears only in semantic
    assert.ok(res.data.results.length >= 1, "should have at least 1 result");
    // d1 with merged BM25+semantic should rank higher
    const d1Item = res.data.results.find((r) => r.documentId === "d1");
    assert.ok(d1Item, "d1 should appear in results");
    assert.ok(d1Item.scoreBreakdown.bm25 > 0, "d1 should have bm25 score");
    assert.ok(d1Item.scoreBreakdown.semantic > 0, "d1 should have semantic score");
  }
}

// ── Scenario 5: semantic timeout in hybrid → degrades to FTS ───────────
{
  const fts = createFtsStub([
    makeFtsResult({ documentId: "d1", score: 8.0 }),
  ]);
  const semantic: SemanticRetriever = {
    search: () => ({
      ok: false as const,
      error: { code: "TIMEOUT" as const, message: "timed out" },
    }),
  };

  const svc = createService({ fts, semantic });
  const res = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "hybrid",
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.fallback, "fts");
    assert.ok(res.data.notice, "should have a degradation notice");
    assert.ok(res.data.results.length > 0, "should still return FTS results");
  }
}

// ── Scenario 6: semantic failure in semantic-only → error ──────────────
{
  const semantic: SemanticRetriever = {
    search: () => ({
      ok: false as const,
      error: { code: "INTERNAL" as const, message: "boom" },
    }),
  };

  const svc = createService({ semantic });
  const res = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "semantic",
  });

  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.code, "INTERNAL");
  }
}

// ── Scenario 7: pagination (offset / limit) ───────────────────────────
{
  const items = Array.from({ length: 5 }, (_, i) =>
    makeFtsResult({
      documentId: `d${i}`,
      score: 10.0,
      updatedAt: 1_700_000_000 + i,
    }),
  );
  const svc = createService({ fts: createFtsStub(items) });

  const full = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "fts",
  });
  assert.equal(full.ok, true);
  if (full.ok) assert.equal(full.data.total, 5);

  const page = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "fts",
    limit: 2,
    offset: 1,
  });
  assert.equal(page.ok, true);
  if (page.ok) {
    assert.equal(page.data.results.length, 2);
    assert.equal(page.data.total, 5);
    assert.equal(page.data.hasMore, true);
  }
}

// ── Scenario 8: cross-project FTS result → SEARCH_PROJECT_FORBIDDEN ───
{
  const fts = createFtsStub([
    makeFtsResult({ projectId: "other-project", documentId: "d1", score: 5 }),
  ]);
  const svc = createService({ fts });

  const res = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "fts",
  });

  assert.equal(res.ok, false);
  if (!res.ok) {
    assert.equal(res.error.code, "SEARCH_PROJECT_FORBIDDEN");
  }
}

// ── Scenario 9: score filtering — items below SCORE_THRESHOLD ─────────
{
  // A single FTS item with very low score. After min-max normalization with
  // only one candidate, BM25 normalizes to 1. finalScore = 0.55*1 + 0.35*0 + 0.1*1 = 0.65
  // so a single item always passes. We need items whose weighted total < 0.25.
  // With semantic-only: semantic score IS the raw 0..1 value used directly.
  // finalScore = 0.35 * score + 0.1 * recency. If score=0.2 and single item → recency=1:
  // finalScore = 0.35*0.2 + 0.1*1 = 0.17 → below 0.25 → filtered.
  const semantic = createSemanticStub([
    makeSemanticItem({ documentId: "low", chunkId: "c-low", score: 0.2 }),
  ]);
  const svc = createService({ semantic });

  const res = svc.queryByStrategy({
    projectId: "proj-1",
    query: "hello",
    strategy: "semantic",
  });

  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.data.results.length, 0, "low-score item should be filtered out");
    assert.equal(res.data.total, 0);
  }
}

console.log("hybridRankingService.test.ts: all assertions passed");
