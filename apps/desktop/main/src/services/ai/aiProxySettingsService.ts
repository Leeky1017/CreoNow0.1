import type Database from "better-sqlite3";

import type { IpcErrorCode } from "@shared/types/ipc-generated";
import { nowTs } from "@shared/timeUtils";
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

type ProviderProxyCredentials = {
  baseUrl: string | null;
  apiKey: string | null;
};

export type AiProxySettingsRaw = {
  enabled: boolean;
  providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
  openAiCompatible: ProviderProxyCredentials;
  openAiByok: ProviderProxyCredentials;
  anthropicByok: ProviderProxyCredentials;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeProviderCredentials(args: {
  nested: unknown;
  flatBaseUrl?: unknown;
  flatApiKey?: unknown;
  fallbackBaseUrl?: unknown;
  fallbackApiKey?: unknown;
}): ProviderProxyCredentials {
  const nested = isRecord(args.nested) ? args.nested : null;
  return {
    baseUrl: normalizeBaseUrl(
      nested?.baseUrl ?? args.flatBaseUrl ?? args.fallbackBaseUrl,
    ),
    apiKey: normalizeApiKey(
      nested?.apiKey ?? args.flatApiKey ?? args.fallbackApiKey,
    ),
  };
}

export function normalizeProxySettings(raw: unknown): AiProxySettingsRaw {
  const data = isRecord(raw) ? raw : {};

  const legacyBaseUrl = normalizeBaseUrl(data.baseUrl);
  const legacyApiKey = normalizeApiKey(data.apiKey);

  return {
    enabled: data.enabled === true,
    providerMode: normalizeProviderMode(data.providerMode),
    openAiCompatible: normalizeProviderCredentials({
      nested: data.openAiCompatible,
      flatBaseUrl: data.openAiCompatibleBaseUrl,
      flatApiKey: data.openAiCompatibleApiKey,
      fallbackBaseUrl: legacyBaseUrl,
      fallbackApiKey: legacyApiKey,
    }),
    openAiByok: normalizeProviderCredentials({
      nested: data.openAiByok,
      flatBaseUrl: data.openAiByokBaseUrl,
      flatApiKey: data.openAiByokApiKey,
      fallbackBaseUrl: legacyBaseUrl,
      fallbackApiKey: legacyApiKey,
    }),
    anthropicByok: normalizeProviderCredentials({
      nested: data.anthropicByok,
      flatBaseUrl: data.anthropicByokBaseUrl,
      flatApiKey: data.anthropicByokApiKey,
    }),
  };
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

  return normalizeProxySettings({
    enabled: enabled === true,
    providerMode,
    baseUrl: normalizeBaseUrl(baseUrl),
    apiKey: decryptApiKey({
      value: apiKey,
      secretStorage: args.secretStorage,
      logger: args.logger,
      field: KEY_API_KEY,
    }),
    openAiCompatibleBaseUrl: normalizeBaseUrl(openAiCompatibleBaseUrl),
    openAiCompatibleApiKey: decryptApiKey({
      value: openAiCompatibleApiKey,
      secretStorage: args.secretStorage,
      logger: args.logger,
      field: KEY_OA_COMPAT_API_KEY,
    }),
    openAiByokBaseUrl: normalizeBaseUrl(openAiByokBaseUrl),
    openAiByokApiKey: decryptApiKey({
      value: openAiByokApiKey,
      secretStorage: args.secretStorage,
      logger: args.logger,
      field: KEY_OA_BYOK_API_KEY,
    }),
    anthropicByokBaseUrl: normalizeBaseUrl(anthropicByokBaseUrl),
    anthropicByokApiKey: decryptApiKey({
      value: anthropicByokApiKey,
      secretStorage: args.secretStorage,
      logger: args.logger,
      field: KEY_ANTH_BYOK_API_KEY,
    }),
  });
}

function toPublic(raw: AiProxySettingsRaw): AiProxySettings {
  return {
    enabled: raw.enabled,
    baseUrl: raw.openAiCompatible.baseUrl ?? "",
    apiKeyConfigured:
      typeof raw.openAiCompatible.apiKey === "string" &&
      raw.openAiCompatible.apiKey.length > 0,
    providerMode: raw.providerMode,
    openAiCompatibleBaseUrl: raw.openAiCompatible.baseUrl ?? "",
    openAiCompatibleApiKeyConfigured:
      typeof raw.openAiCompatible.apiKey === "string" &&
      raw.openAiCompatible.apiKey.length > 0,
    openAiByokBaseUrl: raw.openAiByok.baseUrl ?? "",
    openAiByokApiKeyConfigured:
      typeof raw.openAiByok.apiKey === "string" &&
      raw.openAiByok.apiKey.length > 0,
    anthropicByokBaseUrl: raw.anthropicByok.baseUrl ?? "",
    anthropicByokApiKeyConfigured:
      typeof raw.anthropicByok.apiKey === "string" &&
      raw.anthropicByok.apiKey.length > 0,
  };
}

type ProxyPatch = Parameters<AiProxySettingsService["update"]>[0]["patch"];

function mergeProxyPatch(patch: ProxyPatch, existing: AiProxySettingsRaw): AiProxySettingsRaw {
  return normalizeProxySettings({
    enabled: patch.enabled ?? existing.enabled,
    providerMode: normalizeProviderMode(patch.providerMode ?? existing.providerMode),
    openAiCompatible: {
      baseUrl:
        typeof patch.openAiCompatibleBaseUrl === "string" ? patch.openAiCompatibleBaseUrl
        : typeof patch.baseUrl === "string" ? patch.baseUrl
        : existing.openAiCompatible.baseUrl,
      apiKey:
        typeof patch.openAiCompatibleApiKey === "string" ? patch.openAiCompatibleApiKey
        : typeof patch.apiKey === "string" ? patch.apiKey
        : existing.openAiCompatible.apiKey,
    },
    openAiByok: {
      baseUrl: typeof patch.openAiByokBaseUrl === "string" ? patch.openAiByokBaseUrl : existing.openAiByok.baseUrl,
      apiKey: typeof patch.openAiByokApiKey === "string" ? patch.openAiByokApiKey : existing.openAiByok.apiKey,
    },
    anthropicByok: {
      baseUrl: typeof patch.anthropicByokBaseUrl === "string" ? patch.anthropicByokBaseUrl : existing.anthropicByok.baseUrl,
      apiKey: typeof patch.anthropicByokApiKey === "string" ? patch.anthropicByokApiKey : existing.anthropicByok.apiKey,
    },
  });
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

    const next: AiProxySettingsRaw = mergeProxyPatch(args.patch, existing.data);

    if (next.providerMode !== "openai-compatible") {
      next.enabled = false;
    }

    if (next.enabled && !next.openAiCompatible.baseUrl) {
      return ipcError(
        "INVALID_ARGUMENT",
        "proxy baseUrl is required when proxy enabled",
      );
    }

    const ts = nowTs();

    const encryptedOpenAiCompatibleKey = encryptApiKey({
      value: next.openAiCompatible.apiKey,
      secretStorage: deps.secretStorage,
    });
    if (!encryptedOpenAiCompatibleKey.ok) {
      return encryptedOpenAiCompatibleKey;
    }

    const encryptedOpenAiByokKey = encryptApiKey({
      value: next.openAiByok.apiKey,
      secretStorage: deps.secretStorage,
    });
    if (!encryptedOpenAiByokKey.ok) {
      return encryptedOpenAiByokKey;
    }

    const encryptedAnthropicByokKey = encryptApiKey({
      value: next.anthropicByok.apiKey,
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
        if (typeof args.patch.providerMode === "string") {
          writeSetting(deps.db, KEY_PROVIDER_MODE, next.providerMode, ts);
        }
        if (
          typeof args.patch.baseUrl === "string" ||
          typeof args.patch.openAiCompatibleBaseUrl === "string"
        ) {
          writeSetting(
            deps.db,
            KEY_OA_COMPAT_BASE_URL,
            next.openAiCompatible.baseUrl ?? "",
            ts,
          );
        }
        if (
          typeof args.patch.apiKey === "string" ||
          typeof args.patch.openAiCompatibleApiKey === "string"
        ) {
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
            next.openAiByok.baseUrl ?? "",
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
            next.anthropicByok.baseUrl ?? "",
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
        baseUrlConfigured: typeof next.openAiCompatible.baseUrl === "string",
        apiKeyConfigured: typeof next.openAiCompatible.apiKey === "string",
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
        ? raw.data.anthropicByok.baseUrl
        : mode === "openai-byok"
          ? raw.data.openAiByok.baseUrl
          : raw.data.openAiCompatible.baseUrl;
    const targetApiKey =
      mode === "anthropic-byok"
        ? raw.data.anthropicByok.apiKey
        : mode === "openai-byok"
          ? raw.data.openAiByok.apiKey
          : raw.data.openAiCompatible.apiKey;

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
