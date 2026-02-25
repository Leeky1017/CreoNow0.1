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
  throw new Error("BE-AIW-S1: expected done event before timeout");
}

const originalFetch = globalThis.fetch;

try {
  const upstreamChunks = ["A", "B", "C", "D", "E", "F"];
  globalThis.fetch = (async () =>
    new Response(
      upstreamChunks
        .map(
          (chunk) =>
            `data: ${JSON.stringify({
              choices: [{ delta: { content: chunk } }],
            })}\n\n`,
        )
        .join("") + "data: [DONE]\n\n",
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
    input: "batching contract",
    mode: "ask",
    model: "gpt-5.2",
    stream: true,
    ts: 1_700_000_020_001,
    emitEvent: (event) => {
      events.push(event);
    },
  });
  assert.equal(run.ok, true, "BE-AIW-S1: stream run should start successfully");

  const done = await waitForDone(events, 2_000);
  assert.equal(done.terminal, "completed");
  assert.equal(done.outputText, upstreamChunks.join(""));

  const chunkEvents = events.filter(
    (event): event is AiStreamChunkEvent => event.type === "chunk",
  );
  assert.ok(chunkEvents.length > 0, "BE-AIW-S1: should emit chunk events");
  assert.ok(
    chunkEvents.length < upstreamChunks.length,
    "BE-AIW-S1: should batch upstream chunks instead of 1:1 emission",
  );
  assert.equal(
    chunkEvents.map((event) => event.chunk).join(""),
    upstreamChunks.join(""),
    "BE-AIW-S1: batched chunks must preserve exact output content",
  );
  assert.deepEqual(
    chunkEvents.map((event) => event.seq),
    chunkEvents.map((_event, index) => index + 1),
    "BE-AIW-S1: chunk sequence should remain strictly increasing",
  );
} finally {
  globalThis.fetch = originalFetch;
}
