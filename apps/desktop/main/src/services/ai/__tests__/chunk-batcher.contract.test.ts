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

// BE-AIW-S1
// should batch tokens by interval/maxBatchSize
{
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (async () => {
      return new Response(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "A" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ delta: { content: "B" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ delta: { content: "C" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ delta: { content: "D" } }] })}\n\n` +
          `data: ${JSON.stringify({ choices: [{ delta: { content: "E" } }] })}\n\n` +
          "data: [DONE]\n\n",
        {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        },
      );
    }) as typeof fetch;

    const events: AiStreamEvent[] = [];
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
      input: "batch me",
      mode: "ask",
      model: "gpt-5.2",
      stream: true,
      ts: 1_700_000_100_000,
      emitEvent: (event) => {
        events.push(event);
        doneWaiter.onEvent(event);
      },
    });
    assert.equal(started.ok, true);
    if (!started.ok) {
      throw new Error("runSkill should start successfully");
    }

    doneWaiter.setExecutionId(started.data.executionId);
    const doneEvent = await doneWaiter.promise;
    assert.equal(doneEvent.terminal, "completed");

    const chunkEvents = events.filter(
      (event): event is AiStreamChunkEvent => event.type === "chunk",
    );
    assert.equal(
      chunkEvents.map((event) => event.chunk).join(""),
      "ABCDE",
      "chunk payload should preserve original output order",
    );
    assert.ok(
      chunkEvents.length < 5,
      `expected batched chunk pushes, got ${chunkEvents.length} per-token pushes`,
    );
    assert.equal(doneEvent.outputText, "ABCDE");
  } finally {
    globalThis.fetch = originalFetch;
  }
}
