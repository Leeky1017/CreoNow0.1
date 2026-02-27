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

const primaryBaseUrl = "https://primary.example.com";
const backupBaseUrl = "https://backup.example.com";

const originalFetch = globalThis.fetch;

try {
  let nowMs = 0;
  let primaryCalls = 0;
  let backupCalls = 0;

  globalThis.fetch = (async (input: URL | RequestInfo, _init?: RequestInit) => {
    const url = String(input);

    if (url.startsWith(`${primaryBaseUrl}/v1/chat/completions`)) {
      primaryCalls += 1;

      if (primaryCalls <= 3) {
        return new Response(
          JSON.stringify({ error: { message: "primary unavailable" } }),
          {
            status: 503,
            headers: { "content-type": "application/json" },
          },
        );
      }

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "primary-ok" } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (url.startsWith(`${backupBaseUrl}/v1/messages`)) {
      backupCalls += 1;
      return new Response(
        JSON.stringify({
          content: [{ text: "backup-ok" }],
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
    now: () => nowMs,
    sleep: async () => {},
    rateLimitPerMinute: 1_000,
    getProxySettings: () => ({
      enabled: false,
      providerMode: "openai-byok",
      openAiCompatible: {
        baseUrl: null,
        apiKey: null,
      },
      openAiByok: {
        baseUrl: primaryBaseUrl,
        apiKey: "sk-primary",
      },
      anthropicByok: {
        baseUrl: backupBaseUrl,
        apiKey: "sk-backup",
      },
    }),
  });

  const runOnce = async () =>
    await service.runSkill({
      skillId: "builtin:polish",
      input: "hello",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId: "project-failover", documentId: "doc-1" },
      stream: false,
      ts: nowMs,
      emitEvent: () => {},
    });

  const first = await runOnce();
  assert.equal(first.ok, false);

  const second = await runOnce();
  assert.equal(second.ok, false);

  const third = await runOnce();
  assert.equal(
    third.ok,
    true,
    "third failure should trigger provider failover and succeed via backup",
  );
  assert.equal(backupCalls > 0, true, "backup provider should be called");

  nowMs += 15 * 60 * 1000 + 1;

  const fourth = await runOnce();
  assert.equal(
    fourth.ok,
    true,
    "after half-open window, primary probe should recover provider",
  );
} finally {
  globalThis.fetch = originalFetch;
}
