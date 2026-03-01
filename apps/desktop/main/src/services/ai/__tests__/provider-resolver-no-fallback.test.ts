import assert from "node:assert/strict";

import type { Logger } from "../../../logging/logger";
import type { ProxySettings } from "../providerResolver";
import { createProviderResolver } from "../providerResolver";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

// AUD-C7-S3: resolver must not read legacy flat fields
{
  const resolver = createProviderResolver({
    logger: createLogger(),
    now: () => 1_000,
  });

  const legacyOnly = {
    enabled: false,
    providerMode: "openai-byok",
    openAiByokBaseUrl: "https://legacy-openai.example",
    openAiByokApiKey: "sk-legacy-only",
  } as unknown as ProxySettings;

  const resolved = await resolver.resolveProviderConfig({
    env: {},
    runtimeAiTimeoutMs: 30_000,
    getFakeServer: async () => {
      throw new Error("should not be called");
    },
    getProxySettings: () => legacyOnly,
  });

  assert.equal(resolved.ok, false);
  if (resolved.ok) {
    throw new Error("AUD-C7-S3: legacy-only settings must not resolve");
  }
  assert.equal(
    resolved.error.code,
    "AI_NOT_CONFIGURED",
    "AUD-C7-S3: missing canonical credentials should fail fast",
  );
}

// AUD-C7-S3: canonical nested fields drive primary and backup resolution
{
  const resolver = createProviderResolver({
    logger: createLogger(),
    now: () => 1_000,
  });

  const canonical: ProxySettings = {
    enabled: true,
    providerMode: "openai-byok",
    openAiCompatible: {
      baseUrl: "https://proxy.example",
      apiKey: "sk-proxy",
    },
    openAiByok: {
      baseUrl: "https://api.openai.com",
      apiKey: "sk-openai",
    },
    anthropicByok: {
      baseUrl: null,
      apiKey: null,
    },
  };

  const resolved = await resolver.resolveProviderConfig({
    env: {},
    runtimeAiTimeoutMs: 30_000,
    getFakeServer: async () => {
      throw new Error("should not be called");
    },
    getProxySettings: () => canonical,
  });

  assert.equal(resolved.ok, true);
  if (!resolved.ok) {
    throw new Error("AUD-C7-S3: canonical settings should resolve");
  }

  assert.equal(resolved.data.primary.provider, "openai");
  assert.equal(resolved.data.primary.baseUrl, "https://api.openai.com");
  assert.equal(resolved.data.primary.apiKey, "sk-openai");
}

// resolveSettingsBackupProvider uses the same canonical direct-read path
{
  const resolver = createProviderResolver({
    logger: createLogger(),
    now: () => 1_000,
  });

  const canonical: ProxySettings = {
    enabled: true,
    providerMode: "openai-byok",
    openAiCompatible: {
      baseUrl: "https://proxy.example",
      apiKey: "sk-proxy",
    },
    openAiByok: {
      baseUrl: "https://api.openai.com",
      apiKey: "sk-openai",
    },
    anthropicByok: {
      baseUrl: null,
      apiKey: null,
    },
  };

  const resolved = await resolver.resolveProviderConfig({
    env: {},
    runtimeAiTimeoutMs: 30_000,
    getFakeServer: async () => {
      throw new Error("should not be called");
    },
    getProxySettings: () => canonical,
  });

  assert.equal(resolved.ok, true);
  if (!resolved.ok) {
    throw new Error("backup resolution should succeed");
  }

  assert.ok(resolved.data.backup, "backup provider should be available");
  assert.equal(resolved.data.backup?.provider, "proxy");
  assert.equal(resolved.data.backup?.baseUrl, "https://proxy.example");
  assert.equal(resolved.data.backup?.apiKey, "sk-proxy");
}

// proxy disabled + explicit baseUrl + missing API key should fail as AI_NOT_CONFIGURED
{
  const resolver = createProviderResolver({
    logger: createLogger(),
    now: () => 1_000,
  });

  const resolved = await resolver.resolveProviderConfig({
    env: {
      CREONOW_E2E: "1",
      CREONOW_AI_PROVIDER: "anthropic",
      CREONOW_AI_BASE_URL: "http://127.0.0.1:9",
    },
    runtimeAiTimeoutMs: 30_000,
    getFakeServer: async () => {
      throw new Error("should not be called");
    },
  });

  assert.equal(resolved.ok, false);
  if (resolved.ok) {
    throw new Error("missing api key should fail when baseUrl is explicit");
  }
  assert.equal(resolved.error.code, "AI_NOT_CONFIGURED");
  assert.match(resolved.error.message, /api key/i);
}
