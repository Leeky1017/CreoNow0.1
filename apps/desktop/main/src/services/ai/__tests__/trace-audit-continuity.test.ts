import assert from "node:assert/strict";

import type { Logger } from "../../../logging/logger";
import { createAiService } from "../aiService";

type LogEntry = {
  name: string;
  payload: unknown;
};

function asRecord(x: unknown): Record<string, unknown> | null {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    return null;
  }
  return x as Record<string, unknown>;
}

const primaryBaseUrl = "https://primary.trace.example.com";
const backupBaseUrl = "https://backup.trace.example.com";

const originalFetch = globalThis.fetch;

try {
  let nowMs = 0;
  let primaryCalls = 0;
  const logs: LogEntry[] = [];

  const logger: Logger = {
    logPath: "<test>",
    info: (name, payload) => {
      logs.push({ name, payload });
    },
    error: () => {},
  };

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
          choices: [{ message: { content: "primary-recovered" } }],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      );
    }

    if (url.startsWith(`${backupBaseUrl}/v1/messages`)) {
      return new Response(
        JSON.stringify({
          content: [{ text: "backup-path" }],
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
    logger,
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
      input: "trace-case",
      mode: "ask",
      model: "gpt-5.2",
      context: { projectId: "trace-project", documentId: "doc-1" },
      stream: false,
      ts: nowMs,
      emitEvent: () => {},
    });

  await runOnce();
  await runOnce();
  const degradedRun = await runOnce();
  assert.equal(
    degradedRun.ok,
    true,
    "degraded run should recover through backup path",
  );

  nowMs += 15 * 60 * 1000 + 1;
  const recoveredRun = await runOnce();
  assert.equal(
    recoveredRun.ok,
    true,
    "half-open probe should recover primary provider",
  );

  const failover = logs.find((entry) => entry.name === "ai_provider_failover");
  if (!failover) {
    assert.fail("missing ai_provider_failover audit log");
  }

  const halfOpen = logs.find(
    (entry) => entry.name === "ai_provider_half_open_probe",
  );
  if (!halfOpen) {
    assert.fail("missing ai_provider_half_open_probe audit log");
  }

  const recovered = logs.find(
    (entry) => entry.name === "ai_provider_recovered",
  );
  if (!recovered) {
    assert.fail("missing ai_provider_recovered audit log");
  }

  const startedTraceIds = new Set(
    logs
      .filter((entry) => entry.name === "ai_run_started")
      .map((entry) => {
        const payload = asRecord(entry.payload);
        return typeof payload?.traceId === "string" ? payload.traceId : "";
      })
      .filter((traceId) => traceId.length > 0),
  );

  const failoverPayload = asRecord(failover.payload);
  const halfOpenPayload = asRecord(halfOpen.payload);
  const recoveredPayload = asRecord(recovered.payload);

  assert.equal(typeof failoverPayload?.traceId, "string");
  assert.equal(typeof halfOpenPayload?.traceId, "string");
  assert.equal(typeof recoveredPayload?.traceId, "string");
  assert.equal(startedTraceIds.has(String(failoverPayload?.traceId)), true);
  assert.equal(startedTraceIds.has(String(halfOpenPayload?.traceId)), true);
  assert.equal(startedTraceIds.has(String(recoveredPayload?.traceId)), true);
} finally {
  globalThis.fetch = originalFetch;
}
