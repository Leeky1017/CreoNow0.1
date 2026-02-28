import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../main/src/logging/logger";
import { createMemoryService } from "../../main/src/services/memory/memoryService";

type SettingsRow = {
  scope: string;
  key: string;
  valueJson: string;
};

function createDbStub(settings: SettingsRow[]): Database.Database {
  const db = {
    prepare: (sql: string) => {
      if (sql.includes("FROM settings WHERE scope = ? AND key = ?")) {
        return {
          get: (scope: string, key: string) => {
            const row = settings.find(
              (item) => item.scope === scope && item.key === key,
            );
            return row ? { valueJson: row.valueJson } : undefined;
          },
        };
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    },
  } as unknown as Database.Database;

  return db;
}

// Test: malformed settings JSON should fallback to default and emit error log.
{
  const errors: Array<{ event: string; data?: Record<string, unknown> }> = [];
  const logger: Logger = {
    logPath: "<test>",
    info: () => {},
    error: (event, data) => {
      errors.push({ event, data });
    },
  };

  const db = createDbStub([
    {
      scope: "app",
      key: "creonow.memory.injectionEnabled",
      valueJson: "{",
    },
    {
      scope: "app",
      key: "creonow.memory.preferenceLearningEnabled",
      valueJson: "false",
    },
    {
      scope: "app",
      key: "creonow.memory.privacyModeEnabled",
      valueJson: "true",
    },
    {
      scope: "app",
      key: "creonow.memory.preferenceLearningThreshold",
      valueJson: "5",
    },
  ]);

  const service = createMemoryService({ db, logger });
  const result = service.getSettings();

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("Expected getSettings to succeed");
  }

  assert.deepEqual(result.data, {
    injectionEnabled: true,
    preferenceLearningEnabled: false,
    privacyModeEnabled: true,
    preferenceLearningThreshold: 5,
  });

  assert.equal(errors.length, 1);
  assert.equal(errors[0]?.event, "memory_settings_read_failed");
  assert.equal(errors[0]?.data?.code, "INVALID_JSON");
  assert.equal(errors[0]?.data?.key, "creonow.memory.injectionEnabled");
}
