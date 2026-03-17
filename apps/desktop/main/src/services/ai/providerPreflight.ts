/**
 * Provider preflight validation — local checks before hitting the provider API.
 *
 * Validates:
 * 1. API key format (non-empty, recognized pattern)
 * 2. Model name non-empty
 * 3. Model ↔ provider compatibility (via known models registry)
 */

import { isModelValidForProvider } from "./knownModels";

export type PreflightErrorCode =
  | "PREFLIGHT_MISSING_API_KEY"
  | "PREFLIGHT_INVALID_API_KEY_FORMAT"
  | "PREFLIGHT_MISSING_MODEL"
  | "PREFLIGHT_MODEL_PROVIDER_MISMATCH";

export interface PreflightError {
  code: PreflightErrorCode;
  message: string;
}

export type PreflightResult =
  | { ok: true }
  | { ok: false; error: PreflightError };

const API_KEY_FORMAT = /^(?:sk|pk|rk|ak)-[A-Za-z0-9._-]{2,}$/u;

export interface PreflightInput {
  provider: string;
  model: string;
  apiKey: string | undefined;
}

export interface ApiKeyPreflightInput {
  provider: string;
  apiKey: string | undefined;
  allowMissingApiKey?: boolean;
}

/**
 * Validate API key constraints for a provider.
 *
 * Why: settings-save and runtime-request paths share one deterministic rule set.
 */
export function validateProviderApiKeyPreflight(
  input: ApiKeyPreflightInput,
): PreflightResult {
  if (input.provider === "proxy") {
    return { ok: true };
  }

  if (!input.apiKey || input.apiKey.trim().length === 0) {
    if (input.allowMissingApiKey) {
      return { ok: true };
    }
    return {
      ok: false,
      error: {
        code: "PREFLIGHT_MISSING_API_KEY",
        message: "API key is required for this provider.",
      },
    };
  }

  if (!API_KEY_FORMAT.test(input.apiKey)) {
    return {
      ok: false,
      error: {
        code: "PREFLIGHT_INVALID_API_KEY_FORMAT",
        message:
          "API key format is not recognized. Expected format: sk-… / pk-… / rk-… / ak-…",
      },
    };
  }

  return { ok: true };
}

/**
 * Run preflight validation on provider configuration.
 *
 * Returns `{ ok: true }` when all checks pass,
 * or `{ ok: false, error }` with the first failing check.
 */
export function validateProviderPreflight(
  input: PreflightInput,
): PreflightResult {
  // 1. API key
  const apiKeyValidation = validateProviderApiKeyPreflight({
    provider: input.provider,
    apiKey: input.apiKey,
  });
  if (!apiKeyValidation.ok) {
    return apiKeyValidation;
  }

  // 2. Model name
  if (!input.model || input.model.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "PREFLIGHT_MISSING_MODEL",
        message: "Model name is required.",
      },
    };
  }

  // 3. Model ↔ provider compatibility
  if (!isModelValidForProvider(input.provider, input.model)) {
    return {
      ok: false,
      error: {
        code: "PREFLIGHT_MODEL_PROVIDER_MISMATCH",
        message: `Model "${input.model}" is not recognized for provider "${input.provider}".`,
      },
    };
  }

  return { ok: true };
}
