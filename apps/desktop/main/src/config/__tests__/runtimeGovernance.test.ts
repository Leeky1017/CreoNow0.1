import assert from "node:assert/strict";

import {
  resolveRuntimeGovernanceFromEnv,
  RUNTIME_GOVERNANCE_DEFAULTS,
} from "../runtimeGovernance";

// S1-RC-S1
// returns roadmap defaults when env is not set
{
  const cfg = resolveRuntimeGovernanceFromEnv({});
  assert.deepEqual(cfg, RUNTIME_GOVERNANCE_DEFAULTS);
}

// S1-RC-S2
// applies env override for numeric and array governance keys
{
  const cfg = resolveRuntimeGovernanceFromEnv({
    CN_AI_TIMEOUT_MS: "30000",
    CN_AI_RETRY_BACKOFF_MS: "500, 1000, 2000",
    CN_AI_RATE_LIMIT_PER_MINUTE: "42",
    CN_AI_SESSION_TOKEN_BUDGET: "123456",
    CN_AI_STREAM_RATE_LIMIT_PER_SECOND: "7777",
    CN_AI_CHAT_MESSAGE_CAPACITY: "321",
    CN_SKILL_GLOBAL_CONCURRENCY_LIMIT: "3",
    CN_SKILL_SESSION_QUEUE_LIMIT: "9",
    CN_SKILL_SLOT_RECOVERY_TIMEOUT_MS: "60000",
    CN_EMBEDDING_QUEUE_DEBOUNCE_MS: "75",
    CN_KG_QUERY_TIMEOUT_MS: "9999",
    CN_RAG_MAX_TOKENS: "2048",
    CN_IPC_MAX_PAYLOAD_BYTES: "1048576",
  });

  assert.equal(cfg.ai.timeoutMs, 30_000);
  assert.deepEqual(cfg.ai.retryBackoffMs, [500, 1000, 2000]);
  assert.equal(cfg.ai.rateLimitPerMinute, 42);
  assert.equal(cfg.ai.sessionTokenBudget, 123_456);
  assert.equal(cfg.ai.streamRateLimitPerSecond, 7_777);
  assert.equal(cfg.ai.chatMessageCapacity, 321);
  assert.equal(cfg.skills.globalConcurrencyLimit, 3);
  assert.equal(cfg.skills.sessionQueueLimit, 9);
  assert.equal(cfg.skills.slotRecoveryTimeoutMs, 60_000);
  assert.equal(cfg.embedding.queueDebounceMs, 75);
  assert.equal(cfg.kg.queryTimeoutMs, 9_999);
  assert.equal(cfg.rag.maxTokens, 2_048);
  assert.equal(cfg.ipc.maxPayloadBytes, 1_048_576);
}
