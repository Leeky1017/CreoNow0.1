import assert from "node:assert/strict";

import { createBackgroundTaskRunner } from "../backgroundTaskRunner";

/**
 * Scenario: BE-UPF-S1
 * should return completed status for successful background task execution.
 */
{
  const runner = createBackgroundTaskRunner();
  const result = await runner.run({
    timeoutMs: 50,
    execute: async () => ({ taskId: "task-1", ok: true }),
  });

  assert.equal(result.status, "completed");
  assert.deepEqual(result.value, { taskId: "task-1", ok: true });
  assert.equal("error" in result, false);
}

/**
 * Scenario: BE-UPF-S1
 * should return error status when background task throws.
 */
{
  const runner = createBackgroundTaskRunner();
  const failure = new Error("task_failed");
  const result = await runner.run({
    timeoutMs: 50,
    execute: async () => {
      throw failure;
    },
  });

  assert.equal(result.status, "error");
  assert.equal(result.error, failure);
}

/**
 * Scenario: BE-UPF-S1
 * should return timeout status when task runtime exceeds timeoutMs.
 */
{
  const runner = createBackgroundTaskRunner();
  const result = await runner.run({
    timeoutMs: 10,
    execute: async () => {
      await new Promise((_resolve) => {});
      return "unreachable";
    },
  });

  assert.equal(result.status, "timeout");
}

/**
 * Scenario: BE-UPF-S1
 * should return aborted status when caller aborts the task.
 */
{
  const runner = createBackgroundTaskRunner();
  const controller = new AbortController();
  const resultPromise = runner.run({
    timeoutMs: 100,
    signal: controller.signal,
    execute: async (signal) => {
      await new Promise((_resolve, reject) => {
        signal.addEventListener(
          "abort",
          () => {
            reject(new Error("aborted_by_caller"));
          },
          { once: true },
        );
      });
      return "unreachable";
    },
  });

  controller.abort();
  const result = await resultPromise;
  assert.equal(result.status, "aborted");
}

/**
 * Scenario: BE-UPF-S1
 * should return crashed status when utility process crash signal is raised.
 */
{
  const runner = createBackgroundTaskRunner();
  const resultPromise = runner.run({
    timeoutMs: 100,
    execute: async () => {
      await new Promise((_resolve) => {});
      return "unreachable";
    },
  });

  runner.crashAll(new Error("compute_process_crashed"));
  const result = await resultPromise;
  assert.equal(result.status, "crashed");
}
