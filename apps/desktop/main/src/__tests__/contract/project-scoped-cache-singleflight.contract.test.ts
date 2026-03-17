import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import { createContextProjectScopedCache } from "../../services/context/projectScopedCache";
import { createCreonowWatchService } from "../../services/context/watchService";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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

function toAsyncStringCompute(fn: () => Promise<string>): () => string {
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
    const releaseA = createDeferred<void>();
    const releaseB = createDeferred<void>();
    let startedA = false;
    let startedB = false;

    const resultAPromise = Promise.resolve(
      cache.getOrComputeString({
        projectId: "proj-cache",
        cacheKey: "k-a",
        compute: toAsyncStringCompute(async () => {
          computeA += 1;
          startedA = true;
          await releaseA.promise;
          return "A";
        }),
      }),
    );
    const resultBPromise = Promise.resolve(
      cache.getOrComputeString({
        projectId: "proj-cache",
        cacheKey: "k-b",
        compute: toAsyncStringCompute(async () => {
          computeB += 1;
          startedB = true;
          await releaseB.promise;
          return "B";
        }),
      }),
    );

    for (
      let attempt = 0;
      attempt < 4 && (!startedA || !startedB);
      attempt += 1
    ) {
      await Promise.resolve();
    }
    assert.equal(startedA, true, "key-a compute should start");
    assert.equal(
      startedB,
      true,
      "key-b compute should start without waiting key-a",
    );

    releaseA.resolve(undefined);
    releaseB.resolve(undefined);

    const [resultA, resultB] = await Promise.all([
      resultAPromise,
      resultBPromise,
    ]);

    assert.equal(resultA, "A");
    assert.equal(resultB, "B");
    assert.equal(computeA, 1);
    assert.equal(computeB, 1);
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

  console.log(
    "project-scoped-cache-singleflight.contract.test.ts: all assertions passed",
  );
}

await main();
