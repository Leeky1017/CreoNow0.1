/* eslint-disable */
/**
 * GENERATED FILE - DO NOT EDIT.
 * Source: apps/desktop/main/src/ipc/contract/ipc-contract.ts
 * Run: pnpm contract:generate
 */

export type IpcErrorCode =
  | "AI_AUTH_FAILED"
  | "AI_NOT_CONFIGURED"
  | "AI_PROVIDER_UNAVAILABLE"
  | "AI_RATE_LIMITED"
  | "AI_SESSION_TOKEN_BUDGET_EXCEEDED"
  | "ALREADY_EXISTS"
  | "CANCELED"
  | "CONFLICT"
  | "CONSTRAINT_CONFLICT"
  | "CONSTRAINT_NOT_FOUND"
  | "CONSTRAINT_VALIDATION_ERROR"
  | "CONTEXT_BACKPRESSURE"
  | "CONTEXT_BUDGET_CONFLICT"
  | "CONTEXT_BUDGET_INVALID_MINIMUM"
  | "CONTEXT_BUDGET_INVALID_RATIO"
  | "CONTEXT_INPUT_TOO_LARGE"
  | "CONTEXT_INSPECT_FORBIDDEN"
  | "CONTEXT_SCOPE_VIOLATION"
  | "CONTEXT_TOKENIZER_MISMATCH"
  | "DB_ERROR"
  | "DOCUMENT_SAVE_CONFLICT"
  | "DOCUMENT_SIZE_EXCEEDED"
  | "EMBEDDING_PROVIDER_UNAVAILABLE"
  | "ENCODING_FAILED"
  | "FORBIDDEN"
  | "INTERNAL"
  | "INTERNAL_ERROR"
  | "INVALID_ARGUMENT"
  | "IO_ERROR"
  | "IPC_CHANNEL_FORBIDDEN"
  | "IPC_PAYLOAD_TOO_LARGE"
  | "IPC_SUBSCRIPTION_LIMIT_EXCEEDED"
  | "IPC_TIMEOUT"
  | "KG_ATTRIBUTE_KEYS_EXCEEDED"
  | "KG_CAPACITY_EXCEEDED"
  | "KG_ENTITY_CONFLICT"
  | "KG_ENTITY_DUPLICATE"
  | "KG_QUERY_TIMEOUT"
  | "KG_RECOGNITION_UNAVAILABLE"
  | "KG_RELATION_INVALID"
  | "KG_RELEVANT_QUERY_FAILED"
  | "KG_SCOPE_VIOLATION"
  | "KG_SUBGRAPH_K_EXCEEDED"
  | "LLM_API_ERROR"
  | "MEMORY_BACKPRESSURE"
  | "MEMORY_CAPACITY_EXCEEDED"
  | "MEMORY_CLEAR_CONFIRM_REQUIRED"
  | "MEMORY_CONFIDENCE_OUT_OF_RANGE"
  | "MEMORY_DISTILL_LLM_UNAVAILABLE"
  | "MEMORY_EPISODE_WRITE_FAILED"
  | "MEMORY_SCOPE_DENIED"
  | "MEMORY_TRACE_MISMATCH"
  | "MODEL_NOT_READY"
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "PROJECT_CAPACITY_EXCEEDED"
  | "PROJECT_DELETE_REQUIRES_ARCHIVE"
  | "PROJECT_IPC_SCHEMA_INVALID"
  | "PROJECT_LIFECYCLE_WRITE_FAILED"
  | "PROJECT_METADATA_INVALID_ENUM"
  | "PROJECT_PURGE_PERMISSION_DENIED"
  | "PROJECT_SWITCH_TIMEOUT"
  | "RATE_LIMITED"
  | "SEARCH_BACKPRESSURE"
  | "SEARCH_CAPACITY_EXCEEDED"
  | "SEARCH_CONCURRENT_WRITE_CONFLICT"
  | "SEARCH_DATA_CORRUPTED"
  | "SEARCH_PROJECT_FORBIDDEN"
  | "SEARCH_REINDEX_IO_ERROR"
  | "SEARCH_TIMEOUT"
  | "SKILL_CAPACITY_EXCEEDED"
  | "SKILL_DEPENDENCY_MISSING"
  | "SKILL_INPUT_EMPTY"
  | "SKILL_OUTPUT_INVALID"
  | "SKILL_QUEUE_OVERFLOW"
  | "SKILL_SCOPE_VIOLATION"
  | "SKILL_TIMEOUT"
  | "TIMEOUT"
  | "UNSUPPORTED"
  | "UPSTREAM_ERROR"
  | "VALIDATION_ERROR"
  | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
  | "VERSION_MERGE_TIMEOUT"
  | "VERSION_ROLLBACK_CONFLICT"
  | "VERSION_SNAPSHOT_COMPACTED";

export type IpcMeta = {
  requestId: string;
  ts: number;
};

export type IpcError = {
  code: IpcErrorCode;
  message: string;
  traceId?: string;
  details?: unknown;
  retryable?: boolean;
};

export type IpcOk<TData> = {
  ok: true;
  data: TData;
  meta?: IpcMeta;
};

export type IpcErr = {
  ok: false;
  error: IpcError;
  meta?: IpcMeta;
};

export type IpcResponse<TData> = IpcOk<TData> | IpcErr;

export const IPC_CHANNELS = [
  "ai:chat:clear",
  "ai:chat:list",
  "ai:chat:send",
  "ai:chat:sessions",
  "ai:chatsession:delete",
  "ai:config:get",
  "ai:config:test",
  "ai:config:update",
  "ai:models:list",
  "ai:skill:cancel",
  "ai:skill:feedback",
  "ai:skill:run",
  "app:renderer:logerror",
  "app:system:ping",
  "app:window:close",
  "app:window:getstate",
  "app:window:minimize",
  "app:window:togglemaximized",
  "backup:snapshot:create",
  "backup:snapshot:delete",
  "backup:snapshot:list",
  "backup:snapshot:restore",
  "constraints:policy:create",
  "constraints:policy:delete",
  "constraints:policy:get",
  "constraints:policy:list",
  "constraints:policy:set",
  "constraints:policy:update",
  "context:budget:get",
  "context:budget:update",
  "context:creonow:ensure",
  "context:creonow:status",
  "context:prompt:assemble",
  "context:prompt:inspect",
  "context:rules:list",
  "context:rules:read",
  "context:settings:list",
  "context:settings:read",
  "context:watch:start",
  "context:watch:stop",
  "db:debug:tablenames",
  "dialog:folder:open",
  "embedding:index:reindex",
  "embedding:semantic:search",
  "embedding:text:generate",
  "export:document:docx",
  "export:document:markdown",
  "export:document:pdf",
  "export:document:txt",
  "export:project:bundle",
  "file:document:create",
  "file:document:delete",
  "file:document:getcurrent",
  "file:document:list",
  "file:document:read",
  "file:document:reorder",
  "file:document:save",
  "file:document:setcurrent",
  "file:document:update",
  "file:document:updatestatus",
  "judge:model:ensure",
  "judge:model:getstate",
  "judge:quality:evaluate",
  "knowledge:entity:create",
  "knowledge:entity:delete",
  "knowledge:entity:list",
  "knowledge:entity:read",
  "knowledge:entity:update",
  "knowledge:query:byids",
  "knowledge:query:path",
  "knowledge:query:relevant",
  "knowledge:query:subgraph",
  "knowledge:query:validate",
  "knowledge:recognition:cancel",
  "knowledge:recognition:enqueue",
  "knowledge:recognition:stats",
  "knowledge:relation:create",
  "knowledge:relation:delete",
  "knowledge:relation:list",
  "knowledge:relation:update",
  "knowledge:rules:inject",
  "knowledge:suggestion:accept",
  "knowledge:suggestion:dismiss",
  "memory:clear:all",
  "memory:clear:project",
  "memory:conflict:resolve",
  "memory:distill:progress",
  "memory:entry:create",
  "memory:entry:delete",
  "memory:entry:list",
  "memory:entry:update",
  "memory:episode:query",
  "memory:episode:record",
  "memory:injection:preview",
  "memory:scope:promote",
  "memory:semantic:add",
  "memory:semantic:delete",
  "memory:semantic:distill",
  "memory:semantic:list",
  "memory:semantic:update",
  "memory:settings:get",
  "memory:settings:update",
  "memory:trace:feedback",
  "memory:trace:get",
  "project:lifecycle:archive",
  "project:lifecycle:get",
  "project:lifecycle:purge",
  "project:lifecycle:restore",
  "project:project:archive",
  "project:project:create",
  "project:project:createaiassist",
  "project:project:delete",
  "project:project:duplicate",
  "project:project:getcurrent",
  "project:project:list",
  "project:project:rename",
  "project:project:setcurrent",
  "project:project:stats",
  "project:project:switch",
  "project:project:update",
  "rag:config:get",
  "rag:config:update",
  "rag:context:retrieve",
  "search:fts:query",
  "search:fts:reindex",
  "search:query:strategy",
  "search:rank:explain",
  "search:replace:execute",
  "search:replace:preview",
  "skill:custom:create",
  "skill:custom:delete",
  "skill:custom:list",
  "skill:custom:update",
  "skill:registry:list",
  "skill:registry:read",
  "skill:registry:toggle",
  "skill:registry:write",
  "stats:day:gettoday",
  "stats:range:get",
  "version:aiapply:logconflict",
  "version:branch:create",
  "version:branch:list",
  "version:branch:merge",
  "version:branch:switch",
  "version:conflict:resolve",
  "version:snapshot:create",
  "version:snapshot:diff",
  "version:snapshot:list",
  "version:snapshot:read",
  "version:snapshot:restore",
  "version:snapshot:rollback",
] as const;

export type IpcChannel = (typeof IPC_CHANNELS)[number];

export type IpcChannelSpec = {
  "ai:chat:clear": {
    request: {
      projectId: string;
      sessionId?: string;
    };
    response: {
      cleared: true;
      removed: number;
    };
  };
  "ai:chat:list": {
    request: {
      projectId: string;
      sessionId?: string;
    };
    response: {
      items: Array<{
        content: string;
        messageId: string;
        projectId: string;
        role: "user" | "assistant";
        skillId?: string;
        timestamp: number;
        traceId: string;
      }>;
    };
  };
  "ai:chat:send": {
    request: {
      documentId?: string;
      message: string;
      projectId: string;
      sessionId?: string;
    };
    response: {
      accepted: true;
      echoed: string;
      messageId: string;
      sessionId: string;
    };
  };
  "ai:chat:sessions": {
    request: {
      projectId: string;
      query?: string;
    };
    response: {
      sessions: Array<{
        createdAt: number;
        projectId: string;
        sessionId: string;
        title: string;
        updatedAt: number;
      }>;
    };
  };
  "ai:chatsession:delete": {
    request: {
      projectId: string;
      sessionId: string;
    };
    response: {
      deleted: true;
    };
  };
  "ai:config:get": {
    request: Record<string, never>;
    response: {
      anthropicByokApiKeyConfigured: boolean;
      anthropicByokBaseUrl: string;
      apiKeyConfigured: boolean;
      baseUrl: string;
      enabled: boolean;
      openAiByokApiKeyConfigured: boolean;
      openAiByokBaseUrl: string;
      openAiCompatibleApiKeyConfigured: boolean;
      openAiCompatibleBaseUrl: string;
      providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
    };
  };
  "ai:config:test": {
    request: Record<string, never>;
    response: {
      error?: {
        code:
          | "VALIDATION_ERROR"
          | "IPC_TIMEOUT"
          | "IPC_CHANNEL_FORBIDDEN"
          | "IPC_PAYLOAD_TOO_LARGE"
          | "IPC_SUBSCRIPTION_LIMIT_EXCEEDED"
          | "INTERNAL_ERROR"
          | "INVALID_ARGUMENT"
          | "NOT_FOUND"
          | "ALREADY_EXISTS"
          | "CONFLICT"
          | "PERMISSION_DENIED"
          | "FORBIDDEN"
          | "UNSUPPORTED"
          | "IO_ERROR"
          | "DB_ERROR"
          | "MEMORY_EPISODE_WRITE_FAILED"
          | "MEMORY_CAPACITY_EXCEEDED"
          | "MEMORY_DISTILL_LLM_UNAVAILABLE"
          | "MEMORY_CONFIDENCE_OUT_OF_RANGE"
          | "MEMORY_CLEAR_CONFIRM_REQUIRED"
          | "MEMORY_TRACE_MISMATCH"
          | "MEMORY_SCOPE_DENIED"
          | "MODEL_NOT_READY"
          | "EMBEDDING_PROVIDER_UNAVAILABLE"
          | "ENCODING_FAILED"
          | "RATE_LIMITED"
          | "TIMEOUT"
          | "CANCELED"
          | "UPSTREAM_ERROR"
          | "INTERNAL"
          | "PROJECT_CAPACITY_EXCEEDED"
          | "PROJECT_DELETE_REQUIRES_ARCHIVE"
          | "PROJECT_METADATA_INVALID_ENUM"
          | "PROJECT_PURGE_PERMISSION_DENIED"
          | "PROJECT_LIFECYCLE_WRITE_FAILED"
          | "PROJECT_IPC_SCHEMA_INVALID"
          | "KG_ATTRIBUTE_KEYS_EXCEEDED"
          | "KG_CAPACITY_EXCEEDED"
          | "KG_ENTITY_CONFLICT"
          | "KG_ENTITY_DUPLICATE"
          | "KG_QUERY_TIMEOUT"
          | "KG_RECOGNITION_UNAVAILABLE"
          | "KG_RELEVANT_QUERY_FAILED"
          | "KG_RELATION_INVALID"
          | "KG_SCOPE_VIOLATION"
          | "KG_SUBGRAPH_K_EXCEEDED"
          | "PROJECT_SWITCH_TIMEOUT"
          | "DOCUMENT_SAVE_CONFLICT"
          | "MEMORY_BACKPRESSURE"
          | "SKILL_TIMEOUT"
          | "SKILL_DEPENDENCY_MISSING"
          | "SKILL_QUEUE_OVERFLOW"
          | "SKILL_CAPACITY_EXCEEDED"
          | "SKILL_SCOPE_VIOLATION"
          | "SKILL_INPUT_EMPTY"
          | "SKILL_OUTPUT_INVALID"
          | "AI_AUTH_FAILED"
          | "AI_NOT_CONFIGURED"
          | "AI_RATE_LIMITED"
          | "AI_SESSION_TOKEN_BUDGET_EXCEEDED"
          | "LLM_API_ERROR"
          | "AI_PROVIDER_UNAVAILABLE"
          | "VERSION_MERGE_TIMEOUT"
          | "VERSION_SNAPSHOT_COMPACTED"
          | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
          | "VERSION_ROLLBACK_CONFLICT"
          | "SEARCH_TIMEOUT"
          | "SEARCH_REINDEX_IO_ERROR"
          | "SEARCH_DATA_CORRUPTED"
          | "SEARCH_CONCURRENT_WRITE_CONFLICT"
          | "SEARCH_CAPACITY_EXCEEDED"
          | "SEARCH_BACKPRESSURE"
          | "SEARCH_PROJECT_FORBIDDEN"
          | "CONSTRAINT_VALIDATION_ERROR"
          | "CONSTRAINT_NOT_FOUND"
          | "CONSTRAINT_CONFLICT"
          | "CONTEXT_SCOPE_VIOLATION"
          | "CONTEXT_INSPECT_FORBIDDEN"
          | "CONTEXT_INPUT_TOO_LARGE"
          | "CONTEXT_BACKPRESSURE"
          | "CONTEXT_BUDGET_INVALID_RATIO"
          | "CONTEXT_BUDGET_INVALID_MINIMUM"
          | "CONTEXT_BUDGET_CONFLICT"
          | "CONTEXT_TOKENIZER_MISMATCH"
          | "DOCUMENT_SIZE_EXCEEDED";
        message: string;
      };
      latencyMs: number;
      ok: boolean;
    };
  };
  "ai:config:update": {
    request: {
      patch: {
        anthropicByokApiKey?: string;
        anthropicByokBaseUrl?: string;
        apiKey?: string;
        baseUrl?: string;
        enabled?: boolean;
        openAiByokApiKey?: string;
        openAiByokBaseUrl?: string;
        openAiCompatibleApiKey?: string;
        openAiCompatibleBaseUrl?: string;
        providerMode?: "openai-compatible" | "openai-byok" | "anthropic-byok";
      };
    };
    response: {
      anthropicByokApiKeyConfigured: boolean;
      anthropicByokBaseUrl: string;
      apiKeyConfigured: boolean;
      baseUrl: string;
      enabled: boolean;
      openAiByokApiKeyConfigured: boolean;
      openAiByokBaseUrl: string;
      openAiCompatibleApiKeyConfigured: boolean;
      openAiCompatibleBaseUrl: string;
      providerMode: "openai-compatible" | "openai-byok" | "anthropic-byok";
    };
  };
  "ai:models:list": {
    request: Record<string, never>;
    response: {
      items: Array<{
        id: string;
        name: string;
        provider: string;
      }>;
      source: "proxy" | "openai" | "anthropic";
    };
  };
  "ai:skill:cancel": {
    request: {
      executionId?: string;
      runId?: string;
    };
    response: {
      canceled: true;
    };
  };
  "ai:skill:feedback": {
    request: {
      action: "accept" | "reject" | "partial";
      evidenceRef: string;
      runId: string;
    };
    response: {
      learning?: {
        ignored: boolean;
        ignoredReason?: string;
        learned: boolean;
        learnedMemoryId?: string;
        signalCount?: number;
        threshold?: number;
      };
      recorded: true;
    };
  };
  "ai:skill:run": {
    request: {
      candidateCount?: number;
      context?: {
        documentId?: string;
        projectId?: string;
      };
      input: string;
      mode: "agent" | "plan" | "ask";
      model: string;
      promptDiagnostics?: {
        promptHash: string;
        stablePrefixHash: string;
      };
      skillId: string;
      stream: boolean;
    };
    response: {
      candidates?: Array<{
        id: string;
        runId: string;
        summary: string;
        text: string;
      }>;
      executionId: string;
      outputText?: string;
      promptDiagnostics?: {
        promptHash: string;
        stablePrefixHash: string;
      };
      runId: string;
      usage?: {
        completionTokens: number;
        estimatedCostUsd?: number;
        promptTokens: number;
        sessionTotalTokens: number;
      };
    };
  };
  "app:renderer:logerror": {
    request: {
      message: string;
      name: string;
      source: "unhandledrejection" | "error";
      stack?: string;
      timestamp: string;
    };
    response: {
      logged: true;
    };
  };
  "app:system:ping": {
    request: Record<string, never>;
    response: Record<string, never>;
  };
  "app:window:close": {
    request: Record<string, never>;
    response: Record<string, never>;
  };
  "app:window:getstate": {
    request: Record<string, never>;
    response: {
      controlsEnabled: boolean;
      isFullScreen: boolean;
      isMaximized: boolean;
      isMinimized: boolean;
      platform: string;
    };
  };
  "app:window:minimize": {
    request: Record<string, never>;
    response: Record<string, never>;
  };
  "app:window:togglemaximized": {
    request: Record<string, never>;
    response: Record<string, never>;
  };
  "backup:snapshot:create": {
    request: {
      label?: string;
      projectId: string;
    };
    response: {
      createdAt: string;
      id: string;
      label?: string;
      projectId: string;
      sizeBytes: number;
    };
  };
  "backup:snapshot:delete": {
    request: {
      backupId: string;
    };
    response: {
      deleted: boolean;
    };
  };
  "backup:snapshot:list": {
    request: {
      projectId: string;
    };
    response: Array<{
      createdAt: string;
      id: string;
      label?: string;
      projectId: string;
      sizeBytes: number;
    }>;
  };
  "backup:snapshot:restore": {
    request: {
      backupId: string;
    };
    response: {
      createdAt: string;
      id: string;
      label?: string;
      projectId: string;
      sizeBytes: number;
    };
  };
  "constraints:policy:create": {
    request: {
      constraint: {
        degradable?: boolean;
        priority?: number;
        source?: "user" | "kg";
        text: string;
      };
      projectId: string;
    };
    response: {
      constraint: {
        degradable: boolean;
        id: string;
        priority: number;
        source: "user" | "kg";
        text: string;
        updatedAt: string;
      };
    };
  };
  "constraints:policy:delete": {
    request: {
      constraintId: string;
      projectId: string;
    };
    response: {
      deletedConstraintId: string;
    };
  };
  "constraints:policy:get": {
    request: {
      projectId: string;
    };
    response: {
      constraints: {
        items: Array<string>;
        version: 1;
      };
    };
  };
  "constraints:policy:list": {
    request: {
      projectId: string;
    };
    response: {
      constraints: Array<{
        degradable: boolean;
        id: string;
        priority: number;
        source: "user" | "kg";
        text: string;
        updatedAt: string;
      }>;
    };
  };
  "constraints:policy:set": {
    request: {
      constraints: {
        items: Array<string>;
        version: 1;
      };
      projectId: string;
    };
    response: {
      constraints: {
        items: Array<string>;
        version: 1;
      };
    };
  };
  "constraints:policy:update": {
    request: {
      constraintId: string;
      patch: {
        degradable?: boolean;
        priority?: number;
        text?: string;
      };
      projectId: string;
    };
    response: {
      constraint: {
        degradable: boolean;
        id: string;
        priority: number;
        source: "user" | "kg";
        text: string;
        updatedAt: string;
      };
    };
  };
  "context:budget:get": {
    request: Record<string, never>;
    response: {
      layers: {
        immediate: {
          minimumTokens: number;
          ratio: number;
        };
        retrieved: {
          minimumTokens: number;
          ratio: number;
        };
        rules: {
          minimumTokens: number;
          ratio: number;
        };
        settings: {
          minimumTokens: number;
          ratio: number;
        };
      };
      tokenizerId: string;
      tokenizerVersion: string;
      totalBudgetTokens: number;
      version: number;
    };
  };
  "context:budget:update": {
    request: {
      layers: {
        immediate: {
          minimumTokens: number;
          ratio: number;
        };
        retrieved: {
          minimumTokens: number;
          ratio: number;
        };
        rules: {
          minimumTokens: number;
          ratio: number;
        };
        settings: {
          minimumTokens: number;
          ratio: number;
        };
      };
      tokenizerId: string;
      tokenizerVersion: string;
      version: number;
    };
    response: {
      layers: {
        immediate: {
          minimumTokens: number;
          ratio: number;
        };
        retrieved: {
          minimumTokens: number;
          ratio: number;
        };
        rules: {
          minimumTokens: number;
          ratio: number;
        };
        settings: {
          minimumTokens: number;
          ratio: number;
        };
      };
      tokenizerId: string;
      tokenizerVersion: string;
      totalBudgetTokens: number;
      version: number;
    };
  };
  "context:creonow:ensure": {
    request: {
      projectId: string;
    };
    response: {
      ensured: true;
      rootPath: string;
    };
  };
  "context:creonow:status": {
    request: {
      projectId: string;
    };
    response: {
      exists: boolean;
      rootPath?: string;
      watching: boolean;
    };
  };
  "context:prompt:assemble": {
    request: {
      additionalInput?: string;
      cursorPosition: number;
      documentId: string;
      model?: string;
      projectId: string;
      provider?: string;
      skillId: string;
      tokenizerVersion?: string;
    };
    response: {
      assemblyOrder: Array<"rules" | "settings" | "retrieved" | "immediate">;
      layers: {
        immediate: {
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
        retrieved: {
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
        rules: {
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
        settings: {
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
      };
      prompt: string;
      stablePrefixHash: string;
      stablePrefixUnchanged: boolean;
      tokenCount: number;
      warnings: Array<string>;
    };
  };
  "context:prompt:inspect": {
    request: {
      additionalInput?: string;
      callerRole?: string;
      cursorPosition: number;
      debugMode?: boolean;
      documentId: string;
      model?: string;
      projectId: string;
      provider?: string;
      requestedBy?: string;
      skillId: string;
      tokenizerVersion?: string;
    };
    response: {
      inspectMeta: {
        debugMode: boolean;
        requestedAt: number;
        requestedBy: string;
      };
      layersDetail: {
        immediate: {
          content: string;
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
        retrieved: {
          content: string;
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
        rules: {
          content: string;
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
        settings: {
          content: string;
          source: Array<string>;
          tokenCount: number;
          truncated: boolean;
          warnings?: Array<string>;
        };
      };
      totals: {
        tokenCount: number;
        warningsCount: number;
      };
    };
  };
  "context:rules:list": {
    request: {
      projectId: string;
    };
    response: {
      items: Array<{
        path: string;
        sizeBytes: number;
        updatedAtMs: number;
      }>;
    };
  };
  "context:rules:read": {
    request: {
      path: string;
      projectId: string;
    };
    response: {
      content: string;
      path: string;
      redactionEvidence: Array<{
        matchCount: number;
        patternId: string;
        sourceRef: string;
      }>;
      sizeBytes: number;
      updatedAtMs: number;
    };
  };
  "context:settings:list": {
    request: {
      projectId: string;
    };
    response: {
      items: Array<{
        path: string;
        sizeBytes: number;
        updatedAtMs: number;
      }>;
    };
  };
  "context:settings:read": {
    request: {
      path: string;
      projectId: string;
    };
    response: {
      content: string;
      path: string;
      redactionEvidence: Array<{
        matchCount: number;
        patternId: string;
        sourceRef: string;
      }>;
      sizeBytes: number;
      updatedAtMs: number;
    };
  };
  "context:watch:start": {
    request: {
      projectId: string;
    };
    response: {
      watching: true;
    };
  };
  "context:watch:stop": {
    request: {
      projectId: string;
    };
    response: {
      watching: false;
    };
  };
  "db:debug:tablenames": {
    request: Record<string, never>;
    response: {
      tableNames: Array<string>;
    };
  };
  "dialog:folder:open": {
    request: Record<string, never>;
    response: {
      selectedPath?: string;
    };
  };
  "embedding:index:reindex": {
    request: {
      batchSize?: number;
      model?: string;
      projectId: string;
    };
    response: {
      changedChunks: number;
      indexedChunks: number;
      indexedDocuments: number;
    };
  };
  "embedding:semantic:search": {
    request: {
      minScore?: number;
      model?: string;
      projectId: string;
      queryText: string;
      topK?: number;
    };
    response: {
      fallback?: {
        from: "semantic";
        reason: string;
        to: "fts";
      };
      isolation?: {
        code: "SEARCH_DATA_CORRUPTED";
        isolatedChunkIds: Array<string>;
      };
      mode: "semantic" | "fts-fallback";
      notice?: string;
      results: Array<{
        chunkId: string;
        documentId: string;
        endOffset: number;
        score: number;
        startOffset: number;
        text: string;
      }>;
    };
  };
  "embedding:text:generate": {
    request: {
      model?: string;
      texts: Array<string>;
    };
    response: {
      dimension: number;
      vectors: Array<Array<number>>;
    };
  };
  "export:document:docx": {
    request: {
      documentId?: string;
      projectId: string;
    };
    response: {
      bytesWritten: number;
      relativePath: string;
    };
  };
  "export:document:markdown": {
    request: {
      documentId?: string;
      projectId: string;
    };
    response: {
      bytesWritten: number;
      relativePath: string;
    };
  };
  "export:document:pdf": {
    request: {
      documentId?: string;
      projectId: string;
    };
    response: {
      bytesWritten: number;
      relativePath: string;
    };
  };
  "export:document:txt": {
    request: {
      documentId?: string;
      projectId: string;
    };
    response: {
      bytesWritten: number;
      relativePath: string;
    };
  };
  "export:project:bundle": {
    request: {
      projectId: string;
    };
    response: {
      bytesWritten: number;
      relativePath: string;
    };
  };
  "file:document:create": {
    request: {
      projectId: string;
      title?: string;
      type?: "chapter" | "note" | "setting" | "timeline" | "character";
    };
    response: {
      documentId: string;
    };
  };
  "file:document:delete": {
    request: {
      documentId: string;
      projectId: string;
    };
    response: {
      deleted: true;
    };
  };
  "file:document:getcurrent": {
    request: {
      projectId: string;
    };
    response: {
      documentId: string;
    };
  };
  "file:document:list": {
    request: {
      projectId: string;
    };
    response: {
      items: Array<{
        documentId: string;
        parentId?: string;
        sortOrder: number;
        status: "draft" | "final";
        title: string;
        type: "chapter" | "note" | "setting" | "timeline" | "character";
        updatedAt: number;
      }>;
    };
  };
  "file:document:read": {
    request: {
      documentId: string;
      projectId: string;
    };
    response: {
      contentHash: string;
      contentJson: string;
      contentMd: string;
      contentText: string;
      createdAt: number;
      documentId: string;
      parentId?: string;
      projectId: string;
      sortOrder: number;
      status: "draft" | "final";
      title: string;
      type: "chapter" | "note" | "setting" | "timeline" | "character";
      updatedAt: number;
    };
  };
  "file:document:reorder": {
    request: {
      orderedDocumentIds: Array<string>;
      projectId: string;
    };
    response: {
      updated: true;
    };
  };
  "file:document:save": {
    request: {
      actor: "user" | "auto" | "ai";
      contentJson: string;
      documentId: string;
      projectId: string;
      reason: "manual-save" | "autosave" | "ai-accept" | "status-change";
    };
    response: {
      compaction?: {
        code: "VERSION_SNAPSHOT_COMPACTED";
        deletedCount: number;
        remainingCount: number;
      };
      contentHash: string;
      updatedAt: number;
    };
  };
  "file:document:setcurrent": {
    request: {
      documentId: string;
      projectId: string;
    };
    response: {
      documentId: string;
    };
  };
  "file:document:update": {
    request: {
      documentId: string;
      parentId?: string;
      projectId: string;
      sortOrder?: number;
      status?: "draft" | "final";
      title?: string;
      type?: "chapter" | "note" | "setting" | "timeline" | "character";
    };
    response: {
      updated: true;
    };
  };
  "file:document:updatestatus": {
    request: {
      documentId: string;
      projectId: string;
      status: "draft" | "final";
    };
    response: {
      status: "draft" | "final";
      updated: true;
    };
  };
  "judge:model:ensure": {
    request: {
      timeoutMs?: number;
    };
    response: {
      state:
        | {
            status: "not_ready";
          }
        | {
            status: "downloading";
          }
        | {
            status: "ready";
          }
        | {
            error: {
              code:
                | "VALIDATION_ERROR"
                | "IPC_TIMEOUT"
                | "IPC_CHANNEL_FORBIDDEN"
                | "IPC_PAYLOAD_TOO_LARGE"
                | "IPC_SUBSCRIPTION_LIMIT_EXCEEDED"
                | "INTERNAL_ERROR"
                | "INVALID_ARGUMENT"
                | "NOT_FOUND"
                | "ALREADY_EXISTS"
                | "CONFLICT"
                | "PERMISSION_DENIED"
                | "FORBIDDEN"
                | "UNSUPPORTED"
                | "IO_ERROR"
                | "DB_ERROR"
                | "MEMORY_EPISODE_WRITE_FAILED"
                | "MEMORY_CAPACITY_EXCEEDED"
                | "MEMORY_DISTILL_LLM_UNAVAILABLE"
                | "MEMORY_CONFIDENCE_OUT_OF_RANGE"
                | "MEMORY_CLEAR_CONFIRM_REQUIRED"
                | "MEMORY_TRACE_MISMATCH"
                | "MEMORY_SCOPE_DENIED"
                | "MODEL_NOT_READY"
                | "EMBEDDING_PROVIDER_UNAVAILABLE"
                | "ENCODING_FAILED"
                | "RATE_LIMITED"
                | "TIMEOUT"
                | "CANCELED"
                | "UPSTREAM_ERROR"
                | "INTERNAL"
                | "PROJECT_CAPACITY_EXCEEDED"
                | "PROJECT_DELETE_REQUIRES_ARCHIVE"
                | "PROJECT_METADATA_INVALID_ENUM"
                | "PROJECT_PURGE_PERMISSION_DENIED"
                | "PROJECT_LIFECYCLE_WRITE_FAILED"
                | "PROJECT_IPC_SCHEMA_INVALID"
                | "KG_ATTRIBUTE_KEYS_EXCEEDED"
                | "KG_CAPACITY_EXCEEDED"
                | "KG_ENTITY_CONFLICT"
                | "KG_ENTITY_DUPLICATE"
                | "KG_QUERY_TIMEOUT"
                | "KG_RECOGNITION_UNAVAILABLE"
                | "KG_RELEVANT_QUERY_FAILED"
                | "KG_RELATION_INVALID"
                | "KG_SCOPE_VIOLATION"
                | "KG_SUBGRAPH_K_EXCEEDED"
                | "PROJECT_SWITCH_TIMEOUT"
                | "DOCUMENT_SAVE_CONFLICT"
                | "MEMORY_BACKPRESSURE"
                | "SKILL_TIMEOUT"
                | "SKILL_DEPENDENCY_MISSING"
                | "SKILL_QUEUE_OVERFLOW"
                | "SKILL_CAPACITY_EXCEEDED"
                | "SKILL_SCOPE_VIOLATION"
                | "SKILL_INPUT_EMPTY"
                | "SKILL_OUTPUT_INVALID"
                | "AI_AUTH_FAILED"
                | "AI_NOT_CONFIGURED"
                | "AI_RATE_LIMITED"
                | "AI_SESSION_TOKEN_BUDGET_EXCEEDED"
                | "LLM_API_ERROR"
                | "AI_PROVIDER_UNAVAILABLE"
                | "VERSION_MERGE_TIMEOUT"
                | "VERSION_SNAPSHOT_COMPACTED"
                | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
                | "VERSION_ROLLBACK_CONFLICT"
                | "SEARCH_TIMEOUT"
                | "SEARCH_REINDEX_IO_ERROR"
                | "SEARCH_DATA_CORRUPTED"
                | "SEARCH_CONCURRENT_WRITE_CONFLICT"
                | "SEARCH_CAPACITY_EXCEEDED"
                | "SEARCH_BACKPRESSURE"
                | "SEARCH_PROJECT_FORBIDDEN"
                | "CONSTRAINT_VALIDATION_ERROR"
                | "CONSTRAINT_NOT_FOUND"
                | "CONSTRAINT_CONFLICT"
                | "CONTEXT_SCOPE_VIOLATION"
                | "CONTEXT_INSPECT_FORBIDDEN"
                | "CONTEXT_INPUT_TOO_LARGE"
                | "CONTEXT_BACKPRESSURE"
                | "CONTEXT_BUDGET_INVALID_RATIO"
                | "CONTEXT_BUDGET_INVALID_MINIMUM"
                | "CONTEXT_BUDGET_CONFLICT"
                | "CONTEXT_TOKENIZER_MISMATCH"
                | "DOCUMENT_SIZE_EXCEEDED";
              message: string;
            };
            status: "error";
          };
    };
  };
  "judge:model:getstate": {
    request: Record<string, never>;
    response: {
      state:
        | {
            status: "not_ready";
          }
        | {
            status: "downloading";
          }
        | {
            status: "ready";
          }
        | {
            error: {
              code:
                | "VALIDATION_ERROR"
                | "IPC_TIMEOUT"
                | "IPC_CHANNEL_FORBIDDEN"
                | "IPC_PAYLOAD_TOO_LARGE"
                | "IPC_SUBSCRIPTION_LIMIT_EXCEEDED"
                | "INTERNAL_ERROR"
                | "INVALID_ARGUMENT"
                | "NOT_FOUND"
                | "ALREADY_EXISTS"
                | "CONFLICT"
                | "PERMISSION_DENIED"
                | "FORBIDDEN"
                | "UNSUPPORTED"
                | "IO_ERROR"
                | "DB_ERROR"
                | "MEMORY_EPISODE_WRITE_FAILED"
                | "MEMORY_CAPACITY_EXCEEDED"
                | "MEMORY_DISTILL_LLM_UNAVAILABLE"
                | "MEMORY_CONFIDENCE_OUT_OF_RANGE"
                | "MEMORY_CLEAR_CONFIRM_REQUIRED"
                | "MEMORY_TRACE_MISMATCH"
                | "MEMORY_SCOPE_DENIED"
                | "MODEL_NOT_READY"
                | "EMBEDDING_PROVIDER_UNAVAILABLE"
                | "ENCODING_FAILED"
                | "RATE_LIMITED"
                | "TIMEOUT"
                | "CANCELED"
                | "UPSTREAM_ERROR"
                | "INTERNAL"
                | "PROJECT_CAPACITY_EXCEEDED"
                | "PROJECT_DELETE_REQUIRES_ARCHIVE"
                | "PROJECT_METADATA_INVALID_ENUM"
                | "PROJECT_PURGE_PERMISSION_DENIED"
                | "PROJECT_LIFECYCLE_WRITE_FAILED"
                | "PROJECT_IPC_SCHEMA_INVALID"
                | "KG_ATTRIBUTE_KEYS_EXCEEDED"
                | "KG_CAPACITY_EXCEEDED"
                | "KG_ENTITY_CONFLICT"
                | "KG_ENTITY_DUPLICATE"
                | "KG_QUERY_TIMEOUT"
                | "KG_RECOGNITION_UNAVAILABLE"
                | "KG_RELEVANT_QUERY_FAILED"
                | "KG_RELATION_INVALID"
                | "KG_SCOPE_VIOLATION"
                | "KG_SUBGRAPH_K_EXCEEDED"
                | "PROJECT_SWITCH_TIMEOUT"
                | "DOCUMENT_SAVE_CONFLICT"
                | "MEMORY_BACKPRESSURE"
                | "SKILL_TIMEOUT"
                | "SKILL_DEPENDENCY_MISSING"
                | "SKILL_QUEUE_OVERFLOW"
                | "SKILL_CAPACITY_EXCEEDED"
                | "SKILL_SCOPE_VIOLATION"
                | "SKILL_INPUT_EMPTY"
                | "SKILL_OUTPUT_INVALID"
                | "AI_AUTH_FAILED"
                | "AI_NOT_CONFIGURED"
                | "AI_RATE_LIMITED"
                | "AI_SESSION_TOKEN_BUDGET_EXCEEDED"
                | "LLM_API_ERROR"
                | "AI_PROVIDER_UNAVAILABLE"
                | "VERSION_MERGE_TIMEOUT"
                | "VERSION_SNAPSHOT_COMPACTED"
                | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
                | "VERSION_ROLLBACK_CONFLICT"
                | "SEARCH_TIMEOUT"
                | "SEARCH_REINDEX_IO_ERROR"
                | "SEARCH_DATA_CORRUPTED"
                | "SEARCH_CONCURRENT_WRITE_CONFLICT"
                | "SEARCH_CAPACITY_EXCEEDED"
                | "SEARCH_BACKPRESSURE"
                | "SEARCH_PROJECT_FORBIDDEN"
                | "CONSTRAINT_VALIDATION_ERROR"
                | "CONSTRAINT_NOT_FOUND"
                | "CONSTRAINT_CONFLICT"
                | "CONTEXT_SCOPE_VIOLATION"
                | "CONTEXT_INSPECT_FORBIDDEN"
                | "CONTEXT_INPUT_TOO_LARGE"
                | "CONTEXT_BACKPRESSURE"
                | "CONTEXT_BUDGET_INVALID_RATIO"
                | "CONTEXT_BUDGET_INVALID_MINIMUM"
                | "CONTEXT_BUDGET_CONFLICT"
                | "CONTEXT_TOKENIZER_MISMATCH"
                | "DOCUMENT_SIZE_EXCEEDED";
              message: string;
            };
            status: "error";
          };
    };
  };
  "judge:quality:evaluate": {
    request: {
      contextSummary: string;
      projectId: string;
      text: string;
      traceId: string;
    };
    response: {
      accepted: true;
      result: {
        labels: Array<string>;
        partialChecksSkipped: boolean;
        projectId: string;
        severity: "high" | "medium" | "low";
        summary: string;
        traceId: string;
        ts: number;
      };
    };
  };
  "knowledge:entity:create": {
    request: {
      aiContextLevel?: "always" | "when_detected" | "manual_only" | "never";
      aliases?: Array<string>;
      attributes?: Record<string, string>;
      description?: string;
      lastSeenState?: string;
      name: string;
      projectId: string;
      type: "character" | "location" | "event" | "item" | "faction";
    };
    response: {
      aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
      aliases: Array<string>;
      attributes: Record<string, string>;
      createdAt: string;
      description: string;
      id: string;
      lastSeenState?: string;
      name: string;
      projectId: string;
      type: "character" | "location" | "event" | "item" | "faction";
      updatedAt: string;
      version: number;
    };
  };
  "knowledge:entity:delete": {
    request: {
      id: string;
      projectId: string;
    };
    response: {
      deleted: true;
      deletedRelationCount: number;
    };
  };
  "knowledge:entity:list": {
    request: {
      filter?: {
        aiContextLevel?: "always" | "when_detected" | "manual_only" | "never";
      };
      limit?: number;
      offset?: number;
      projectId: string;
    };
    response: {
      items: Array<{
        aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
        aliases: Array<string>;
        attributes: Record<string, string>;
        createdAt: string;
        description: string;
        id: string;
        lastSeenState?: string;
        name: string;
        projectId: string;
        type: "character" | "location" | "event" | "item" | "faction";
        updatedAt: string;
        version: number;
      }>;
      totalCount: number;
    };
  };
  "knowledge:entity:read": {
    request: {
      id: string;
      projectId: string;
    };
    response: {
      aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
      aliases: Array<string>;
      attributes: Record<string, string>;
      createdAt: string;
      description: string;
      id: string;
      lastSeenState?: string;
      name: string;
      projectId: string;
      type: "character" | "location" | "event" | "item" | "faction";
      updatedAt: string;
      version: number;
    };
  };
  "knowledge:entity:update": {
    request: {
      expectedVersion: number;
      id: string;
      patch: {
        aiContextLevel?: "always" | "when_detected" | "manual_only" | "never";
        aliases?: Array<string>;
        attributes?: Record<string, string>;
        description?: string;
        lastSeenState?: string;
        name?: string;
        type?: "character" | "location" | "event" | "item" | "faction";
      };
      projectId: string;
    };
    response: {
      aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
      aliases: Array<string>;
      attributes: Record<string, string>;
      createdAt: string;
      description: string;
      id: string;
      lastSeenState?: string;
      name: string;
      projectId: string;
      type: "character" | "location" | "event" | "item" | "faction";
      updatedAt: string;
      version: number;
    };
  };
  "knowledge:query:byids": {
    request: {
      entityIds: Array<string>;
      projectId: string;
    };
    response: {
      items: Array<{
        aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
        aliases: Array<string>;
        attributes: Record<string, string>;
        createdAt: string;
        description: string;
        id: string;
        lastSeenState?: string;
        name: string;
        projectId: string;
        type: "character" | "location" | "event" | "item" | "faction";
        updatedAt: string;
        version: number;
      }>;
    };
  };
  "knowledge:query:path": {
    request: {
      projectId: string;
      sourceEntityId: string;
      targetEntityId: string;
      timeoutMs?: number;
    };
    response: {
      degraded: boolean;
      expansions: number;
      pathEntityIds: Array<string>;
      queryCostMs: number;
    };
  };
  "knowledge:query:relevant": {
    request: {
      entityIds?: Array<string>;
      excerpt: string;
      maxEntities?: number;
      projectId: string;
    };
    response: {
      items: Array<{
        aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
        aliases: Array<string>;
        attributes: Record<string, string>;
        createdAt: string;
        description: string;
        id: string;
        lastSeenState?: string;
        name: string;
        projectId: string;
        type: "character" | "location" | "event" | "item" | "faction";
        updatedAt: string;
        version: number;
      }>;
      queryCostMs: number;
    };
  };
  "knowledge:query:subgraph": {
    request: {
      centerEntityId: string;
      k: number;
      projectId: string;
    };
    response: {
      edgeCount: number;
      entities: Array<{
        aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
        aliases: Array<string>;
        attributes: Record<string, string>;
        createdAt: string;
        description: string;
        id: string;
        lastSeenState?: string;
        name: string;
        projectId: string;
        type: "character" | "location" | "event" | "item" | "faction";
        updatedAt: string;
        version: number;
      }>;
      nodeCount: number;
      queryCostMs: number;
      relations: Array<{
        createdAt: string;
        description: string;
        id: string;
        projectId: string;
        relationType: string;
        sourceEntityId: string;
        targetEntityId: string;
      }>;
    };
  };
  "knowledge:query:validate": {
    request: {
      projectId: string;
    };
    response: {
      cycles: Array<Array<string>>;
      queryCostMs: number;
    };
  };
  "knowledge:recognition:cancel": {
    request: {
      projectId: string;
      sessionId: string;
      taskId: string;
    };
    response: {
      canceled: true;
    };
  };
  "knowledge:recognition:enqueue": {
    request: {
      contentText: string;
      documentId: string;
      projectId: string;
      sessionId: string;
      traceId: string;
    };
    response: {
      queuePosition: number;
      status: "started" | "queued" | "skipped";
      taskId: string | null;
    };
  };
  "knowledge:recognition:stats": {
    request: {
      projectId: string;
      sessionId: string;
    };
    response: {
      canceledTaskIds: Array<string>;
      completed: number;
      completionOrder: Array<string>;
      maxConcurrency: number;
      peakRunning: number;
      queued: number;
      running: number;
    };
  };
  "knowledge:relation:create": {
    request: {
      description?: string;
      projectId: string;
      relationType: string;
      sourceEntityId: string;
      targetEntityId: string;
    };
    response: {
      createdAt: string;
      description: string;
      id: string;
      projectId: string;
      relationType: string;
      sourceEntityId: string;
      targetEntityId: string;
    };
  };
  "knowledge:relation:delete": {
    request: {
      id: string;
      projectId: string;
    };
    response: {
      deleted: true;
    };
  };
  "knowledge:relation:list": {
    request: {
      limit?: number;
      offset?: number;
      projectId: string;
    };
    response: {
      items: Array<{
        createdAt: string;
        description: string;
        id: string;
        projectId: string;
        relationType: string;
        sourceEntityId: string;
        targetEntityId: string;
      }>;
      totalCount: number;
    };
  };
  "knowledge:relation:update": {
    request: {
      id: string;
      patch: {
        description?: string;
        relationType?: string;
        sourceEntityId?: string;
        targetEntityId?: string;
      };
      projectId: string;
    };
    response: {
      createdAt: string;
      description: string;
      id: string;
      projectId: string;
      relationType: string;
      sourceEntityId: string;
      targetEntityId: string;
    };
  };
  "knowledge:rules:inject": {
    request: {
      documentId: string;
      entityIds?: Array<string>;
      excerpt: string;
      maxEntities?: number;
      projectId: string;
      traceId: string;
    };
    response: {
      injectedEntities: Array<{
        attributes: Record<string, string>;
        id: string;
        name: string;
        relationsSummary: Array<string>;
        type: "character" | "location" | "event" | "item" | "faction";
      }>;
      source: "kg-rules-mock";
    };
  };
  "knowledge:suggestion:accept": {
    request: {
      projectId: string;
      sessionId: string;
      suggestionId: string;
    };
    response: {
      aiContextLevel: "always" | "when_detected" | "manual_only" | "never";
      aliases: Array<string>;
      attributes: Record<string, string>;
      createdAt: string;
      description: string;
      id: string;
      lastSeenState?: string;
      name: string;
      projectId: string;
      type: "character" | "location" | "event" | "item" | "faction";
      updatedAt: string;
      version: number;
    };
  };
  "knowledge:suggestion:dismiss": {
    request: {
      projectId: string;
      sessionId: string;
      suggestionId: string;
    };
    response: {
      dismissed: true;
    };
  };
  "memory:clear:all": {
    request: {
      confirmed: boolean;
    };
    response: {
      deletedEpisodes: number;
      deletedRules: number;
      ok: true;
    };
  };
  "memory:clear:project": {
    request: {
      confirmed: boolean;
      projectId: string;
    };
    response: {
      deletedEpisodes: number;
      deletedRules: number;
      ok: true;
    };
  };
  "memory:conflict:resolve": {
    request: {
      chosenRuleId: string;
      conflictId: string;
      projectId: string;
    };
    response: {
      item: {
        id: string;
        ruleIds: Array<string>;
        status: "pending" | "resolved";
      };
      keptRule: {
        category: "style" | "structure" | "character" | "pacing" | "vocabulary";
        confidence: number;
        conflictMarked?: boolean;
        contradictingEpisodes: Array<string>;
        createdAt: number;
        id: string;
        projectId: string;
        recentlyUpdated?: boolean;
        rule: string;
        scope: "global" | "project";
        supportingEpisodes: Array<string>;
        updatedAt: number;
        userConfirmed: boolean;
        userModified: boolean;
        version: 1;
      };
    };
  };
  "memory:distill:progress": {
    request: {
      errorCode?:
        | "VALIDATION_ERROR"
        | "IPC_TIMEOUT"
        | "IPC_CHANNEL_FORBIDDEN"
        | "IPC_PAYLOAD_TOO_LARGE"
        | "IPC_SUBSCRIPTION_LIMIT_EXCEEDED"
        | "INTERNAL_ERROR"
        | "INVALID_ARGUMENT"
        | "NOT_FOUND"
        | "ALREADY_EXISTS"
        | "CONFLICT"
        | "PERMISSION_DENIED"
        | "FORBIDDEN"
        | "UNSUPPORTED"
        | "IO_ERROR"
        | "DB_ERROR"
        | "MEMORY_EPISODE_WRITE_FAILED"
        | "MEMORY_CAPACITY_EXCEEDED"
        | "MEMORY_DISTILL_LLM_UNAVAILABLE"
        | "MEMORY_CONFIDENCE_OUT_OF_RANGE"
        | "MEMORY_CLEAR_CONFIRM_REQUIRED"
        | "MEMORY_TRACE_MISMATCH"
        | "MEMORY_SCOPE_DENIED"
        | "MODEL_NOT_READY"
        | "EMBEDDING_PROVIDER_UNAVAILABLE"
        | "ENCODING_FAILED"
        | "RATE_LIMITED"
        | "TIMEOUT"
        | "CANCELED"
        | "UPSTREAM_ERROR"
        | "INTERNAL"
        | "PROJECT_CAPACITY_EXCEEDED"
        | "PROJECT_DELETE_REQUIRES_ARCHIVE"
        | "PROJECT_METADATA_INVALID_ENUM"
        | "PROJECT_PURGE_PERMISSION_DENIED"
        | "PROJECT_LIFECYCLE_WRITE_FAILED"
        | "PROJECT_IPC_SCHEMA_INVALID"
        | "KG_ATTRIBUTE_KEYS_EXCEEDED"
        | "KG_CAPACITY_EXCEEDED"
        | "KG_ENTITY_CONFLICT"
        | "KG_ENTITY_DUPLICATE"
        | "KG_QUERY_TIMEOUT"
        | "KG_RECOGNITION_UNAVAILABLE"
        | "KG_RELEVANT_QUERY_FAILED"
        | "KG_RELATION_INVALID"
        | "KG_SCOPE_VIOLATION"
        | "KG_SUBGRAPH_K_EXCEEDED"
        | "PROJECT_SWITCH_TIMEOUT"
        | "DOCUMENT_SAVE_CONFLICT"
        | "MEMORY_BACKPRESSURE"
        | "SKILL_TIMEOUT"
        | "SKILL_DEPENDENCY_MISSING"
        | "SKILL_QUEUE_OVERFLOW"
        | "SKILL_CAPACITY_EXCEEDED"
        | "SKILL_SCOPE_VIOLATION"
        | "SKILL_INPUT_EMPTY"
        | "SKILL_OUTPUT_INVALID"
        | "AI_AUTH_FAILED"
        | "AI_NOT_CONFIGURED"
        | "AI_RATE_LIMITED"
        | "AI_SESSION_TOKEN_BUDGET_EXCEEDED"
        | "LLM_API_ERROR"
        | "AI_PROVIDER_UNAVAILABLE"
        | "VERSION_MERGE_TIMEOUT"
        | "VERSION_SNAPSHOT_COMPACTED"
        | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
        | "VERSION_ROLLBACK_CONFLICT"
        | "SEARCH_TIMEOUT"
        | "SEARCH_REINDEX_IO_ERROR"
        | "SEARCH_DATA_CORRUPTED"
        | "SEARCH_CONCURRENT_WRITE_CONFLICT"
        | "SEARCH_CAPACITY_EXCEEDED"
        | "SEARCH_BACKPRESSURE"
        | "SEARCH_PROJECT_FORBIDDEN"
        | "CONSTRAINT_VALIDATION_ERROR"
        | "CONSTRAINT_NOT_FOUND"
        | "CONSTRAINT_CONFLICT"
        | "CONTEXT_SCOPE_VIOLATION"
        | "CONTEXT_INSPECT_FORBIDDEN"
        | "CONTEXT_INPUT_TOO_LARGE"
        | "CONTEXT_BACKPRESSURE"
        | "CONTEXT_BUDGET_INVALID_RATIO"
        | "CONTEXT_BUDGET_INVALID_MINIMUM"
        | "CONTEXT_BUDGET_CONFLICT"
        | "CONTEXT_TOKENIZER_MISMATCH"
        | "DOCUMENT_SIZE_EXCEEDED";
      message?: string;
      progress: number;
      projectId: string;
      runId: string;
      stage:
        | "started"
        | "clustered"
        | "patterned"
        | "generated"
        | "completed"
        | "failed";
      trigger: "batch" | "idle" | "manual" | "conflict";
    };
    response: {
      errorCode?:
        | "VALIDATION_ERROR"
        | "IPC_TIMEOUT"
        | "IPC_CHANNEL_FORBIDDEN"
        | "IPC_PAYLOAD_TOO_LARGE"
        | "IPC_SUBSCRIPTION_LIMIT_EXCEEDED"
        | "INTERNAL_ERROR"
        | "INVALID_ARGUMENT"
        | "NOT_FOUND"
        | "ALREADY_EXISTS"
        | "CONFLICT"
        | "PERMISSION_DENIED"
        | "FORBIDDEN"
        | "UNSUPPORTED"
        | "IO_ERROR"
        | "DB_ERROR"
        | "MEMORY_EPISODE_WRITE_FAILED"
        | "MEMORY_CAPACITY_EXCEEDED"
        | "MEMORY_DISTILL_LLM_UNAVAILABLE"
        | "MEMORY_CONFIDENCE_OUT_OF_RANGE"
        | "MEMORY_CLEAR_CONFIRM_REQUIRED"
        | "MEMORY_TRACE_MISMATCH"
        | "MEMORY_SCOPE_DENIED"
        | "MODEL_NOT_READY"
        | "EMBEDDING_PROVIDER_UNAVAILABLE"
        | "ENCODING_FAILED"
        | "RATE_LIMITED"
        | "TIMEOUT"
        | "CANCELED"
        | "UPSTREAM_ERROR"
        | "INTERNAL"
        | "PROJECT_CAPACITY_EXCEEDED"
        | "PROJECT_DELETE_REQUIRES_ARCHIVE"
        | "PROJECT_METADATA_INVALID_ENUM"
        | "PROJECT_PURGE_PERMISSION_DENIED"
        | "PROJECT_LIFECYCLE_WRITE_FAILED"
        | "PROJECT_IPC_SCHEMA_INVALID"
        | "KG_ATTRIBUTE_KEYS_EXCEEDED"
        | "KG_CAPACITY_EXCEEDED"
        | "KG_ENTITY_CONFLICT"
        | "KG_ENTITY_DUPLICATE"
        | "KG_QUERY_TIMEOUT"
        | "KG_RECOGNITION_UNAVAILABLE"
        | "KG_RELEVANT_QUERY_FAILED"
        | "KG_RELATION_INVALID"
        | "KG_SCOPE_VIOLATION"
        | "KG_SUBGRAPH_K_EXCEEDED"
        | "PROJECT_SWITCH_TIMEOUT"
        | "DOCUMENT_SAVE_CONFLICT"
        | "MEMORY_BACKPRESSURE"
        | "SKILL_TIMEOUT"
        | "SKILL_DEPENDENCY_MISSING"
        | "SKILL_QUEUE_OVERFLOW"
        | "SKILL_CAPACITY_EXCEEDED"
        | "SKILL_SCOPE_VIOLATION"
        | "SKILL_INPUT_EMPTY"
        | "SKILL_OUTPUT_INVALID"
        | "AI_AUTH_FAILED"
        | "AI_NOT_CONFIGURED"
        | "AI_RATE_LIMITED"
        | "AI_SESSION_TOKEN_BUDGET_EXCEEDED"
        | "LLM_API_ERROR"
        | "AI_PROVIDER_UNAVAILABLE"
        | "VERSION_MERGE_TIMEOUT"
        | "VERSION_SNAPSHOT_COMPACTED"
        | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
        | "VERSION_ROLLBACK_CONFLICT"
        | "SEARCH_TIMEOUT"
        | "SEARCH_REINDEX_IO_ERROR"
        | "SEARCH_DATA_CORRUPTED"
        | "SEARCH_CONCURRENT_WRITE_CONFLICT"
        | "SEARCH_CAPACITY_EXCEEDED"
        | "SEARCH_BACKPRESSURE"
        | "SEARCH_PROJECT_FORBIDDEN"
        | "CONSTRAINT_VALIDATION_ERROR"
        | "CONSTRAINT_NOT_FOUND"
        | "CONSTRAINT_CONFLICT"
        | "CONTEXT_SCOPE_VIOLATION"
        | "CONTEXT_INSPECT_FORBIDDEN"
        | "CONTEXT_INPUT_TOO_LARGE"
        | "CONTEXT_BACKPRESSURE"
        | "CONTEXT_BUDGET_INVALID_RATIO"
        | "CONTEXT_BUDGET_INVALID_MINIMUM"
        | "CONTEXT_BUDGET_CONFLICT"
        | "CONTEXT_TOKENIZER_MISMATCH"
        | "DOCUMENT_SIZE_EXCEEDED";
      message?: string;
      progress: number;
      projectId: string;
      runId: string;
      stage:
        | "started"
        | "clustered"
        | "patterned"
        | "generated"
        | "completed"
        | "failed";
      trigger: "batch" | "idle" | "manual" | "conflict";
    };
  };
  "memory:entry:create": {
    request: {
      content: string;
      documentId?: string;
      projectId?: string;
      scope: "global" | "project" | "document";
      type: "preference" | "fact" | "note";
    };
    response: {
      content: string;
      createdAt: number;
      deletedAt?: number;
      documentId?: string;
      memoryId: string;
      origin: "manual" | "learned";
      projectId?: string;
      scope: "global" | "project" | "document";
      sourceRef?: string;
      type: "preference" | "fact" | "note";
      updatedAt: number;
    };
  };
  "memory:entry:delete": {
    request: {
      memoryId: string;
    };
    response: {
      deleted: true;
    };
  };
  "memory:entry:list": {
    request: {
      documentId?: string;
      includeDeleted?: boolean;
      projectId?: string;
    };
    response: {
      items: Array<{
        content: string;
        createdAt: number;
        deletedAt?: number;
        documentId?: string;
        memoryId: string;
        origin: "manual" | "learned";
        projectId?: string;
        scope: "global" | "project" | "document";
        sourceRef?: string;
        type: "preference" | "fact" | "note";
        updatedAt: number;
      }>;
    };
  };
  "memory:entry:update": {
    request: {
      memoryId: string;
      patch: {
        content?: string;
        documentId?: string;
        projectId?: string;
        scope?: "global" | "project" | "document";
        type?: "preference" | "fact" | "note";
      };
    };
    response: {
      content: string;
      createdAt: number;
      deletedAt?: number;
      documentId?: string;
      memoryId: string;
      origin: "manual" | "learned";
      projectId?: string;
      scope: "global" | "project" | "document";
      sourceRef?: string;
      type: "preference" | "fact" | "note";
      updatedAt: number;
    };
  };
  "memory:episode:query": {
    request: {
      limit?: number;
      projectId: string;
      queryText?: string;
      sceneType: string;
    };
    response: {
      fallbackRules: Array<string>;
      items: Array<{
        candidates: Array<string>;
        chapterId: string;
        compressed: boolean;
        createdAt: number;
        editDistance: number;
        explicit?: string;
        finalText: string;
        id: string;
        implicitSignal:
          | "DIRECT_ACCEPT"
          | "LIGHT_EDIT"
          | "HEAVY_REWRITE"
          | "FULL_REJECT"
          | "UNDO_AFTER_ACCEPT"
          | "REPEATED_SCENE_SKILL";
        implicitWeight: number;
        importance: number;
        inputContext: string;
        lastRecalledAt?: number;
        projectId: string;
        recallCount: number;
        sceneType: string;
        scope: "project";
        selectedIndex: number;
        skillUsed: string;
        updatedAt: number;
        userConfirmed: boolean;
        version: 1;
      }>;
      memoryDegraded: boolean;
      semanticRules: Array<{
        confidence: number;
        createdAt: number;
        id: string;
        projectId: string;
        rule: string;
        scope: "project" | "global";
        updatedAt: number;
        version: 1;
      }>;
    };
  };
  "memory:episode:record": {
    request: {
      acceptedWithoutEdit?: boolean;
      candidates: Array<string>;
      chapterId: string;
      editDistance: number;
      explicit?: string;
      finalText: string;
      importance?: number;
      inputContext: string;
      projectId: string;
      repeatedSceneSkillCount?: number;
      sceneType: string;
      selectedIndex: number;
      skillUsed: string;
      targetEpisodeId?: string;
      undoAfterAccept?: boolean;
      userConfirmed?: boolean;
    };
    response: {
      accepted: true;
      episodeId: string;
      implicitSignal:
        | "DIRECT_ACCEPT"
        | "LIGHT_EDIT"
        | "HEAVY_REWRITE"
        | "FULL_REJECT"
        | "UNDO_AFTER_ACCEPT"
        | "REPEATED_SCENE_SKILL";
      implicitWeight: number;
      retryCount: number;
    };
  };
  "memory:injection:preview": {
    request: {
      documentId?: string;
      projectId?: string;
      queryText?: string;
    };
    response: {
      diagnostics?: {
        degradedFrom: "semantic";
        reason: string;
      };
      items: Array<{
        content: string;
        id: string;
        origin: "manual" | "learned";
        reason:
          | {
              kind: "deterministic";
            }
          | {
              kind: "semantic";
              score: number;
            };
        scope: "global" | "project" | "document";
        type: "preference" | "fact" | "note";
      }>;
      mode: "deterministic" | "semantic";
    };
  };
  "memory:scope:promote": {
    request: {
      projectId: string;
      ruleId: string;
    };
    response: {
      item: {
        category: "style" | "structure" | "character" | "pacing" | "vocabulary";
        confidence: number;
        conflictMarked?: boolean;
        contradictingEpisodes: Array<string>;
        createdAt: number;
        id: string;
        projectId: string;
        recentlyUpdated?: boolean;
        rule: string;
        scope: "global" | "project";
        supportingEpisodes: Array<string>;
        updatedAt: number;
        userConfirmed: boolean;
        userModified: boolean;
        version: 1;
      };
    };
  };
  "memory:semantic:add": {
    request: {
      category: "style" | "structure" | "character" | "pacing" | "vocabulary";
      confidence: number;
      contradictingEpisodes?: Array<string>;
      projectId: string;
      rule: string;
      scope?: "global" | "project";
      supportingEpisodes?: Array<string>;
      userConfirmed?: boolean;
      userModified?: boolean;
    };
    response: {
      item: {
        category: "style" | "structure" | "character" | "pacing" | "vocabulary";
        confidence: number;
        conflictMarked?: boolean;
        contradictingEpisodes: Array<string>;
        createdAt: number;
        id: string;
        projectId: string;
        recentlyUpdated?: boolean;
        rule: string;
        scope: "global" | "project";
        supportingEpisodes: Array<string>;
        updatedAt: number;
        userConfirmed: boolean;
        userModified: boolean;
        version: 1;
      };
    };
  };
  "memory:semantic:delete": {
    request: {
      projectId: string;
      ruleId: string;
    };
    response: {
      deleted: true;
    };
  };
  "memory:semantic:distill": {
    request: {
      projectId: string;
      trigger?: "batch" | "idle" | "manual" | "conflict";
    };
    response: {
      accepted: true;
      runId: string;
    };
  };
  "memory:semantic:list": {
    request: {
      projectId: string;
    };
    response: {
      conflictQueue: Array<{
        id: string;
        ruleIds: Array<string>;
        status: "pending" | "resolved";
      }>;
      items: Array<{
        category: "style" | "structure" | "character" | "pacing" | "vocabulary";
        confidence: number;
        conflictMarked?: boolean;
        contradictingEpisodes: Array<string>;
        createdAt: number;
        id: string;
        projectId: string;
        recentlyUpdated?: boolean;
        rule: string;
        scope: "global" | "project";
        supportingEpisodes: Array<string>;
        updatedAt: number;
        userConfirmed: boolean;
        userModified: boolean;
        version: 1;
      }>;
    };
  };
  "memory:semantic:update": {
    request: {
      patch: {
        category?:
          | "style"
          | "structure"
          | "character"
          | "pacing"
          | "vocabulary";
        confidence?: number;
        contradictingEpisodes?: Array<string>;
        rule?: string;
        scope?: "global" | "project";
        supportingEpisodes?: Array<string>;
        userConfirmed?: boolean;
        userModified?: boolean;
      };
      projectId: string;
      ruleId: string;
    };
    response: {
      item: {
        category: "style" | "structure" | "character" | "pacing" | "vocabulary";
        confidence: number;
        conflictMarked?: boolean;
        contradictingEpisodes: Array<string>;
        createdAt: number;
        id: string;
        projectId: string;
        recentlyUpdated?: boolean;
        rule: string;
        scope: "global" | "project";
        supportingEpisodes: Array<string>;
        updatedAt: number;
        userConfirmed: boolean;
        userModified: boolean;
        version: 1;
      };
    };
  };
  "memory:settings:get": {
    request: Record<string, never>;
    response: {
      injectionEnabled: boolean;
      preferenceLearningEnabled: boolean;
      preferenceLearningThreshold: number;
      privacyModeEnabled: boolean;
    };
  };
  "memory:settings:update": {
    request: {
      patch: {
        injectionEnabled?: boolean;
        preferenceLearningEnabled?: boolean;
        preferenceLearningThreshold?: number;
        privacyModeEnabled?: boolean;
      };
    };
    response: {
      injectionEnabled: boolean;
      preferenceLearningEnabled: boolean;
      preferenceLearningThreshold: number;
      privacyModeEnabled: boolean;
    };
  };
  "memory:trace:feedback": {
    request: {
      generationId: string;
      projectId: string;
      reason?: string;
      verdict: "correct" | "incorrect";
    };
    response: {
      accepted: true;
      feedbackId: string;
    };
  };
  "memory:trace:get": {
    request: {
      generationId: string;
      projectId: string;
    };
    response: {
      trace: {
        createdAt: number;
        generationId: string;
        influenceWeights: Array<{
          memoryType: "working" | "episodic" | "semantic";
          referenceId: string;
          weight: number;
        }>;
        memoryReferences: {
          episodic: Array<string>;
          semantic: Array<string>;
          working: Array<string>;
        };
        projectId: string;
        updatedAt: number;
      };
    };
  };
  "project:lifecycle:archive": {
    request: {
      projectId: string;
      traceId?: string;
    };
    response: {
      archivedAt?: number;
      projectId: string;
      state: "active" | "archived" | "deleted";
    };
  };
  "project:lifecycle:get": {
    request: {
      projectId: string;
      traceId?: string;
    };
    response: {
      projectId: string;
      state: "active" | "archived" | "deleted";
    };
  };
  "project:lifecycle:purge": {
    request: {
      projectId: string;
      traceId?: string;
    };
    response: {
      projectId: string;
      state: "active" | "archived" | "deleted";
    };
  };
  "project:lifecycle:restore": {
    request: {
      projectId: string;
      traceId?: string;
    };
    response: {
      projectId: string;
      state: "active" | "archived" | "deleted";
    };
  };
  "project:project:archive": {
    request: {
      archived: boolean;
      projectId: string;
    };
    response: {
      archived: boolean;
      archivedAt?: number;
      projectId: string;
    };
  };
  "project:project:create": {
    request: {
      description?: string;
      name?: string;
      template?:
        | {
            id: string;
            kind: "builtin";
          }
        | {
            kind: "custom";
            structure: {
              files: Array<{
                content?: string;
                path: string;
              }>;
              folders: Array<string>;
            };
          };
      type?: "novel" | "screenplay" | "media";
    };
    response: {
      projectId: string;
      rootPath: string;
    };
  };
  "project:project:createaiassist": {
    request: {
      prompt: string;
    };
    response: {
      chapterOutlines: Array<string>;
      characters: Array<string>;
      description: string;
      name: string;
      type: "novel" | "screenplay" | "media";
    };
  };
  "project:project:delete": {
    request: {
      projectId: string;
    };
    response: {
      deleted: true;
    };
  };
  "project:project:duplicate": {
    request: {
      projectId: string;
    };
    response: {
      name: string;
      projectId: string;
      rootPath: string;
    };
  };
  "project:project:getcurrent": {
    request: Record<string, never>;
    response: {
      projectId: string;
      rootPath: string;
    };
  };
  "project:project:list": {
    request: {
      includeArchived?: boolean;
    };
    response: {
      items: Array<{
        archivedAt?: number;
        name: string;
        projectId: string;
        rootPath: string;
        stage?: "outline" | "draft" | "revision" | "final";
        type?: "novel" | "screenplay" | "media";
        updatedAt: number;
      }>;
    };
  };
  "project:project:rename": {
    request: {
      name: string;
      projectId: string;
    };
    response: {
      name: string;
      projectId: string;
      updatedAt: number;
    };
  };
  "project:project:setcurrent": {
    request: {
      projectId: string;
    };
    response: {
      projectId: string;
      rootPath: string;
    };
  };
  "project:project:stats": {
    request: Record<string, never>;
    response: {
      active: number;
      archived: number;
      total: number;
    };
  };
  "project:project:switch": {
    request: {
      fromProjectId: string;
      operatorId: string;
      projectId: string;
      traceId: string;
    };
    response: {
      currentProjectId: string;
      switchedAt: string;
    };
  };
  "project:project:update": {
    request: {
      patch: {
        defaultSkillSetId?: string;
        description?: string;
        knowledgeGraphId?: string;
        languageStyle?: string;
        narrativePerson?: string;
        stage?: string;
        targetAudience?: string;
        targetChapterCount?: number;
        targetWordCount?: number;
        type?: string;
      };
      projectId: string;
    };
    response: {
      updated: true;
    };
  };
  "rag:config:get": {
    request: Record<string, never>;
    response: {
      maxTokens: number;
      minScore: number;
      model?: string;
      topK: number;
    };
  };
  "rag:config:update": {
    request: {
      maxTokens?: number;
      minScore?: number;
      model?: string;
      topK?: number;
    };
    response: {
      maxTokens: number;
      minScore: number;
      model?: string;
      topK: number;
    };
  };
  "rag:context:retrieve": {
    request: {
      maxTokens?: number;
      minScore?: number;
      model?: string;
      projectId: string;
      queryText: string;
      topK?: number;
    };
    response: {
      chunks: Array<{
        chunkId: string;
        documentId: string;
        score: number;
        text: string;
        tokenEstimate: number;
      }>;
      fallback?: {
        from: "semantic";
        reason: string;
        to: "fts";
      };
      truncated: boolean;
      usedTokens: number;
    };
  };
  "search:fts:query": {
    request: {
      limit?: number;
      offset?: number;
      projectId: string;
      query: string;
    };
    response: {
      hasMore: boolean;
      indexState: "ready" | "rebuilding";
      results: Array<{
        anchor: {
          end: number;
          start: number;
        };
        documentId: string;
        documentTitle: string;
        documentType: string;
        highlights: Array<{
          end: number;
          start: number;
        }>;
        projectId: string;
        score: number;
        snippet: string;
        updatedAt: number;
      }>;
      total: number;
    };
  };
  "search:fts:reindex": {
    request: {
      projectId: string;
    };
    response: {
      indexState: "ready";
      reindexed: number;
    };
  };
  "search:query:strategy": {
    request: {
      limit?: number;
      offset?: number;
      projectId: string;
      query: string;
      strategy: "fts" | "semantic" | "hybrid";
    };
    response: {
      backpressure: {
        candidateCount: number;
        candidateLimit: number;
        truncated: boolean;
      };
      costMs: number;
      fallback: "fts" | "none";
      hasMore: boolean;
      notice?: string;
      results: Array<{
        chunkId: string;
        documentId: string;
        finalScore: number;
        scoreBreakdown: {
          bm25: number;
          recency: number;
          semantic: number;
        };
        snippet: string;
        updatedAt: number;
      }>;
      strategy: "fts" | "semantic" | "hybrid";
      total: number;
      traceId: string;
    };
  };
  "search:rank:explain": {
    request: {
      chunkId?: string;
      documentId?: string;
      limit?: number;
      offset?: number;
      projectId: string;
      query: string;
      strategy: "fts" | "semantic" | "hybrid";
    };
    response: {
      backpressure: {
        candidateCount: number;
        candidateLimit: number;
        truncated: boolean;
      };
      explanations: Array<{
        chunkId: string;
        documentId: string;
        finalScore: number;
        scoreBreakdown: {
          bm25: number;
          recency: number;
          semantic: number;
        };
        snippet: string;
        updatedAt: number;
      }>;
      strategy: "fts" | "semantic" | "hybrid";
      total: number;
    };
  };
  "search:replace:execute": {
    request: {
      caseSensitive?: boolean;
      confirmed?: boolean;
      documentId?: string;
      previewId?: string;
      projectId: string;
      query: string;
      regex?: boolean;
      replaceWith: string;
      scope: "currentDocument" | "wholeProject";
      wholeWord?: boolean;
    };
    response: {
      affectedDocumentCount: number;
      replacedCount: number;
      skipped: Array<{
        documentId: string;
        message?: string;
        reason: string;
      }>;
      snapshotIds: Array<string>;
    };
  };
  "search:replace:preview": {
    request: {
      caseSensitive?: boolean;
      documentId?: string;
      projectId: string;
      query: string;
      regex?: boolean;
      replaceWith: string;
      scope: "currentDocument" | "wholeProject";
      wholeWord?: boolean;
    };
    response: {
      affectedDocuments: number;
      items: Array<{
        documentId: string;
        matchCount: number;
        sample: string;
        title: string;
      }>;
      previewId?: string;
      totalMatches: number;
      warnings: Array<string>;
    };
  };
  "skill:custom:create": {
    request: {
      contextRules: Record<string, string | number | boolean>;
      description: string;
      enabled?: boolean;
      inputType: "selection" | "document";
      name: string;
      promptTemplate: string;
      scope: "global" | "project";
    };
    response: {
      skill: {
        contextRules: Record<string, string | number | boolean>;
        createdAt: number;
        description: string;
        enabled: boolean;
        id: string;
        inputType: "selection" | "document";
        name: string;
        promptTemplate: string;
        scope: "global" | "project";
        updatedAt: number;
      };
    };
  };
  "skill:custom:delete": {
    request: {
      id: string;
    };
    response: {
      deleted: true;
      id: string;
    };
  };
  "skill:custom:list": {
    request: Record<string, never>;
    response: {
      items: Array<{
        contextRules: Record<string, string | number | boolean>;
        createdAt: number;
        description: string;
        enabled: boolean;
        id: string;
        inputType: "selection" | "document";
        name: string;
        promptTemplate: string;
        scope: "global" | "project";
        updatedAt: number;
      }>;
    };
  };
  "skill:custom:update": {
    request: {
      contextRules?: Record<string, string | number | boolean>;
      description?: string;
      enabled?: boolean;
      id: string;
      inputType?: "selection" | "document";
      name?: string;
      promptTemplate?: string;
      scope?: "global" | "project";
    };
    response: {
      id: string;
      scope: "global" | "project";
    };
  };
  "skill:registry:list": {
    request: {
      includeDisabled?: boolean;
    };
    response: {
      items: Array<{
        enabled: boolean;
        error_code?:
          | "VALIDATION_ERROR"
          | "IPC_TIMEOUT"
          | "IPC_CHANNEL_FORBIDDEN"
          | "IPC_PAYLOAD_TOO_LARGE"
          | "IPC_SUBSCRIPTION_LIMIT_EXCEEDED"
          | "INTERNAL_ERROR"
          | "INVALID_ARGUMENT"
          | "NOT_FOUND"
          | "ALREADY_EXISTS"
          | "CONFLICT"
          | "PERMISSION_DENIED"
          | "FORBIDDEN"
          | "UNSUPPORTED"
          | "IO_ERROR"
          | "DB_ERROR"
          | "MEMORY_EPISODE_WRITE_FAILED"
          | "MEMORY_CAPACITY_EXCEEDED"
          | "MEMORY_DISTILL_LLM_UNAVAILABLE"
          | "MEMORY_CONFIDENCE_OUT_OF_RANGE"
          | "MEMORY_CLEAR_CONFIRM_REQUIRED"
          | "MEMORY_TRACE_MISMATCH"
          | "MEMORY_SCOPE_DENIED"
          | "MODEL_NOT_READY"
          | "EMBEDDING_PROVIDER_UNAVAILABLE"
          | "ENCODING_FAILED"
          | "RATE_LIMITED"
          | "TIMEOUT"
          | "CANCELED"
          | "UPSTREAM_ERROR"
          | "INTERNAL"
          | "PROJECT_CAPACITY_EXCEEDED"
          | "PROJECT_DELETE_REQUIRES_ARCHIVE"
          | "PROJECT_METADATA_INVALID_ENUM"
          | "PROJECT_PURGE_PERMISSION_DENIED"
          | "PROJECT_LIFECYCLE_WRITE_FAILED"
          | "PROJECT_IPC_SCHEMA_INVALID"
          | "KG_ATTRIBUTE_KEYS_EXCEEDED"
          | "KG_CAPACITY_EXCEEDED"
          | "KG_ENTITY_CONFLICT"
          | "KG_ENTITY_DUPLICATE"
          | "KG_QUERY_TIMEOUT"
          | "KG_RECOGNITION_UNAVAILABLE"
          | "KG_RELEVANT_QUERY_FAILED"
          | "KG_RELATION_INVALID"
          | "KG_SCOPE_VIOLATION"
          | "KG_SUBGRAPH_K_EXCEEDED"
          | "PROJECT_SWITCH_TIMEOUT"
          | "DOCUMENT_SAVE_CONFLICT"
          | "MEMORY_BACKPRESSURE"
          | "SKILL_TIMEOUT"
          | "SKILL_DEPENDENCY_MISSING"
          | "SKILL_QUEUE_OVERFLOW"
          | "SKILL_CAPACITY_EXCEEDED"
          | "SKILL_SCOPE_VIOLATION"
          | "SKILL_INPUT_EMPTY"
          | "SKILL_OUTPUT_INVALID"
          | "AI_AUTH_FAILED"
          | "AI_NOT_CONFIGURED"
          | "AI_RATE_LIMITED"
          | "AI_SESSION_TOKEN_BUDGET_EXCEEDED"
          | "LLM_API_ERROR"
          | "AI_PROVIDER_UNAVAILABLE"
          | "VERSION_MERGE_TIMEOUT"
          | "VERSION_SNAPSHOT_COMPACTED"
          | "VERSION_DIFF_PAYLOAD_TOO_LARGE"
          | "VERSION_ROLLBACK_CONFLICT"
          | "SEARCH_TIMEOUT"
          | "SEARCH_REINDEX_IO_ERROR"
          | "SEARCH_DATA_CORRUPTED"
          | "SEARCH_CONCURRENT_WRITE_CONFLICT"
          | "SEARCH_CAPACITY_EXCEEDED"
          | "SEARCH_BACKPRESSURE"
          | "SEARCH_PROJECT_FORBIDDEN"
          | "CONSTRAINT_VALIDATION_ERROR"
          | "CONSTRAINT_NOT_FOUND"
          | "CONSTRAINT_CONFLICT"
          | "CONTEXT_SCOPE_VIOLATION"
          | "CONTEXT_INSPECT_FORBIDDEN"
          | "CONTEXT_INPUT_TOO_LARGE"
          | "CONTEXT_BACKPRESSURE"
          | "CONTEXT_BUDGET_INVALID_RATIO"
          | "CONTEXT_BUDGET_INVALID_MINIMUM"
          | "CONTEXT_BUDGET_CONFLICT"
          | "CONTEXT_TOKENIZER_MISMATCH"
          | "DOCUMENT_SIZE_EXCEEDED";
        error_message?: string;
        id: string;
        name: string;
        packageId: string;
        scope: "builtin" | "global" | "project";
        valid: boolean;
        version: string;
      }>;
    };
  };
  "skill:registry:read": {
    request: {
      id: string;
    };
    response: {
      content: string;
      id: string;
    };
  };
  "skill:registry:toggle": {
    request: {
      enabled: boolean;
      id?: string;
      skillId?: string;
    };
    response: {
      enabled: boolean;
      id: string;
    };
  };
  "skill:registry:write": {
    request: {
      content: string;
      id: string;
    };
    response: {
      id: string;
      scope: "builtin" | "global" | "project";
      written: true;
    };
  };
  "stats:day:gettoday": {
    request: Record<string, never>;
    response: {
      date: string;
      summary: {
        documentsCreated: number;
        skillsUsed: number;
        wordsWritten: number;
        writingSeconds: number;
      };
    };
  };
  "stats:range:get": {
    request: {
      from: string;
      to: string;
    };
    response: {
      days: Array<{
        date: string;
        summary: {
          documentsCreated: number;
          skillsUsed: number;
          wordsWritten: number;
          writingSeconds: number;
        };
      }>;
      from: string;
      summary: {
        documentsCreated: number;
        skillsUsed: number;
        wordsWritten: number;
        writingSeconds: number;
      };
      to: string;
    };
  };
  "version:aiapply:logconflict": {
    request: {
      documentId: string;
      runId: string;
    };
    response: {
      logged: true;
    };
  };
  "version:branch:create": {
    request: {
      createdBy: string;
      documentId: string;
      name: string;
    };
    response: {
      branch: {
        baseSnapshotId: string;
        createdAt: number;
        createdBy: string;
        documentId: string;
        headSnapshotId: string;
        id: string;
        isCurrent: boolean;
        name: string;
      };
    };
  };
  "version:branch:list": {
    request: {
      documentId: string;
    };
    response: {
      branches: Array<{
        baseSnapshotId: string;
        createdAt: number;
        createdBy: string;
        documentId: string;
        headSnapshotId: string;
        id: string;
        isCurrent: boolean;
        name: string;
      }>;
    };
  };
  "version:branch:merge": {
    request: {
      documentId: string;
      sourceBranchName: string;
      targetBranchName: string;
    };
    response: {
      mergeSnapshotId: string;
      status: "merged";
    };
  };
  "version:branch:switch": {
    request: {
      documentId: string;
      name: string;
    };
    response: {
      currentBranch: string;
      headSnapshotId: string;
    };
  };
  "version:conflict:resolve": {
    request: {
      documentId: string;
      mergeSessionId: string;
      resolutions: Array<{
        conflictId: string;
        manualText?: string;
        resolution: "ours" | "theirs" | "manual";
      }>;
      resolvedBy: string;
    };
    response: {
      mergeSnapshotId: string;
      status: "merged";
    };
  };
  "version:snapshot:create": {
    request: {
      actor: "user" | "auto" | "ai";
      contentJson: string;
      documentId: string;
      projectId: string;
      reason: "manual-save" | "autosave" | "ai-accept" | "status-change";
    };
    response: {
      compaction?: {
        code: "VERSION_SNAPSHOT_COMPACTED";
        deletedCount: number;
        remainingCount: number;
      };
      contentHash: string;
      createdAt: number;
      versionId: string;
      wordCount: number;
    };
  };
  "version:snapshot:diff": {
    request: {
      baseVersionId: string;
      documentId: string;
      targetVersionId?: string;
    };
    response: {
      aiMarked: boolean;
      diffText: string;
      hasDifferences: boolean;
      stats: {
        addedLines: number;
        changedHunks: number;
        removedLines: number;
      };
    };
  };
  "version:snapshot:list": {
    request: {
      documentId: string;
    };
    response: {
      items: Array<{
        actor: "user" | "auto" | "ai";
        contentHash: string;
        createdAt: number;
        reason: string;
        versionId: string;
        wordCount: number;
      }>;
    };
  };
  "version:snapshot:read": {
    request: {
      documentId: string;
      versionId: string;
    };
    response: {
      actor: "user" | "auto" | "ai";
      contentHash: string;
      contentJson: string;
      contentMd: string;
      contentText: string;
      createdAt: number;
      documentId: string;
      projectId: string;
      reason: string;
      versionId: string;
      wordCount: number;
    };
  };
  "version:snapshot:restore": {
    request: {
      documentId: string;
      versionId: string;
    };
    response: {
      restored: true;
    };
  };
  "version:snapshot:rollback": {
    request: {
      documentId: string;
      versionId: string;
    };
    response: {
      preRollbackVersionId: string;
      restored: true;
      rollbackVersionId: string;
    };
  };
};

export type IpcRequest<C extends IpcChannel> = IpcChannelSpec[C]["request"];

export type IpcResponseData<C extends IpcChannel> =
  IpcChannelSpec[C]["response"];

export type IpcInvokeResult<C extends IpcChannel> = IpcResponse<
  IpcResponseData<C>
>;
