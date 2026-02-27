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
  let transientFailures = 0;
  let totalCalls = 0;

  globalThis.fetch = (async (
    _input: URL | RequestInfo,
    _init?: RequestInit,
  ) => {
    totalCalls += 1;
    if (transientFailures < 2) {
      transientFailures += 1;
      throw new TypeError("temporary network failure");
    }

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "retry-success",
            },
          },
        ],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  }) as typeof fetch;

  const service = createAiService({
    logger: createLogger(),
    env: {},
    sleep: async () => {},
    getProxySettings: () => ({
      enabled: false,
      providerMode: "openai-byok",
      openAiByok: {
        baseUrl: "https://api.openai.com",
        apiKey: "sk-byok",
      },
    }),
  });

  const retryResult = await service.runSkill({
    skillId: "builtin:polish",
    input: "hello",
    mode: "ask",
    model: "gpt-4o",
    stream: false,
    ts: Date.now(),
    emitEvent: () => {},
  });

  assert.equal(retryResult.ok, true, "network flake should recover by retry");
  assert.equal(totalCalls, 3, "should attempt 1 + 2 retries");

  let hitRateLimit = false;
  for (let i = 0; i < 61; i += 1) {
    const res = await service.runSkill({
      skillId: "builtin:polish",
      input: `req-${i}`,
      mode: "ask",
      model: "gpt-4o",
      stream: false,
      ts: Date.now(),
      emitEvent: () => {},
    });

    if (!res.ok && res.error.code === "AI_RATE_LIMITED") {
      hitRateLimit = true;
      break;
    }
  }

  assert.equal(hitRateLimit, true, "should enforce default 60 req/min limit");
} finally {
  globalThis.fetch = originalFetch;
}
