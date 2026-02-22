import assert from "node:assert/strict";

import { registerGlobalExceptionHandlers } from "../globalExceptionHandlers";

type CapturedLog = {
  event: string;
  data: Record<string, unknown> | undefined;
};

type TimerHandle = { id: number };

type TimerEntry = {
  callback: () => void;
  timeoutMs: number;
  cleared: boolean;
};

type Harness = {
  logs: CapturedLog[];
  exitCodes: number[];
  quitCalls: number;
  timers: TimerEntry[];
  emitUncaughtException: (error: Error) => void;
  emitUnhandledRejection: (reason: unknown) => void;
  emitWillQuit: () => void;
  fireTimeout: (index?: number) => void;
};

function createHarness(timeoutMs = 75): Harness {
  const listeners: Record<string, Array<(payload: unknown) => void>> = {
    uncaughtException: [],
    unhandledRejection: [],
  };
  const logs: CapturedLog[] = [];
  const exitCodes: number[] = [];
  const timers: TimerEntry[] = [];
  let quitCalls = 0;
  let willQuitListener: (() => void) | null = null;

  registerGlobalExceptionHandlers({
    processLike: {
      on: (event, listener) => {
        listeners[event].push(listener as (payload: unknown) => void);
      },
    },
    appLike: {
      once: (_event, listener) => {
        willQuitListener = listener;
      },
      quit: () => {
        quitCalls += 1;
      },
    },
    logger: {
      error: (event, data) => {
        logs.push({ event, data });
      },
    },
    shutdownTimeoutMs: timeoutMs,
    exit: (code) => {
      exitCodes.push(code);
    },
    setTimeoutFn: ((callback: () => void, delay?: number) => {
      const normalized = typeof delay === "number" ? delay : 0;
      const handle: TimerHandle = { id: timers.length };
      timers.push({ callback, timeoutMs: normalized, cleared: false });
      return handle as unknown as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout,
    clearTimeoutFn: ((timer: unknown) => {
      const timerId = (timer as unknown as TimerHandle).id;
      if (typeof timerId !== "number") {
        return;
      }
      const target = timers[timerId];
      if (target) {
        target.cleared = true;
      }
    }) as unknown as typeof clearTimeout,
  });

  return {
    logs,
    exitCodes,
    timers,
    get quitCalls() {
      return quitCalls;
    },
    emitUncaughtException: (error) => {
      const listener = listeners.uncaughtException[0];
      assert.ok(listener, "expected uncaughtException listener");
      listener(error);
    },
    emitUnhandledRejection: (reason) => {
      const listener = listeners.unhandledRejection[0];
      assert.ok(listener, "expected unhandledRejection listener");
      listener(reason);
    },
    emitWillQuit: () => {
      assert.ok(willQuitListener, "expected will-quit listener");
      willQuitListener();
    },
    fireTimeout: (index = 0) => {
      const entry = timers[index];
      assert.ok(entry, `expected timeout #${index.toString()} to exist`);
      entry.callback();
    },
  };
}

function runScenario(name: string, fn: () => void): void {
  try {
    fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

runScenario(
  "BE-GHB-S2 uncaughtException should trigger graceful fatal shutdown",
  () => {
    const harness = createHarness();

    harness.emitUncaughtException(new Error("fatal boom"));

    assert.equal(harness.quitCalls, 1);
    assert.equal(harness.exitCodes.length, 0);
    assert.equal(harness.timers[0]?.timeoutMs, 75);
    assert.equal(harness.logs[0]?.event, "fatal_exception_captured");
    assert.equal(harness.logs[0]?.data?.source, "uncaughtException");

    harness.emitWillQuit();

    assert.deepEqual(harness.exitCodes, [1]);
    assert.equal(harness.timers[0]?.cleared, true);
  },
);

runScenario(
  "BE-GHB-S2 unhandledRejection should trigger graceful fatal shutdown",
  () => {
    const harness = createHarness();

    harness.emitUnhandledRejection("panic");
    harness.emitWillQuit();

    assert.equal(harness.quitCalls, 1);
    assert.deepEqual(harness.exitCodes, [1]);
    assert.equal(harness.logs[0]?.event, "fatal_exception_captured");
    assert.equal(harness.logs[0]?.data?.source, "unhandledRejection");
    assert.equal(harness.logs[0]?.data?.message, "panic");
  },
);

runScenario(
  "BE-GHB-S2 should force exit(1) when graceful shutdown times out",
  () => {
    const harness = createHarness(120);

    harness.emitUncaughtException(new Error("hang"));
    harness.fireTimeout();

    assert.deepEqual(harness.exitCodes, [1]);
    const timeoutLog = harness.logs.find(
      (entry) => entry.event === "fatal_shutdown_timeout",
    );
    assert.ok(timeoutLog, "expected timeout audit log");
    assert.equal(timeoutLog.data?.timeout_ms, 120);
  },
);
