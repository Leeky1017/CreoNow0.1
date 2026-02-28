import assert from "node:assert/strict";

import type { Logger } from "../../logging/logger";
import type {
  AiStreamDoneEvent,
  AiStreamEvent,
  AiStreamChunkEvent,
} from "@shared/types/ai";
import { createAiService } from "../../services/ai/aiService";

type LogEntry = {
  event: string;
  data: Record<string, unknown> | undefined;
};

function createDoneWaiter(): {
  setExecutionId: (executionId: string) => void;
  onEvent: (event: AiStreamEvent) => void;
  getChunks: () => string[];
  promise: Promise<AiStreamDoneEvent>;
} {
  let expectedExecutionId: string | null = null;
  let bufferedDone: AiStreamDoneEvent | null = null;
  const chunkEvents: AiStreamChunkEvent[] = [];
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
      if (event.type === "chunk") {
        chunkEvents.push(event);
        return;
      }
      if (event.type !== "done") {
        return;
      }
      bufferedDone = event;
      maybeResolve();
    },
    getChunks: () =>
      expectedExecutionId
        ? chunkEvents
            .filter((event) => event.executionId === expectedExecutionId)
            .map((event) => event.chunk)
        : [],
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
      "data: {\"choices\":[{\"delta\":{\"content\":\"hello\"}}]}\r\n\r\n" +
        "data: {\"choices\":[{\"delta\":{\"content\":\" world\"}}]}\r\n\r\n" +
        "data: [DONE]\r\n\r\n",
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
    input: "stream crlf",
    mode: "ask",
    model: "gpt-5.2",
    stream: true,
    ts: 1_700_000_000_000,
    emitEvent: doneWaiter.onEvent,
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("AUD-C3-S8: expected stream run success");
  }

  doneWaiter.setExecutionId(result.data.executionId);
  const done = await doneWaiter.promise;
  assert.equal(done.terminal, "completed");
  assert.equal(done.error, undefined);
  assert.equal(doneWaiter.getChunks().join(""), "hello world");
  assert.equal(
    logs.some((entry) => entry.event === "ai_sse_parse_failure"),
    false,
  );
} finally {
  globalThis.fetch = originalFetch;
}

console.log("ai-service-sse-crlf.test.ts: all assertions passed");
