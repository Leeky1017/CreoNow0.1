export type RuntimeGovernanceEnv = Record<string, string | undefined>;

export type RuntimeGovernance = {
  ipc: {
    maxPayloadBytes: number;
  };
  ai: {
    timeoutMs: number;
    retryBackoffMs: readonly number[];
    rateLimitPerMinute: number;
    sessionTokenBudget: number;
    streamRateLimitPerSecond: number;
    chatMessageCapacity: number;
  };
  skills: {
    globalConcurrencyLimit: number;
    sessionQueueLimit: number;
    slotRecoveryTimeoutMs: number;
  };
  embedding: {
    queueDebounceMs: number;
  };
  kg: {
    queryTimeoutMs: number;
  };
  rag: {
    maxTokens: number;
  };
};

export const RUNTIME_GOVERNANCE_DEFAULTS: RuntimeGovernance = {
  ipc: {
    maxPayloadBytes: 10 * 1024 * 1024,
  },
  ai: {
    timeoutMs: 10_000,
    retryBackoffMs: [1_000, 2_000, 4_000],
    rateLimitPerMinute: 60,
    sessionTokenBudget: 200_000,
    streamRateLimitPerSecond: 5_000,
    chatMessageCapacity: 2_000,
  },
  skills: {
    globalConcurrencyLimit: 8,
    sessionQueueLimit: 20,
    slotRecoveryTimeoutMs: 125_000,
  },
  embedding: {
    queueDebounceMs: 120,
  },
  kg: {
    queryTimeoutMs: 2_000,
  },
  rag: {
    maxTokens: 1_500,
  },
};

const IPC_MAX_PAYLOAD_BYTES_HARD_CAP =
  RUNTIME_GOVERNANCE_DEFAULTS.ipc.maxPayloadBytes;

function pickRaw(args: {
  env: RuntimeGovernanceEnv;
  primaryKey: string;
  legacyKey?: string;
}): string | undefined {
  const primary = args.env[args.primaryKey];
  if (typeof primary === "string") {
    return primary;
  }

  if (!args.legacyKey) {
    return undefined;
  }
  const legacy = args.env[args.legacyKey];
  if (typeof legacy === "string") {
    return legacy;
  }

  return undefined;
}

function parsePositiveInt(
  raw: string | undefined,
  fallback: number,
  maxValue?: number,
): number {
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return fallback;
  }
  if (!/^\d+$/u.test(trimmed)) {
    return fallback;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  if (
    typeof maxValue === "number" &&
    Number.isFinite(maxValue) &&
    maxValue > 0
  ) {
    return Math.min(parsed, maxValue);
  }

  return parsed;
}

function parsePositiveIntList(
  raw: string | undefined,
  fallback: readonly number[],
): readonly number[] {
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.includes(";")) {
    return fallback;
  }

  const parts = trimmed.split(",").map((part) => part.trim());
  if (parts.length === 0) {
    return fallback;
  }

  const parsed: number[] = [];
  for (const part of parts) {
    if (part.length === 0) {
      return fallback;
    }
    if (!/^\d+$/u.test(part)) {
      return fallback;
    }
    const value = Number.parseInt(part, 10);
    if (!Number.isFinite(value) || value <= 0) {
      return fallback;
    }
    parsed.push(value);
  }

  if (parsed.length === 0) {
    return fallback;
  }
  return parsed;
}

export function resolveRuntimeGovernanceFromEnv(
  env: RuntimeGovernanceEnv,
): RuntimeGovernance {
  const ipcMaxPayload = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_IPC_MAX_PAYLOAD_BYTES",
      legacyKey: "CREONOW_IPC_MAX_PAYLOAD_BYTES",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.ipc.maxPayloadBytes,
    IPC_MAX_PAYLOAD_BYTES_HARD_CAP,
  );

  const aiTimeoutMs = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_AI_TIMEOUT_MS",
      legacyKey: "CREONOW_AI_TIMEOUT_MS",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.ai.timeoutMs,
  );
  const aiRetryBackoffMs = parsePositiveIntList(
    pickRaw({
      env,
      primaryKey: "CN_AI_RETRY_BACKOFF_MS",
      legacyKey: "CREONOW_AI_RETRY_BACKOFF_MS",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.ai.retryBackoffMs,
  );
  const aiRateLimitPerMinute = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_AI_RATE_LIMIT_PER_MINUTE",
      legacyKey: "CREONOW_AI_RATE_LIMIT_PER_MINUTE",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.ai.rateLimitPerMinute,
  );
  const aiSessionTokenBudget = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_AI_SESSION_TOKEN_BUDGET",
      legacyKey: "CREONOW_AI_SESSION_TOKEN_BUDGET",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.ai.sessionTokenBudget,
  );
  const aiStreamRateLimitPerSecond = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_AI_STREAM_RATE_LIMIT_PER_SECOND",
      legacyKey: "CREONOW_AI_STREAM_RATE_LIMIT_PER_SECOND",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.ai.streamRateLimitPerSecond,
  );
  const aiChatMessageCapacity = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_AI_CHAT_MESSAGE_CAPACITY",
      legacyKey: "CREONOW_AI_CHAT_MESSAGE_CAPACITY",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.ai.chatMessageCapacity,
  );

  const skillGlobalConcurrencyLimit = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_SKILL_GLOBAL_CONCURRENCY_LIMIT",
      legacyKey: "CREONOW_SKILL_GLOBAL_CONCURRENCY_LIMIT",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.skills.globalConcurrencyLimit,
  );
  const skillSessionQueueLimit = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_SKILL_SESSION_QUEUE_LIMIT",
      legacyKey: "CREONOW_SKILL_SESSION_QUEUE_LIMIT",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.skills.sessionQueueLimit,
  );
  const skillSlotRecoveryTimeoutMs = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_SKILL_SLOT_RECOVERY_TIMEOUT_MS",
      legacyKey: "CREONOW_SKILL_SLOT_RECOVERY_TIMEOUT_MS",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.skills.slotRecoveryTimeoutMs,
  );

  const embeddingQueueDebounceMs = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_EMBEDDING_QUEUE_DEBOUNCE_MS",
      legacyKey: "CREONOW_EMBEDDING_QUEUE_DEBOUNCE_MS",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.embedding.queueDebounceMs,
  );

  const kgQueryTimeoutMs = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_KG_QUERY_TIMEOUT_MS",
      legacyKey: "CREONOW_KG_QUERY_TIMEOUT_MS",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.kg.queryTimeoutMs,
  );

  const ragMaxTokens = parsePositiveInt(
    pickRaw({
      env,
      primaryKey: "CN_RAG_MAX_TOKENS",
      legacyKey: "CREONOW_RAG_MAX_TOKENS",
    }),
    RUNTIME_GOVERNANCE_DEFAULTS.rag.maxTokens,
  );

  return {
    ipc: {
      maxPayloadBytes: ipcMaxPayload,
    },
    ai: {
      timeoutMs: aiTimeoutMs,
      retryBackoffMs: aiRetryBackoffMs,
      rateLimitPerMinute: aiRateLimitPerMinute,
      sessionTokenBudget: aiSessionTokenBudget,
      streamRateLimitPerSecond: aiStreamRateLimitPerSecond,
      chatMessageCapacity: aiChatMessageCapacity,
    },
    skills: {
      globalConcurrencyLimit: skillGlobalConcurrencyLimit,
      sessionQueueLimit: skillSessionQueueLimit,
      slotRecoveryTimeoutMs: skillSlotRecoveryTimeoutMs,
    },
    embedding: {
      queueDebounceMs: embeddingQueueDebounceMs,
    },
    kg: {
      queryTimeoutMs: kgQueryTimeoutMs,
    },
    rag: {
      maxTokens: ragMaxTokens,
    },
  };
}
