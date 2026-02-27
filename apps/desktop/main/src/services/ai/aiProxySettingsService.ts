import type Database from "better-sqlite3";

import type { IpcErrorCode } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type AiProxySettings = {
  enabled: boolean;
  baseUrl: string;
  apiKeyConfigured: boolean;
  providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
  openAiCompatibleBaseUrl: string;
  openAiCompatibleApiKeyConfigured: boolean;
  openAiByokBaseUrl: string;
  openAiByokApiKeyConfigured: boolean;
  anthropicByokBaseUrl: string;
  anthropicByokApiKeyConfigured: boolean;
};

export type AiProxySettingsRaw = {
  enabled: boolean;
  baseUrl: string | null;
  apiKey: string | null;
  providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
  openAiCompatibleBaseUrl: string | null;
  openAiCompatibleApiKey: string | null;
  openAiByokBaseUrl: string | null;
  openAiByokApiKey: string | null;
  anthropicByokBaseUrl: string | null;
  anthropicByokApiKey: string | null;
};

export type AiProxySettingsService = {
  get: () => ServiceResult<AiProxySettings>;
  getRaw: () => ServiceResult<AiProxySettingsRaw>;
  update: (args: {
    patch: Partial<{
      enabled: boolean;
      baseUrl: string;
      apiKey: string;
      providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
      openAiCompatibleBaseUrl: string;
      openAiCompatibleApiKey: string;
      openAiByokBaseUrl: string;
      openAiByokApiKey: string;
      anthropicByokBaseUrl: string;
      anthropicByokApiKey: string;
    }>;
  }) => ServiceResult<AiProxySettings>;
  test: () => Promise<
    ServiceResult<{
      ok: boolean;
      latencyMs: number;
      error?: { code: IpcErrorCode; message: string };
    }>
  >;
};

export type SecretStorageAdapter = {
  isEncryptionAvailable: () => boolean;
  encryptString: (plainText: string) => Buffer;
  decryptString: (cipherText: Buffer) => string;
};

const SETTINGS_SCOPE = "app" as const;
const KEY_ENABLED = "creonow.ai.proxy.enabled" as const;
const KEY_BASE_URL = "creonow.ai.proxy.baseUrl" as const;
const KEY_API_KEY = "creonow.ai.proxy.apiKey" as const;
const KEY_PROVIDER_MODE = "creonow.ai.provider.mode" as const;
const KEY_OA_COMPAT_BASE_URL =
  "creonow.ai.provider.openaiCompatible.baseUrl" as const;
const KEY_OA_COMPAT_API_KEY =
  "creonow.ai.provider.openaiCompatible.apiKey" as const;
const KEY_OA_BYOK_BASE_URL = "creonow.ai.provider.openaiByok.baseUrl" as const;
const KEY_OA_BYOK_API_KEY = "creonow.ai.provider.openaiByok.apiKey" as const;
const KEY_ANTH_BYOK_BASE_URL =
  "creonow.ai.provider.anthropicByok.baseUrl" as const;
const KEY_ANTH_BYOK_API_KEY =
  "creonow.ai.provider.anthropicByok.apiKey" as const;
const ENCRYPTED_SECRET_PREFIX = "__safe_storage_v1__:";

function nowTs(): number {
  return Date.now();
}

type SettingsRow = { valueJson: string };

function readSetting(db: Database.Database, key: string): unknown | null {
  const row = db
    .prepare<
      [string, string],
      SettingsRow
    >("SELECT value_json as valueJson FROM settings WHERE scope = ? AND key = ?")
    .get(SETTINGS_SCOPE, key);
  if (!row) {
    return null;
  }
  try {
    return JSON.parse(row.valueJson) as unknown;
  } catch {
    return null;
  }
}

function writeSetting(
  db: Database.Database,
  key: string,
  value: unknown,
  ts: number,
): void {
  db.prepare(
    "INSERT INTO settings (scope, key, value_json, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(scope, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at",
  ).run(SETTINGS_SCOPE, key, JSON.stringify(value), ts);
}

function normalizeBaseUrl(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return trimmed;
  } catch {
    return null;
  }
}

function normalizeApiKey(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Encrypt API key text for DB persistence.
 *
 * Why: P0 security baseline forbids plaintext API keys on disk.
 */
function encryptApiKey(args: {
  value: string | null;
  secretStorage?: SecretStorageAdapter;
}): ServiceResult<string | null> {
  if (args.value === null) {
    return { ok: true, data: null };
  }

  if (!args.secretStorage || !args.secretStorage.isEncryptionAvailable()) {
    return ipcError(
      "UNSUPPORTED",
      "safeStorage is required to persist API key securely",
    );
  }

  try {
    const encrypted = args.secretStorage.encryptString(args.value);
    return {
      ok: true,
      data: `${ENCRYPTED_SECRET_PREFIX}${encrypted.toString("base64")}`,
    };
  } catch {
    return ipcError("INTERNAL", "Failed to encrypt API key");
  }
}

/**
 * Decrypt API key text read from DB.
 *
 * Why: keys are persisted encrypted, but in-memory callers need plaintext.
 */
function decryptApiKey(args: {
  value: unknown;
  secretStorage?: SecretStorageAdapter;
  logger: Logger;
  field: string;
}): string | null {
  if (typeof args.value !== "string") {
    return null;
  }

  const trimmed = args.value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (!trimmed.startsWith(ENCRYPTED_SECRET_PREFIX)) {
    return normalizeApiKey(trimmed);
  }

  if (!args.secretStorage || !args.secretStorage.isEncryptionAvailable()) {
    args.logger.error("ai_proxy_settings_secret_decrypt_unavailable", {
      field: args.field,
    });
    return null;
  }

  try {
    const encoded = trimmed.slice(ENCRYPTED_SECRET_PREFIX.length);
    const encrypted = Buffer.from(encoded, "base64");
    return normalizeApiKey(args.secretStorage.decryptString(encrypted));
  } catch {
    args.logger.error("ai_proxy_settings_secret_decrypt_failed", {
      field: args.field,
    });
    return null;
  }
}

function normalizeProviderMode(
  raw: unknown,
): "openai-compatible" | "openai-byok" | "anthropic-byok" {
  if (
    raw === "openai-compatible" ||
    raw === "openai-byok" ||
    raw === "anthropic-byok"
  ) {
    return raw;
  }
  return "openai-compatible";
}

function joinApiPath(args: { baseUrl: string; endpointPath: string }): string {
  const base = new URL(args.baseUrl);
  const endpoint = args.endpointPath.startsWith("/")
    ? args.endpointPath
    : `/${args.endpointPath}`;

  if (!base.pathname.endsWith("/")) {
    base.pathname = `${base.pathname}/`;
  }

  const basePathNoSlash = base.pathname.endsWith("/")
    ? base.pathname.slice(0, -1)
    : base.pathname;
  const normalizedEndpoint =
    basePathNoSlash.endsWith("/v1") && endpoint.startsWith("/v1/")
      ? endpoint.slice(3)
      : endpoint;

  return new URL(normalizedEndpoint.slice(1), base.toString()).toString();
}

function readRawSettings(args: {
  db: Database.Database;
  logger: Logger;
  secretStorage?: SecretStorageAdapter;
}): AiProxySettingsRaw {
  const enabled = readSetting(args.db, KEY_ENABLED);
  const baseUrl = readSetting(args.db, KEY_BASE_URL);
  const apiKey = readSetting(args.db, KEY_API_KEY);
  const providerMode = readSetting(args.db, KEY_PROVIDER_MODE);
  const openAiCompatibleBaseUrl = readSetting(args.db, KEY_OA_COMPAT_BASE_URL);
  const openAiCompatibleApiKey = readSetting(args.db, KEY_OA_COMPAT_API_KEY);
  const openAiByokBaseUrl = readSetting(args.db, KEY_OA_BYOK_BASE_URL);
  const openAiByokApiKey = readSetting(args.db, KEY_OA_BYOK_API_KEY);
  const anthropicByokBaseUrl = readSetting(args.db, KEY_ANTH_BYOK_BASE_URL);
  const anthropicByokApiKey = readSetting(args.db, KEY_ANTH_BYOK_API_KEY);

  const normalizedLegacyBaseUrl = normalizeBaseUrl(baseUrl);
  const normalizedLegacyApiKey = decryptApiKey({
    value: apiKey,
    secretStorage: args.secretStorage,
    logger: args.logger,
    field: KEY_API_KEY,
  });

  return {
    enabled: enabled === true,
    baseUrl: normalizedLegacyBaseUrl,
    apiKey: normalizedLegacyApiKey,
    providerMode: normalizeProviderMode(providerMode),
    openAiCompatibleBaseUrl:
      normalizeBaseUrl(openAiCompatibleBaseUrl) ?? normalizedLegacyBaseUrl,
    openAiCompatibleApiKey:
      decryptApiKey({
        value: openAiCompatibleApiKey,
        secretStorage: args.secretStorage,
        logger: args.logger,
        field: KEY_OA_COMPAT_API_KEY,
      }) ?? normalizedLegacyApiKey,
    openAiByokBaseUrl:
      normalizeBaseUrl(openAiByokBaseUrl) ?? normalizedLegacyBaseUrl,
    openAiByokApiKey:
      decryptApiKey({
        value: openAiByokApiKey,
        secretStorage: args.secretStorage,
        logger: args.logger,
        field: KEY_OA_BYOK_API_KEY,
      }) ?? normalizedLegacyApiKey,
    anthropicByokBaseUrl: normalizeBaseUrl(anthropicByokBaseUrl),
    anthropicByokApiKey: decryptApiKey({
      value: anthropicByokApiKey,
      secretStorage: args.secretStorage,
      logger: args.logger,
      field: KEY_ANTH_BYOK_API_KEY,
    }),
  };
}

function toPublic(raw: AiProxySettingsRaw): AiProxySettings {
  return {
    enabled: raw.enabled,
    baseUrl: raw.baseUrl ?? "",
    apiKeyConfigured: typeof raw.apiKey === "string" && raw.apiKey.length > 0,
    providerMode: raw.providerMode,
    openAiCompatibleBaseUrl: raw.openAiCompatibleBaseUrl ?? "",
    openAiCompatibleApiKeyConfigured:
      typeof raw.openAiCompatibleApiKey === "string" &&
      raw.openAiCompatibleApiKey.length > 0,
    openAiByokBaseUrl: raw.openAiByokBaseUrl ?? "",
    openAiByokApiKeyConfigured:
      typeof raw.openAiByokApiKey === "string" &&
      raw.openAiByokApiKey.length > 0,
    anthropicByokBaseUrl: raw.anthropicByokBaseUrl ?? "",
    anthropicByokApiKeyConfigured:
      typeof raw.anthropicByokApiKey === "string" &&
      raw.anthropicByokApiKey.length > 0,
  };
}

/**
 * Create an AI proxy settings service backed by the main SQLite DB.
 */
export function createAiProxySettingsService(deps: {
  db: Database.Database;
  logger: Logger;
  secretStorage?: SecretStorageAdapter;
}): AiProxySettingsService {
  function getRaw(): ServiceResult<AiProxySettingsRaw> {
    try {
      return {
        ok: true,
        data: readRawSettings({
          db: deps.db,
          logger: deps.logger,
          secretStorage: deps.secretStorage,
        }),
      };
    } catch (error) {
      deps.logger.error("ai_proxy_settings_get_failed", {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
      return ipcError("DB_ERROR", "Failed to read proxy settings");
    }
  }

  function get(): ServiceResult<AiProxySettings> {
    const raw = getRaw();
    return raw.ok ? { ok: true, data: toPublic(raw.data) } : raw;
  }

  function update(args: {
    patch: Partial<{
      enabled: boolean;
      baseUrl: string;
      apiKey: string;
      providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
      openAiCompatibleBaseUrl: string;
      openAiCompatibleApiKey: string;
      openAiByokBaseUrl: string;
      openAiByokApiKey: string;
      anthropicByokBaseUrl: string;
      anthropicByokApiKey: string;
    }>;
  }): ServiceResult<AiProxySettings> {
    const patchKeys = Object.keys(args.patch);
    if (patchKeys.length === 0) {
      return ipcError("INVALID_ARGUMENT", "patch is required");
    }

    const existing = getRaw();
    if (!existing.ok) {
      return existing;
    }

    const next: AiProxySettingsRaw = {
      enabled: args.patch.enabled ?? existing.data.enabled,
      baseUrl:
        typeof args.patch.baseUrl === "string"
          ? normalizeBaseUrl(args.patch.baseUrl)
          : existing.data.baseUrl,
      apiKey:
        typeof args.patch.apiKey === "string"
          ? normalizeApiKey(args.patch.apiKey)
          : existing.data.apiKey,
      providerMode: normalizeProviderMode(
        args.patch.providerMode ?? existing.data.providerMode,
      ),
      openAiCompatibleBaseUrl:
        typeof args.patch.openAiCompatibleBaseUrl === "string"
          ? normalizeBaseUrl(args.patch.openAiCompatibleBaseUrl)
          : existing.data.openAiCompatibleBaseUrl,
      openAiCompatibleApiKey:
        typeof args.patch.openAiCompatibleApiKey === "string"
          ? normalizeApiKey(args.patch.openAiCompatibleApiKey)
          : existing.data.openAiCompatibleApiKey,
      openAiByokBaseUrl:
        typeof args.patch.openAiByokBaseUrl === "string"
          ? normalizeBaseUrl(args.patch.openAiByokBaseUrl)
          : existing.data.openAiByokBaseUrl,
      openAiByokApiKey:
        typeof args.patch.openAiByokApiKey === "string"
          ? normalizeApiKey(args.patch.openAiByokApiKey)
          : existing.data.openAiByokApiKey,
      anthropicByokBaseUrl:
        typeof args.patch.anthropicByokBaseUrl === "string"
          ? normalizeBaseUrl(args.patch.anthropicByokBaseUrl)
          : existing.data.anthropicByokBaseUrl,
      anthropicByokApiKey:
        typeof args.patch.anthropicByokApiKey === "string"
          ? normalizeApiKey(args.patch.anthropicByokApiKey)
          : existing.data.anthropicByokApiKey,
    };

    if (next.providerMode !== "openai-compatible") {
      next.enabled = false;
    }

    if (next.enabled && !next.baseUrl) {
      return ipcError(
        "INVALID_ARGUMENT",
        "proxy baseUrl is required when proxy enabled",
      );
    }

    const ts = nowTs();

    const encryptedLegacyKey = encryptApiKey({
      value: next.apiKey,
      secretStorage: deps.secretStorage,
    });
    if (!encryptedLegacyKey.ok) {
      return encryptedLegacyKey;
    }

    const encryptedOpenAiCompatibleKey = encryptApiKey({
      value: next.openAiCompatibleApiKey,
      secretStorage: deps.secretStorage,
    });
    if (!encryptedOpenAiCompatibleKey.ok) {
      return encryptedOpenAiCompatibleKey;
    }

    const encryptedOpenAiByokKey = encryptApiKey({
      value: next.openAiByokApiKey,
      secretStorage: deps.secretStorage,
    });
    if (!encryptedOpenAiByokKey.ok) {
      return encryptedOpenAiByokKey;
    }

    const encryptedAnthropicByokKey = encryptApiKey({
      value: next.anthropicByokApiKey,
      secretStorage: deps.secretStorage,
    });
    if (!encryptedAnthropicByokKey.ok) {
      return encryptedAnthropicByokKey;
    }

    try {
      deps.db.transaction(() => {
        if (
          typeof args.patch.enabled === "boolean" ||
          typeof args.patch.providerMode === "string"
        ) {
          writeSetting(deps.db, KEY_ENABLED, next.enabled, ts);
        }
        if (typeof args.patch.baseUrl === "string") {
          writeSetting(deps.db, KEY_BASE_URL, next.baseUrl ?? "", ts);
        }
        if (typeof args.patch.apiKey === "string") {
          writeSetting(deps.db, KEY_API_KEY, encryptedLegacyKey.data ?? "", ts);
        }
        if (typeof args.patch.providerMode === "string") {
          writeSetting(deps.db, KEY_PROVIDER_MODE, next.providerMode, ts);
        }
        if (typeof args.patch.openAiCompatibleBaseUrl === "string") {
          writeSetting(
            deps.db,
            KEY_OA_COMPAT_BASE_URL,
            next.openAiCompatibleBaseUrl ?? "",
            ts,
          );
        }
        if (typeof args.patch.openAiCompatibleApiKey === "string") {
          writeSetting(
            deps.db,
            KEY_OA_COMPAT_API_KEY,
            encryptedOpenAiCompatibleKey.data ?? "",
            ts,
          );
        }
        if (typeof args.patch.openAiByokBaseUrl === "string") {
          writeSetting(
            deps.db,
            KEY_OA_BYOK_BASE_URL,
            next.openAiByokBaseUrl ?? "",
            ts,
          );
        }
        if (typeof args.patch.openAiByokApiKey === "string") {
          writeSetting(
            deps.db,
            KEY_OA_BYOK_API_KEY,
            encryptedOpenAiByokKey.data ?? "",
            ts,
          );
        }
        if (typeof args.patch.anthropicByokBaseUrl === "string") {
          writeSetting(
            deps.db,
            KEY_ANTH_BYOK_BASE_URL,
            next.anthropicByokBaseUrl ?? "",
            ts,
          );
        }
        if (typeof args.patch.anthropicByokApiKey === "string") {
          writeSetting(
            deps.db,
            KEY_ANTH_BYOK_API_KEY,
            encryptedAnthropicByokKey.data ?? "",
            ts,
          );
        }
      })();

      deps.logger.info("ai_proxy_settings_updated", {
        enabled: next.enabled,
        providerMode: next.providerMode,
        baseUrlConfigured: typeof next.baseUrl === "string",
        apiKeyConfigured: typeof next.apiKey === "string",
      });

      return { ok: true, data: toPublic(next) };
    } catch (error) {
      deps.logger.error("ai_proxy_settings_update_failed", {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
      return ipcError("DB_ERROR", "Failed to update proxy settings");
    }
  }

  async function testProxy(): Promise<
    ServiceResult<{
      ok: boolean;
      latencyMs: number;
      error?: { code: IpcErrorCode; message: string };
    }>
  > {
    const raw = getRaw();
    if (!raw.ok) {
      return raw;
    }
    if (!raw.data.enabled) {
      if (raw.data.providerMode === "openai-compatible") {
        return {
          ok: true,
          data: {
            ok: false,
            latencyMs: 0,
            error: { code: "INVALID_ARGUMENT", message: "proxy is disabled" },
          },
        };
      }
    }

    const mode = raw.data.providerMode;
    const targetBaseUrl =
      mode === "anthropic-byok"
        ? raw.data.anthropicByokBaseUrl
        : mode === "openai-byok"
          ? raw.data.openAiByokBaseUrl
          : raw.data.openAiCompatibleBaseUrl;
    const targetApiKey =
      mode === "anthropic-byok"
        ? raw.data.anthropicByokApiKey
        : mode === "openai-byok"
          ? raw.data.openAiByokApiKey
          : raw.data.openAiCompatibleApiKey;

    if (!targetBaseUrl) {
      return {
        ok: true,
        data: {
          ok: false,
          latencyMs: 0,
          error: {
            code: "AI_NOT_CONFIGURED",
            message: "请先在设置中配置 AI 服务",
          },
        },
      };
    }

    const start = nowTs();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2_000);
    try {
      const url = joinApiPath({
        baseUrl: targetBaseUrl,
        endpointPath: "/v1/models",
      });
      const res = await fetch(url, {
        method: "GET",
        headers:
          mode === "anthropic-byok"
            ? {
                ...(targetApiKey ? { "x-api-key": targetApiKey } : {}),
                "anthropic-version": "2023-06-01",
              }
            : targetApiKey
              ? { Authorization: `Bearer ${targetApiKey}` }
              : {},
        signal: controller.signal,
      });

      const latencyMs = nowTs() - start;
      if (res.ok) {
        return { ok: true, data: { ok: true, latencyMs } };
      }

      if (res.status === 401) {
        return {
          ok: true,
          data: {
            ok: false,
            latencyMs,
            error: { code: "AI_AUTH_FAILED", message: "Proxy unauthorized" },
          },
        };
      }
      if (res.status === 429) {
        return {
          ok: true,
          data: {
            ok: false,
            latencyMs,
            error: { code: "AI_RATE_LIMITED", message: "Proxy rate limited" },
          },
        };
      }
      return {
        ok: true,
        data: {
          ok: false,
          latencyMs,
          error: { code: "LLM_API_ERROR", message: "Proxy request failed" },
        },
      };
    } catch (error) {
      const latencyMs = nowTs() - start;
      return {
        ok: true,
        data: {
          ok: false,
          latencyMs,
          error: {
            code: controller.signal.aborted ? "TIMEOUT" : "LLM_API_ERROR",
            message: controller.signal.aborted
              ? "Proxy request timed out"
              : error instanceof Error
                ? error.message
                : String(error),
          },
        },
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  return { get, getRaw, update, test: testProxy };
}
