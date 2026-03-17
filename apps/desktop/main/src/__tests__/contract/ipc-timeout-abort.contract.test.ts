// BE-TG-S3: ipc timeout should abort underlying work (no ghost execution)
import assert from "node:assert/strict";

import { createBackgroundTaskRunner } from "../../services/utilityprocess/backgroundTaskRunner";

/**
 * Simulates an IPC handler that wraps work in BackgroundTaskRunner with a timeout.
 * This is the pattern used by real IPC handlers to enforce abort semantics.
 */
function createIpcHandler(timeoutMs: number) {
  const runner = createBackgroundTaskRunner();

  return {
    runner,
    handle: async <T>(
      work: (signal: AbortSignal) => Promise<T>,
      externalSignal?: AbortSignal,
    ) => {
      return runner.run({ execute: work, timeoutMs, signal: externalSignal });
    },
  };
}

function runScenario(name: string, fn: () => Promise<void>): Promise<void> {
  return fn().catch((error) => {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  });
}

async function main(): Promise<void> {
  await runScenario(
    "BE-TG-S3 timeout aborts work: signal is aborted after timeout",
    async () => {
      const handler = createIpcHandler(30);
      let signalAbortedDuringWork = false;

      const result = await handler.handle(async (signal) => {
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, 500);
          signal.addEventListener("abort", () => {
            signalAbortedDuringWork = true;
            clearTimeout(t);
          });
        });
        return "should not complete";
      });

      assert.equal(result.status, "timeout");
      assert.equal(
        signalAbortedDuringWork,
        true,
        "signal must be aborted to stop work",
      );
    },
  );

  await runScenario(
    "BE-TG-S3 no ghost execution: work does not produce value after timeout",
    async () => {
      const handler = createIpcHandler(20);
      let ghostValue: string | undefined;

      const result = await handler.handle(async (signal) => {
        // Simulate work that checks signal before producing value
        await new Promise<void>((resolve) => {
          const t = setTimeout(resolve, 200);
          signal.addEventListener("abort", () => clearTimeout(t));
        });
        if (!signal.aborted) {
          ghostValue = "ghost-result";
        }
        return "value";
      });

      assert.equal(result.status, "timeout");
      assert.equal(
        ghostValue,
        undefined,
        "ghost execution must not occur after timeout",
      );
    },
  );

  await runScenario(
    "BE-TG-S3 external abort: caller can cancel before timeout",
    async () => {
      const handler = createIpcHandler(5000);
      const controller = new AbortController();
      let workStarted = false;

      const resultPromise = handler.handle(async (signal) => {
        workStarted = true;
        await new Promise<void>((_, reject) => {
          const t = setTimeout(
            () => reject(new Error("should not reach")),
            5000,
          );
          signal.addEventListener("abort", () => {
            clearTimeout(t);
            reject(signal.reason);
          });
        });
        return "value";
      }, controller.signal);

      // Wait for work to start then abort
      await new Promise<void>((resolve) => setTimeout(resolve, 10));
      assert.equal(workStarted, true);
      controller.abort();

      const result = await resultPromise;
      assert.equal(result.status, "aborted");
    },
  );

  await runScenario("BE-TG-S3 fast work completes before timeout", async () => {
    const handler = createIpcHandler(1000);

    const result = await handler.handle(async () => {
      return "fast-result";
    });

    assert.equal(result.status, "completed");
    if (result.status === "completed") {
      assert.equal(result.value, "fast-result");
    }
  });

  await runScenario(
    "BE-TG-S3 crash propagates: utility process crash aborts all inflight",
    async () => {
      const handler = createIpcHandler(5000);
      const results: Array<{ status: string }> = [];

      const p1 = handler.handle(async () => {
        await new Promise<never>(() => undefined);
        return "v1";
      });
      const p2 = handler.handle(async () => {
        await new Promise<never>(() => undefined);
        return "v2";
      });

      await Promise.resolve();
      handler.runner.crashAll(new Error("process crashed"));

      results.push(await p1, await p2);
      assert.ok(
        results.every((r) => r.status === "crashed"),
        "all inflight must be crashed",
      );
    },
  );

  console.log("[BE-TG-S3] all scenarios passed");
}

await main();
