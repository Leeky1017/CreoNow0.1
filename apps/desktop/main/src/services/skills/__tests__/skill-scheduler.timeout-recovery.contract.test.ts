import assert from "node:assert/strict";

import {
  createSkillScheduler,
  type ServiceResult,
  type SkillSchedulerTerminal,
} from "../skillScheduler";

async function wait(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main(): Promise<void> {
  const scheduler = createSkillScheduler({
    globalConcurrencyLimit: 1,
    sessionQueueLimit: 20,
    slotRecoveryTimeoutMs: 40,
  });

  const statusesA: Array<SkillSchedulerTerminal | "queued" | "started"> = [];

  const resultPromiseA = scheduler.schedule({
    sessionKey: "session-srh-s3",
    executionId: "exec-srh-s3-a",
    runId: "task-srh-s3-a",
    traceId: "trace-srh-s3-a",
    onQueueEvent: (event) => {
      if (event.runId === "task-srh-s3-a") {
        statusesA.push(event.status);
      }
    },
    start: () => ({
      response: new Promise<ServiceResult<string>>(() => undefined),
      completion: new Promise<SkillSchedulerTerminal>(() => undefined),
    }),
  });

  let startCallsB = 0;
  const resultPromiseB = scheduler.schedule({
    sessionKey: "session-srh-s3",
    executionId: "exec-srh-s3-b",
    runId: "task-srh-s3-b",
    traceId: "trace-srh-s3-b",
    start: () => {
      startCallsB += 1;
      return {
        response: Promise.resolve({ ok: true, data: "ok-b" }),
        completion: Promise.resolve("completed"),
      };
    },
  });

  await wait(10);
  assert.equal(
    startCallsB,
    0,
    "second task should stay queued before recovery timeout",
  );

  const racedA = await Promise.race<
    | { kind: "result"; value: ServiceResult<string> }
    | { kind: "timeout" }
  >([
    resultPromiseA.then((value) => ({ kind: "result" as const, value })),
    wait(250).then(() => ({ kind: "timeout" as const })),
  ]);
  assert.equal(
    racedA.kind,
    "result",
    "leaked task should settle by slot recovery timeout",
  );
  if (racedA.kind === "result") {
    assert.equal(racedA.value.ok, false);
    if (!racedA.value.ok) {
      assert.equal(racedA.value.error.code, "SKILL_TIMEOUT");
    }
  }

  const racedB = await Promise.race<
    | { kind: "result"; value: ServiceResult<string> }
    | { kind: "timeout" }
  >([
    resultPromiseB.then((value) => ({ kind: "result" as const, value })),
    wait(250).then(() => ({ kind: "timeout" as const })),
  ]);
  assert.equal(
    racedB.kind,
    "result",
    "queued task should continue after recovery frees slot",
  );
  if (racedB.kind === "result") {
    assert.equal(racedB.value.ok, true);
  }

  assert.equal(startCallsB, 1, "queued task should be started once");
  assert.equal(
    statusesA.includes("timeout"),
    true,
    "timed-out task should emit timeout terminal status",
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
