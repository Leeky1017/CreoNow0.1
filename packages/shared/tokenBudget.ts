const UTF8_BYTES_PER_TOKEN = 4;

function isContinuationByte(byte: number): boolean {
  return (byte & 0b1100_0000) === 0b1000_0000;
}

function utf8SequenceLength(leadByte: number): number {
  if ((leadByte & 0b1000_0000) === 0) {
    return 1;
  }
  if ((leadByte & 0b1110_0000) === 0b1100_0000) {
    return 2;
  }
  if ((leadByte & 0b1111_0000) === 0b1110_0000) {
    return 3;
  }
  if ((leadByte & 0b1111_1000) === 0b1111_0000) {
    return 4;
  }
  return 0;
}

function alignUtf8Boundary(bytes: Uint8Array, endExclusive: number): number {
  if (endExclusive <= 0 || endExclusive > bytes.length) {
    return 0;
  }

  let leadIndex = endExclusive - 1;
  while (leadIndex >= 0 && isContinuationByte(bytes[leadIndex] ?? 0)) {
    leadIndex -= 1;
  }

  if (leadIndex < 0) {
    return 0;
  }

  const expectedLength = utf8SequenceLength(bytes[leadIndex] ?? 0);
  if (expectedLength === 0) {
    return leadIndex;
  }

  const availableLength = endExclusive - leadIndex;
  if (availableLength < expectedLength) {
    return leadIndex;
  }

  return endExclusive;
}

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

  const safeEnd = alignUtf8Boundary(encoded, maxBytes);
  return new TextDecoder().decode(encoded.slice(0, safeEnd));
}
