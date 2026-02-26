import assert from "node:assert/strict";

import type { Logger } from "../../../logging/logger";
import { createProjectLifecycle } from "../projectLifecycle";

type TimerHandle = { id: number; canceled: boolean };

function createLogger(
  errors: Array<{ event: string; data?: Record<string, unknown> }>,
): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: (event, data) => {
      errors.push({ event, ...(data ? { data } : {}) });
    },
  };
}

function createFakeTimers() {
  const scheduled: Array<{
    handle: TimerHandle;
    callback: () => void;
  }> = [];

  return {
    timers: {
      setTimeout: (callback: () => void, _ms: number) => {
        const handle: TimerHandle = { id: scheduled.length, canceled: false };
        scheduled.push({ handle, callback });
        return handle as unknown as ReturnType<typeof setTimeout>;
      },
      clearTimeout: (handle: ReturnType<typeof setTimeout>) => {
        const cast = handle as unknown as TimerHandle;
        const entry = scheduled[cast.id];
        if (entry) {
          entry.handle.canceled = true;
        }
      },
    },
    runNext: () => {
      const entry = scheduled.find((candidate) => !candidate.handle.canceled);
      assert.ok(entry, "expected at least one pending timer to run");
      entry.handle.canceled = true;
      entry.callback();
    },
  };
}

// Scenario: BE-SLA-S1
// switch should unbind ALL -> persist switch -> bind ALL, with timeout guards.
{
  const errors: Array<{ event: string; data?: Record<string, unknown> }> = [];
  const events: string[] = [];
  const fakeTimers = createFakeTimers();

  const lifecycle = createProjectLifecycle({
    logger: createLogger(errors),
    timeoutMs: 10,
    timers: fakeTimers.timers,
  });

  lifecycle.register({
    id: "fast",
    unbind: () => {
      events.push("unbind:fast");
    },
    bind: () => {
      events.push("bind:fast");
    },
  });

  lifecycle.register({
    id: "slow",
    unbind: ({ signal }) => {
      events.push("unbind:slow:start");
      return new Promise<void>((resolve) => {
        if (signal.aborted) {
          events.push("unbind:slow:aborted");
          resolve();
          return;
        }
        signal.addEventListener(
          "abort",
          () => {
            events.push("unbind:slow:aborted");
            resolve();
          },
          { once: true },
        );
      });
    },
    bind: () => {
      events.push("bind:slow");
    },
  });

  lifecycle.register({
    id: "after",
    unbind: () => {
      events.push("unbind:after");
    },
    bind: () => {
      events.push("bind:after");
    },
  });

  const switchPromise = lifecycle.switchProject({
    fromProjectId: "proj-a",
    toProjectId: "proj-b",
    traceId: "trace-1",
    persist: async () => {
      events.push("persist");
      return "ok";
    },
  });

  for (let attempt = 0; attempt < 4 && events.length < 2; attempt += 1) {
    await Promise.resolve();
  }
  assert.deepEqual(events.slice(0, 2), ["unbind:fast", "unbind:slow:start"]);

  fakeTimers.runNext();

  const result = await switchPromise;
  assert.equal(result, "ok");

  assert.deepEqual(events, [
    "unbind:fast",
    "unbind:slow:start",
    "unbind:slow:aborted",
    "unbind:after",
    "persist",
    "bind:fast",
    "bind:slow",
    "bind:after",
  ]);

  assert.equal(
    errors.some((log) => log.event === "project_lifecycle_step_timed_out"),
    true,
    "expected a timeout guard log for the slow unbind",
  );
}

console.log("project-lifecycle.switch.contract.test.ts: all assertions passed");
