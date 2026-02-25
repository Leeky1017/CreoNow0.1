import assert from "node:assert/strict";

import type { AiStreamDoneEvent, AiStreamEvent } from "@shared/types/ai";
import type { Logger } from "../../../logging/logger";
import { createAiService } from "../aiService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDoneWaiter(): {
  setExecutionId: (executionId: string) => void;
  onEvent: (event: AiStreamEvent) => void;
  promise: Promise<AiStreamDoneEvent>;
} {
  let expectedExecutionId: string | null = null;
  let bufferedDone: AiStreamDoneEvent | null = null;
  let resolvePromise: (event: AiStreamDoneEvent) => void = () => undefined;

  const promise = new Promise<AiStreamDoneEvent>((resolve) => {
    resolvePromise = resolve;
  });

  const maybeResolve = () => {
    if (!expectedExecutionId || !bufferedDone) {
      return;
    }
    if (bufferedDone.executionId !== expectedExecutionId) {
      return;
    }
    resolvePromise(bufferedDone);
  };

  return {
    promise,
    setExecutionId: (executionId) => {
      expectedExecutionId = executionId;
      maybeResolve();
    },
    onEvent: (event) => {
      if (event.type !== "done") {
        return;
      }
      bufferedDone = event;
      maybeResolve();
    },
  };
}

// BE-AIW-S4
// cancel should win over done event and stop applying chunks
{
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => {
      return new Response(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "RACE" } }] })}\n\n` +
          "data: [DONE]\n\n",
        {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        },
      );
    }) as typeof fetch;

    const doneWaiter = createDoneWaiter();
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

    const started = await service.runSkill({
      skillId: "builtin:polish",
      input: "race-input",
      mode: "ask",
      model: "gpt-5.2",
      stream: true,
      ts: 1_700_000_400_000,
      emitEvent: doneWaiter.onEvent,
    });
    assert.equal(started.ok, true);
    if (!started.ok) {
      throw new Error("runSkill should start successfully");
    }

    doneWaiter.setExecutionId(started.data.executionId);
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        service.cancel({
          executionId: started.data.executionId,
          ts: 1_700_000_400_001,
        });
        resolve();
      }, 10);
    });

    const done = await doneWaiter.promise;
    assert.equal(done.terminal, "cancelled");
  } finally {
    globalThis.fetch = originalFetch;
  }
}
