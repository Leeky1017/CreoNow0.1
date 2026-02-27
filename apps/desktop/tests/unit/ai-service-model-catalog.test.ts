import assert from "node:assert/strict";
import http from "node:http";

import { createAiService } from "../../main/src/services/ai/aiService";
import type { Logger } from "../../main/src/logging/logger";

function createNoopLogger(): Logger {
  return {
    logPath: "(unit-test)",
    info: () => {},
    error: () => {},
  };
}

async function withModelsServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const server = http.createServer((_req, res) => {
    if (_req.method !== "GET" || _req.url !== "/v1/models") {
      res.writeHead(404).end();
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        object: "list",
        data: [
          { id: "deepseek", name: "DeepSeek Chat" },
          { id: "gpt-5.2", name: "GPT 5.2" },
          { id: "deepseek", name: "Duplicate" },
        ],
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
    await run(baseUrl);
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

async function withCustomServer(args: {
  handler: http.RequestListener;
  run: (baseUrl: string) => Promise<void>;
}): Promise<void> {
  const server = http.createServer(args.handler);

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
    await args.run(baseUrl);
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

{
  await withModelsServer(async (baseUrl) => {
    const ai = createAiService({
      logger: createNoopLogger(),
      env: {
        CREONOW_AI_PROVIDER: "openai",
        CREONOW_AI_BASE_URL: baseUrl,
        CREONOW_AI_API_KEY: "test-key",
      },
    });

    const result = await ai.listModels();
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.data.source, "openai");
    assert.deepEqual(
      result.data.items.map((item) => item.id),
      ["deepseek", "gpt-5.2"],
    );
    assert.equal(result.data.items[0]?.provider, "OpenAI");
  });
}

{
  await withCustomServer({
    handler: (_req, res) => {
      if (_req.method !== "GET" || _req.url !== "/api/v1/models") {
        res.writeHead(404).end();
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: [{ id: "openrouter/test-model" }] }));
    },
    run: async (baseUrl) => {
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: `${baseUrl}/api/v1`,
          CREONOW_AI_API_KEY: "test-key",
        },
      });

      const result = await ai.listModels();
      assert.equal(result.ok, true);
      if (!result.ok) {
        return;
      }

      assert.equal(result.data.items[0]?.id, "openrouter/test-model");
    },
  });
}

{
  await withCustomServer({
    handler: (_req, res) => {
      if (_req.method !== "GET" || _req.url !== "/v1/models") {
        res.writeHead(404).end();
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<!DOCTYPE html><html><body>not json</body></html>");
    },
    run: async (baseUrl) => {
      const ai = createAiService({
        logger: createNoopLogger(),
        env: {
          CREONOW_AI_PROVIDER: "openai",
          CREONOW_AI_BASE_URL: baseUrl,
          CREONOW_AI_API_KEY: "test-key",
        },
      });

      const result = await ai.listModels();
      assert.equal(result.ok, false);
      if (result.ok) {
        return;
      }

      assert.equal(result.error.code, "LLM_API_ERROR");
      assert.equal(result.error.message, "Non-JSON upstream response");
    },
  });
}

{
  await withModelsServer(async (baseUrl) => {
    const ai = createAiService({
      logger: createNoopLogger(),
      env: {},
      getProxySettings: () => ({
        enabled: true,
        providerMode: "openai-compatible",
        openAiCompatible: {
          baseUrl,
          apiKey: "proxy-key",
        },
      }),
    });

    const result = await ai.listModels();
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.data.source, "proxy");
    assert.equal(result.data.items.length > 0, true);
    assert.equal(result.data.items[0]?.provider, "Proxy");
  });
}
