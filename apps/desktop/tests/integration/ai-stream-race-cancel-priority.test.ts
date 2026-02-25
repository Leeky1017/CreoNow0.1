import assert from "node:assert/strict";
import http from "node:http";

import { createAiService } from "../../main/src/services/ai/aiService";
import type { Logger } from "../../main/src/logging/logger";
import type { AiStreamDoneEvent, AiStreamEvent } from "@shared/types/ai";

function createNoopLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

async function waitForDone(
  events: AiStreamEvent[],
  executionId: string,
  timeoutMs = 2_000,
): Promise<AiStreamDoneEvent> {
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const done = events.find(
      (event): event is AiStreamDoneEvent =>
        event.type === "done" && event.executionId === executionId,
    );
    if (done) {
      return done;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }

  throw new Error("timeout waiting for done event");
}

async function waitForEventsToSettle(
  events: AiStreamEvent[],
  timeoutMs = 1_000,
): Promise<void> {
  const startedAt = Date.now();
  let stableTurns = 0;
  let lastLength = events.length;

  while (Date.now() - startedAt < timeoutMs) {
    await new Promise<void>((resolve) => setImmediate(resolve));

    if (events.length === lastLength) {
      stableTurns += 1;
      if (stableTurns >= 5) {
        return;
      }
      continue;
    }

    stableTurns = 0;
    lastLength = events.length;
  }

  throw new Error("timeout waiting for stream events to settle");
}

async function withStreamingServer(args: {
  run: (input: { baseUrl: string }) => Promise<void>;
}): Promise<void> {
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
      res.writeHead(404).end();
      return;
    }

    await readJson(req);

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
    });

    const chunks = ["A", "B", "C"];
    for (const delta of chunks) {
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`,
      );
      await new Promise<void>((resolve) => setImmediate(resolve));
    }

    res.write("data: [DONE]\n\n");
    res.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to bind server");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await args.run({ baseUrl });
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}

/**
 * S2: 取消与完成并发时取消优先 [ADDED]
 * should resolve to cancelled when cancel and completion race on the same execution
 */
{
  await withStreamingServer({
    run: async ({ baseUrl }) => {
      const events: AiStreamEvent[] = [];
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "test-key",
        },
      });

      let executionId = "";
      let cancelIssued = false;

      const runResult = await ai.runSkill({
        skillId: "builtin:polish",
        input: "race-case",
        mode: "ask",
        model: "gpt-5.2",
        stream: true,
        ts: Date.now(),
        emitEvent: (event) => {
          events.push(event);
          if (
            event.type === "chunk" &&
            executionId.length > 0 &&
            !cancelIssued &&
            event.seq >= 1
          ) {
            cancelIssued = true;
            const cancelResult = ai.cancel({
              executionId,
              ts: Date.now(),
            });
            assert.equal(cancelResult.ok, true);
          }
        },
      });

      assert.equal(runResult.ok, true);
      if (!runResult.ok) {
        return;
      }
      executionId = runResult.data.executionId;

      const done = await waitForDone(events, executionId);
      assert.equal(done.terminal, "cancelled");

      await waitForEventsToSettle(events);

      const doneEvents = events.filter(
        (event): event is AiStreamDoneEvent =>
          event.type === "done" && event.executionId === executionId,
      );
      assert.equal(doneEvents.length, 1);
      assert.equal(doneEvents[0]?.terminal, "cancelled");
    },
  });
}
