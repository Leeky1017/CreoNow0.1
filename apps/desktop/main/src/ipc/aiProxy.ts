import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcErrorCode, IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import {
  type SecretStorageAdapter,
  createAiProxySettingsService,
} from "../services/ai/aiProxySettingsService";
import { createDbNotReadyError } from "./dbError";

type ProxySettingsPatch = Partial<{
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

type NormalizeProxySettingsPatchResult =
  | {
      ok: true;
      patch: ProxySettingsPatch;
    }
  | {
      ok: false;
      unknownKeys: string[];
    };

const ALLOWED_PROXY_SETTINGS_PATCH_KEYS = new Set<string>([
  "enabled",
  "baseUrl",
  "apiKey",
  "providerMode",
  "openAiCompatibleBaseUrl",
  "openAiCompatibleApiKey",
  "openAiByokBaseUrl",
  "openAiByokApiKey",
  "anthropicByokBaseUrl",
  "anthropicByokApiKey",
]);

/**
 * Normalize renderer payload into a safe proxy-settings patch object.
 *
 * Why: malformed IPC payload must degrade to a deterministic INVALID_ARGUMENT
 * response from service.update instead of throwing at the IPC boundary.
 */
function normalizeProxySettingsPatch(
  payload: unknown,
): NormalizeProxySettingsPatchResult {
  if (!payload || typeof payload !== "object" || !("patch" in payload)) {
    return {
      ok: true,
      patch: {},
    };
  }
  const patch = (payload as { patch?: unknown }).patch;
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return {
      ok: true,
      patch: {},
    };
  }

  const unknownKeys = Object.keys(patch).filter(
    (key) => !ALLOWED_PROXY_SETTINGS_PATCH_KEYS.has(key),
  );
  if (unknownKeys.length > 0) {
    return {
      ok: false,
      unknownKeys,
    };
  }

  return {
    ok: true,
    patch: patch as ProxySettingsPatch,
  };
}

/**
 * Register `ai:config:*` IPC handlers.
 *
 * Why: renderer must not access secrets; proxy config is persisted in main DB
 * and queried via typed IPC.
 */
export function registerAiProxyIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  secretStorage?: SecretStorageAdapter;
}): void {
  deps.ipcMain.handle(
    "ai:config:get",
    async (): Promise<
      IpcResponse<{
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
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      const svc = createAiProxySettingsService({
        db: deps.db,
        logger: deps.logger,
        secretStorage: deps.secretStorage,
      });
      const res = svc.get();
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "ai:config:update",
    async (
      _e,
      payload: unknown,
    ): Promise<
      IpcResponse<{
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
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      const svc = createAiProxySettingsService({
        db: deps.db,
        logger: deps.logger,
        secretStorage: deps.secretStorage,
      });
      const normalizedPatch = normalizeProxySettingsPatch(payload);
      if (!normalizedPatch.ok) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: `unknown ai proxy patch fields: ${normalizedPatch.unknownKeys.join(", ")}`,
            details: {
              unknownKeys: normalizedPatch.unknownKeys,
            },
          },
        };
      }

      const res = svc.update({ patch: normalizedPatch.patch });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "ai:config:test",
    async (): Promise<
      IpcResponse<{
        ok: boolean;
        latencyMs: number;
        error?: { code: IpcErrorCode; message: string };
      }>
    > => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      const svc = createAiProxySettingsService({
        db: deps.db,
        logger: deps.logger,
        secretStorage: deps.secretStorage,
      });
      const res = await svc.test();
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}
