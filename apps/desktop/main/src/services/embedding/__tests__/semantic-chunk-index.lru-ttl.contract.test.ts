import assert from "node:assert/strict";

import type { Logger } from "../../../logging/logger";
import type { EmbeddingService } from "../embeddingService";
import { createSemanticChunkIndexCache } from "../semanticChunkIndexCache";
import { createSemanticChunkIndexService } from "../semanticChunkIndexService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createEmbeddingRecorder() {
  let encodeCalls = 0;

  const embedding: EmbeddingService = {
    encode: (args) => {
      encodeCalls += 1;
      return {
        ok: true,
        data: {
          vectors: args.texts.map(() => [1, 0, 0]),
          dimension: 3,
        },
      };
    },
  };

  return {
    embedding,
    getEncodeCalls: () => encodeCalls,
  };
}

/**
 * Scenario: BE-EMR-S4
 * cache should evict by maxSize and expire by ttl.
 */
{
  let now = 1_000;
  const cache = createSemanticChunkIndexCache<string>({
    maxSize: 2,
    ttlMs: 50,
    now: () => now,
  });

  cache.set("a", "A");
  cache.set("b", "B");
  assert.equal(cache.get("a"), "A");

  cache.set("c", "C");
  assert.equal(cache.get("b"), undefined, "least-recent key should be evicted");
  assert.equal(cache.get("a"), "A");
  assert.equal(cache.get("c"), "C");

  now += 60;
  assert.equal(cache.get("a"), undefined, "expired key should be removed");
  assert.equal(cache.get("c"), undefined, "expired key should be removed");
}

{
  let now = 0;
  const logger = createLogger();
  const { embedding, getEncodeCalls } = createEmbeddingRecorder();
  const chunkHashCache = createSemanticChunkIndexCache<string>({
    maxSize: 1,
    ttlMs: 5_000,
    now: () => now,
  });

  const index = createSemanticChunkIndexService({
    logger,
    embedding,
    defaultModel: "hash",
    chunkHashCache,
  });

  assert.equal(
    index.upsertDocument({
      projectId: "project-1",
      documentId: "doc-1",
      contentText: "alpha",
      updatedAt: 1,
    }).ok,
    true,
  );
  assert.equal(
    index.upsertDocument({
      projectId: "project-1",
      documentId: "doc-2",
      contentText: "beta",
      updatedAt: 2,
    }).ok,
    true,
  );

  // doc-1 hash is evicted because maxSize=1 after writing doc-2
  assert.equal(
    index.upsertDocument({
      projectId: "project-1",
      documentId: "doc-1",
      contentText: "alpha",
      updatedAt: 3,
    }).ok,
    true,
  );
  assert.equal(getEncodeCalls(), 3, "evicted hash should trigger re-encode");
}

{
  let now = 0;
  const logger = createLogger();
  const { embedding, getEncodeCalls } = createEmbeddingRecorder();
  const chunkHashCache = createSemanticChunkIndexCache<string>({
    maxSize: 8,
    ttlMs: 100,
    now: () => now,
  });

  const index = createSemanticChunkIndexService({
    logger,
    embedding,
    defaultModel: "hash",
    chunkHashCache,
  });

  assert.equal(
    index.upsertDocument({
      projectId: "project-2",
      documentId: "doc-1",
      contentText: "same text",
      updatedAt: 1,
    }).ok,
    true,
  );

  now = 50;
  assert.equal(
    index.upsertDocument({
      projectId: "project-2",
      documentId: "doc-1",
      contentText: "same text",
      updatedAt: 2,
    }).ok,
    true,
  );

  now = 200;
  assert.equal(
    index.upsertDocument({
      projectId: "project-2",
      documentId: "doc-1",
      contentText: "same text",
      updatedAt: 3,
    }).ok,
    true,
  );

  assert.equal(getEncodeCalls(), 2, "expired hash should trigger re-encode");
}
