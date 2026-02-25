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

// BE-AIW-S3
// abort should rollback and leave no partial writes
{
  const originalFetch = globalThis.fetch;
  const requestBodies: Array<{ stream?: unknown; messages?: unknown[] }> = [];

  try {
    globalThis.fetch = (async (_input, init) => {
      const rawBody =
        typeof init?.body === "string" ? init.body : JSON.stringify({});
      const parsed = JSON.parse(rawBody) as {
        stream?: unknown;
        messages?: unknown[];
      };
      requestBodies.push(parsed);

      if (parsed.stream === true) {
        return new Response(
          `data: ${JSON.stringify({
            choices: [{ delta: { content: "partial-output" } }],
          })}\n\n` + "data: [DONE]\n\n",
          {
            status: 200,
            headers: { "content-type": "text/event-stream" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "final-output" } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }) as typeof fetch;

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

    const doneWaiter = createDoneWaiter();
    const abortedRun = await service.runSkill({
      skillId: "builtin:polish",
      input: "cancelled-user-input",
      mode: "ask",
      model: "gpt-5.2",
      stream: true,
      ts: 1_700_000_300_000,
      emitEvent: doneWaiter.onEvent,
    });
    assert.equal(abortedRun.ok, true);
    if (!abortedRun.ok) {
      throw new Error("expected streaming run to start");
    }

    doneWaiter.setExecutionId(abortedRun.data.executionId);
    const canceled = service.cancel({
      executionId: abortedRun.data.executionId,
      ts: 1_700_000_300_001,
    });
    assert.equal(canceled.ok, true);
    const doneEvent = await doneWaiter.promise;
    assert.equal(doneEvent.terminal, "cancelled");

    const followUp = await service.runSkill({
      skillId: "builtin:polish",
      input: "post-cancel-input",
      mode: "ask",
      model: "gpt-5.2",
      stream: false,
      ts: 1_700_000_300_010,
      emitEvent: () => {},
    });
    assert.equal(followUp.ok, true);

    const secondRequest = requestBodies[1];
    assert.ok(secondRequest, "expected second request to exist");
    const messages = secondRequest?.messages;
    assert.ok(Array.isArray(messages), "follow-up request should include history");
    if (!Array.isArray(messages)) {
      throw new Error("messages should be an array");
    }
    const serialized = JSON.stringify(messages);
    assert.equal(
      serialized.includes("cancelled-user-input"),
      false,
      "aborted run user message should not persist",
    );
    assert.equal(
      serialized.includes("partial-output"),
      false,
      "aborted run partial output should not persist",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}
