import assert from "node:assert/strict";

import type { RagRetrieveDiagnostics, RagRetrieveItem } from "../ragService";
import {
  createRagComputeOffload,
  type RagComputeRunner,
} from "../ragComputeOffload";

function createDiagnostics(): RagRetrieveDiagnostics {
  return {
    budgetTokens: 400,
    usedTokens: 120,
    droppedCount: 0,
    trimmedCount: 0,
    mode: "fulltext_reranked",
    planner: {
      queries: ["warehouse"],
      perQueryHits: [3],
      selectedQuery: "warehouse",
      selectedCount: 2,
    },
    rerank: {
      enabled: true,
      model: "hash",
    },
  };
}

/**
 * Scenario: BE-EMR-S3
 * retrieve should run via compute runner and return stable TopK.
 */
{
  let runCalls = 0;
  let inComputeRunner = false;
  let observedTimeoutMs = -1;
  let observedSignal: AbortSignal | undefined;

  const callerAbort = new AbortController();

  const computeRunner: RagComputeRunner = {
    run: async (args) => {
      runCalls += 1;
      observedTimeoutMs = args.timeoutMs ?? -1;
      observedSignal = args.signal;
      inComputeRunner = true;
      try {
        const value = await args.execute(new AbortController().signal);
        return {
          status: "completed",
          value,
        };
      } finally {
        inComputeRunner = false;
      }
    },
  };

  const offload = createRagComputeOffload({
    computeRunner,
    retrieveAndRerankOnCompute: async (args) => {
      assert.equal(
        inComputeRunner,
        true,
        "retrieve must execute inside compute runner",
      );
      assert.equal(args.projectId, "project-1");
      assert.equal(args.queryText, "warehouse");
      assert.equal(args.topK, 2);

      const items: RagRetrieveItem[] = [
        { sourceRef: "doc:c", snippet: "c", score: 0.2 },
        { sourceRef: "doc:a", snippet: "a", score: 0.9 },
        { sourceRef: "doc:b", snippet: "b", score: 0.9 },
      ];

      return {
        ok: true,
        data: {
          items,
          diagnostics: createDiagnostics(),
        },
      };
    },
  });

  const retrieved = await offload.retrieve({
    projectId: "project-1",
    queryText: "warehouse",
    topK: 2,
    timeoutMs: 1200,
    signal: callerAbort.signal,
  });

  assert.equal(runCalls, 1);
  assert.equal(observedTimeoutMs, 1200);
  assert.equal(observedSignal, callerAbort.signal);

  assert.equal(retrieved.ok, true);
  if (!retrieved.ok) {
    throw new Error("BE-EMR-S3: expected retrieve result from compute runner");
  }

  assert.deepEqual(
    retrieved.data.items.map((item) => item.sourceRef),
    ["doc:a", "doc:b"],
    "topK must be stable for tie scores",
  );
  assert.deepEqual(
    retrieved.data.items.map((item) => item.score),
    [0.9, 0.9],
  );
}
