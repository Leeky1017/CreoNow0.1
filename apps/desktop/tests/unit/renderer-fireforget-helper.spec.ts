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
  assert.ok(captured instanceof Error);
  assert.equal((captured as Error).message, "handled");
}

{
  const original = console.error;
  const calls: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    calls.push(args);
  };

  let captured: unknown = null;
  assert.doesNotThrow(() => {
    runFireAndForget(
      () => {
        throw new Error("sync boom");
      },
      {
        label: "sync-task",
        onError: (error) => {
          captured = error;
        },
      },
    );
  });

  console.error = original;

  assert.ok(captured instanceof Error);
  assert.equal((captured as Error).message, "sync boom");
  assert.equal(calls.length, 1, "expected sync throws to be logged once");
  assert.equal(calls[0][0], "[fire-and-forget][critical] task failed");
  assert.deepEqual(calls[0][1], {
    label: "sync-task",
    errorType: "Error",
    message: "sync boom",
    critical: true,
  });
}
