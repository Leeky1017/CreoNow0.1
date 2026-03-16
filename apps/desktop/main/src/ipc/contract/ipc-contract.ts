import { s } from "./schema";

export const IPC_ERROR_CODES = [
  "VALIDATION_ERROR",
  "IPC_TIMEOUT",
  "IPC_CHANNEL_FORBIDDEN",
  "IPC_PAYLOAD_TOO_LARGE",
  "IPC_SUBSCRIPTION_LIMIT_EXCEEDED",
  "INTERNAL_ERROR",
  "INVALID_ARGUMENT",
  "NOT_FOUND",
  "ALREADY_EXISTS",
  "CONFLICT",
  "PERMISSION_DENIED",
  "FORBIDDEN",
  "UNSUPPORTED",
  "IO_ERROR",
  "DB_ERROR",
  "MEMORY_EPISODE_WRITE_FAILED",
  "MEMORY_CAPACITY_EXCEEDED",
  "MEMORY_DISTILL_LLM_UNAVAILABLE",
  "MEMORY_CONFIDENCE_OUT_OF_RANGE",
  "MEMORY_CLEAR_CONFIRM_REQUIRED",
  "MEMORY_TRACE_MISMATCH",
  "MEMORY_SCOPE_DENIED",
  "MODEL_NOT_READY",
  "EMBEDDING_PROVIDER_UNAVAILABLE",
  "ENCODING_FAILED",
  "RATE_LIMITED",
  "TIMEOUT",
  "CANCELED",
  "UPSTREAM_ERROR",
  "INTERNAL",
  "PROJECT_CAPACITY_EXCEEDED",
  "PROJECT_DELETE_REQUIRES_ARCHIVE",
  "PROJECT_METADATA_INVALID_ENUM",
  "PROJECT_PURGE_PERMISSION_DENIED",
  "PROJECT_LIFECYCLE_WRITE_FAILED",
  "PROJECT_IPC_SCHEMA_INVALID",
  "KG_ATTRIBUTE_KEYS_EXCEEDED",
  "KG_CAPACITY_EXCEEDED",
  "KG_ENTITY_CONFLICT",
  "KG_ENTITY_DUPLICATE",
  "KG_QUERY_TIMEOUT",
  "KG_RECOGNITION_UNAVAILABLE",
  "KG_RELEVANT_QUERY_FAILED",
  "KG_RELATION_INVALID",
  "KG_SCOPE_VIOLATION",
  "KG_SUBGRAPH_K_EXCEEDED",
  "PROJECT_SWITCH_TIMEOUT",
  "DOCUMENT_SAVE_CONFLICT",
  "MEMORY_BACKPRESSURE",
  "SKILL_TIMEOUT",
  "SKILL_DEPENDENCY_MISSING",
  "SKILL_QUEUE_OVERFLOW",
  "SKILL_CAPACITY_EXCEEDED",
  "SKILL_SCOPE_VIOLATION",
  "SKILL_INPUT_EMPTY",
  "SKILL_OUTPUT_INVALID",
  "AI_AUTH_FAILED",
  "AI_NOT_CONFIGURED",
  "AI_RATE_LIMITED",
  "AI_SESSION_TOKEN_BUDGET_EXCEEDED",
  "LLM_API_ERROR",
  "AI_PROVIDER_UNAVAILABLE",
  "VERSION_MERGE_TIMEOUT",
  "VERSION_SNAPSHOT_COMPACTED",
  "VERSION_DIFF_PAYLOAD_TOO_LARGE",
  "VERSION_ROLLBACK_CONFLICT",
  "SEARCH_TIMEOUT",
  "SEARCH_REINDEX_IO_ERROR",
  "SEARCH_DATA_CORRUPTED",
  "SEARCH_CONCURRENT_WRITE_CONFLICT",
  "SEARCH_CAPACITY_EXCEEDED",
  "SEARCH_BACKPRESSURE",
  "SEARCH_PROJECT_FORBIDDEN",
  "CONSTRAINT_VALIDATION_ERROR",
  "CONSTRAINT_NOT_FOUND",
  "CONSTRAINT_CONFLICT",
  "CONTEXT_SCOPE_VIOLATION",
  "CONTEXT_INSPECT_FORBIDDEN",
  "CONTEXT_INPUT_TOO_LARGE",
  "CONTEXT_BACKPRESSURE",
  "CONTEXT_BUDGET_INVALID_RATIO",
  "CONTEXT_BUDGET_INVALID_MINIMUM",
  "CONTEXT_BUDGET_CONFLICT",
  "CONTEXT_TOKENIZER_MISMATCH",
  "DOCUMENT_SIZE_EXCEEDED",
] as const;

export type IpcErrorCode = (typeof IPC_ERROR_CODES)[number];

const IPC_ERROR_CODE_SCHEMA = s.union(
  ...IPC_ERROR_CODES.map((code) => s.literal(code)),
);

const JUDGE_MODEL_STATE_SCHEMA = s.union(
  s.object({ status: s.literal("not_ready") }),
  s.object({ status: s.literal("downloading") }),
  s.object({ status: s.literal("ready") }),
  s.object({
    status: s.literal("error"),
    error: s.object({ code: IPC_ERROR_CODE_SCHEMA, message: s.string() }),
  }),
);

const JUDGE_SEVERITY_SCHEMA = s.union(
  s.literal("high"),
  s.literal("medium"),
  s.literal("low"),
);

const JUDGE_EVALUATE_REQUEST_SCHEMA = s.object({
  projectId: s.string(),
  traceId: s.string(),
  text: s.string(),
  contextSummary: s.string(),
});

const SKILL_SCOPE_SCHEMA = s.union(
  s.literal("builtin"),
  s.literal("global"),
  s.literal("project"),
);

const SKILL_LIST_ITEM_SCHEMA = s.object({
  id: s.string(),
  name: s.string(),
  scope: SKILL_SCOPE_SCHEMA,
  packageId: s.string(),
  version: s.string(),
  enabled: s.boolean(),
  valid: s.boolean(),
  error_code: s.optional(IPC_ERROR_CODE_SCHEMA),
  error_message: s.optional(s.string()),
});

const CUSTOM_SKILL_SCOPE_SCHEMA = s.union(
  s.literal("global"),
  s.literal("project"),
);

const CUSTOM_SKILL_INPUT_TYPE_SCHEMA = s.union(
  s.literal("selection"),
  s.literal("document"),
);

const CUSTOM_SKILL_CONTEXT_RULES_SCHEMA = s.record(
  s.union(s.string(), s.number(), s.boolean()),
);

const CUSTOM_SKILL_SCHEMA = s.object({
  id: s.string(),
  name: s.string(),
  description: s.string(),
  promptTemplate: s.string(),
  inputType: CUSTOM_SKILL_INPUT_TYPE_SCHEMA,
  contextRules: CUSTOM_SKILL_CONTEXT_RULES_SCHEMA,
  scope: CUSTOM_SKILL_SCOPE_SCHEMA,
  enabled: s.boolean(),
  createdAt: s.number(),
  updatedAt: s.number(),
});

const CREONOW_LIST_ITEM_SCHEMA = s.object({
  path: s.string(),
  sizeBytes: s.number(),
  updatedAtMs: s.number(),
});

const CONTEXT_LAYER_ID_SCHEMA = s.union(
  s.literal("rules"),
  s.literal("settings"),
  s.literal("retrieved"),
  s.literal("immediate"),
);

const CONTEXT_ASSEMBLE_REQUEST_SCHEMA = s.object({
  projectId: s.string(),
  documentId: s.string(),
  cursorPosition: s.number(),
  skillId: s.string(),
  additionalInput: s.optional(s.string()),
  provider: s.optional(s.string()),
  model: s.optional(s.string()),
  tokenizerVersion: s.optional(s.string()),
});

const CONTEXT_INSPECT_REQUEST_SCHEMA = s.object({
  projectId: s.string(),
  documentId: s.string(),
  cursorPosition: s.number(),
  skillId: s.string(),
  additionalInput: s.optional(s.string()),
  provider: s.optional(s.string()),
  model: s.optional(s.string()),
  tokenizerVersion: s.optional(s.string()),
  debugMode: s.optional(s.boolean()),
  requestedBy: s.optional(s.string()),
  callerRole: s.optional(s.string()),
});

const CONTEXT_LAYER_SUMMARY_SCHEMA = s.object({
  source: s.array(s.string()),
  tokenCount: s.number(),
  truncated: s.boolean(),
  warnings: s.optional(s.array(s.string())),
});

const CONTEXT_LAYER_DETAIL_SCHEMA = s.object({
  content: s.string(),
  source: s.array(s.string()),
  tokenCount: s.number(),
  truncated: s.boolean(),
  warnings: s.optional(s.array(s.string())),
});

const CONTEXT_ASSEMBLE_RESPONSE_SCHEMA = s.object({
  prompt: s.string(),
  tokenCount: s.number(),
  stablePrefixHash: s.string(),
  stablePrefixUnchanged: s.boolean(),
  warnings: s.array(s.string()),
  assemblyOrder: s.array(CONTEXT_LAYER_ID_SCHEMA),
  layers: s.object({
    rules: CONTEXT_LAYER_SUMMARY_SCHEMA,
    settings: CONTEXT_LAYER_SUMMARY_SCHEMA,
    retrieved: CONTEXT_LAYER_SUMMARY_SCHEMA,
    immediate: CONTEXT_LAYER_SUMMARY_SCHEMA,
  }),
});

const CONTEXT_INSPECT_RESPONSE_SCHEMA = s.object({
  layersDetail: s.object({
    rules: CONTEXT_LAYER_DETAIL_SCHEMA,
    settings: CONTEXT_LAYER_DETAIL_SCHEMA,
    retrieved: CONTEXT_LAYER_DETAIL_SCHEMA,
    immediate: CONTEXT_LAYER_DETAIL_SCHEMA,
  }),
  totals: s.object({
    tokenCount: s.number(),
    warningsCount: s.number(),
  }),
  inspectMeta: s.object({
    debugMode: s.boolean(),
    requestedBy: s.string(),
    requestedAt: s.number(),
  }),
});

const CONTEXT_BUDGET_LAYER_SCHEMA = s.object({
  ratio: s.number(),
  minimumTokens: s.number(),
});

const CONTEXT_BUDGET_PROFILE_SCHEMA = s.object({
  version: s.number(),
  tokenizerId: s.string(),
  tokenizerVersion: s.string(),
  totalBudgetTokens: s.number(),
  layers: s.object({
    rules: CONTEXT_BUDGET_LAYER_SCHEMA,
    settings: CONTEXT_BUDGET_LAYER_SCHEMA,
    retrieved: CONTEXT_BUDGET_LAYER_SCHEMA,
    immediate: CONTEXT_BUDGET_LAYER_SCHEMA,
  }),
});

const CONTEXT_BUDGET_UPDATE_REQUEST_SCHEMA = s.object({
  version: s.number(),
  tokenizerId: s.string(),
  tokenizerVersion: s.string(),
  layers: s.object({
    rules: CONTEXT_BUDGET_LAYER_SCHEMA,
    settings: CONTEXT_BUDGET_LAYER_SCHEMA,
    retrieved: CONTEXT_BUDGET_LAYER_SCHEMA,
    immediate: CONTEXT_BUDGET_LAYER_SCHEMA,
  }),
});

const CONSTRAINT_SOURCE_SCHEMA = s.union(s.literal("user"), s.literal("kg"));

const CONSTRAINT_ITEM_SCHEMA = s.object({
  id: s.string(),
  text: s.string(),
  source: CONSTRAINT_SOURCE_SCHEMA,
  priority: s.number(),
  updatedAt: s.string(),
  degradable: s.boolean(),
});

const CONSTRAINT_CREATE_SCHEMA = s.object({
  text: s.string(),
  source: s.optional(CONSTRAINT_SOURCE_SCHEMA),
  priority: s.optional(s.number()),
  degradable: s.optional(s.boolean()),
});

const CONSTRAINT_PATCH_SCHEMA = s.object({
  text: s.optional(s.string()),
  priority: s.optional(s.number()),
  degradable: s.optional(s.boolean()),
});

const SEARCH_FTS_HIGHLIGHT_SCHEMA = s.object({
  start: s.number(),
  end: s.number(),
});

const SEARCH_FTS_ANCHOR_SCHEMA = s.object({
  start: s.number(),
  end: s.number(),
});

const SEARCH_FTS_ITEM_SCHEMA = s.object({
  projectId: s.string(),
  documentId: s.string(),
  documentTitle: s.string(),
  documentType: s.string(),
  snippet: s.string(),
  highlights: s.array(SEARCH_FTS_HIGHLIGHT_SCHEMA),
  anchor: SEARCH_FTS_ANCHOR_SCHEMA,
  score: s.number(),
  updatedAt: s.number(),
});

const SEARCH_QUERY_STRATEGY_SCHEMA = s.union(
  s.literal("fts"),
  s.literal("semantic"),
  s.literal("hybrid"),
);

const SEARCH_FALLBACK_SCHEMA = s.union(s.literal("fts"), s.literal("none"));

const SEARCH_RANK_SCORE_BREAKDOWN_SCHEMA = s.object({
  bm25: s.number(),
  semantic: s.number(),
  recency: s.number(),
});

const SEARCH_RANKED_ITEM_SCHEMA = s.object({
  documentId: s.string(),
  chunkId: s.string(),
  snippet: s.string(),
  finalScore: s.number(),
  scoreBreakdown: SEARCH_RANK_SCORE_BREAKDOWN_SCHEMA,
  updatedAt: s.number(),
});

const SEARCH_RANK_BACKPRESSURE_SCHEMA = s.object({
  candidateLimit: s.number(),
  candidateCount: s.number(),
  truncated: s.boolean(),
});

const SEARCH_REPLACE_SCOPE_SCHEMA = s.union(
  s.literal("currentDocument"),
  s.literal("wholeProject"),
);

const SEARCH_REPLACE_PREVIEW_ITEM_SCHEMA = s.object({
  documentId: s.string(),
  title: s.string(),
  matchCount: s.number(),
  sample: s.string(),
});

const SEARCH_REPLACE_SKIPPED_ITEM_SCHEMA = s.object({
  documentId: s.string(),
  reason: s.string(),
  message: s.optional(s.string()),
});

const EMBEDDING_SEARCH_RESULT_SCHEMA = s.object({
  chunkId: s.string(),
  documentId: s.string(),
  text: s.string(),
  score: s.number(),
  startOffset: s.number(),
  endOffset: s.number(),
});

const EMBEDDING_SEARCH_ISOLATION_SCHEMA = s.object({
  code: s.literal("SEARCH_DATA_CORRUPTED"),
  isolatedChunkIds: s.array(s.string()),
});

const RAG_CHUNK_SCHEMA = s.object({
  chunkId: s.string(),
  documentId: s.string(),
  text: s.string(),
  score: s.number(),
  tokenEstimate: s.number(),
});

const RAG_CONFIG_SCHEMA = s.object({
  topK: s.number(),
  minScore: s.number(),
  maxTokens: s.number(),
  model: s.optional(s.string()),
});

const STATS_SUMMARY_SCHEMA = s.object({
  wordsWritten: s.number(),
  writingSeconds: s.number(),
  skillsUsed: s.number(),
  documentsCreated: s.number(),
});

const STATS_DAY_SCHEMA = s.object({
  date: s.string(),
  summary: STATS_SUMMARY_SCHEMA,
});

const PROJECT_TYPE_SCHEMA = s.union(
  s.literal("novel"),
  s.literal("screenplay"),
  s.literal("media"),
);

const PROJECT_STAGE_SCHEMA = s.union(
  s.literal("outline"),
  s.literal("draft"),
  s.literal("revision"),
  s.literal("final"),
);

const PROJECT_TEMPLATE_INPUT_SCHEMA = s.union(
  s.object({
    kind: s.literal("builtin"),
    id: s.string(),
  }),
  s.object({
    kind: s.literal("custom"),
    structure: s.object({
      folders: s.array(s.string()),
      files: s.array(
        s.object({
          path: s.string(),
          content: s.optional(s.string()),
        }),
      ),
    }),
  }),
);

const PROJECT_LIFECYCLE_STATE_SCHEMA = s.union(
  s.literal("active"),
  s.literal("archived"),
  s.literal("deleted"),
);

const EXPORT_RESULT_SCHEMA = s.object({
  relativePath: s.string(),
  bytesWritten: s.number(),
});

const AI_PROMPT_DIAGNOSTICS_SCHEMA = s.object({
  stablePrefixHash: s.string(),
  promptHash: s.string(),
});

const AI_USAGE_STATS_SCHEMA = s.object({
  promptTokens: s.number(),
  completionTokens: s.number(),
  sessionTotalTokens: s.number(),
  estimatedCostUsd: s.optional(s.number()),
});

const AI_CANDIDATE_SCHEMA = s.object({
  id: s.string(),
  runId: s.string(),
  text: s.string(),
  summary: s.string(),
});

const AI_PROXY_SETTINGS_SCHEMA = s.object({
  enabled: s.boolean(),
  baseUrl: s.string(),
  apiKeyConfigured: s.boolean(),
  providerMode: s.union(
    s.literal("openai-compatible"),
    s.literal("openai-byok"),
    s.literal("anthropic-byok"),
  ),
  openAiCompatibleBaseUrl: s.string(),
  openAiCompatibleApiKeyConfigured: s.boolean(),
  openAiByokBaseUrl: s.string(),
  openAiByokApiKeyConfigured: s.boolean(),
  anthropicByokBaseUrl: s.string(),
  anthropicByokApiKeyConfigured: s.boolean(),
});

const AI_PROXY_TEST_SCHEMA = s.object({
  ok: s.boolean(),
  latencyMs: s.number(),
  error: s.optional(
    s.object({
      code: IPC_ERROR_CODE_SCHEMA,
      message: s.string(),
    }),
  ),
});

const AI_MODEL_CATALOG_ITEM_SCHEMA = s.object({
  id: s.string(),
  name: s.string(),
  provider: s.string(),
});

const AI_MODEL_CATALOG_SCHEMA = s.object({
  source: s.union(
    s.literal("proxy"),
    s.literal("openai"),
    s.literal("anthropic"),
  ),
  items: s.array(AI_MODEL_CATALOG_ITEM_SCHEMA),
});

const REDACTION_EVIDENCE_SCHEMA = s.object({
  patternId: s.string(),
  sourceRef: s.string(),
  matchCount: s.number(),
});

const MEMORY_TYPE_SCHEMA = s.union(
  s.literal("preference"),
  s.literal("fact"),
  s.literal("note"),
);

const MEMORY_SCOPE_SCHEMA = s.union(
  s.literal("global"),
  s.literal("project"),
  s.literal("document"),
);

const MEMORY_ORIGIN_SCHEMA = s.union(s.literal("manual"), s.literal("learned"));

const MEMORY_SETTINGS_SCHEMA = s.object({
  injectionEnabled: s.boolean(),
  preferenceLearningEnabled: s.boolean(),
  privacyModeEnabled: s.boolean(),
  preferenceLearningThreshold: s.number(),
});

const MEMORY_INJECTION_REASON_SCHEMA = s.union(
  s.object({ kind: s.literal("deterministic") }),
  s.object({ kind: s.literal("semantic"), score: s.number() }),
);

const MEMORY_INJECTION_ITEM_SCHEMA = s.object({
  id: s.string(),
  type: MEMORY_TYPE_SCHEMA,
  scope: MEMORY_SCOPE_SCHEMA,
  origin: MEMORY_ORIGIN_SCHEMA,
  content: s.string(),
  reason: MEMORY_INJECTION_REASON_SCHEMA,
});

const MEMORY_IMPLICIT_SIGNAL_SCHEMA = s.union(
  s.literal("DIRECT_ACCEPT"),
  s.literal("LIGHT_EDIT"),
  s.literal("HEAVY_REWRITE"),
  s.literal("FULL_REJECT"),
  s.literal("UNDO_AFTER_ACCEPT"),
  s.literal("REPEATED_SCENE_SKILL"),
);

const MEMORY_EPISODE_SCHEMA = s.object({
  id: s.string(),
  projectId: s.string(),
  scope: s.literal("project"),
  version: s.literal(1),
  chapterId: s.string(),
  sceneType: s.string(),
  skillUsed: s.string(),
  inputContext: s.string(),
  candidates: s.array(s.string()),
  selectedIndex: s.number(),
  finalText: s.string(),
  explicit: s.optional(s.string()),
  editDistance: s.number(),
  implicitSignal: MEMORY_IMPLICIT_SIGNAL_SCHEMA,
  implicitWeight: s.number(),
  importance: s.number(),
  recallCount: s.number(),
  lastRecalledAt: s.optional(s.number()),
  compressed: s.boolean(),
  userConfirmed: s.boolean(),
  createdAt: s.number(),
  updatedAt: s.number(),
});

const MEMORY_SEMANTIC_RULE_PLACEHOLDER_SCHEMA = s.object({
  id: s.string(),
  projectId: s.string(),
  scope: s.union(s.literal("project"), s.literal("global")),
  version: s.literal(1),
  rule: s.string(),
  confidence: s.number(),
  createdAt: s.number(),
  updatedAt: s.number(),
});

const MEMORY_SEMANTIC_CATEGORY_SCHEMA = s.union(
  s.literal("style"),
  s.literal("structure"),
  s.literal("character"),
  s.literal("pacing"),
  s.literal("vocabulary"),
);

const MEMORY_SEMANTIC_SCOPE_SCHEMA = s.union(
  s.literal("global"),
  s.literal("project"),
);

const MEMORY_SEMANTIC_RULE_SCHEMA = s.object({
  id: s.string(),
  projectId: s.string(),
  scope: MEMORY_SEMANTIC_SCOPE_SCHEMA,
  version: s.literal(1),
  rule: s.string(),
  category: MEMORY_SEMANTIC_CATEGORY_SCHEMA,
  confidence: s.number(),
  supportingEpisodes: s.array(s.string()),
  contradictingEpisodes: s.array(s.string()),
  userConfirmed: s.boolean(),
  userModified: s.boolean(),
  recentlyUpdated: s.optional(s.boolean()),
  conflictMarked: s.optional(s.boolean()),
  createdAt: s.number(),
  updatedAt: s.number(),
});

const MEMORY_CONFLICT_QUEUE_ITEM_SCHEMA = s.object({
  id: s.string(),
  ruleIds: s.array(s.string()),
  status: s.union(s.literal("pending"), s.literal("resolved")),
});

const MEMORY_DISTILL_TRIGGER_SCHEMA = s.union(
  s.literal("batch"),
  s.literal("idle"),
  s.literal("manual"),
  s.literal("conflict"),
);

const MEMORY_DISTILL_PROGRESS_SCHEMA = s.object({
  runId: s.string(),
  projectId: s.string(),
  trigger: MEMORY_DISTILL_TRIGGER_SCHEMA,
  stage: s.union(
    s.literal("started"),
    s.literal("clustered"),
    s.literal("patterned"),
    s.literal("generated"),
    s.literal("completed"),
    s.literal("failed"),
  ),
  progress: s.number(),
  message: s.optional(s.string()),
  errorCode: s.optional(IPC_ERROR_CODE_SCHEMA),
});

const MEMORY_TRACE_TYPE_SCHEMA = s.union(
  s.literal("working"),
  s.literal("episodic"),
  s.literal("semantic"),
);

const MEMORY_GENERATION_TRACE_SCHEMA = s.object({
  generationId: s.string(),
  projectId: s.string(),
  memoryReferences: s.object({
    working: s.array(s.string()),
    episodic: s.array(s.string()),
    semantic: s.array(s.string()),
  }),
  influenceWeights: s.array(
    s.object({
      memoryType: MEMORY_TRACE_TYPE_SCHEMA,
      referenceId: s.string(),
      weight: s.number(),
    }),
  ),
  createdAt: s.number(),
  updatedAt: s.number(),
});

const MEMORY_TRACE_FEEDBACK_VERDICT_SCHEMA = s.union(
  s.literal("correct"),
  s.literal("incorrect"),
);

const KG_ENTITY_TYPE_SCHEMA = s.union(
  s.literal("character"),
  s.literal("location"),
  s.literal("event"),
  s.literal("item"),
  s.literal("faction"),
);

const KG_AI_CONTEXT_LEVEL_SCHEMA = s.union(
  s.literal("always"),
  s.literal("when_detected"),
  s.literal("manual_only"),
  s.literal("never"),
);

const KG_ENTITY_SCHEMA = s.object({
  id: s.string(),
  projectId: s.string(),
  type: KG_ENTITY_TYPE_SCHEMA,
  name: s.string(),
  description: s.string(),
  attributes: s.record(s.string()),
  lastSeenState: s.optional(s.string()),
  aiContextLevel: KG_AI_CONTEXT_LEVEL_SCHEMA,
  aliases: s.array(s.string()),
  version: s.number(),
  createdAt: s.string(),
  updatedAt: s.string(),
});

const KG_RELATION_SCHEMA = s.object({
  id: s.string(),
  projectId: s.string(),
  sourceEntityId: s.string(),
  targetEntityId: s.string(),
  relationType: s.string(),
  description: s.string(),
  createdAt: s.string(),
});

const KG_RECOGNITION_ENQUEUE_SCHEMA = s.object({
  taskId: s.union(s.string(), s.literal(null)),
  status: s.union(
    s.literal("started"),
    s.literal("queued"),
    s.literal("skipped"),
  ),
  queuePosition: s.number(),
});

const KG_RECOGNITION_STATS_SCHEMA = s.object({
  running: s.number(),
  queued: s.number(),
  maxConcurrency: s.number(),
  peakRunning: s.number(),
  completed: s.number(),
  completionOrder: s.array(s.string()),
  canceledTaskIds: s.array(s.string()),
});

const KG_RULES_INJECTION_ENTITY_SCHEMA = s.object({
  id: s.string(),
  name: s.string(),
  type: KG_ENTITY_TYPE_SCHEMA,
  attributes: s.record(s.string()),
  relationsSummary: s.array(s.string()),
});

const KG_RULES_INJECTION_SCHEMA = s.object({
  injectedEntities: s.array(KG_RULES_INJECTION_ENTITY_SCHEMA),
  source: s.literal("kg-rules-mock"),
});

const DOCUMENT_TYPE_SCHEMA = s.union(
  s.literal("chapter"),
  s.literal("note"),
  s.literal("setting"),
  s.literal("timeline"),
  s.literal("character"),
);

const DOCUMENT_STATUS_SCHEMA = s.union(s.literal("draft"), s.literal("final"));

const VERSION_SNAPSHOT_ACTOR_SCHEMA = s.union(
  s.literal("user"),
  s.literal("auto"),
  s.literal("ai"),
);

const VERSION_SNAPSHOT_REASON_SCHEMA = s.union(
  s.literal("manual-save"),
  s.literal("autosave"),
  s.literal("ai-accept"),
  s.literal("status-change"),
);

const VERSION_DIFF_STATS_SCHEMA = s.object({
  addedLines: s.number(),
  removedLines: s.number(),
  changedHunks: s.number(),
});

const VERSION_BRANCH_ITEM_SCHEMA = s.object({
  id: s.string(),
  documentId: s.string(),
  name: s.string(),
  baseSnapshotId: s.string(),
  headSnapshotId: s.string(),
  createdBy: s.string(),
  createdAt: s.number(),
  isCurrent: s.boolean(),
});

const VERSION_BRANCH_CONFLICT_RESOLUTION_SCHEMA = s.union(
  s.literal("ours"),
  s.literal("theirs"),
  s.literal("manual"),
);

const VERSION_BRANCH_CONFLICT_RESOLUTION_ITEM_SCHEMA = s.object({
  conflictId: s.string(),
  resolution: VERSION_BRANCH_CONFLICT_RESOLUTION_SCHEMA,
  manualText: s.optional(s.string()),
});

const DOCUMENT_LIST_ITEM_SCHEMA = s.object({
  documentId: s.string(),
  type: DOCUMENT_TYPE_SCHEMA,
  title: s.string(),
  status: DOCUMENT_STATUS_SCHEMA,
  sortOrder: s.number(),
  parentId: s.optional(s.string()),
  updatedAt: s.number(),
});

const AI_CHAT_ROLE_SCHEMA = s.union(s.literal("user"), s.literal("assistant"));

const AI_CHAT_HISTORY_ITEM_SCHEMA = s.object({
  messageId: s.string(),
  projectId: s.string(),
  role: AI_CHAT_ROLE_SCHEMA,
  content: s.string(),
  skillId: s.optional(s.string()),
  timestamp: s.number(),
  traceId: s.string(),
});

const APP_WINDOW_STATE_SCHEMA = s.object({
  controlsEnabled: s.boolean(),
  isMaximized: s.boolean(),
  isMinimized: s.boolean(),
  isFullScreen: s.boolean(),
  platform: s.string(),
});


/**
 * Backup snapshot schema.
 */
const BACKUP_SNAPSHOT_SCHEMA = s.object({
  id: s.string(),
  projectId: s.string(),
  createdAt: s.string(),
  sizeBytes: s.number(),
  label: s.optional(s.string()),
});

export const ipcContract = {
  version: 1,
  errorCodes: IPC_ERROR_CODES,
  channels: {
    "app:system:ping": {
      request: s.object({}),
      response: s.object({}),
    },
    "app:window:getstate": {
      request: s.object({}),
      response: APP_WINDOW_STATE_SCHEMA,
    },
    "app:window:minimize": {
      request: s.object({}),
      response: s.object({}),
    },
    "app:window:togglemaximized": {
      request: s.object({}),
      response: s.object({}),
    },
    "app:window:close": {
      request: s.object({}),
      response: s.object({}),
    },
    "stats:day:gettoday": {
      request: s.object({}),
      response: STATS_DAY_SCHEMA,
    },
    "stats:range:get": {
      request: s.object({
        from: s.string(),
        to: s.string(),
      }),
      response: s.object({
        from: s.string(),
        to: s.string(),
        days: s.array(STATS_DAY_SCHEMA),
        summary: STATS_SUMMARY_SCHEMA,
      }),
    },
    "export:document:markdown": {
      request: s.object({
        projectId: s.string(),
        documentId: s.optional(s.string()),
      }),
      response: EXPORT_RESULT_SCHEMA,
    },
    "export:document:pdf": {
      request: s.object({
        projectId: s.string(),
        documentId: s.optional(s.string()),
      }),
      response: EXPORT_RESULT_SCHEMA,
    },
    "export:document:docx": {
      request: s.object({
        projectId: s.string(),
        documentId: s.optional(s.string()),
      }),
      response: EXPORT_RESULT_SCHEMA,
    },
    "export:document:txt": {
      request: s.object({
        projectId: s.string(),
        documentId: s.optional(s.string()),
      }),
      response: EXPORT_RESULT_SCHEMA,
    },
    "export:project:bundle": {
      request: s.object({
        projectId: s.string(),
      }),
      response: EXPORT_RESULT_SCHEMA,
    },
    "backup:snapshot:create": {
      request: s.object({
        projectId: s.string(),
        label: s.optional(s.string()),
      }),
      response: BACKUP_SNAPSHOT_SCHEMA,
    },
    "backup:snapshot:list": {
      request: s.object({
        projectId: s.string(),
      }),
      response: s.array(BACKUP_SNAPSHOT_SCHEMA),
    },
    "backup:snapshot:restore": {
      request: s.object({
        backupId: s.string(),
      }),
      response: BACKUP_SNAPSHOT_SCHEMA,
    },
    "backup:snapshot:delete": {
      request: s.object({
        backupId: s.string(),
      }),
      response: s.object({
        deleted: s.boolean(),
      }),
    },
    "ai:chat:send": {
      request: s.object({
        message: s.string(),
        projectId: s.string(),
        documentId: s.optional(s.string()),
      }),
      response: s.object({
        accepted: s.literal(true),
        messageId: s.string(),
        echoed: s.string(),
      }),
    },
    "ai:chat:list": {
      request: s.object({
        projectId: s.string(),
      }),
      response: s.object({
        items: s.array(AI_CHAT_HISTORY_ITEM_SCHEMA),
      }),
    },
    "ai:chat:clear": {
      request: s.object({
        projectId: s.string(),
      }),
      response: s.object({
        cleared: s.literal(true),
        removed: s.number(),
      }),
    },
    "ai:skill:run": {
      request: s.object({
        skillId: s.string(),
        input: s.string(),
        mode: s.union(s.literal("agent"), s.literal("plan"), s.literal("ask")),
        model: s.string(),
        candidateCount: s.optional(s.number()),
        context: s.optional(
          s.object({
            projectId: s.optional(s.string()),
            documentId: s.optional(s.string()),
          }),
        ),
        promptDiagnostics: s.optional(AI_PROMPT_DIAGNOSTICS_SCHEMA),
        stream: s.boolean(),
      }),
      response: s.object({
        executionId: s.string(),
        runId: s.string(),
        outputText: s.optional(s.string()),
        candidates: s.optional(s.array(AI_CANDIDATE_SCHEMA)),
        usage: s.optional(AI_USAGE_STATS_SCHEMA),
        promptDiagnostics: s.optional(AI_PROMPT_DIAGNOSTICS_SCHEMA),
      }),
    },
    "ai:config:get": {
      request: s.object({}),
      response: AI_PROXY_SETTINGS_SCHEMA,
    },
    "ai:config:update": {
      request: s.object({
        patch: s.object({
          enabled: s.optional(s.boolean()),
          baseUrl: s.optional(s.string()),
          apiKey: s.optional(s.string()),
          providerMode: s.optional(
            s.union(
              s.literal("openai-compatible"),
              s.literal("openai-byok"),
              s.literal("anthropic-byok"),
            ),
          ),
          openAiCompatibleBaseUrl: s.optional(s.string()),
          openAiCompatibleApiKey: s.optional(s.string()),
          openAiByokBaseUrl: s.optional(s.string()),
          openAiByokApiKey: s.optional(s.string()),
          anthropicByokBaseUrl: s.optional(s.string()),
          anthropicByokApiKey: s.optional(s.string()),
        }),
      }),
      response: AI_PROXY_SETTINGS_SCHEMA,
    },
    "ai:config:test": {
      request: s.object({}),
      response: AI_PROXY_TEST_SCHEMA,
    },
    "ai:models:list": {
      request: s.object({}),
      response: AI_MODEL_CATALOG_SCHEMA,
    },
    "ai:skill:cancel": {
      request: s.object({
        runId: s.optional(s.string()),
        executionId: s.optional(s.string()),
      }),
      response: s.object({ canceled: s.literal(true) }),
    },
    "ai:skill:feedback": {
      request: s.object({
        runId: s.string(),
        action: s.union(
          s.literal("accept"),
          s.literal("reject"),
          s.literal("partial"),
        ),
        evidenceRef: s.string(),
      }),
      response: s.object({
        recorded: s.literal(true),
        learning: s.optional(
          s.object({
            ignored: s.boolean(),
            ignoredReason: s.optional(s.string()),
            learned: s.boolean(),
            learnedMemoryId: s.optional(s.string()),
            signalCount: s.optional(s.number()),
            threshold: s.optional(s.number()),
          }),
        ),
      }),
    },
    "memory:entry:create": {
      request: s.object({
        type: MEMORY_TYPE_SCHEMA,
        scope: MEMORY_SCOPE_SCHEMA,
        projectId: s.optional(s.string()),
        documentId: s.optional(s.string()),
        content: s.string(),
      }),
      response: s.object({
        memoryId: s.string(),
        type: MEMORY_TYPE_SCHEMA,
        scope: MEMORY_SCOPE_SCHEMA,
        projectId: s.optional(s.string()),
        documentId: s.optional(s.string()),
        origin: MEMORY_ORIGIN_SCHEMA,
        sourceRef: s.optional(s.string()),
        content: s.string(),
        createdAt: s.number(),
        updatedAt: s.number(),
        deletedAt: s.optional(s.number()),
      }),
    },
    "memory:entry:list": {
      request: s.object({
        projectId: s.optional(s.string()),
        documentId: s.optional(s.string()),
        includeDeleted: s.optional(s.boolean()),
      }),
      response: s.object({
        items: s.array(
          s.object({
            memoryId: s.string(),
            type: MEMORY_TYPE_SCHEMA,
            scope: MEMORY_SCOPE_SCHEMA,
            projectId: s.optional(s.string()),
            documentId: s.optional(s.string()),
            origin: MEMORY_ORIGIN_SCHEMA,
            sourceRef: s.optional(s.string()),
            content: s.string(),
            createdAt: s.number(),
            updatedAt: s.number(),
            deletedAt: s.optional(s.number()),
          }),
        ),
      }),
    },
    "memory:entry:update": {
      request: s.object({
        memoryId: s.string(),
        patch: s.object({
          type: s.optional(MEMORY_TYPE_SCHEMA),
          scope: s.optional(MEMORY_SCOPE_SCHEMA),
          projectId: s.optional(s.string()),
          documentId: s.optional(s.string()),
          content: s.optional(s.string()),
        }),
      }),
      response: s.object({
        memoryId: s.string(),
        type: MEMORY_TYPE_SCHEMA,
        scope: MEMORY_SCOPE_SCHEMA,
        projectId: s.optional(s.string()),
        documentId: s.optional(s.string()),
        origin: MEMORY_ORIGIN_SCHEMA,
        sourceRef: s.optional(s.string()),
        content: s.string(),
        createdAt: s.number(),
        updatedAt: s.number(),
        deletedAt: s.optional(s.number()),
      }),
    },
    "memory:entry:delete": {
      request: s.object({ memoryId: s.string() }),
      response: s.object({ deleted: s.literal(true) }),
    },
    "memory:settings:get": {
      request: s.object({}),
      response: MEMORY_SETTINGS_SCHEMA,
    },
    "memory:settings:update": {
      request: s.object({
        patch: s.object({
          injectionEnabled: s.optional(s.boolean()),
          preferenceLearningEnabled: s.optional(s.boolean()),
          privacyModeEnabled: s.optional(s.boolean()),
          preferenceLearningThreshold: s.optional(s.number()),
        }),
      }),
      response: MEMORY_SETTINGS_SCHEMA,
    },
    "memory:injection:preview": {
      request: s.object({
        projectId: s.optional(s.string()),
        documentId: s.optional(s.string()),
        queryText: s.optional(s.string()),
      }),
      response: s.object({
        items: s.array(MEMORY_INJECTION_ITEM_SCHEMA),
        mode: s.union(s.literal("deterministic"), s.literal("semantic")),
        diagnostics: s.optional(
          s.object({
            degradedFrom: s.literal("semantic"),
            reason: s.string(),
          }),
        ),
      }),
    },
    "memory:episode:record": {
      request: s.object({
        projectId: s.string(),
        chapterId: s.string(),
        sceneType: s.string(),
        skillUsed: s.string(),
        inputContext: s.string(),
        candidates: s.array(s.string()),
        selectedIndex: s.number(),
        finalText: s.string(),
        explicit: s.optional(s.string()),
        editDistance: s.number(),
        importance: s.optional(s.number()),
        acceptedWithoutEdit: s.optional(s.boolean()),
        undoAfterAccept: s.optional(s.boolean()),
        repeatedSceneSkillCount: s.optional(s.number()),
        userConfirmed: s.optional(s.boolean()),
        targetEpisodeId: s.optional(s.string()),
      }),
      response: s.object({
        accepted: s.literal(true),
        episodeId: s.string(),
        retryCount: s.number(),
        implicitSignal: MEMORY_IMPLICIT_SIGNAL_SCHEMA,
        implicitWeight: s.number(),
      }),
    },
    "memory:episode:query": {
      request: s.object({
        projectId: s.string(),
        sceneType: s.string(),
        queryText: s.optional(s.string()),
        limit: s.optional(s.number()),
      }),
      response: s.object({
        items: s.array(MEMORY_EPISODE_SCHEMA),
        memoryDegraded: s.boolean(),
        fallbackRules: s.array(s.string()),
        semanticRules: s.array(MEMORY_SEMANTIC_RULE_PLACEHOLDER_SCHEMA),
      }),
    },
    "memory:semantic:list": {
      request: s.object({
        projectId: s.string(),
      }),
      response: s.object({
        items: s.array(MEMORY_SEMANTIC_RULE_SCHEMA),
        conflictQueue: s.array(MEMORY_CONFLICT_QUEUE_ITEM_SCHEMA),
      }),
    },
    "memory:semantic:add": {
      request: s.object({
        projectId: s.string(),
        rule: s.string(),
        category: MEMORY_SEMANTIC_CATEGORY_SCHEMA,
        confidence: s.number(),
        scope: s.optional(MEMORY_SEMANTIC_SCOPE_SCHEMA),
        supportingEpisodes: s.optional(s.array(s.string())),
        contradictingEpisodes: s.optional(s.array(s.string())),
        userConfirmed: s.optional(s.boolean()),
        userModified: s.optional(s.boolean()),
      }),
      response: s.object({
        item: MEMORY_SEMANTIC_RULE_SCHEMA,
      }),
    },
    "memory:semantic:update": {
      request: s.object({
        projectId: s.string(),
        ruleId: s.string(),
        patch: s.object({
          rule: s.optional(s.string()),
          category: s.optional(MEMORY_SEMANTIC_CATEGORY_SCHEMA),
          confidence: s.optional(s.number()),
          scope: s.optional(MEMORY_SEMANTIC_SCOPE_SCHEMA),
          supportingEpisodes: s.optional(s.array(s.string())),
          contradictingEpisodes: s.optional(s.array(s.string())),
          userConfirmed: s.optional(s.boolean()),
          userModified: s.optional(s.boolean()),
        }),
      }),
      response: s.object({
        item: MEMORY_SEMANTIC_RULE_SCHEMA,
      }),
    },
    "memory:semantic:delete": {
      request: s.object({
        projectId: s.string(),
        ruleId: s.string(),
      }),
      response: s.object({
        deleted: s.literal(true),
      }),
    },
    "memory:scope:promote": {
      request: s.object({
        projectId: s.string(),
        ruleId: s.string(),
      }),
      response: s.object({
        item: MEMORY_SEMANTIC_RULE_SCHEMA,
      }),
    },
    "memory:clear:project": {
      request: s.object({
        projectId: s.string(),
        confirmed: s.boolean(),
      }),
      response: s.object({
        ok: s.literal(true),
        deletedEpisodes: s.number(),
        deletedRules: s.number(),
      }),
    },
    "memory:clear:all": {
      request: s.object({
        confirmed: s.boolean(),
      }),
      response: s.object({
        ok: s.literal(true),
        deletedEpisodes: s.number(),
        deletedRules: s.number(),
      }),
    },
    "memory:semantic:distill": {
      request: s.object({
        projectId: s.string(),
        trigger: s.optional(MEMORY_DISTILL_TRIGGER_SCHEMA),
      }),
      response: s.object({
        accepted: s.literal(true),
        runId: s.string(),
      }),
    },
    "memory:distill:progress": {
      request: MEMORY_DISTILL_PROGRESS_SCHEMA,
      response: MEMORY_DISTILL_PROGRESS_SCHEMA,
    },
    "memory:trace:get": {
      request: s.object({
        projectId: s.string(),
        generationId: s.string(),
      }),
      response: s.object({
        trace: MEMORY_GENERATION_TRACE_SCHEMA,
      }),
    },
    "memory:trace:feedback": {
      request: s.object({
        projectId: s.string(),
        generationId: s.string(),
        verdict: MEMORY_TRACE_FEEDBACK_VERDICT_SCHEMA,
        reason: s.optional(s.string()),
      }),
      response: s.object({
        accepted: s.literal(true),
        feedbackId: s.string(),
      }),
    },
    "search:fts:query": {
      request: s.object({
        projectId: s.string(),
        query: s.string(),
        limit: s.optional(s.number()),
        offset: s.optional(s.number()),
      }),
      response: s.object({
        results: s.array(SEARCH_FTS_ITEM_SCHEMA),
        total: s.number(),
        hasMore: s.boolean(),
        indexState: s.union(s.literal("ready"), s.literal("rebuilding")),
      }),
    },
    "search:fts:reindex": {
      request: s.object({
        projectId: s.string(),
      }),
      response: s.object({
        indexState: s.literal("ready"),
        reindexed: s.number(),
      }),
    },
    "search:query:strategy": {
      request: s.object({
        projectId: s.string(),
        query: s.string(),
        strategy: SEARCH_QUERY_STRATEGY_SCHEMA,
        limit: s.optional(s.number()),
        offset: s.optional(s.number()),
      }),
      response: s.object({
        traceId: s.string(),
        costMs: s.number(),
        strategy: SEARCH_QUERY_STRATEGY_SCHEMA,
        fallback: SEARCH_FALLBACK_SCHEMA,
        notice: s.optional(s.string()),
        results: s.array(SEARCH_RANKED_ITEM_SCHEMA),
        total: s.number(),
        hasMore: s.boolean(),
        backpressure: SEARCH_RANK_BACKPRESSURE_SCHEMA,
      }),
    },
    "search:rank:explain": {
      request: s.object({
        projectId: s.string(),
        query: s.string(),
        strategy: SEARCH_QUERY_STRATEGY_SCHEMA,
        documentId: s.optional(s.string()),
        chunkId: s.optional(s.string()),
        limit: s.optional(s.number()),
        offset: s.optional(s.number()),
      }),
      response: s.object({
        strategy: SEARCH_QUERY_STRATEGY_SCHEMA,
        explanations: s.array(SEARCH_RANKED_ITEM_SCHEMA),
        total: s.number(),
        backpressure: SEARCH_RANK_BACKPRESSURE_SCHEMA,
      }),
    },
    "search:replace:preview": {
      request: s.object({
        projectId: s.string(),
        documentId: s.optional(s.string()),
        scope: SEARCH_REPLACE_SCOPE_SCHEMA,
        query: s.string(),
        replaceWith: s.string(),
        regex: s.optional(s.boolean()),
        caseSensitive: s.optional(s.boolean()),
        wholeWord: s.optional(s.boolean()),
      }),
      response: s.object({
        affectedDocuments: s.number(),
        totalMatches: s.number(),
        items: s.array(SEARCH_REPLACE_PREVIEW_ITEM_SCHEMA),
        warnings: s.array(s.string()),
        previewId: s.optional(s.string()),
      }),
    },
    "search:replace:execute": {
      request: s.object({
        projectId: s.string(),
        documentId: s.optional(s.string()),
        scope: SEARCH_REPLACE_SCOPE_SCHEMA,
        query: s.string(),
        replaceWith: s.string(),
        regex: s.optional(s.boolean()),
        caseSensitive: s.optional(s.boolean()),
        wholeWord: s.optional(s.boolean()),
        previewId: s.optional(s.string()),
        confirmed: s.optional(s.boolean()),
      }),
      response: s.object({
        replacedCount: s.number(),
        affectedDocumentCount: s.number(),
        snapshotIds: s.array(s.string()),
        skipped: s.array(SEARCH_REPLACE_SKIPPED_ITEM_SCHEMA),
      }),
    },
    "embedding:text:generate": {
      request: s.object({
        texts: s.array(s.string()),
        model: s.optional(s.string()),
      }),
      response: s.object({
        vectors: s.array(s.array(s.number())),
        dimension: s.number(),
      }),
    },
    "embedding:semantic:search": {
      request: s.object({
        projectId: s.string(),
        queryText: s.string(),
        topK: s.optional(s.number()),
        minScore: s.optional(s.number()),
        model: s.optional(s.string()),
      }),
      response: s.object({
        mode: s.union(s.literal("semantic"), s.literal("fts-fallback")),
        notice: s.optional(s.string()),
        fallback: s.optional(
          s.object({
            from: s.literal("semantic"),
            to: s.literal("fts"),
            reason: s.string(),
          }),
        ),
        isolation: s.optional(EMBEDDING_SEARCH_ISOLATION_SCHEMA),
        results: s.array(EMBEDDING_SEARCH_RESULT_SCHEMA),
      }),
    },
    "embedding:index:reindex": {
      request: s.object({
        projectId: s.string(),
        batchSize: s.optional(s.number()),
        model: s.optional(s.string()),
      }),
      response: s.object({
        indexedDocuments: s.number(),
        indexedChunks: s.number(),
        changedChunks: s.number(),
      }),
    },
    "rag:context:retrieve": {
      request: s.object({
        projectId: s.string(),
        queryText: s.string(),
        topK: s.optional(s.number()),
        minScore: s.optional(s.number()),
        maxTokens: s.optional(s.number()),
        model: s.optional(s.string()),
      }),
      response: s.object({
        chunks: s.array(RAG_CHUNK_SCHEMA),
        truncated: s.boolean(),
        usedTokens: s.number(),
        fallback: s.optional(
          s.object({
            from: s.literal("semantic"),
            to: s.literal("fts"),
            reason: s.string(),
          }),
        ),
      }),
    },
    "rag:config:get": {
      request: s.object({}),
      response: RAG_CONFIG_SCHEMA,
    },
    "rag:config:update": {
      request: s.object({
        topK: s.optional(s.number()),
        minScore: s.optional(s.number()),
        maxTokens: s.optional(s.number()),
        model: s.optional(s.string()),
      }),
      response: RAG_CONFIG_SCHEMA,
    },
    "knowledge:entity:create": {
      request: s.object({
        projectId: s.string(),
        type: KG_ENTITY_TYPE_SCHEMA,
        name: s.string(),
        description: s.optional(s.string()),
        attributes: s.optional(s.record(s.string())),
        lastSeenState: s.optional(s.string()),
        aiContextLevel: s.optional(KG_AI_CONTEXT_LEVEL_SCHEMA),
        aliases: s.optional(s.array(s.string())),
      }),
      response: KG_ENTITY_SCHEMA,
    },
    "knowledge:entity:read": {
      request: s.object({
        projectId: s.string(),
        id: s.string(),
      }),
      response: KG_ENTITY_SCHEMA,
    },
    "knowledge:entity:list": {
      request: s.object({
        projectId: s.string(),
        filter: s.optional(
          s.object({
            aiContextLevel: s.optional(KG_AI_CONTEXT_LEVEL_SCHEMA),
          }),
        ),
      }),
      response: s.object({ items: s.array(KG_ENTITY_SCHEMA) }),
    },
    "knowledge:entity:update": {
      request: s.object({
        projectId: s.string(),
        id: s.string(),
        expectedVersion: s.number(),
        patch: s.object({
          type: s.optional(KG_ENTITY_TYPE_SCHEMA),
          name: s.optional(s.string()),
          description: s.optional(s.string()),
          attributes: s.optional(s.record(s.string())),
          lastSeenState: s.optional(s.string()),
          aiContextLevel: s.optional(KG_AI_CONTEXT_LEVEL_SCHEMA),
          aliases: s.optional(s.array(s.string())),
        }),
      }),
      response: KG_ENTITY_SCHEMA,
    },
    "knowledge:entity:delete": {
      request: s.object({
        projectId: s.string(),
        id: s.string(),
      }),
      response: s.object({
        deleted: s.literal(true),
        deletedRelationCount: s.number(),
      }),
    },
    "knowledge:relation:create": {
      request: s.object({
        projectId: s.string(),
        sourceEntityId: s.string(),
        targetEntityId: s.string(),
        relationType: s.string(),
        description: s.optional(s.string()),
      }),
      response: KG_RELATION_SCHEMA,
    },
    "knowledge:relation:list": {
      request: s.object({ projectId: s.string() }),
      response: s.object({ items: s.array(KG_RELATION_SCHEMA) }),
    },
    "knowledge:relation:update": {
      request: s.object({
        projectId: s.string(),
        id: s.string(),
        patch: s.object({
          sourceEntityId: s.optional(s.string()),
          targetEntityId: s.optional(s.string()),
          relationType: s.optional(s.string()),
          description: s.optional(s.string()),
        }),
      }),
      response: KG_RELATION_SCHEMA,
    },
    "knowledge:relation:delete": {
      request: s.object({
        projectId: s.string(),
        id: s.string(),
      }),
      response: s.object({ deleted: s.literal(true) }),
    },
    "knowledge:query:subgraph": {
      request: s.object({
        projectId: s.string(),
        centerEntityId: s.string(),
        k: s.number(),
      }),
      response: s.object({
        entities: s.array(KG_ENTITY_SCHEMA),
        relations: s.array(KG_RELATION_SCHEMA),
        nodeCount: s.number(),
        edgeCount: s.number(),
        queryCostMs: s.number(),
      }),
    },
    "knowledge:query:path": {
      request: s.object({
        projectId: s.string(),
        sourceEntityId: s.string(),
        targetEntityId: s.string(),
        timeoutMs: s.optional(s.number()),
      }),
      response: s.object({
        pathEntityIds: s.array(s.string()),
        queryCostMs: s.number(),
        expansions: s.number(),
        degraded: s.boolean(),
      }),
    },
    "knowledge:query:validate": {
      request: s.object({
        projectId: s.string(),
      }),
      response: s.object({
        cycles: s.array(s.array(s.string())),
        queryCostMs: s.number(),
      }),
    },
    "knowledge:recognition:enqueue": {
      request: s.object({
        projectId: s.string(),
        documentId: s.string(),
        sessionId: s.string(),
        contentText: s.string(),
        traceId: s.string(),
      }),
      response: KG_RECOGNITION_ENQUEUE_SCHEMA,
    },
    "knowledge:recognition:cancel": {
      request: s.object({
        projectId: s.string(),
        sessionId: s.string(),
        taskId: s.string(),
      }),
      response: s.object({
        canceled: s.literal(true),
      }),
    },
    "knowledge:recognition:stats": {
      request: s.object({
        projectId: s.string(),
        sessionId: s.string(),
      }),
      response: KG_RECOGNITION_STATS_SCHEMA,
    },
    "knowledge:suggestion:accept": {
      request: s.object({
        projectId: s.string(),
        sessionId: s.string(),
        suggestionId: s.string(),
      }),
      response: KG_ENTITY_SCHEMA,
    },
    "knowledge:suggestion:dismiss": {
      request: s.object({
        projectId: s.string(),
        sessionId: s.string(),
        suggestionId: s.string(),
      }),
      response: s.object({
        dismissed: s.literal(true),
      }),
    },
    "knowledge:query:relevant": {
      request: s.object({
        projectId: s.string(),
        excerpt: s.string(),
        maxEntities: s.optional(s.number()),
        entityIds: s.optional(s.array(s.string())),
      }),
      response: s.object({
        items: s.array(KG_ENTITY_SCHEMA),
        queryCostMs: s.number(),
      }),
    },
    "knowledge:query:byids": {
      request: s.object({
        projectId: s.string(),
        entityIds: s.array(s.string()),
      }),
      response: s.object({
        items: s.array(KG_ENTITY_SCHEMA),
      }),
    },
    "knowledge:rules:inject": {
      request: s.object({
        projectId: s.string(),
        documentId: s.string(),
        excerpt: s.string(),
        traceId: s.string(),
        maxEntities: s.optional(s.number()),
        entityIds: s.optional(s.array(s.string())),
      }),
      response: KG_RULES_INJECTION_SCHEMA,
    },
    "skill:registry:list": {
      request: s.object({ includeDisabled: s.optional(s.boolean()) }),
      response: s.object({ items: s.array(SKILL_LIST_ITEM_SCHEMA) }),
    },
    "skill:registry:read": {
      request: s.object({ id: s.string() }),
      response: s.object({ id: s.string(), content: s.string() }),
    },
    "skill:registry:write": {
      request: s.object({ id: s.string(), content: s.string() }),
      response: s.object({
        id: s.string(),
        scope: SKILL_SCOPE_SCHEMA,
        written: s.literal(true),
      }),
    },
    "skill:registry:toggle": {
      request: s.object({
        id: s.optional(s.string()),
        skillId: s.optional(s.string()),
        enabled: s.boolean(),
      }),
      response: s.object({ id: s.string(), enabled: s.boolean() }),
    },
    "skill:custom:update": {
      request: s.object({
        id: s.string(),
        scope: s.optional(CUSTOM_SKILL_SCOPE_SCHEMA),
        name: s.optional(s.string()),
        description: s.optional(s.string()),
        promptTemplate: s.optional(s.string()),
        inputType: s.optional(CUSTOM_SKILL_INPUT_TYPE_SCHEMA),
        contextRules: s.optional(CUSTOM_SKILL_CONTEXT_RULES_SCHEMA),
        enabled: s.optional(s.boolean()),
      }),
      response: s.object({
        id: s.string(),
        scope: CUSTOM_SKILL_SCOPE_SCHEMA,
      }),
    },
    "skill:custom:create": {
      request: s.object({
        name: s.string(),
        description: s.string(),
        promptTemplate: s.string(),
        inputType: CUSTOM_SKILL_INPUT_TYPE_SCHEMA,
        contextRules: CUSTOM_SKILL_CONTEXT_RULES_SCHEMA,
        scope: CUSTOM_SKILL_SCOPE_SCHEMA,
        enabled: s.optional(s.boolean()),
      }),
      response: s.object({
        skill: CUSTOM_SKILL_SCHEMA,
      }),
    },
    "skill:custom:list": {
      request: s.object({}),
      response: s.object({
        items: s.array(CUSTOM_SKILL_SCHEMA),
      }),
    },
    "skill:custom:delete": {
      request: s.object({ id: s.string() }),
      response: s.object({
        id: s.string(),
        deleted: s.literal(true),
      }),
    },
    "db:debug:tablenames": {
      request: s.object({}),
      response: s.object({ tableNames: s.array(s.string()) }),
    },
    "dialog:folder:open": {
      request: s.object({}),
      response: s.object({
        selectedPath: s.optional(s.string()),
      }),
    },
    "project:project:create": {
      request: s.object({
        name: s.optional(s.string()),
        type: s.optional(PROJECT_TYPE_SCHEMA),
        description: s.optional(s.string()),
        template: s.optional(PROJECT_TEMPLATE_INPUT_SCHEMA),
      }),
      response: s.object({ projectId: s.string(), rootPath: s.string() }),
    },
    "project:project:createaiassist": {
      request: s.object({ prompt: s.string() }),
      response: s.object({
        name: s.string(),
        type: PROJECT_TYPE_SCHEMA,
        description: s.string(),
        chapterOutlines: s.array(s.string()),
        characters: s.array(s.string()),
      }),
    },
    "project:project:list": {
      request: s.object({ includeArchived: s.optional(s.boolean()) }),
      response: s.object({
        items: s.array(
          s.object({
            projectId: s.string(),
            name: s.string(),
            rootPath: s.string(),
            type: s.optional(PROJECT_TYPE_SCHEMA),
            stage: s.optional(PROJECT_STAGE_SCHEMA),
            updatedAt: s.number(),
            archivedAt: s.optional(s.number()),
          }),
        ),
      }),
    },
    "project:project:update": {
      request: s.object({
        projectId: s.string(),
        patch: s.object({
          type: s.optional(s.string()),
          description: s.optional(s.string()),
          stage: s.optional(s.string()),
          targetWordCount: s.optional(s.number()),
          targetChapterCount: s.optional(s.number()),
          narrativePerson: s.optional(s.string()),
          languageStyle: s.optional(s.string()),
          targetAudience: s.optional(s.string()),
          defaultSkillSetId: s.optional(s.string()),
          knowledgeGraphId: s.optional(s.string()),
        }),
      }),
      response: s.object({ updated: s.literal(true) }),
    },
    "project:project:stats": {
      request: s.object({}),
      response: s.object({
        total: s.number(),
        active: s.number(),
        archived: s.number(),
      }),
    },
    "project:project:rename": {
      request: s.object({ projectId: s.string(), name: s.string() }),
      response: s.object({
        projectId: s.string(),
        name: s.string(),
        updatedAt: s.number(),
      }),
    },
    "project:project:duplicate": {
      request: s.object({ projectId: s.string() }),
      response: s.object({
        projectId: s.string(),
        rootPath: s.string(),
        name: s.string(),
      }),
    },
    "project:project:archive": {
      request: s.object({ projectId: s.string(), archived: s.boolean() }),
      response: s.object({
        projectId: s.string(),
        archived: s.boolean(),
        archivedAt: s.optional(s.number()),
      }),
    },
    "project:project:getcurrent": {
      request: s.object({}),
      response: s.object({ projectId: s.string(), rootPath: s.string() }),
    },
    "project:project:setcurrent": {
      request: s.object({ projectId: s.string() }),
      response: s.object({ projectId: s.string(), rootPath: s.string() }),
    },
    "project:project:switch": {
      request: s.object({
        projectId: s.string(),
        operatorId: s.string(),
        fromProjectId: s.string(),
        traceId: s.string(),
      }),
      response: s.object({
        currentProjectId: s.string(),
        switchedAt: s.string(),
      }),
    },
    "project:project:delete": {
      request: s.object({ projectId: s.string() }),
      response: s.object({ deleted: s.literal(true) }),
    },
    "project:lifecycle:archive": {
      request: s.object({
        projectId: s.string(),
        traceId: s.optional(s.string()),
      }),
      response: s.object({
        projectId: s.string(),
        state: PROJECT_LIFECYCLE_STATE_SCHEMA,
        archivedAt: s.optional(s.number()),
      }),
    },
    "project:lifecycle:restore": {
      request: s.object({
        projectId: s.string(),
        traceId: s.optional(s.string()),
      }),
      response: s.object({
        projectId: s.string(),
        state: PROJECT_LIFECYCLE_STATE_SCHEMA,
      }),
    },
    "project:lifecycle:purge": {
      request: s.object({
        projectId: s.string(),
        traceId: s.optional(s.string()),
      }),
      response: s.object({
        projectId: s.string(),
        state: PROJECT_LIFECYCLE_STATE_SCHEMA,
      }),
    },
    "project:lifecycle:get": {
      request: s.object({
        projectId: s.string(),
        traceId: s.optional(s.string()),
      }),
      response: s.object({
        projectId: s.string(),
        state: PROJECT_LIFECYCLE_STATE_SCHEMA,
      }),
    },
    "context:creonow:ensure": {
      request: s.object({ projectId: s.string() }),
      response: s.object({ rootPath: s.string(), ensured: s.literal(true) }),
    },
    "context:creonow:status": {
      request: s.object({ projectId: s.string() }),
      response: s.object({
        exists: s.boolean(),
        watching: s.boolean(),
        rootPath: s.optional(s.string()),
      }),
    },
    "context:watch:start": {
      request: s.object({ projectId: s.string() }),
      response: s.object({ watching: s.literal(true) }),
    },
    "context:watch:stop": {
      request: s.object({ projectId: s.string() }),
      response: s.object({ watching: s.literal(false) }),
    },
    "context:budget:get": {
      request: s.object({}),
      response: CONTEXT_BUDGET_PROFILE_SCHEMA,
    },
    "context:budget:update": {
      request: CONTEXT_BUDGET_UPDATE_REQUEST_SCHEMA,
      response: CONTEXT_BUDGET_PROFILE_SCHEMA,
    },
    "context:prompt:assemble": {
      request: CONTEXT_ASSEMBLE_REQUEST_SCHEMA,
      response: CONTEXT_ASSEMBLE_RESPONSE_SCHEMA,
    },
    "context:prompt:inspect": {
      request: CONTEXT_INSPECT_REQUEST_SCHEMA,
      response: CONTEXT_INSPECT_RESPONSE_SCHEMA,
    },
    "context:rules:list": {
      request: s.object({ projectId: s.string() }),
      response: s.object({
        items: s.array(CREONOW_LIST_ITEM_SCHEMA),
      }),
    },
    "context:rules:read": {
      request: s.object({ projectId: s.string(), path: s.string() }),
      response: s.object({
        path: s.string(),
        content: s.string(),
        sizeBytes: s.number(),
        updatedAtMs: s.number(),
        redactionEvidence: s.array(REDACTION_EVIDENCE_SCHEMA),
      }),
    },
    "context:settings:list": {
      request: s.object({ projectId: s.string() }),
      response: s.object({
        items: s.array(CREONOW_LIST_ITEM_SCHEMA),
      }),
    },
    "context:settings:read": {
      request: s.object({ projectId: s.string(), path: s.string() }),
      response: s.object({
        path: s.string(),
        content: s.string(),
        sizeBytes: s.number(),
        updatedAtMs: s.number(),
        redactionEvidence: s.array(REDACTION_EVIDENCE_SCHEMA),
      }),
    },
    "constraints:policy:get": {
      request: s.object({ projectId: s.string() }),
      response: s.object({
        constraints: s.object({
          version: s.literal(1),
          items: s.array(s.string()),
        }),
      }),
    },
    "constraints:policy:list": {
      request: s.object({ projectId: s.string() }),
      response: s.object({
        constraints: s.array(CONSTRAINT_ITEM_SCHEMA),
      }),
    },
    "constraints:policy:create": {
      request: s.object({
        projectId: s.string(),
        constraint: CONSTRAINT_CREATE_SCHEMA,
      }),
      response: s.object({
        constraint: CONSTRAINT_ITEM_SCHEMA,
      }),
    },
    "constraints:policy:update": {
      request: s.object({
        projectId: s.string(),
        constraintId: s.string(),
        patch: CONSTRAINT_PATCH_SCHEMA,
      }),
      response: s.object({
        constraint: CONSTRAINT_ITEM_SCHEMA,
      }),
    },
    "constraints:policy:delete": {
      request: s.object({
        projectId: s.string(),
        constraintId: s.string(),
      }),
      response: s.object({
        deletedConstraintId: s.string(),
      }),
    },
    "constraints:policy:set": {
      request: s.object({
        projectId: s.string(),
        constraints: s.object({
          version: s.literal(1),
          items: s.array(s.string()),
        }),
      }),
      response: s.object({
        constraints: s.object({
          version: s.literal(1),
          items: s.array(s.string()),
        }),
      }),
    },
    "judge:model:getstate": {
      request: s.object({}),
      response: s.object({ state: JUDGE_MODEL_STATE_SCHEMA }),
    },
    "judge:model:ensure": {
      request: s.object({ timeoutMs: s.optional(s.number()) }),
      response: s.object({ state: JUDGE_MODEL_STATE_SCHEMA }),
    },
    "judge:quality:evaluate": {
      request: JUDGE_EVALUATE_REQUEST_SCHEMA,
      response: s.object({
        accepted: s.literal(true),
        result: s.object({
          projectId: s.string(),
          traceId: s.string(),
          severity: JUDGE_SEVERITY_SCHEMA,
          labels: s.array(s.string()),
          summary: s.string(),
          partialChecksSkipped: s.boolean(),
          ts: s.number(),
        }),
      }),
    },
    "file:document:create": {
      request: s.object({
        projectId: s.string(),
        title: s.optional(s.string()),
        type: s.optional(DOCUMENT_TYPE_SCHEMA),
      }),
      response: s.object({ documentId: s.string() }),
    },
    "file:document:list": {
      request: s.object({ projectId: s.string() }),
      response: s.object({
        items: s.array(DOCUMENT_LIST_ITEM_SCHEMA),
      }),
    },
    "file:document:read": {
      request: s.object({ projectId: s.string(), documentId: s.string() }),
      response: s.object({
        documentId: s.string(),
        projectId: s.string(),
        type: DOCUMENT_TYPE_SCHEMA,
        title: s.string(),
        status: DOCUMENT_STATUS_SCHEMA,
        sortOrder: s.number(),
        parentId: s.optional(s.string()),
        contentJson: s.string(),
        contentText: s.string(),
        contentMd: s.string(),
        contentHash: s.string(),
        createdAt: s.number(),
        updatedAt: s.number(),
      }),
    },
    "file:document:update": {
      request: s.object({
        projectId: s.string(),
        documentId: s.string(),
        title: s.optional(s.string()),
        type: s.optional(DOCUMENT_TYPE_SCHEMA),
        status: s.optional(DOCUMENT_STATUS_SCHEMA),
        sortOrder: s.optional(s.number()),
        parentId: s.optional(s.string()),
      }),
      response: s.object({ updated: s.literal(true) }),
    },
    "file:document:save": {
      request: s.object({
        projectId: s.string(),
        documentId: s.string(),
        contentJson: s.string(),
        actor: VERSION_SNAPSHOT_ACTOR_SCHEMA,
        reason: VERSION_SNAPSHOT_REASON_SCHEMA,
      }),
      response: s.object({
        updatedAt: s.number(),
        contentHash: s.string(),
        compaction: s.optional(
          s.object({
            code: s.literal("VERSION_SNAPSHOT_COMPACTED"),
            deletedCount: s.number(),
            remainingCount: s.number(),
          }),
        ),
      }),
    },
    "file:document:getcurrent": {
      request: s.object({ projectId: s.string() }),
      response: s.object({ documentId: s.string() }),
    },
    "file:document:setcurrent": {
      request: s.object({ projectId: s.string(), documentId: s.string() }),
      response: s.object({ documentId: s.string() }),
    },
    "file:document:reorder": {
      request: s.object({
        projectId: s.string(),
        orderedDocumentIds: s.array(s.string()),
      }),
      response: s.object({ updated: s.literal(true) }),
    },
    "file:document:updatestatus": {
      request: s.object({
        projectId: s.string(),
        documentId: s.string(),
        status: DOCUMENT_STATUS_SCHEMA,
      }),
      response: s.object({
        updated: s.literal(true),
        status: DOCUMENT_STATUS_SCHEMA,
      }),
    },
    "file:document:delete": {
      request: s.object({ projectId: s.string(), documentId: s.string() }),
      response: s.object({ deleted: s.literal(true) }),
    },
    "version:snapshot:create": {
      request: s.object({
        projectId: s.string(),
        documentId: s.string(),
        contentJson: s.string(),
        actor: VERSION_SNAPSHOT_ACTOR_SCHEMA,
        reason: VERSION_SNAPSHOT_REASON_SCHEMA,
      }),
      response: s.object({
        versionId: s.string(),
        contentHash: s.string(),
        wordCount: s.number(),
        createdAt: s.number(),
        compaction: s.optional(
          s.object({
            code: s.literal("VERSION_SNAPSHOT_COMPACTED"),
            deletedCount: s.number(),
            remainingCount: s.number(),
          }),
        ),
      }),
    },
    "version:snapshot:list": {
      request: s.object({ documentId: s.string() }),
      response: s.object({
        items: s.array(
          s.object({
            versionId: s.string(),
            actor: VERSION_SNAPSHOT_ACTOR_SCHEMA,
            reason: s.string(),
            contentHash: s.string(),
            wordCount: s.number(),
            createdAt: s.number(),
          }),
        ),
      }),
    },
    "version:snapshot:read": {
      request: s.object({ documentId: s.string(), versionId: s.string() }),
      response: s.object({
        documentId: s.string(),
        projectId: s.string(),
        versionId: s.string(),
        actor: s.union(s.literal("user"), s.literal("auto"), s.literal("ai")),
        reason: s.string(),
        contentJson: s.string(),
        contentText: s.string(),
        contentMd: s.string(),
        contentHash: s.string(),
        wordCount: s.number(),
        createdAt: s.number(),
      }),
    },
    "version:snapshot:diff": {
      request: s.object({
        documentId: s.string(),
        baseVersionId: s.string(),
        targetVersionId: s.optional(s.string()),
      }),
      response: s.object({
        diffText: s.string(),
        hasDifferences: s.boolean(),
        stats: VERSION_DIFF_STATS_SCHEMA,
        aiMarked: s.boolean(),
      }),
    },
    "version:snapshot:rollback": {
      request: s.object({ documentId: s.string(), versionId: s.string() }),
      response: s.object({
        restored: s.literal(true),
        preRollbackVersionId: s.string(),
        rollbackVersionId: s.string(),
      }),
    },
    "version:branch:create": {
      request: s.object({
        documentId: s.string(),
        name: s.string(),
        createdBy: s.string(),
      }),
      response: s.object({
        branch: VERSION_BRANCH_ITEM_SCHEMA,
      }),
    },
    "version:branch:list": {
      request: s.object({ documentId: s.string() }),
      response: s.object({
        branches: s.array(VERSION_BRANCH_ITEM_SCHEMA),
      }),
    },
    "version:branch:switch": {
      request: s.object({
        documentId: s.string(),
        name: s.string(),
      }),
      response: s.object({
        currentBranch: s.string(),
        headSnapshotId: s.string(),
      }),
    },
    "version:branch:merge": {
      request: s.object({
        documentId: s.string(),
        sourceBranchName: s.string(),
        targetBranchName: s.string(),
      }),
      response: s.object({
        status: s.literal("merged"),
        mergeSnapshotId: s.string(),
      }),
    },
    "version:conflict:resolve": {
      request: s.object({
        documentId: s.string(),
        mergeSessionId: s.string(),
        resolutions: s.array(VERSION_BRANCH_CONFLICT_RESOLUTION_ITEM_SCHEMA),
        resolvedBy: s.string(),
      }),
      response: s.object({
        status: s.literal("merged"),
        mergeSnapshotId: s.string(),
      }),
    },
    "version:snapshot:restore": {
      request: s.object({ documentId: s.string(), versionId: s.string() }),
      response: s.object({ restored: s.literal(true) }),
    },
    "version:aiapply:logconflict": {
      request: s.object({ documentId: s.string(), runId: s.string() }),
      response: s.object({ logged: s.literal(true) }),
    },
    "app:renderer:logerror": {
      request: s.object({
        source: s.union(s.literal("unhandledrejection"), s.literal("error")),
        name: s.string(),
        message: s.string(),
        stack: s.optional(s.string()),
        timestamp: s.string(),
      }),
      response: s.object({ logged: s.literal(true) }),
    },
  },
} as const;
