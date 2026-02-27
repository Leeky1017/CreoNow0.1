const UTF8_BYTES_PER_TOKEN = 4;

/**
 * Convert token budget into a byte limit using the shared UTF-8 estimator.
 *
 * Why: token budget math must stay identical across renderer/main/test paths.
 */
export function tokenBudgetToUtf8ByteLimit(tokenBudget: number): number {
  return Math.max(0, Math.floor(tokenBudget * UTF8_BYTES_PER_TOKEN));
}

/**
 * Estimate token count from UTF-8 byte length.
 *
 * Why: V1 keeps token estimation deterministic and tokenizer-free.
 */
export function estimateUtf8TokenCount(text: string): number {
  const bytes = new TextEncoder().encode(text).length;
  return bytes === 0 ? 0 : Math.ceil(bytes / UTF8_BYTES_PER_TOKEN);
}

/**
 * Trim UTF-8 content to fit into a token budget.
 *
 * Why: all layers must share one truncation rule to avoid drift.
 */
export function trimUtf8ToTokenBudget(
  text: string,
  tokenBudget: number,
): string {
  const maxBytes = tokenBudgetToUtf8ByteLimit(tokenBudget);
  if (maxBytes === 0) {
    return "";
  }

  const encoded = new TextEncoder().encode(text);
  if (encoded.length <= maxBytes) {
    return text;
  }

  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (let end = maxBytes; end > 0; end -= 1) {
    try {
      return decoder.decode(encoded.slice(0, end));
    } catch {
      continue;
    }
  }

  return "";
}
