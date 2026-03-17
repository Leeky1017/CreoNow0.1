/**
 * Known model registry — provider → supported model prefixes.
 *
 * Used for local preflight validation before requests hit the provider.
 * This is a best-effort allowlist; unknown models can still be attempted
 * but will receive a warning rather than a hard block.
 */

const OPENAI_PREFIXES = [
  "gpt-5",
  "gpt-4",
  "gpt-3.5",
  "o1",
  "o3",
  "o4",
  "chatgpt-4o",
] as const;

const ANTHROPIC_PREFIXES = ["claude-"] as const;

const PROVIDER_MODEL_PREFIXES: Record<string, readonly string[]> = {
  openai: [...OPENAI_PREFIXES],
  anthropic: [...ANTHROPIC_PREFIXES],
  proxy: [], // proxy accepts any model
};

/**
 * Check whether a model string is plausibly valid for the given provider.
 *
 * Returns `true` when:
 * - provider is "proxy" (accepts anything)
 * - provider has no prefix registry (unknown provider — permissive)
 * - model starts with one of the known prefixes
 */
export function isModelValidForProvider(
  provider: string,
  model: string,
): boolean {
  const prefixes = PROVIDER_MODEL_PREFIXES[provider];
  if (!prefixes || prefixes.length === 0) {
    return true; // unknown provider or proxy — permissive
  }
  return prefixes.some((p) => model.startsWith(p));
}
