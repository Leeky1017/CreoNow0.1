
import type { Logger } from "../../logging/logger";
import type { FakeAiServer } from "./fakeAiServer";
import { ipcError, type ServiceResult } from "../shared/ipcResult";

type AiProvider = "anthropic" | "openai" | "proxy";
type ProviderMode = "openai-compatible" | "openai-byok" | "anthropic-byok";

type ProviderCredentials = {
  baseUrl: string | null;
  apiKey: string | null;
};

export type ProxySettings = {
  enabled: boolean;
  providerMode?: ProviderMode;
  openAiCompatible?: ProviderCredentials;
  openAiByok?: ProviderCredentials;
  anthropicByok?: ProviderCredentials;
};

export type ProviderConfig = {
  provider: AiProvider;
  baseUrl: string;
  apiKey?: string;
  timeoutMs: number;
};

type ProviderResolution = {
  primary: ProviderConfig;
  backup: ProviderConfig | null;
};

type ProviderHealthState = {
  status: "healthy" | "degraded";
  consecutiveFailures: number;
  degradedAtMs: number | null;
};

const PROVIDER_FAILURE_THRESHOLD = 3;

function isE2E(env: NodeJS.ProcessEnv): boolean {
  return env.CREONOW_E2E === "1";
}

function parseProvider(env: NodeJS.ProcessEnv): AiProvider | null {
  const raw = env.CREONOW_AI_PROVIDER;
  if (raw === "anthropic" || raw === "openai" || raw === "proxy") {
    return raw;
  }
  return null;
}

function resolveSettingsProviderMode(settings: ProxySettings): ProviderMode {
  if (
    settings.providerMode === "openai-compatible" ||
    settings.providerMode === "openai-byok" ||
    settings.providerMode === "anthropic-byok"
  ) {
    return settings.providerMode;
  }
  return settings.enabled ? "openai-compatible" : "openai-byok";
}

function resolveSettingsProviderCredentials(args: {
  settings: ProxySettings;
  mode: ProviderMode;
}): {
  provider: AiProvider;
  credentials: ProviderCredentials;
} {
  const openAiCompatible: ProviderCredentials = args.settings.openAiCompatible ?? {
    baseUrl: null,
    apiKey: null,
  };

  const openAiByok: ProviderCredentials = args.settings.openAiByok ?? {
    baseUrl: null,
    apiKey: null,
  };

  const anthropicByok: ProviderCredentials = args.settings.anthropicByok ?? {
    baseUrl: null,
    apiKey: null,
  };

  if (args.mode === "anthropic-byok") {
    return {
      provider: "anthropic",
      credentials: anthropicByok,
    };
  }

  if (args.mode === "openai-byok") {
    return {
      provider: "openai",
      credentials: openAiByok,
    };
  }

  return {
    provider: "proxy",
    credentials: openAiCompatible,
  };
}

function buildProviderConfigFromCredentials(args: {
  provider: AiProvider;
  credentials: ProviderCredentials;
  timeoutMs: number;
  env: NodeJS.ProcessEnv;
}): ProviderConfig | null {
  const baseUrl =
    typeof args.credentials.baseUrl === "string"
      ? args.credentials.baseUrl.trim()
      : "";
  if (baseUrl.length === 0) {
    return null;
  }

  const apiKey =
    typeof args.credentials.apiKey === "string" &&
    args.credentials.apiKey.trim().length > 0
      ? args.credentials.apiKey
      : undefined;

  if (args.provider !== "proxy" && !isE2E(args.env) && !apiKey) {
    return null;
  }

  return {
    provider: args.provider,
    baseUrl,
    apiKey,
    timeoutMs: args.timeoutMs,
  };
}

function resolveSettingsBackupProvider(args: {
  settings: ProxySettings;
  primary: ProviderConfig;
  timeoutMs: number;
  env: NodeJS.ProcessEnv;
}): ProviderConfig | null {
  const openAiCompatible: ProviderCredentials = args.settings.openAiCompatible ?? {
    baseUrl: null,
    apiKey: null,
  };
  const openAiByok: ProviderCredentials = args.settings.openAiByok ?? {
    baseUrl: null,
    apiKey: null,
  };
  const anthropicByok: ProviderCredentials = args.settings.anthropicByok ?? {
    baseUrl: null,
    apiKey: null,
  };

  const candidates: ProviderConfig[] = [];

  const pushCandidate = (
    provider: AiProvider,
    credentials: ProviderCredentials,
  ) => {
    const cfg = buildProviderConfigFromCredentials({
      provider,
      credentials,
      timeoutMs: args.timeoutMs,
      env: args.env,
    });
    if (!cfg) {
      return;
    }
    if (
      cfg.provider === args.primary.provider &&
      cfg.baseUrl === args.primary.baseUrl &&
      cfg.apiKey === args.primary.apiKey
    ) {
      return;
    }
    candidates.push(cfg);
  };

  if (args.primary.provider !== "anthropic") {
    pushCandidate("anthropic", anthropicByok);
  }
  if (args.primary.provider !== "openai") {
    pushCandidate("openai", openAiByok);
  }

  const mode = resolveSettingsProviderMode(args.settings);
  if (
    args.primary.provider !== "proxy" &&
    (mode === "openai-compatible" || args.settings.enabled)
  ) {
    pushCandidate("proxy", openAiCompatible);
  }

  return candidates[0] ?? null;
}

export function createProviderResolver(deps: {
  logger: Logger;
  now?: () => number;
}) {
  const now = deps.now ?? (() => Date.now());
  const providerHealthByKey = new Map<string, ProviderHealthState>();

  const providerHealthKey = (cfg: ProviderConfig): string =>
    `${cfg.provider}:${cfg.baseUrl}`;

  const setProviderHealthState = (
    cfg: ProviderConfig,
    state: ProviderHealthState,
  ): void => {
    providerHealthByKey.set(providerHealthKey(cfg), state);
  };

  function getProviderHealthState(cfg: ProviderConfig): ProviderHealthState {
    const key = providerHealthKey(cfg);
    const existing = providerHealthByKey.get(key);
    if (existing) {
      return { ...existing };
    }

    const initial: ProviderHealthState = {
      status: "healthy",
      consecutiveFailures: 0,
      degradedAtMs: null,
    };
    providerHealthByKey.set(key, initial);
    return { ...initial };
  }

  function markProviderFailure(args: {
    cfg: ProviderConfig;
    traceId: string;
    reason: string;
  }): ProviderHealthState {
    const state = getProviderHealthState(args.cfg);
    state.consecutiveFailures += 1;

    if (state.consecutiveFailures >= PROVIDER_FAILURE_THRESHOLD) {
      const wasDegraded = state.status === "degraded";
      state.status = "degraded";
      state.degradedAtMs = now();
      if (!wasDegraded) {
        deps.logger.info("ai_provider_degraded", {
          traceId: args.traceId,
          provider: args.cfg.provider,
          baseUrl: args.cfg.baseUrl,
          failures: state.consecutiveFailures,
          reason: args.reason,
        });
      }
    }

    setProviderHealthState(args.cfg, state);
    return { ...state };
  }

  function markProviderSuccess(args: {
    cfg: ProviderConfig;
    traceId: string;
    fromHalfOpen: boolean;
  }): void {
    const state = getProviderHealthState(args.cfg);
    const wasDegraded = state.status === "degraded";
    state.status = "healthy";
    state.consecutiveFailures = 0;
    state.degradedAtMs = null;
    setProviderHealthState(args.cfg, state);

    if (wasDegraded || args.fromHalfOpen) {
      deps.logger.info("ai_provider_recovered", {
        traceId: args.traceId,
        provider: args.cfg.provider,
        baseUrl: args.cfg.baseUrl,
        fromHalfOpen: args.fromHalfOpen,
      });
    }
  }

  async function resolveProviderConfig(args: {
    env: NodeJS.ProcessEnv;
    runtimeAiTimeoutMs: number;
    getFakeServer: () => Promise<FakeAiServer>;
    getProxySettings?: () => ProxySettings | null;
  }): Promise<ServiceResult<ProviderResolution>> {
    const timeoutMs = args.runtimeAiTimeoutMs;

    const proxyEnabled = args.env.CREONOW_AI_PROXY_ENABLED === "1";
    if (proxyEnabled) {
      const baseUrl = args.env.CREONOW_AI_PROXY_BASE_URL;
      if (typeof baseUrl !== "string" || baseUrl.trim().length === 0) {
        return ipcError(
          "INVALID_ARGUMENT",
          "proxy baseUrl is required when proxy enabled (CREONOW_AI_PROXY_BASE_URL)",
        );
      }
      return {
        ok: true,
        data: {
          primary: {
            provider: "proxy",
            baseUrl,
            apiKey:
              typeof args.env.CREONOW_AI_PROXY_API_KEY === "string" &&
              args.env.CREONOW_AI_PROXY_API_KEY.length > 0
                ? args.env.CREONOW_AI_PROXY_API_KEY
                : undefined,
            timeoutMs,
          },
          backup: null,
        },
      };
    }

    const proxyFromSettings = args.getProxySettings?.() ?? null;
    if (proxyFromSettings) {
      const mode = resolveSettingsProviderMode(proxyFromSettings);
      const resolved = resolveSettingsProviderCredentials({
        settings: proxyFromSettings,
        mode,
      });

      if (mode !== "openai-compatible" || proxyFromSettings.enabled) {
        const primary = buildProviderConfigFromCredentials({
          provider: resolved.provider,
          credentials: resolved.credentials,
          timeoutMs,
          env: args.env,
        });
        if (!primary) {
          return ipcError(
            "AI_NOT_CONFIGURED",
            "AI service is not configured. Configure it in Settings first.",
          );
        }
        const backup = resolveSettingsBackupProvider({
          settings: proxyFromSettings,
          primary,
          timeoutMs,
          env: args.env,
        });

        return {
          ok: true,
          data: {
            primary,
            backup,
          },
        };
      }
    }

    const provider =
      parseProvider(args.env) ?? (isE2E(args.env) ? "anthropic" : null);
    if (!provider) {
      return ipcError(
        "INVALID_ARGUMENT",
        "CREONOW_AI_PROVIDER is required (anthropic|openai|proxy)",
      );
    }

    const envBaseUrl = args.env.CREONOW_AI_BASE_URL;
    const baseUrl =
      typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0
        ? envBaseUrl
        : isE2E(args.env)
          ? (await args.getFakeServer()).baseUrl
          : null;

    if (!baseUrl) {
      return ipcError(
        "INVALID_ARGUMENT",
        "CREONOW_AI_BASE_URL is required (or set CREONOW_E2E=1 for fake-first)",
      );
    }

    const apiKey =
      typeof args.env.CREONOW_AI_API_KEY === "string" &&
      args.env.CREONOW_AI_API_KEY.length > 0
        ? args.env.CREONOW_AI_API_KEY
        : undefined;

    const hasExplicitBaseUrl =
      typeof envBaseUrl === "string" && envBaseUrl.trim().length > 0;
    const requiresApiKey =
      provider !== "proxy" && (!isE2E(args.env) || hasExplicitBaseUrl);

    if (requiresApiKey && !apiKey) {
      return ipcError(
        "AI_NOT_CONFIGURED",
        "AI service is not configured: API key is required. Configure API key in Settings first.",
      );
    }

    return {
      ok: true,
      data: {
        primary: {
          provider,
          baseUrl,
          apiKey,
          timeoutMs,
        },
        backup: null,
      },
    };
  }

  return {
    getProviderHealthState,
    markProviderFailure,
    markProviderSuccess,
    resolveProviderConfig,
  };
}
