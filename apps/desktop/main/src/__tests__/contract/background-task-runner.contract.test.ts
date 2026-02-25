// BE-TG-S1: runner should cover five-state machine (completed/error/timeout/aborted/crashed)
import assert from "node:assert/strict";

import { createBackgroundTaskRunner } from "../../services/utilityprocess/backgroundTaskRunner";

function runScenario(name: string, fn: () => Promise<void>): Promise<void> {
  return fn().catch((error) => {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  });
}

async function main(): Promise<void> {
  await runScenario("BE-TG-S1 completed: resolves with value", async () => {
    const runner = createBackgroundTaskRunner();
    const result = await runner.run({
      execute: async () => 42,
      timeoutMs: 1000,
    });
    assert.equal(result.status, "completed");
    if (result.status === "completed") {
      assert.equal(result.value, 42);
    }
  });

  await runScenario("BE-TG-S1 error: execute throws returns error status", async () => {
    const runner = createBackgroundTaskRunner();
    const result = await runner.run({
      execute: async () => {
        throw new Error("task failed");
      },
      timeoutMs: 1000,
    });
    assert.equal(result.status, "error");
    if (result.status === "error") {
      assert.match(result.error.message, /task failed/u);
    }
  });

  await runScenario("BE-TG-S1 timeout: slow task returns timeout status", async () => {
    const runner = createBackgroundTaskRunner();
    const result = await runner.run({
      execute: (signal) =>
        new Promise<never>((_, reject) => {
          const t = setTimeout(() => reject(new Error("should not reach")), 5000);
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(signal.reason);
          });
        }),
      timeoutMs: 20,
    });
    assert.equal(result.status, "timeout");
    if (result.status === "timeout") {
      assert.equal(result.error.name, "TimeoutError");
    }
  });

  await runScenario("BE-TG-S1 aborted: external signal returns aborted status", async () => {
    const runner = createBackgroundTaskRunner();
    const controller = new AbortController();
    const resultPromise = runner.run({
      execute: (signal) =>
        new Promise<never>((_, reject) => {
          const t = setTimeout(() => reject(new Error("should not reach")), 5000);
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(signal.reason);
          });
        }),
      signal: controller.signal,
      timeoutMs: 5000,
    });
    // abort after a tick
    await Promise.resolve();
    controller.abort();
    const result = await resultPromise;
    assert.equal(result.status, "aborted");
    if (result.status === "aborted") {
      assert.equal(result.error.name, "AbortError");
    }
  });

  await runScenario("BE-TG-S1 crashed: crashAll returns crashed status", async () => {
    const runner = createBackgroundTaskRunner();
    const resultPromise = runner.run({
      execute: () => new Promise<never>(() => undefined),
      timeoutMs: 5000,
    });
    await Promise.resolve();
    runner.crashAll(new Error("utility process crashed"));
    const result = await resultPromise;
    assert.equal(result.status, "crashed");
    if (result.status === "crashed") {
      assert.match(result.error.message, /utility process crashed/u);
    }
  });

  await runScenario("BE-TG-S1 no ghost execution: aborted task does not resolve with value", async () => {
    const runner = createBackgroundTaskRunner();
    const controller = new AbortController();
    let ghostExecuted = false;
    const resultPromise = runner.run({
      execute: async (signal) => {
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, 50);
          signal.addEventListener("abort", () => clearTimeout(t));
        });
        if (!signal.aborted) {
          ghostExecuted = true;
        }
        return "ghost";
      },
      signal: controller.signal,
      timeoutMs: 5000,
    });
    controller.abort();
    const result = await resultPromise;
    assert.notEqual(result.status, "completed");
    assert.equal(ghostExecuted, false);
  });

  console.log("[BE-TG-S1] all scenarios passed");
}

await main();
