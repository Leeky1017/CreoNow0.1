import assert from "node:assert/strict";

import {
  createSkillScheduler,
  type ServiceResult,
  type SkillSchedulerTerminal,
} from "../skillScheduler";

type ScenarioFn = () => Promise<void> | void;

async function runScenario(name: string, fn: ScenarioFn): Promise<void> {
  try {
    await fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function main(): Promise<void> {
  await runScenario(
    "BE-SLA-S3 slot should be released on timeout/abort even if completion is missing",
    async () => {
      const scheduler = createSkillScheduler({
        globalConcurrencyLimit: 1,
        sessionQueueLimit: 20,
        slotRecoveryTimeoutMs: 40,
      });

      const statusesA: string[] = [];
      const resultA = await scheduler.schedule({
        sessionKey: "session-s3",
        executionId: "exec-s3-a",
        runId: "task-s3-a",
        traceId: "trace-s3-a",
        onQueueEvent: (event) => {
          if (event.runId === "task-s3-a") {
            statusesA.push(event.status);
          }
        },
        start: () => ({
          response: Promise.resolve({ ok: true, data: "ok-a" }),
          completion: new Promise<SkillSchedulerTerminal>(() => undefined),
        }),
      });

      assert.equal(resultA.ok, true);

      let startCallsB = 0;
      const statusesB: string[] = [];
      const resultPromiseB = scheduler.schedule({
        sessionKey: "session-s3",
        executionId: "exec-s3-b",
        runId: "task-s3-b",
        traceId: "trace-s3-b",
        onQueueEvent: (event) => {
          if (event.runId === "task-s3-b") {
            statusesB.push(event.status);
          }
        },
        start: (): {
          response: Promise<ServiceResult<string>>;
          completion: Promise<SkillSchedulerTerminal>;
        } => {
          startCallsB += 1;
          return {
            response: Promise.resolve({ ok: true, data: "ok-b" }),
            completion: Promise.resolve("completed"),
          };
        },
      });

      await new Promise<void>((resolve) => {
        setTimeout(resolve, 10);
      });

      assert.equal(
        startCallsB,
        0,
        "queued task should not start before slot recovery triggers",
      );

      const raced = await Promise.race<
        { kind: "result"; value: ServiceResult<string> } | { kind: "timeout" }
      >([
        resultPromiseB.then((value) => ({ kind: "result" as const, value })),
        new Promise<{ kind: "timeout" }>((resolve) => {
          setTimeout(() => resolve({ kind: "timeout" }), 250);
        }),
      ]);

      assert.equal(
        raced.kind,
        "result",
        "expected slot recovery to unblock queue",
      );
      if (raced.kind === "result") {
        assert.equal(raced.value.ok, true);
      }

      assert.equal(
        statusesB.includes("started"),
        true,
        "second task should start after slot recovery",
      );
      assert.equal(
        statusesB.includes("completed"),
        true,
        "second task should complete",
      );

      assert.equal(
        statusesA.includes("timeout"),
        true,
        "slot recovery should timeout leaked task",
      );
    },
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
