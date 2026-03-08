import assert from "node:assert/strict";

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

const db = createSettingsDb();
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

const secret = "sk-openai-byok-secret";

const updated = service.update({
  patch: {
    providerMode: "openai-byok",
    openAiByokBaseUrl: "https://api.openai.com",
    openAiByokApiKey: secret,
  },
});

assert.equal(updated.ok, true);

const row = db
  .prepare(
    "SELECT value_json AS valueJson FROM settings WHERE scope = ? AND key = ?",
  )
  .get("app", "creonow.ai.provider.openaiByok.apiKey") as
  | { valueJson: string }
  | undefined;

assert.ok(row, "expected provider API key setting to be persisted");

const storedValue = JSON.parse(row.valueJson) as string;
assert.notEqual(
  storedValue,
  secret,
  "API key must not be persisted as plaintext (safeStorage encrypted)",
);

const publicResult = service.get();
assert.equal(publicResult.ok, true);
if (!publicResult.ok) {
  throw new Error("unexpected get failure");
}
assert.equal(publicResult.data.openAiByokApiKeyConfigured, true);
assert.equal(
  Object.prototype.hasOwnProperty.call(publicResult.data, "openAiByokApiKey"),
  false,
  "public config must not return raw API key",
);

const invalidUpdate = service.update({
  patch: {
    providerMode: "openai-byok",
    openAiByokApiKey: "plain-text-key",
  },
});

assert.equal(invalidUpdate.ok, false);
if (invalidUpdate.ok) {
  throw new Error("expected invalid API key format to be rejected");
}
assert.equal(invalidUpdate.error.code, "INVALID_ARGUMENT");
