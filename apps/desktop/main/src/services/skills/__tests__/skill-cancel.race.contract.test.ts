import assert from "node:assert/strict";

import {
  createSkillScheduler,
  type ServiceResult,
  type SkillSchedulerTerminal,
} from "../skillScheduler";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function main(): Promise<void> {
  const scheduler = createSkillScheduler({
    globalConcurrencyLimit: 1,
    sessionQueueLimit: 20,
    slotRecoveryTimeoutMs: 200,
  });

  const response = createDeferred<ServiceResult<string>>();
  const completion = createDeferred<SkillSchedulerTerminal>();
  const terminalStatuses: string[] = [];

  const resultPromise = scheduler.schedule({
    sessionKey: "session-srh-s4",
    executionId: "exec-srh-s4",
    runId: "task-srh-s4",
    traceId: "trace-srh-s4",
    onQueueEvent: (event) => {
      if (
        event.status === "completed" ||
        event.status === "failed" ||
        event.status === "cancelled" ||
        event.status === "timeout"
      ) {
        terminalStatuses.push(event.status);
      }
    },
    start: () => ({
      response: response.promise,
      completion: completion.promise,
    }),
  });

  completion.resolve("cancelled");
  response.resolve({ ok: true, data: "should-not-be-applied" });

  const result = await resultPromise;
  assert.equal(result.ok, false, "cancel should win over done race");
  if (!result.ok) {
    assert.equal(result.error.code, "CANCELED");
  }

  assert.deepEqual(
    terminalStatuses,
    ["cancelled"],
    "scheduler terminal state should converge to cancelled exactly once",
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
