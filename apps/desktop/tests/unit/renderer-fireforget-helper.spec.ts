import assert from "node:assert/strict";

import { runFireAndForget } from "../../renderer/src/lib/fireAndForget";

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

// C1C-S2: fire-and-forget helper should not swallow errors silently [ADDED]
{
  const original = console.error;
  const calls: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };

  runFireAndForget(async () => {
    throw new Error("boom");
  });
  await flushMicrotasks();

  console.error = original;

  assert.equal(
    calls.length,
    1,
    "expected default error logging for uncaught task rejection",
  );
}

{
  const originalError = console.error;
  const originalWarn = console.warn;
  const errorCalls: unknown[][] = [];
  const warnCalls: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    errorCalls.push(args);
  };
  console.warn = (...args: unknown[]) => {
    warnCalls.push(args);
  };

  let captured: unknown = null;
  runFireAndForget(
    async () => {
      throw new Error("handled");
    },
    (error) => {
      captured = error;
    },
  );

  await flushMicrotasks();

  console.error = originalError;
  console.warn = originalWarn;

  assert.ok(captured instanceof Error);
  assert.equal((captured as Error).message, "handled");
  assert.equal(
    errorCalls.length,
    0,
    "expected handled errors to avoid critical logs",
  );
  assert.equal(
    warnCalls.length,
    1,
    "expected handled errors to emit non-critical warning",
  );
  assert.equal(warnCalls[0][0], "[fire-and-forget][non-critical] task failed");
}
