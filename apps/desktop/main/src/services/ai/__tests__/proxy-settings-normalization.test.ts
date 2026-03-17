import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import { createAiProxySettingsService } from "../aiProxySettingsService";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createSettingsDb(): Database.Database {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE settings (
      scope TEXT NOT NULL,
      key TEXT NOT NULL,
      value_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (scope, key)
    )
  `);
  return db;
}

function encryptedValue(secret: string): string {
  return `__safe_storage_v1__:${Buffer.from(`encrypted:${secret}`, "utf8").toString("base64")}`;
}

function createServiceWithRows(rows: Array<{ key: string; value: unknown }>) {
  const db = createSettingsDb();
  const ts = Date.now();
  const insert = db.prepare(
    "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?)",
  );
  for (const row of rows) {
    insert.run("app", row.key, JSON.stringify(row.value), ts);
  }

  const service = createAiProxySettingsService({
    db,
    logger: createLogger(),
    secretStorage: {
      isEncryptionAvailable: () => true,
      encryptString: (plainText: string) =>
        Buffer.from(`encrypted:${plainText}`, "utf8"),
      decryptString: (cipherText: Buffer) => {
        const text = cipherText.toString("utf8");
        return text.startsWith("encrypted:")
          ? text.slice("encrypted:".length)
          : text;
      },
    },
  });

  return { db, service };
}

// AUD-C7-S1: legacy flat format -> canonical nested format
{
  const { service } = createServiceWithRows([
    { key: "creonow.ai.proxy.enabled", value: true },
    { key: "creonow.ai.provider.mode", value: "openai-compatible" },
    { key: "creonow.ai.proxy.baseUrl", value: "https://legacy-proxy.example" },
    { key: "creonow.ai.proxy.apiKey", value: encryptedValue("sk-legacy") },
  ]);

  const rawResult = service.getRaw();
  assert.equal(rawResult.ok, true, "AUD-C7-S1: getRaw should succeed");
  if (!rawResult.ok) {
    throw new Error("AUD-C7-S1: unexpected getRaw failure");
  }

  const raw = rawResult.data;
  assert.equal(raw.enabled, true);
  assert.equal(raw.providerMode, "openai-compatible");
  assert.equal(raw.openAiCompatible.baseUrl, "https://legacy-proxy.example");
  assert.equal(raw.openAiCompatible.apiKey, "sk-legacy");
  assert.equal(raw.openAiByok.baseUrl, "https://legacy-proxy.example");
  assert.equal(raw.openAiByok.apiKey, "sk-legacy");
}

// AUD-C7-S4: oldest format migration preserves all credentials
{
  const { service } = createServiceWithRows([
    { key: "creonow.ai.proxy.enabled", value: true },
    { key: "creonow.ai.provider.mode", value: "openai-byok" },
    { key: "creonow.ai.proxy.baseUrl", value: "https://legacy-root.example" },
    { key: "creonow.ai.proxy.apiKey", value: encryptedValue("sk-legacy-root") },
    {
      key: "creonow.ai.provider.openaiCompatible.baseUrl",
      value: "https://proxy.example",
    },
    {
      key: "creonow.ai.provider.openaiCompatible.apiKey",
      value: encryptedValue("sk-compat-01"),
    },
    {
      key: "creonow.ai.provider.openaiByok.baseUrl",
      value: "https://api.openai.com",
    },
    {
      key: "creonow.ai.provider.openaiByok.apiKey",
      value: encryptedValue("sk-byok-01"),
    },
    {
      key: "creonow.ai.provider.anthropicByok.baseUrl",
      value: "https://api.anthropic.com",
    },
    {
      key: "creonow.ai.provider.anthropicByok.apiKey",
      value: encryptedValue("sk-anthropic-01"),
    },
  ]);

  const rawResult = service.getRaw();
  assert.equal(rawResult.ok, true, "AUD-C7-S4: getRaw should succeed");
  if (!rawResult.ok) {
    throw new Error("AUD-C7-S4: unexpected getRaw failure");
  }

  const raw = rawResult.data;
  assert.equal(raw.openAiCompatible.baseUrl, "https://proxy.example");
  assert.equal(raw.openAiCompatible.apiKey, "sk-compat-01");
  assert.equal(raw.openAiByok.baseUrl, "https://api.openai.com");
  assert.equal(raw.openAiByok.apiKey, "sk-byok-01");
  assert.equal(raw.anthropicByok.baseUrl, "https://api.anthropic.com");
  assert.equal(raw.anthropicByok.apiKey, "sk-anthropic-01");
}

// AUD-C7-S5: missing fields don't crash, fill safe defaults
{
  const { service } = createServiceWithRows([
    { key: "creonow.ai.proxy.enabled", value: true },
    { key: "creonow.ai.proxy.baseUrl", value: "" },
  ]);

  const rawResult = service.getRaw();
  assert.equal(rawResult.ok, true, "AUD-C7-S5: getRaw should succeed");
  if (!rawResult.ok) {
    throw new Error("AUD-C7-S5: unexpected getRaw failure");
  }

  const raw = rawResult.data;
  assert.equal(raw.openAiCompatible.baseUrl, null);
  assert.equal(raw.openAiCompatible.apiKey, null);
  assert.equal(raw.openAiByok.baseUrl, null);
  assert.equal(raw.openAiByok.apiKey, null);
  assert.equal(raw.anthropicByok.baseUrl, null);
  assert.equal(raw.anthropicByok.apiKey, null);
}

// AUD-C7-S6: static scan — getRaw() has no legacy fallback patterns
{
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(
    path.join(dirname, "..", "aiProxySettingsService.ts"),
    "utf8",
  );
  const getRawMatch = source.match(
    /function getRaw\(\): ServiceResult<AiProxySettingsRaw> {([\s\S]*?)\n\s+}\n\n\s+function get\(\)/,
  );
  assert.ok(getRawMatch, "AUD-C7-S6: getRaw function must exist");
  const getRawBody = getRawMatch?.[1] ?? "";

  const forbiddenPatterns = [
    "normalizedLegacyBaseUrl",
    "normalizedLegacyApiKey",
    "openAiCompatibleBaseUrl",
    "openAiCompatibleApiKey",
    "openAiByokBaseUrl",
    "openAiByokApiKey",
    "anthropicByokBaseUrl",
    "anthropicByokApiKey",
  ];

  for (const pattern of forbiddenPatterns) {
    assert.equal(
      getRawBody.includes(pattern),
      false,
      `AUD-C7-S6: getRaw() must not contain legacy fallback pattern: ${pattern}`,
    );
  }
}
