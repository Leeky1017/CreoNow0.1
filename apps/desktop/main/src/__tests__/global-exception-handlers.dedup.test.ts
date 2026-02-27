import assert from "node:assert/strict";

import {
  type GlobalExceptionHandlerDeps,
  registerGlobalExceptionHandlers,
} from "../globalExceptionHandlers";

type FatalEventSource = "uncaughtException" | "unhandledRejection";
type FatalListener = (reason: unknown) => void;

type CapturedLog = {
  event: string;
  data: Record<string, unknown> | undefined;
};

type Harness = {
  deps: GlobalExceptionHandlerDeps;
  listeners: Record<FatalEventSource, FatalListener[]>;
  logs: CapturedLog[];
  getQuitCalls: () => number;
};

function createHarness(): Harness {
  const listeners: Record<FatalEventSource, FatalListener[]> = {
    uncaughtException: [],
    unhandledRejection: [],
  };
  const logs: CapturedLog[] = [];
  let quitCalls = 0;

  const deps: GlobalExceptionHandlerDeps = {
    processLike: {
      on: (event, listener) => {
        listeners[event].push(listener);
      },
    },
    appLike: {
      once: () => {},
      quit: () => {
        quitCalls += 1;
      },
    },
    logger: {
      error: (event, data) => {
        logs.push({ event, data });
      },
    },
    shutdownTimeoutMs: 10,
    exit: () => {},
    setTimeoutFn: ((() => {
      return {} as ReturnType<typeof setTimeout>;
    }) as unknown as typeof setTimeout),
    clearTimeoutFn: (() => {}) as typeof clearTimeout,
  };

  return {
    deps,
    listeners,
    logs,
    getQuitCalls: () => quitCalls,
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
  "AUD-C15-S5 repeated registerGlobalExceptionHandlers calls should not add duplicate listeners",
  () => {
    const harness = createHarness();

    registerGlobalExceptionHandlers(harness.deps);
    registerGlobalExceptionHandlers(harness.deps);
    registerGlobalExceptionHandlers(harness.deps);

    assert.equal(harness.listeners.uncaughtException.length, 1);
    assert.equal(harness.listeners.unhandledRejection.length, 1);
  },
);

runScenario(
  "AUD-C15-S6 dedup guard should keep fatal exception capture behavior",
  () => {
    const harness = createHarness();

    registerGlobalExceptionHandlers(harness.deps);
    registerGlobalExceptionHandlers(harness.deps);

    const uncaughtExceptionListener = harness.listeners.uncaughtException[0];
    assert.ok(uncaughtExceptionListener, "expected uncaughtException listener");
    uncaughtExceptionListener(new Error("fatal"));

    assert.equal(harness.getQuitCalls(), 1);
    const capturedLogs = harness.logs.filter(
      (entry) => entry.event === "fatal_exception_captured",
    );
    assert.equal(capturedLogs.length, 1);
    assert.equal(capturedLogs[0]?.data?.source, "uncaughtException");
  },
);
