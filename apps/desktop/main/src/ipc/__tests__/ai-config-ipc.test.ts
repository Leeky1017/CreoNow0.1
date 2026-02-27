import assert from "node:assert/strict";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import {
  type SecretStorageAdapter,
  createAiProxySettingsService,
} from "../../services/ai/aiProxySettingsService";
import { registerAiIpcHandlers } from "../ai";
import { registerAiProxyIpcHandlers } from "../aiProxy";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

type SettingsEntry = {
  valueJson: string;
  updatedAt: number;
};

class InMemorySettingsDb {
  private readonly rows = new Map<string, SettingsEntry>();

  prepare(sql: string): {
    get: (scope: string, key: string) => { valueJson: string } | undefined;
    run: (
      scope: string,
      key: string,
      valueJson: string,
      updatedAt: number,
    ) => unknown;
  } {
    if (sql.startsWith("SELECT")) {
      return {
        get: (scope: string, key: string) => {
          const row = this.rows.get(this.rowKey(scope, key));
          if (!row) {
            return undefined;
          }
          return { valueJson: row.valueJson };
        },
        run: () => undefined,
      };
    }

    if (sql.startsWith("INSERT INTO settings")) {
      return {
        get: () => undefined,
        run: (
          scope: string,
          key: string,
          valueJson: string,
          updatedAt: number,
        ) => {
          this.rows.set(this.rowKey(scope, key), { valueJson, updatedAt });
          return { changes: 1 };
        },
      };
    }

    throw new Error(`Unsupported SQL in test DB: ${sql}`);
  }

  transaction<T>(fn: () => T): () => T {
    return fn;
  }

  readJson(scope: string, key: string): unknown {
    const row = this.rows.get(this.rowKey(scope, key));
    if (!row) {
      return null;
    }
    return JSON.parse(row.valueJson) as unknown;
  }

  private rowKey(scope: string, key: string): string {
    return `${scope}::${key}`;
  }
}

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createSecretStorage(args?: {
  available?: boolean;
}): SecretStorageAdapter {
  return {
    isEncryptionAvailable: () => args?.available ?? true,
    encryptString: (plainText: string) =>
      Buffer.from(`encrypted:${plainText}`, "utf8"),
    decryptString: (cipherText: Buffer) => {
      const text = cipherText.toString("utf8");
      return text.startsWith("encrypted:")
        ? text.slice("encrypted:".length)
        : text;
    },
  };
}

function createIpcHarness(args?: { secretStorage?: SecretStorageAdapter }): {
  db: InMemorySettingsDb;
  invoke: <T>(channel: string, payload: unknown) => Promise<T>;
} {
  const db = new InMemorySettingsDb();
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  registerAiProxyIpcHandlers({
    ipcMain,
    db: db as unknown as Database.Database,
    logger: createLogger(),
    secretStorage: args?.secretStorage ?? createSecretStorage(),
  });

  return {
    db,
    invoke: async <T>(channel: string, payload: unknown): Promise<T> => {
      const handler = handlers.get(channel);
      assert.ok(handler, `expected IPC handler ${channel} to be registered`);
      return (await handler({}, payload)) as T;
    },
  };
}

function createAiCancelIpcHarness(): {
  invokeCancel: (payload: { executionId?: string; runId?: string }) => Promise<{
    ok: boolean;
    data?: { canceled: true };
    error?: { code?: string; message?: string };
  }>;
  deprecatedWarnings: Array<{ event: string; data?: Record<string, unknown> }>;
} {
  const handlers = new Map<string, Handler>();
  const deprecatedWarnings: Array<{
    event: string;
    data?: Record<string, unknown>;
  }> = [];
  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  registerAiIpcHandlers({
    ipcMain,
    db: null,
    userDataDir: "<test-user-data>",
    builtinSkillsDir: "<test-skills>",
    logger: {
      logPath: "<test>",
      info: (event, data) => {
        if (event === "deprecated_field") {
          deprecatedWarnings.push({ event, data });
        }
      },
      error: () => undefined,
    },
    env: process.env,
  });

  return {
    invokeCancel: async (payload) => {
      const handler = handlers.get("ai:skill:cancel");
      assert.ok(
        handler,
        "expected IPC handler ai:skill:cancel to be registered",
      );
      return (await handler({}, payload)) as {
        ok: boolean;
        data?: { canceled: true };
        error?: { code?: string; message?: string };
      };
    },
    deprecatedWarnings,
  };
}

async function runScenario(
  name: string,
  fn: () => Promise<void> | void,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function main(): Promise<void> {
  // S1
  await runScenario(
    "S1 should store and retrieve provider config",
    async () => {
      const harness = createIpcHarness();
      const updated = await harness.invoke<{
        ok: boolean;
        data?: {
          providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
          openAiByokApiKeyConfigured: boolean;
        };
      }>("ai:config:update", {
        patch: {
          providerMode: "openai-byok",
          openAiByokBaseUrl: "https://api.openai.com",
          openAiByokApiKey: "sk-test-abc123",
        },
      });

      assert.equal(updated.ok, true);
      assert.equal(updated.data?.providerMode, "openai-byok");
      assert.equal(updated.data?.openAiByokApiKeyConfigured, true);

      const got = await harness.invoke<{
        ok: boolean;
        data?: {
          providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
          openAiByokBaseUrl: string;
          openAiByokApiKeyConfigured: boolean;
        };
      }>("ai:config:get", {});

      assert.equal(got.ok, true);
      assert.equal(got.data?.providerMode, "openai-byok");
      assert.equal(got.data?.openAiByokBaseUrl, "https://api.openai.com");
      assert.equal(got.data?.openAiByokApiKeyConfigured, true);
      assert.equal(
        Object.prototype.hasOwnProperty.call(
          got.data ?? {},
          "openAiByokApiKey",
        ),
        false,
      );

      const storedCipher = harness.db.readJson(
        "app",
        "creonow.ai.provider.openaiByok.apiKey",
      );
      assert.equal(typeof storedCipher, "string");
      assert.match(String(storedCipher), /^__safe_storage_v1__:/);
    },
  );

  // S2
  await runScenario(
    "S2 should return apiKeyConfigured false when no key stored",
    async () => {
      const harness = createIpcHarness();
      const got = await harness.invoke<{
        ok: boolean;
        data?: {
          openAiByokApiKeyConfigured: boolean;
          anthropicByokApiKeyConfigured: boolean;
        };
      }>("ai:config:get", {});

      assert.equal(got.ok, true);
      assert.equal(got.data?.openAiByokApiKeyConfigured, false);
      assert.equal(got.data?.anthropicByokApiKeyConfigured, false);
    },
  );

  // S3
  await runScenario(
    "S3 should store different provider keys independently",
    async () => {
      const harness = createIpcHarness();
      await harness.invoke("ai:config:update", {
        patch: {
          providerMode: "openai-byok",
          openAiByokApiKey: "sk-openai",
        },
      });
      await harness.invoke("ai:config:update", {
        patch: {
          providerMode: "anthropic-byok",
          anthropicByokApiKey: "sk-anthropic",
        },
      });

      const got = await harness.invoke<{
        ok: boolean;
        data?: {
          openAiByokApiKeyConfigured: boolean;
          anthropicByokApiKeyConfigured: boolean;
        };
      }>("ai:config:get", {});

      assert.equal(got.ok, true);
      assert.equal(got.data?.openAiByokApiKeyConfigured, true);
      assert.equal(got.data?.anthropicByokApiKeyConfigured, true);
    },
  );

  // S4
  await runScenario("S4 should reject empty api key", () => {
    const db = new InMemorySettingsDb();
    const service = createAiProxySettingsService({
      db: db as unknown as Database.Database,
      logger: createLogger(),
      secretStorage: createSecretStorage(),
    });

    const updated = service.update({
      patch: { openAiByokApiKey: "   " },
    });
    assert.equal(updated.ok, true);

    const raw = service.getRaw();
    assert.equal(raw.ok, true);
    if (!raw.ok) {
      return;
    }
    assert.equal(raw.data.openAiByok.apiKey, null);
  });

  await runScenario(
    "Boundary should return INVALID_ARGUMENT when patch is missing",
    async () => {
      const harness = createIpcHarness();
      const updated = await harness.invoke<{
        ok: boolean;
        error?: { code?: string };
      }>("ai:config:update", {} as unknown);

      assert.equal(updated.ok, false);
      assert.equal(updated.error?.code, "INVALID_ARGUMENT");
    },
  );

  // S5
  await runScenario(
    "S5 should return UNSUPPORTED when encryption unavailable",
    async () => {
      const harness = createIpcHarness({
        secretStorage: createSecretStorage({ available: false }),
      });
      const updated = await harness.invoke<{
        ok: boolean;
        error?: { code?: string; message?: string };
      }>("ai:config:update", {
        patch: {
          openAiByokApiKey: "sk-test",
        },
      });

      assert.equal(updated.ok, false);
      assert.equal(updated.error?.code, "UNSUPPORTED");
      assert.match(
        updated.error?.message ?? "",
        /safeStorage is required to persist API key securely/,
      );
    },
  );

  // S6
  await runScenario(
    "S6 should return ok true when test connection succeeds",
    async () => {
      const harness = createIpcHarness();
      await harness.invoke("ai:config:update", {
        patch: {
          providerMode: "openai-byok",
          openAiByokBaseUrl: "https://api.openai.com",
          openAiByokApiKey: "sk-good",
        },
      });

      const originalFetch = globalThis.fetch;
      const fetchCalls: Array<{ url: string; authHeader?: string }> = [];
      globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
        fetchCalls.push({
          url: String(url),
          authHeader:
            typeof init?.headers === "object" &&
            init.headers &&
            "Authorization" in init.headers
              ? String(
                  (init.headers as Record<string, unknown>).Authorization ?? "",
                )
              : undefined,
        });
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      }) as typeof fetch;

      try {
        const tested = await harness.invoke<{
          ok: boolean;
          data?: { ok: boolean; latencyMs: number };
        }>("ai:config:test", {});

        assert.equal(tested.ok, true);
        assert.equal(tested.data?.ok, true);
        assert.equal(typeof tested.data?.latencyMs, "number");
        assert.equal(fetchCalls.length, 1);
        assert.equal(fetchCalls[0]?.url, "https://api.openai.com/v1/models");
        assert.equal(fetchCalls[0]?.authHeader, "Bearer sk-good");
      } finally {
        globalThis.fetch = originalFetch;
      }
    },
  );

  // S7
  await runScenario("S7 should return AI_AUTH_FAILED on 401", async () => {
    const harness = createIpcHarness();
    await harness.invoke("ai:config:update", {
      patch: {
        providerMode: "openai-byok",
        openAiByokBaseUrl: "https://api.openai.com",
        openAiByokApiKey: "sk-invalid-key",
      },
    });

    const originalFetch = globalThis.fetch;
    let fetchCalls = 0;
    globalThis.fetch = (async () => {
      fetchCalls += 1;
      return new Response("", {
        status: 401,
        headers: { "content-type": "text/plain" },
      });
    }) as typeof fetch;

    try {
      const tested = await harness.invoke<{
        ok: boolean;
        data?: {
          ok: boolean;
          error?: { code?: string };
        };
      }>("ai:config:test", {});

      assert.equal(tested.ok, true);
      assert.equal(tested.data?.ok, false);
      assert.equal(tested.data?.error?.code, "AI_AUTH_FAILED");
      assert.equal(fetchCalls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // S8
  await runScenario(
    "S8 should accept executionId without deprecated warning",
    async () => {
      const harness = createAiCancelIpcHarness();
      const canceled = await harness.invokeCancel({
        executionId: "exec-s2-new-field",
      });

      assert.equal(canceled.ok, true);
      assert.equal(canceled.data?.canceled, true);
      assert.equal(harness.deprecatedWarnings.length, 0);
    },
  );

  // S9
  await runScenario(
    "S9 should accept legacy runId and emit deprecated_field warning",
    async () => {
      const harness = createAiCancelIpcHarness();
      const canceled = await harness.invokeCancel({
        runId: "run-s2-legacy-field",
      });

      assert.equal(canceled.ok, true);
      assert.equal(canceled.data?.canceled, true);
      assert.equal(harness.deprecatedWarnings.length, 1);
      assert.equal(harness.deprecatedWarnings[0]?.event, "deprecated_field");
      assert.equal(harness.deprecatedWarnings[0]?.data?.field, "runId");
    },
  );

  // S10
  await runScenario(
    "S10 should prefer executionId when executionId and runId are both present",
    async () => {
      const harness = createAiCancelIpcHarness();
      const canceled = await harness.invokeCancel({
        executionId: "exec-s2-primary",
        runId: "run-s2-legacy-secondary",
      });

      assert.equal(canceled.ok, true);
      assert.equal(canceled.data?.canceled, true);
      assert.equal(harness.deprecatedWarnings.length, 0);
    },
  );
}

await main();
