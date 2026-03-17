import assert from "node:assert/strict";
import { createKeyedMutex, createKeyedSingleflight } from "../concurrency";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// S1: Same-key tasks run serially
// ---------------------------------------------------------------------------
async function sameKeyRunsSerially(): Promise<void> {
  const mutex = createKeyedMutex();
  const order: number[] = [];

  const t1 = mutex.runExclusive("k", async () => {
    await delay(30);
    order.push(1);
  });
  const t2 = mutex.runExclusive("k", async () => {
    order.push(2);
  });

  await Promise.all([t1, t2]);
  assert.deepStrictEqual(order, [1, 2], "same-key tasks must execute in order");
}

// ---------------------------------------------------------------------------
// S2: Different-key tasks can run concurrently
// ---------------------------------------------------------------------------
async function differentKeysRunConcurrently(): Promise<void> {
  const mutex = createKeyedMutex();
  let concurrentPeak = 0;
  let running = 0;

  const task = async () => {
    running++;
    if (running > concurrentPeak) concurrentPeak = running;
    await delay(20);
    running--;
  };

  await Promise.all([
    mutex.runExclusive("a", task),
    mutex.runExclusive("b", task),
  ]);

  assert.equal(concurrentPeak, 2, "different keys should run concurrently");
}

// ---------------------------------------------------------------------------
// S3: Empty key bypasses locking
// ---------------------------------------------------------------------------
async function emptyKeyBypassesLocking(): Promise<void> {
  const mutex = createKeyedMutex();
  let concurrentPeak = 0;
  let running = 0;

  const task = async () => {
    running++;
    if (running > concurrentPeak) concurrentPeak = running;
    await delay(20);
    running--;
  };

  await Promise.all([
    mutex.runExclusive("", task),
    mutex.runExclusive("", task),
  ]);

  assert.equal(
    concurrentPeak,
    2,
    "empty key should allow concurrent execution",
  );
}

// ---------------------------------------------------------------------------
// S4: Prior task error is reported via callback
// ---------------------------------------------------------------------------
async function priorTaskErrorReportedViaCallback(): Promise<void> {
  const reported: Array<{ key: string; error: unknown }> = [];
  const mutex = createKeyedMutex({
    onPriorTaskError: (args) => reported.push(args),
  });

  const boom = new Error("boom");

  // First task throws
  await assert.rejects(
    () =>
      mutex.runExclusive("k", () => {
        throw boom;
      }),
    (err: unknown) => err === boom,
  );

  // Second task triggers callback before executing
  const result = await mutex.runExclusive("k", () => 42);
  assert.equal(result, 42);
  assert.equal(reported.length, 1, "callback should be invoked once");
  assert.equal(reported[0].key, "k");
  assert.equal(reported[0].error, boom);
}

// ---------------------------------------------------------------------------
// S5: Singleflight deduplicates concurrent same-key calls
// ---------------------------------------------------------------------------
async function singleflightDeduplicates(): Promise<void> {
  const sf = createKeyedSingleflight();
  let computeCount = 0;

  const compute = async () => {
    computeCount++;
    await delay(30);
    return "result";
  };

  const [r1, r2] = await Promise.all([
    sf.run("k", compute),
    sf.run("k", compute),
  ]);

  assert.equal(computeCount, 1, "compute should run only once");
  assert.equal(r1, "result");
  assert.equal(r2, "result");

  // After resolution, next call starts fresh
  const r3 = await sf.run("k", compute);
  assert.equal(
    computeCount,
    2,
    "new call after resolution should compute again",
  );
  assert.equal(r3, "result");
}

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
void (async () => {
  await sameKeyRunsSerially();
  await differentKeysRunConcurrently();
  await emptyKeyBypassesLocking();
  await priorTaskErrorReportedViaCallback();
  await singleflightDeduplicates();
  console.log("concurrency.test.ts: all assertions passed");
})();
