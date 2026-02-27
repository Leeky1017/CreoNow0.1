import assert from "node:assert/strict";

import type { Logger } from "../../../logging/logger";
import { createAiService } from "../aiService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

const originalFetch = globalThis.fetch;

try {
  globalThis.fetch = (async (input: URL | RequestInfo) => {
    const url = String(input);
    if (url.includes("/v1/chat/completions")) {
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "contract-ok" } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (url.includes("/v1/models")) {
      return new Response(
        JSON.stringify({
          data: [{ id: "gpt-5.2", name: "GPT-5.2" }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    return new Response("unexpected url", { status: 500 });
  }) as typeof fetch;

  const service = createAiService({
    logger: createLogger(),
    env: {},
    sleep: async () => {},
    rateLimitPerMinute: 1_000,
    getProxySettings: () => ({
      enabled: false,
      providerMode: "openai-byok",
      openAiByok: {
        baseUrl: "https://api.openai.com",
        apiKey: "sk-contract",
      },
    }),
  });

  assert.deepEqual(Object.keys(service).sort(), [
    "cancel",
    "feedback",
    "listModels",
    "runSkill",
  ]);

  const run = await service.runSkill({
    skillId: "builtin:polish",
    input: "hello",
    mode: "ask",
    model: "gpt-5.2",
    stream: false,
    ts: 1_700_000_000_000,
    emitEvent: () => {},
  });

  assert.equal(
    run.ok,
    true,
    "AI-S1-ASE-S3: runSkill contract must remain compatible",
  );
  if (!run.ok) {
    throw new Error("runSkill should succeed");
  }
  assert.equal(typeof run.data.runId, "string");
  assert.equal(typeof run.data.executionId, "string");
  assert.equal(run.data.outputText, "contract-ok");

  const canceled = service.cancel({
    executionId: run.data.executionId,
    ts: 1_700_000_000_001,
  });
  assert.equal(canceled.ok, true);
  assert.deepEqual(canceled, { ok: true, data: { canceled: true } });

  const cancelInvalid = service.cancel({
    executionId: "   ",
    ts: 1_700_000_000_002,
  });
  assert.equal(cancelInvalid.ok, false);
  if (cancelInvalid.ok) {
    throw new Error("cancel with empty id must fail");
  }
  assert.equal(cancelInvalid.error.code, "INVALID_ARGUMENT");

  const models = await service.listModels();
  assert.equal(
    models.ok,
    true,
    "AI-S1-ASE-S3: listModels envelope should remain unchanged",
  );
  if (!models.ok) {
    throw new Error("listModels should succeed");
  }
  assert.equal(models.data.source, "openai");
  assert.deepEqual(models.data.items, [
    { id: "gpt-5.2", name: "GPT-5.2", provider: "OpenAI" },
  ]);
} finally {
  globalThis.fetch = originalFetch;
}
