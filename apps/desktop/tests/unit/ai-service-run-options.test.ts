import assert from "node:assert/strict";
import http from "node:http";

import { createAiService } from "../../main/src/services/ai/aiService";
import type { Logger } from "../../main/src/logging/logger";
import type { AiStreamEvent } from "@shared/types/ai";

type CapturedRequest = {
  model: unknown;
  messages: unknown;
  system: unknown;
  stream: unknown;
};

type JsonRecord = Record<string, unknown>;

function asRecord(x: unknown): JsonRecord | null {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    return null;
  }
  return x as JsonRecord;
}

function createNoopLogger(): Logger {
  return {
    logPath: "(unit-test)",
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

async function withOpenAiStubServer(args: {
  endpointPath?: string;
  handler?: (args: {
    req: http.IncomingMessage;
    res: http.ServerResponse;
    body: JsonRecord;
    captured: CapturedRequest[];
  }) => Promise<void> | void;
  run: (args: {
    baseUrl: string;
    captured: CapturedRequest[];
  }) => Promise<void>;
}): Promise<void> {
  const endpointPath = args.endpointPath ?? "/v1/chat/completions";
  const captured: CapturedRequest[] = [];
  const server = http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== endpointPath) {
      res.writeHead(404).end();
      return;
    }

    const body = (await readJson(req)) as JsonRecord;
    captured.push({
      model: body.model,
      messages: body.messages,
      system: body.system,
      stream: body.stream,
    });

    if (args.handler) {
      await args.handler({ req, res, body, captured });
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        id: "test-openai-1",
        object: "chat.completion",
        choices: [{ index: 0, message: { role: "assistant", content: "ok" } }],
      }),
    );
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("failed to bind test server");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await args.run({ baseUrl, captured });
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

function createEmitCollector(): {
  emitEvent: (event: AiStreamEvent) => void;
  events: AiStreamEvent[];
} {
  const events: AiStreamEvent[] = [];
  return {
    emitEvent: (event) => {
      events.push(event);
    },
    events,
  };
}

{
  await withOpenAiStubServer({
    run: async ({ baseUrl, captured }) => {
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "sk-test-key",
        },
      });

      const stream = createEmitCollector();
      const result = await ai.runSkill({
        skillId: "builtin:polish",
        input: "hello",
        stream: false,
        ts: Date.now(),
        emitEvent: stream.emitEvent,
        model: "gpt-5.2",
        mode: "ask",
      });

      assert.equal(result.ok, true);
      assert.equal(captured.length, 1);
      assert.equal(captured[0]?.model, "gpt-5.2");
    },
  });
}

{
  await withOpenAiStubServer({
    handler: ({ res }) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          id: "test-openai-array-content-1",
          object: "chat.completion",
          choices: [
            {
              index: 0,
              message: {
                role: "assistant",
                content: [{ type: "text", text: "array-content-ok" }],
              },
            },
          ],
        }),
      );
    },
    run: async ({ baseUrl }) => {
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "sk-test-key",
        },
      });

      const stream = createEmitCollector();
      const result = await ai.runSkill({
        skillId: "builtin:polish",
        input: "hello",
        stream: false,
        ts: Date.now(),
        emitEvent: stream.emitEvent,
        model: "gpt-5.2",
        mode: "ask",
      });

      assert.equal(result.ok, true);
      if (!result.ok) {
        return;
      }
      assert.equal(result.data.outputText, "array-content-ok");
    },
  });
}

{
  await withOpenAiStubServer({
    run: async ({ baseUrl, captured }) => {
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "sk-test-key",
        },
      });

      const stream = createEmitCollector();
      const result = await ai.runSkill({
        skillId: "builtin:polish",
        input: "hello",
        stream: false,
        ts: Date.now(),
        emitEvent: stream.emitEvent,
        model: "gpt-5.2",
        mode: "plan",
        systemPrompt: "base-system",
      });

      assert.equal(result.ok, true);
      assert.equal(captured.length, 1);

      const messages = captured[0]?.messages;
      assert.equal(Array.isArray(messages), true);

      const first = Array.isArray(messages) ? asRecord(messages[0]) : null;
      assert.equal(first?.role, "system");
      const systemText =
        typeof first?.content === "string" ? first.content : "";
      assert.equal(systemText.includes("base-system"), true);
      assert.equal(systemText.includes("Mode: plan"), true);
    },
  });
}

{
  await withOpenAiStubServer({
    endpointPath: "/api/v1/chat/completions",
    run: async ({ baseUrl, captured }) => {
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: `${baseUrl}/api/v1`,
          CREONOW_AI_API_KEY: "sk-test-key",
        },
      });

      const stream = createEmitCollector();
      const result = await ai.runSkill({
        skillId: "builtin:polish",
        input: "hello",
        stream: false,
        ts: Date.now(),
        emitEvent: stream.emitEvent,
        model: "gpt-5.2",
        mode: "ask",
      });

      assert.equal(result.ok, true);
      assert.equal(captured.length, 1);
      assert.equal(captured[0]?.model, "gpt-5.2");
    },
  });
}

{
  await withOpenAiStubServer({
    handler: ({ res }) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!DOCTYPE html><html><body>not json</body></html>");
    },
    run: async ({ baseUrl }) => {
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "sk-test-key",
        },
      });

      const stream = createEmitCollector();
      const result = await ai.runSkill({
        skillId: "builtin:polish",
        input: "hello",
        stream: false,
        ts: Date.now(),
        emitEvent: stream.emitEvent,
        model: "gpt-5.2",
        mode: "ask",
      });

      assert.equal(result.ok, false);
      if (result.ok) {
        return;
      }

      assert.equal(result.error.code, "LLM_API_ERROR");
      assert.equal(result.error.message, "Non-JSON upstream response");
    },
  });
}
