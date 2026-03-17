import assert from "node:assert/strict";

import { buildLLMMessages, estimateMessageTokens } from "../buildLLMMessages";

// --- S1: includes history messages in order ---

{
  const history = [
    { role: "user" as const, content: "Hello" },
    { role: "assistant" as const, content: "Hi there" },
  ];

  const result = buildLLMMessages({
    systemPrompt: "You are an assistant.",
    history,
    currentUserMessage: "What next?",
    maxTokenBudget: 10000,
  });

  // system + 2 history + current = 4
  assert.equal(result.length, 4);
  assert.equal(result[0].role, "system");
  assert.equal(result[1].role, "user");
  assert.equal(result[1].content, "Hello");
  assert.equal(result[2].role, "assistant");
  assert.equal(result[2].content, "Hi there");
  assert.equal(result[3].role, "user");
  assert.equal(result[3].content, "What next?");
}

// --- S1: places system message first ---

{
  const result = buildLLMMessages({
    systemPrompt: "SYSTEM_MSG",
    history: [{ role: "user", content: "msg1" }],
    currentUserMessage: "msg2",
    maxTokenBudget: 10000,
  });

  assert.equal(result[0].role, "system");
  assert.equal(result[0].content, "SYSTEM_MSG");
}

// --- S1: includes current user message last ---

{
  const result = buildLLMMessages({
    systemPrompt: "sys",
    history: [
      { role: "user", content: "a" },
      { role: "assistant", content: "b" },
    ],
    currentUserMessage: "CURRENT",
    maxTokenBudget: 10000,
  });

  const last = result[result.length - 1];
  assert.equal(last.role, "user");
  assert.equal(last.content, "CURRENT");
}

// --- S2: trims oldest non-system messages when over budget ---

{
  const longContent = "x".repeat(20000); // ~5000 tokens

  const result = buildLLMMessages({
    systemPrompt: "sys",
    history: [
      { role: "user", content: longContent },
      { role: "assistant", content: "short reply" },
      { role: "user", content: "recent question" },
      { role: "assistant", content: "recent answer" },
    ],
    currentUserMessage: "now",
    maxTokenBudget: 4000,
  });

  // system message always retained
  assert.equal(result[0].role, "system");
  assert.equal(result[0].content, "sys");

  // current user message always retained
  const last = result[result.length - 1];
  assert.equal(last.content, "now");

  // the long message should have been trimmed
  const hasLongMsg = result.some(
    (m: { content: string }) => m.content === longContent,
  );
  assert.equal(hasLongMsg, false, "long message should be trimmed");
}

// --- S2: always retains system message ---

{
  const result = buildLLMMessages({
    systemPrompt: "IMPORTANT_SYSTEM",
    history: [{ role: "user", content: "x".repeat(40000) }],
    currentUserMessage: "current",
    maxTokenBudget: 100,
  });

  assert.equal(result[0].role, "system");
  assert.equal(result[0].content, "IMPORTANT_SYSTEM");
}

// --- S2: keeps most recent messages within budget ---

{
  const result = buildLLMMessages({
    systemPrompt: "sys",
    history: [
      { role: "user", content: "old-msg-" + "x".repeat(10000) },
      { role: "assistant", content: "old-reply" },
      { role: "user", content: "recent" },
      { role: "assistant", content: "recent-reply" },
    ],
    currentUserMessage: "now",
    maxTokenBudget: 4000,
  });

  // Recent messages should be retained
  const contents = result.map((m: { content: string }) => m.content);
  assert.ok(contents.includes("recent"), "recent user msg should be kept");
  assert.ok(contents.includes("recent-reply"), "recent reply should be kept");
  assert.ok(contents.includes("now"), "current msg should be kept");
}

// --- No history: just system + current ---

{
  const result = buildLLMMessages({
    systemPrompt: "sys",
    history: [],
    currentUserMessage: "hello",
    maxTokenBudget: 10000,
  });

  assert.equal(result.length, 2);
  assert.equal(result[0].role, "system");
  assert.equal(result[1].role, "user");
  assert.equal(result[1].content, "hello");
}

// --- estimateMessageTokens returns stable approximation ---

{
  const tokens = estimateMessageTokens("Hello world");
  assert.ok(typeof tokens === "number");
  assert.ok(tokens > 0);
  assert.ok(tokens < 100);

  // Same input always returns same value
  assert.equal(estimateMessageTokens("Hello world"), tokens);

  // Empty string → 0
  assert.equal(estimateMessageTokens(""), 0);
}
