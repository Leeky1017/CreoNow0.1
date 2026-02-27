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

// --- runSkill maps missing provider credentials to AI_PROVIDER_UNAVAILABLE ---
{
  const originalFetch = globalThis.fetch;

  try {
    let fetchCalled = false;
    globalThis.fetch = (async () => {
      fetchCalled = true;
      return new Response("unexpected", { status: 500 });
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
          apiKey: null,
        },
      }),
    });

    const result = await service.runSkill({
      skillId: "builtin:polish",
      input: "hello",
      mode: "ask",
      model: "gpt-5.2",
      stream: false,
      ts: 1_700_000_000_000,
      emitEvent: () => {},
    });

    assert.equal(result.ok, false);
    if (result.ok) {
      throw new Error(
        "runSkill should fail when provider credentials are missing",
      );
    }

    assert.equal(result.error.code, "AI_PROVIDER_UNAVAILABLE");
    assert.equal(fetchCalled, false, "must fail before provider network call");
  } finally {
    globalThis.fetch = originalFetch;
  }
}
