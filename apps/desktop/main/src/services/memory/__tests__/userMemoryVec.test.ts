import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import {
  createUserMemoryVecService,
  embedTextSemanticDeterministic,
} from "../userMemoryVec";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createModelUnavailableDbStub(): Database.Database {
  const db = {
    prepare: () => ({
      get: () => {
        throw new Error("vec not loaded");
      },
    }),
    loadExtension: () => {
      throw new Error("extension unavailable");
    },
  } as unknown as Database.Database;

  return db;
}

function fnv1a32(text: string): number {
  const data = new TextEncoder().encode(text);
  let hash = 0x811c9dc5;
  for (const b of data) {
    hash ^= b;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function oldTokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function oldEmbed(text: string, dimension: number): number[] {
  const dim = Math.max(1, Math.floor(dimension));
  const v = new Array<number>(dim).fill(0);
  const tokens = oldTokenize(text);
  for (const token of tokens) {
    const idx = fnv1a32(token) % dim;
    v[idx] = (v[idx] ?? 0) + 1;
  }
  let norm = 0;
  for (const x of v) {
    norm += x * x;
  }
  norm = Math.sqrt(norm);
  if (!Number.isFinite(norm) || norm <= 0) {
    return v;
  }
  return v.map((x) => x / norm);
}

function cosine(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na <= 0 || nb <= 0) {
    return 0;
  }
  return dot / Math.sqrt(na * nb);
}

// Scenario: AC-2 semantic deterministic embedding should outperform old hash approximation
{
  const query = "开心的动作节奏";
  const candidates = [
    { id: "a-unrelated", text: "天气很好" },
    { id: "z-semantic", text: "高兴的打斗节奏" },
  ];

  const queryOld = oldEmbed(query, 64);
  const oldTop = [...candidates]
    .map((item) => ({
      ...item,
      score: cosine(queryOld, oldEmbed(item.text, 64)),
    }))
    .sort((a, b) => (a.score === b.score ? a.id.localeCompare(b.id) : b.score - a.score))[0]?.id;

  const queryNew = embedTextSemanticDeterministic(query, 64);
  const newTop = [...candidates]
    .map((item) => ({
      ...item,
      score: cosine(queryNew, embedTextSemanticDeterministic(item.text, 64)),
    }))
    .sort((a, b) => (a.score === b.score ? a.id.localeCompare(b.id) : b.score - a.score))[0]?.id;

  assert.notEqual(oldTop, "z-semantic", "old hash approximation should not reliably rank synonym match first");
  assert.equal(newTop, "z-semantic", "semantic deterministic embedding should rank synonym match first");
}

// Scenario: topK should fallback to in-memory semantic ranking when sqlite-vec is unavailable
{
  const svc = createUserMemoryVecService({
    db: createModelUnavailableDbStub(),
    logger: createLogger(),
  });

  const result = svc.topK({
    sources: [
      { memoryId: "m-2", content: "悲伤独白" },
      { memoryId: "m-1", content: "高兴的打斗节奏" },
    ],
    queryText: "开心动作",
    k: 2,
    ts: 1_700_000_000_000,
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.matches.length, 2);
    assert.equal(result.data.matches[0]?.memoryId, "m-1");
    assert.equal(result.data.matches[0]!.score > result.data.matches[1]!.score, true);
  }
}

console.log("userMemoryVec.test.ts: all assertions passed");
