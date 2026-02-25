import assert from "node:assert/strict";

import type {
  AiStreamChunkEvent,
  AiStreamDoneEvent,
  AiStreamEvent,
} from "@shared/types/ai";
import type { Logger } from "../../../logging/logger";
import { createAiService } from "../aiService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

async function waitForDone(
  events: AiStreamEvent[],
  timeoutMs: number,
): Promise<AiStreamDoneEvent> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const found = events.find(
      (event): event is AiStreamDoneEvent => event.type === "done",
    );
    if (found) {
      return found;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error("BE-AIW-S4: expected done event before timeout");
}

async function waitFor(
  predicate: () => boolean,
  timeoutTicks: number,
  timeoutMessage: string,
): Promise<void> {
  for (let index = 0; index < timeoutTicks; index += 1) {
    if (predicate()) {
      return;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
  throw new Error(timeoutMessage);
}

type ManualTimerRuntime = {
  setTimeout: typeof globalThis.setTimeout;
  clearTimeout: typeof globalThis.clearTimeout;
  advanceToNextDue: () => boolean;
  pendingCountAtDelay: (delayMs: number) => number;
};

function createManualTimerRuntime(): ManualTimerRuntime {
  type TimerEntry = {
    id: number;
    due: number;
    canceled: boolean;
    callback: () => void;
  };

  let now = 0;
  let nextId = 1;
  const timers: TimerEntry[] = [];

  const setTimeoutMock = ((
    handler: TimerHandler,
    timeout?: number,
    ...args: unknown[]
  ) => {
    const id = nextId;
    nextId += 1;
    const delayMs = Number.isFinite(timeout) ? Math.max(0, Number(timeout)) : 0;
    const callback =
      typeof handler === "function"
        ? () => {
            (handler as (...handlerArgs: unknown[]) => void)(...args);
          }
        : () => {};
    timers.push({
      id,
      due: now + delayMs,
      canceled: false,
      callback,
    });
    return id as unknown as NodeJS.Timeout;
  }) as unknown as typeof globalThis.setTimeout;

  const clearTimeoutMock: typeof globalThis.clearTimeout = ((handle) => {
    if (handle == null) {
      return;
    }
    const id = Number(handle as unknown as number);
    const timer = timers.find((entry) => entry.id === id);
    if (timer) {
      timer.canceled = true;
    }
  }) as typeof globalThis.clearTimeout;

  const getDueTimers = (targetDue: number): TimerEntry[] =>
    timers
      .filter((timer) => !timer.canceled && timer.due <= targetDue)
      .sort((left, right) => {
        if (left.due !== right.due) {
          return left.due - right.due;
        }
        return left.id - right.id;
      });

  function runDue(targetDue: number): boolean {
    let executed = false;
    let dueTimers = getDueTimers(targetDue);
    while (dueTimers.length > 0) {
      for (const timer of dueTimers) {
        if (timer.canceled) {
          continue;
        }
        timer.canceled = true;
        executed = true;
        timer.callback();
      }
      dueTimers = getDueTimers(targetDue);
    }
    return executed;
  }

  function advanceToNextDue(): boolean {
    const activeDueTimes = timers
      .filter((timer) => !timer.canceled)
      .map((timer) => timer.due)
      .sort((left, right) => left - right);
    const nextDue = activeDueTimes[0];
    if (nextDue == null) {
      return false;
    }
    now = nextDue;
    return runDue(nextDue);
  }

  return {
    setTimeout: setTimeoutMock,
    clearTimeout: clearTimeoutMock,
    advanceToNextDue,
    pendingCountAtDelay: (delayMs) =>
      timers.filter((timer) => !timer.canceled && timer.due === now + delayMs)
        .length,
  };
}

const originalFetch = globalThis.fetch;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

try {
  globalThis.fetch = (async () =>
    new Response(
      `data: ${JSON.stringify({
        choices: [{ delta: { content: "race-chunk" } }],
      })}\n\n` + "data: [DONE]\n\n",
      {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      },
    )) as typeof fetch;

  const events: AiStreamEvent[] = [];
  const service = createAiService({
    logger: createLogger(),
    env: {
      CREONOW_AI_PROVIDER: "openai",
      CREONOW_AI_BASE_URL: "https://api.openai.com",
      CREONOW_AI_API_KEY: "sk-test",
    },
    sleep: async () => {},
    rateLimitPerMinute: 1_000,
  });

  const run = await service.runSkill({
    skillId: "builtin:polish",
    input: "cancel race contract",
    mode: "ask",
    model: "gpt-5.2",
    stream: true,
    ts: 1_700_000_020_101,
    emitEvent: (event) => {
      events.push(event);
    },
  });
  assert.equal(run.ok, true, "BE-AIW-S4: stream run should start successfully");
  if (!run.ok) {
    throw new Error("BE-AIW-S4: runSkill should return ok result");
  }

  let cancelInvokedAt = 0;
  let cancelResult: unknown = null;
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      cancelInvokedAt = Date.now();
      cancelResult = service.cancel({
        executionId: run.data.executionId,
        ts: cancelInvokedAt,
      });
      resolve();
    }, 5);
  });

  const done = await waitForDone(events, 2_000);
  const resolvedCancelResult = cancelResult;
  if (
    resolvedCancelResult === null ||
    typeof resolvedCancelResult !== "object" ||
    !("ok" in resolvedCancelResult)
  ) {
    throw new Error("BE-AIW-S4: cancel result missing");
  }
  assert.equal((resolvedCancelResult as { ok: boolean }).ok, true);
  assert.equal(
    done.terminal,
    "cancelled",
    "BE-AIW-S4: cancel should win over near-simultaneous done",
  );

  const chunkEvents = events.filter(
    (event): event is AiStreamChunkEvent => event.type === "chunk",
  );
  assert.equal(
    chunkEvents.length,
    0,
    "BE-AIW-S4: cancelled race should not apply queued chunk output",
  );
  const lateChunks = chunkEvents.filter(
    (event) => event.ts >= cancelInvokedAt && cancelInvokedAt > 0,
  );
  assert.equal(
    lateChunks.length,
    0,
    "BE-AIW-S4: no chunk can be applied after cancellation timestamp",
  );

  const manualTimers = createManualTimerRuntime();
  globalThis.setTimeout = manualTimers.setTimeout;
  globalThis.clearTimeout = manualTimers.clearTimeout;
  globalThis.fetch = (async () =>
    new Response(
      `data: ${JSON.stringify({
        choices: [{ delta: { content: "tie-race-chunk" } }],
      })}\n\n` + "data: [DONE]\n\n",
      {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      },
    )) as typeof fetch;

  const tieEvents: AiStreamEvent[] = [];
  const tieService = createAiService({
    logger: createLogger(),
    env: {
      CREONOW_AI_PROVIDER: "openai",
      CREONOW_AI_BASE_URL: "https://api.openai.com",
      CREONOW_AI_API_KEY: "sk-test",
    },
    sleep: async () => {},
    rateLimitPerMinute: 1_000,
  });

  const tieRun = await tieService.runSkill({
    skillId: "builtin:polish",
    input: "cancel tie race contract",
    mode: "ask",
    model: "gpt-5.2",
    stream: true,
    ts: 1_700_000_020_201,
    emitEvent: (event) => {
      tieEvents.push(event);
    },
  });
  assert.equal(tieRun.ok, true, "BE-AIW-S4: tie race stream should start");
  if (!tieRun.ok) {
    throw new Error("BE-AIW-S4: tie race runSkill should return ok result");
  }

  await waitFor(
    () => manualTimers.pendingCountAtDelay(20) >= 1,
    2_000,
    "BE-AIW-S4: expected completion timer to be scheduled",
  );

  let cancelTs = 0;
  let tieCancelResult: unknown = null;
  setTimeout(() => {
    cancelTs = Date.now();
    tieCancelResult = tieService.cancel({
      executionId: tieRun.data.executionId,
      ts: cancelTs,
    });
  }, 20);

  const advanced = manualTimers.advanceToNextDue();
  assert.equal(advanced, true, "BE-AIW-S4: expected pending timers to execute");
  await new Promise<void>((resolve) => setImmediate(resolve));

  const resolvedTieCancelResult = tieCancelResult;
  if (
    resolvedTieCancelResult === null ||
    typeof resolvedTieCancelResult !== "object" ||
    !("ok" in resolvedTieCancelResult)
  ) {
    throw new Error("BE-AIW-S4: tie race cancel result missing");
  }
  assert.equal((resolvedTieCancelResult as { ok: boolean }).ok, true);

  const tieDone = tieEvents.find(
    (event): event is AiStreamDoneEvent => event.type === "done",
  );
  assert.ok(tieDone, "BE-AIW-S4: tie race should emit done event");
  if (!tieDone) {
    throw new Error("BE-AIW-S4: tie race done missing");
  }
  assert.equal(
    tieDone.terminal,
    "cancelled",
    "BE-AIW-S4: cancel must win even when done timer fires in same window",
  );
} finally {
  globalThis.fetch = originalFetch;
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
}
