import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import { createContextProjectScopedCache } from "../../services/context/projectScopedCache";
import { createCreonowWatchService } from "../../services/context/watchService";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function toAsyncStringCompute(
  fn: () => Promise<string>,
): () => string {
  return () => fn() as unknown as string;
}

async function main(): Promise<void> {
  const logger = createLogger();
  const watchService = createCreonowWatchService({ logger });

  // Scenario: AUD-C1-S6
  // concurrent same key should trigger compute only once.
  {
    const cache = createContextProjectScopedCache({ logger, watchService });
    let computeCalls = 0;

    const compute = toAsyncStringCompute(async () => {
      computeCalls += 1;
      await wait(30);
      return "value-k1";
    });

    const [left, mid, right] = await Promise.all([
      Promise.resolve(
        cache.getOrComputeString({
          projectId: "proj-cache",
          cacheKey: "k1",
          compute,
        }),
      ),
      Promise.resolve(
        cache.getOrComputeString({
          projectId: "proj-cache",
          cacheKey: "k1",
          compute,
        }),
      ),
      Promise.resolve(
        cache.getOrComputeString({
          projectId: "proj-cache",
          cacheKey: "k1",
          compute,
        }),
      ),
    ]);

    assert.equal(left, "value-k1");
    assert.equal(mid, "value-k1");
    assert.equal(right, "value-k1");
    assert.equal(computeCalls, 1, "same key compute should be deduplicated");
  }

  // Scenario: AUD-C1-S7
  // different keys should not block each other.
  {
    const cache = createContextProjectScopedCache({ logger, watchService });
    let computeA = 0;
    let computeB = 0;

    const startedAt = Date.now();

    const [resultA, resultB] = await Promise.all([
      Promise.resolve(
        cache.getOrComputeString({
          projectId: "proj-cache",
          cacheKey: "k-a",
          compute: toAsyncStringCompute(async () => {
            computeA += 1;
            await wait(40);
            return "A";
          }),
        }),
      ),
      Promise.resolve(
        cache.getOrComputeString({
          projectId: "proj-cache",
          cacheKey: "k-b",
          compute: toAsyncStringCompute(async () => {
            computeB += 1;
            await wait(40);
            return "B";
          }),
        }),
      ),
    ]);

    const elapsedMs = Date.now() - startedAt;

    assert.equal(resultA, "A");
    assert.equal(resultB, "B");
    assert.equal(computeA, 1);
    assert.equal(computeB, 1);
    assert.ok(
      elapsedMs < 75,
      `different keys should run in parallel, elapsed=${elapsedMs.toString()}ms`,
    );
  }

  // Scenario: AUD-C1-S8
  // compute failure must propagate to all callers and must not poison cache.
  {
    const cache = createContextProjectScopedCache({ logger, watchService });
    let attempts = 0;

    const compute = toAsyncStringCompute(async () => {
      attempts += 1;
      await wait(10);
      if (attempts === 1) {
        throw new Error("singleflight-failed");
      }
      return "recovered";
    });

    const [first, second] = await Promise.allSettled([
      Promise.resolve(
        cache.getOrComputeString({
          projectId: "proj-cache",
          cacheKey: "k-fail",
          compute,
        }),
      ),
      Promise.resolve(
        cache.getOrComputeString({
          projectId: "proj-cache",
          cacheKey: "k-fail",
          compute,
        }),
      ),
    ]);

    assert.equal(first.status, "rejected");
    assert.equal(second.status, "rejected");
    if (first.status === "rejected") {
      assert.match(String(first.reason), /singleflight-failed/u);
    }
    if (second.status === "rejected") {
      assert.match(String(second.reason), /singleflight-failed/u);
    }

    const recovered = await Promise.resolve(
      cache.getOrComputeString({
        projectId: "proj-cache",
        cacheKey: "k-fail",
        compute,
      }),
    );

    assert.equal(recovered, "recovered");
    assert.equal(attempts, 2, "failed compute should not stay cached");
  }

  console.log("project-scoped-cache-singleflight.contract.test.ts: all assertions passed");
}

await main();
