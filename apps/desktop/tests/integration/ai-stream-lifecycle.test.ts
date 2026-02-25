import assert from "node:assert/strict";
import http from "node:http";

import { createAiService } from "../../main/src/services/ai/aiService";
import type { Logger } from "../../main/src/logging/logger";
import type { AiStreamDoneEvent, AiStreamEvent } from "@shared/types/ai";

type JsonRecord = Record<string, unknown>;

function createNoopLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function asRecord(x: unknown): JsonRecord | null {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    return null;
  }
  return x as JsonRecord;
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

async function withOpenAiStreamingServer(args: {
  handler: (input: {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    body: JsonRecord;
  }) => Promise<void> | void;
  run: (input: { baseUrl: string }) => Promise<void>;
}): Promise<void> {
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/v1/chat/completions") {
      res.writeHead(404).end();
      return;
    }

    const json = (await readJson(req)) as JsonRecord;
    await args.handler({ req, res, body: json });
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
 * S1: 流式生命周期可判定闭环 [ADDED]
 * should return executionId first, emit chunk sequence, and converge exactly once via done
 */
{
  await withOpenAiStreamingServer({
    handler: ({ res }) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "Hello " } }] })}\n\n`,
      );
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "World" } }] })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
    },
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

      const runResult = await ai.runSkill({
        skillId: "builtin:polish",
        input: "input text",
        mode: "ask",
        model: "gpt-5.2",
        stream: true,
        ts: Date.now(),
        emitEvent: (event) => {
          events.push(event);
        },
      });

      assert.equal(runResult.ok, true);
      if (!runResult.ok) {
        return;
      }
      assert.equal(typeof runResult.data.executionId, "string");
      assert.ok(runResult.data.executionId.length > 0);

      const executionId = runResult.data.executionId;
      const done = await waitForDone(events, executionId);

      const chunks = events.filter(
        (event): event is Extract<AiStreamEvent, { type: "chunk" }> =>
          event.type === "chunk" && event.executionId === executionId,
      );

      assert.ok(chunks.length > 0);
      assert.equal(chunks.map((chunk) => chunk.chunk).join(""), "Hello World");
      assert.deepEqual(
        chunks.map((chunk) => chunk.seq),
        Array.from({ length: chunks.length }, (_, index) => index + 1),
      );
      assert.equal(done.terminal, "completed");
      assert.equal(done.outputText, "Hello World");

      await waitForEventsToSettle(events);
      const doneEvents = events.filter(
        (event) => event.type === "done" && event.executionId === executionId,
      );
      assert.equal(doneEvents.length, 1);
    },
  });
}

/**
 * N1: 网络中断后完整 prompt 重放（非断点续传） [ADDED]
 * should replay with the full prompt after stream disconnect instead of resuming from partial state
 */
{
  const requestBodies: JsonRecord[] = [];
  let attempt = 0;

  await withOpenAiStreamingServer({
    handler: ({ res, body }) => {
      requestBodies.push(body);
      attempt += 1;

      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });

      if (attempt === 1) {
        res.destroy(new Error("simulated network disconnect"));
        return;
      }

      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "Replay " } }] })}\n\n`,
      );
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: "OK" } }] })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      res.end();
    },
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

      const runResult = await ai.runSkill({
        skillId: "builtin:polish",
        input: "full prompt input",
        mode: "ask",
        model: "gpt-5.2",
        stream: true,
        ts: Date.now(),
        emitEvent: (event) => {
          events.push(event);
        },
      });

      assert.equal(runResult.ok, true);
      if (!runResult.ok) {
        return;
      }
      const executionId = runResult.data.executionId;

      const done = await waitForDone(events, executionId);
      assert.equal(done.terminal, "completed");
      assert.equal(done.outputText, "Replay OK");
      assert.equal(requestBodies.length, 2);

      const first = asRecord(requestBodies[0]);
      const second = asRecord(requestBodies[1]);
      assert.deepEqual(second, first);
      assert.equal(first?.stream, true);
    },
  });
}

/**
 * AIS-TIMEOUT-S1: stream 超时通过 done(error: SKILL_TIMEOUT) 收敛 [ADDED]
 * should emit one done(error) event with SKILL_TIMEOUT when stream exceeds timeout
 */
{
  await withOpenAiStreamingServer({
    handler: async ({ req, res }) => {
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
      });
      await new Promise<void>((resolve) => {
        req.once("close", resolve);
      });
      res.end();
    },
    run: async ({ baseUrl }) => {
      const events: AiStreamEvent[] = [];
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "test-key",
        },
        sleep: async () => {},
        rateLimitPerMinute: 1_000,
      });

      const runResult = await ai.runSkill({
        skillId: "builtin:polish",
        input: "timeout-input",
        mode: "ask",
        model: "gpt-5.2",
        stream: true,
        timeoutMs: 5,
        ts: Date.now(),
        emitEvent: (event) => {
          events.push(event);
        },
      });

      assert.equal(runResult.ok, true);
      if (!runResult.ok) {
        return;
      }

      const executionId = runResult.data.executionId;
      const done = await waitForDone(events, executionId, 3_000);
      assert.equal(done.terminal, "error");
      assert.equal(done.error?.code, "SKILL_TIMEOUT");

      await waitForEventsToSettle(events);
      const doneEvents = events.filter(
        (event) => event.type === "done" && event.executionId === executionId,
      );
      assert.equal(doneEvents.length, 1);
    },
  });
}
