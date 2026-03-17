/**
 * Build the LLM message array for a multi-turn conversation call.
 *
 * Assembly order:
 * 1. system message (assembleSystemPrompt output)
 * 2. history messages (ChatMessage[] by timestamp)
 * 3. current user input
 *
 * Trimming strategy: remove oldest non-system messages first until
 * total estimated tokens fit within maxTokenBudget. System message
 * and current user message are always retained.
 *
 * Design reference: audit/02 §3.2 — token budget management.
 */
import { estimateUtf8TokenCount } from "@shared/tokenBudget";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export const estimateMessageTokens = estimateUtf8TokenCount;

export function buildLLMMessages(args: {
  systemPrompt: string;
  history: HistoryMessage[];
  currentUserMessage: string;
  maxTokenBudget: number;
}): LLMMessage[] {
  const systemMsg: LLMMessage = { role: "system", content: args.systemPrompt };
  const currentMsg: LLMMessage = {
    role: "user",
    content: args.currentUserMessage,
  };

  // Fixed cost: system + current user message
  const fixedTokens =
    estimateMessageTokens(args.systemPrompt) +
    estimateMessageTokens(args.currentUserMessage);

  // If no history, return system + current
  if (args.history.length === 0) {
    return [systemMsg, currentMsg];
  }

  // Build history messages with token estimates
  const historyWithTokens = args.history.map((m) => ({
    msg: { role: m.role, content: m.content } as LLMMessage,
    tokens: estimateMessageTokens(m.content),
  }));

  // Calculate total tokens
  let totalHistoryTokens = historyWithTokens.reduce(
    (sum, h) => sum + h.tokens,
    0,
  );

  const remainingBudget = args.maxTokenBudget - fixedTokens;

  // Trim oldest messages first until within budget
  let trimStart = 0;
  while (
    totalHistoryTokens > remainingBudget &&
    trimStart < historyWithTokens.length
  ) {
    totalHistoryTokens -= historyWithTokens[trimStart].tokens;
    trimStart++;
  }

  const keptHistory = historyWithTokens.slice(trimStart).map((h) => h.msg);

  return [systemMsg, ...keptHistory, currentMsg];
}
