import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import type { AiStreamDoneEvent, AiStreamEvent } from "@shared/types/ai";
import { createAiService } from "../../services/ai/aiService";

type LogEntry = {
  event: string;
  data: Record<string, unknown> | undefined;
};

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

function createLogger(logs: LogEntry[]): Logger & {
  warn: (event: string, data?: Record<string, unknown>) => void;
} {
  return {
    logPath: "<test>",
    info: () => {},
    warn: (event, data) => {
      logs.push({ event, data });
    },
    error: () => {},
  };
}

const originalFetch = globalThis.fetch;

try {
  const logs: LogEntry[] = [];
  const logger = createLogger(logs);

  globalThis.fetch = (async () => {
    return new Response(
      'data: {"choices":[{"delta":{"content":"hello"}}]}\n\n' +
        "data: {malformed-json}\n\n" +
        'data: {"choices":[{"delta":{"content":" world"}}]}\n\n' +
        "data: [DONE]\n\n",
      {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      },
    );
  }) as typeof fetch;

  const service = createAiService({
    logger,
    env: {
      CREONOW_AI_PROVIDER: "openai",
      CREONOW_AI_BASE_URL: "https://api.openai.com",
      CREONOW_AI_API_KEY: "sk-test",
    },
    sleep: async () => {},
    rateLimitPerMinute: 1_000,
  });

  const doneWaiter = createDoneWaiter();
  const result = await service.runSkill({
    skillId: "builtin:polish",
    input: "stream parse warn",
    mode: "ask",
    model: "gpt-5.2",
    stream: true,
    ts: 1_700_000_000_000,
    emitEvent: doneWaiter.onEvent,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("AUD-C3-S7: expected stream run success");
  }
  doneWaiter.setExecutionId(result.data.executionId);
  await doneWaiter.promise;

  const warn = logs.find((entry) => entry.event === "ai_sse_parse_failure");
  assert.ok(warn, "AUD-C3-S7: expected ai_sse_parse_failure warning");
  assert.equal(warn?.data?.provider, "openai");
  assert.equal(typeof warn?.data?.error, "string");
  assert.equal(typeof warn?.data?.raw, "string");
  assert.equal((warn?.data?.raw as string).length <= 200, true);
} finally {
  globalThis.fetch = originalFetch;
}

console.log("ai-service-sse-parse-warn.test.ts: all assertions passed");
