import { randomUUID } from "node:crypto";

import type { IpcError, IpcErrorCode } from "@shared/types/ipc-generated";
import type { AiStreamEvent, AiStreamTerminal } from "@shared/types/ai";
import type { Logger } from "../../logging/logger";
import { resolveRuntimeGovernanceFromEnv } from "../../config/runtimeGovernance";
import {
  createSkillScheduler,
  type SkillSchedulerTerminal,
} from "../skills/skillScheduler";
import { startFakeAiServer, type FakeAiServer } from "./fakeAiServer";
import { buildLLMMessages, type LLMMessage } from "./buildLLMMessages";
import {
  createChatMessageManager,
  type ChatMessageManager,
} from "./chatMessageManager";
import {
  buildUpstreamHttpError,
  mapUpstreamStatusToIpcErrorCode,
} from "./errorMapper";
import {
  combineSystemText,
  DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE,
  estimateTokenCount,
  modeSystemHint,
  parseChatHistoryTokenBudget,
  parseMaxSkillOutputChars,
  resolveSkillTimeoutMs,
} from "./runtimeConfig";
import { assembleSystemPrompt } from "./assembleSystemPrompt";
import { GLOBAL_IDENTITY_PROMPT } from "./identityPrompt";
import {
  createProviderResolver,
  type ProviderConfig,
  type ProxySettings,
} from "./providerResolver";
import {
  extractAnthropicDelta,
  extractAnthropicText,
  extractOpenAiDelta,
  extractOpenAiModels,
  extractOpenAiText,
  providerDisplayName,
} from "./aiPayloadParsers";
import type { TraceStore } from "./traceStore";

export { assembleSystemPrompt, GLOBAL_IDENTITY_PROMPT };
export { mapUpstreamStatusToIpcErrorCode };
export type { AiProvider } from "./aiPayloadParsers";

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: IpcError };
export type ServiceResult<T> = Ok<T> | Err;

export type TracePersistenceDegradation = {
  code: "TRACE_PERSISTENCE_DEGRADED";
  message: string;
  runId: string;
  traceId: string;
  cause: { code: IpcErrorCode; message: string };
};

export type AiService = {
  runSkill: (args: {
    skillId: string;
    systemPrompt?: string;
    input: string;
    timeoutMs?: number;
    mode: "agent" | "plan" | "ask";
    model: string;
    system?: string;
    context?: { projectId?: string; documentId?: string };
    stream: boolean;
    ts: number;
    emitEvent: (event: AiStreamEvent) => void;
  }) => Promise<
    ServiceResult<{
      executionId: string;
      runId: string;
      traceId: string;
      outputText?: string;
      degradation?: TracePersistenceDegradation;
    }>
  >;
  listModels: () => Promise<
    ServiceResult<{
      source: "proxy" | "openai" | "anthropic";
      items: Array<{ id: string; name: string; provider: string }>;
    }>
  >;
  cancel: (args: {
    executionId?: string;
    runId?: string;
    ts: number;
  }) => ServiceResult<{ canceled: true }>;
  feedback: (args: {
    runId: string;
    action: "accept" | "reject" | "partial";
    evidenceRef: string;
    ts: number;
  }) => ServiceResult<{ recorded: true }>;
};

type JsonObject = Record<string, unknown>;

type RunEntry = {
  executionId: string;
  runId: string;
  traceId: string;
  controller: AbortController;
  timeoutTimer: NodeJS.Timeout | null;
  completionTimer: NodeJS.Timeout | null;
  chunkFlushTimer: NodeJS.Timeout | null;
  pendingChunkText: string;
  pendingChunkCount: number;
  stream: boolean;
  startedAt: number;
  terminal: AiStreamTerminal | null;
  doneEmitted: boolean;
  schedulerTerminalResolved: boolean;
  resolveSchedulerTerminal: (terminal: SkillSchedulerTerminal) => void;
  seq: number;
  outputText: string;
  emitEvent: (event: AiStreamEvent) => void;
};

const DEFAULT_LLM_RATE_LIMIT_PER_MINUTE = 60;
const PROVIDER_HALF_OPEN_AFTER_MS = 15 * 60 * 1000;
const STREAM_CHUNK_BATCH_WINDOW_MS = 20;
const STREAM_CHUNK_MAX_BATCH_SIZE = 4;
const STREAM_COMPLETION_SETTLE_DELAY_MS = 20;

type RuntimeMessages = {
  systemText: string;
  openAiMessages: LLMMessage[];
  anthropicMessages: Array<{ role: "user" | "assistant"; content: string }>;
};

/**
 * Narrow an unknown value to a JSON object.
 */
function asObject(x: unknown): JsonObject | null {
  if (typeof x !== "object" || x === null) {
    return null;
  }
  return x as JsonObject;
}

/**
 * Return a stable IPC error wrapper.
 *
 * Why: errors must be deterministic for E2E assertions and must not leak secrets.
 */
function ipcError(code: IpcErrorCode, message: string, details?: unknown): Err {
  return { ok: false, error: { code, message, details } };
}

/**
 * Join a provider base URL with an endpoint path while preserving base path prefixes.
 */
function buildApiUrl(args: { baseUrl: string; endpointPath: string }): string {
  const base = new URL(args.baseUrl.trim());
  const endpoint = args.endpointPath.startsWith("/")
    ? args.endpointPath
    : `/${args.endpointPath}`;

  if (!base.pathname.endsWith("/")) {
    base.pathname = `${base.pathname}/`;
  }

  const basePathNoSlash = base.pathname.endsWith("/")
    ? base.pathname.slice(0, -1)
    : base.pathname;
  const normalizedEndpoint =
    basePathNoSlash.endsWith("/v1") && endpoint.startsWith("/v1/")
      ? endpoint.slice(3)
      : endpoint;

  return new URL(normalizedEndpoint.slice(1), base.toString()).toString();
}

/**
 * Parse upstream JSON safely and return deterministic errors for non-JSON bodies.
 */
async function parseJsonResponse(
  res: Response,
): Promise<ServiceResult<unknown>> {
  const bodyText = await res.text();
  try {
    return { ok: true, data: JSON.parse(bodyText) as unknown };
  } catch {
    return ipcError("LLM_API_ERROR", "Non-JSON upstream response");
  }
}

/**
 * Read SSE messages from a fetch response body.
 *
 * Why: both OpenAI and Anthropic streaming are delivered as SSE.
 */
async function* readSse(args: {
  body: ReadableStream<Uint8Array>;
}): AsyncGenerator<{ event: string | null; data: string }> {
  const decoder = new TextDecoder();
  const reader = args.body.getReader();

  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    while (true) {
      const sepIndex = buffer.indexOf("\n\n");
      if (sepIndex < 0) {
        break;
      }

      const rawEvent = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);

      const lines = rawEvent.split("\n");
      let event: string | null = null;
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith("event:")) {
          event = line.slice("event:".length).trim();
          continue;
        }
        if (line.startsWith("data:")) {
          dataLines.push(line.slice("data:".length).trimStart());
        }
      }

      if (dataLines.length === 0) {
        continue;
      }

      yield { event, data: dataLines.join("\n") };
    }
  }
}

/**
 * Create the main-process AI service.
 *
 * Why: keep secrets + network + error mapping in the main process for stable IPC.
 */
export function createAiService(deps: {
  logger: Logger;
  env: NodeJS.ProcessEnv;
  getProxySettings?: () => ProxySettings | null;
  traceStore?: TraceStore;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  rateLimitPerMinute?: number;
  retryBackoffMs?: readonly number[];
  sessionTokenBudget?: number;
}): AiService {
  const runtimeGovernance = resolveRuntimeGovernanceFromEnv(deps.env);
  const runs = new Map<string, RunEntry>();
  const requestTimestamps: number[] = [];
  const sessionTokenTotalsByKey = new Map<string, number>();
  const sessionChatMessagesByKey = new Map<string, ChatMessageManager>();
  const skillScheduler = createSkillScheduler({
    globalConcurrencyLimit: 8,
    sessionQueueLimit: 20,
  });
  const now = deps.now ?? (() => Date.now());
  const providerResolver = createProviderResolver({
    logger: deps.logger,
    now,
  });
  const sleep =
    deps.sleep ??
    ((ms: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, ms);
      }));
  const rateLimitPerMinute =
    deps.rateLimitPerMinute ?? DEFAULT_LLM_RATE_LIMIT_PER_MINUTE;
  const retryBackoffMs =
    deps.retryBackoffMs ?? runtimeGovernance.ai.retryBackoffMs;
  const sessionTokenBudget =
    deps.sessionTokenBudget ?? runtimeGovernance.ai.sessionTokenBudget;
  const maxSkillOutputChars = parseMaxSkillOutputChars(deps.env);
  const chatHistoryTokenBudget = parseChatHistoryTokenBudget(deps.env);
  let fakeServerPromise: Promise<FakeAiServer> | null = null;

  const getFakeServer = async (): Promise<FakeAiServer> => {
    if (!fakeServerPromise) {
      fakeServerPromise = startFakeAiServer({
        logger: deps.logger,
        env: deps.env,
      });
    }
    return await fakeServerPromise;
  };

  /**
   * Build a stable session key used for queueing and token-budget accounting.
   */
  function resolveSessionKey(context?: {
    projectId?: string;
    documentId?: string;
  }): string {
    const projectId = context?.projectId?.trim() ?? "";
    if (projectId.length > 0) {
      return `project:${projectId}`;
    }

    const documentId = context?.documentId?.trim() ?? "";
    if (documentId.length > 0) {
      return `document:${documentId}`;
    }

    return "global";
  }

  function getChatMessageManager(sessionKey: string): ChatMessageManager {
    const existing = sessionChatMessagesByKey.get(sessionKey);
    if (existing) {
      return existing;
    }
    const created = createChatMessageManager();
    sessionChatMessagesByKey.set(sessionKey, created);
    return created;
  }

  function buildRuntimeMessages(args: {
    systemPrompt?: string;
    mode: "agent" | "plan" | "ask";
    system?: string;
    input: string;
    history: Array<{ role: "user" | "assistant"; content: string }>;
  }): RuntimeMessages {
    const systemText = combineSystemText({
      systemPrompt: args.systemPrompt,
      modeHint: modeSystemHint(args.mode) ?? undefined,
      system: args.system,
    });
    const openAiMessages = buildLLMMessages({
      systemPrompt: systemText,
      history: args.history,
      currentUserMessage: args.input,
      maxTokenBudget: chatHistoryTokenBudget,
    });
    const anthropicMessages: RuntimeMessages["anthropicMessages"] = [];
    for (const message of openAiMessages) {
      if (message.role !== "user" && message.role !== "assistant") {
        continue;
      }
      anthropicMessages.push({
        role: message.role,
        content: message.content,
      });
    }
    return {
      systemText,
      openAiMessages,
      anthropicMessages,
    };
  }

  function isProviderAvailabilityError(error: IpcError): boolean {
    return (
      error.code === "LLM_API_ERROR" ||
      error.code === "TIMEOUT" ||
      error.code === "SKILL_TIMEOUT"
    );
  }

  function buildProviderUnavailableError(args: {
    traceId: string;
    primary: ProviderConfig;
    backup: ProviderConfig | null;
  }): Err {
    return ipcError("AI_PROVIDER_UNAVAILABLE", "All AI providers unavailable", {
      traceId: args.traceId,
      primary: args.primary.provider,
      backup: args.backup?.provider ?? null,
    });
  }

  /**
   * Consume one request budget token from the fixed 60s window limiter.
   *
   * Why: P0 baseline requires deterministic quota protection before upstream calls.
   */
  function consumeRateLimitToken(): Err | null {
    const windowStart = now() - 60_000;
    while (
      requestTimestamps.length > 0 &&
      requestTimestamps[0] <= windowStart
    ) {
      requestTimestamps.shift();
    }

    if (requestTimestamps.length >= rateLimitPerMinute) {
      return ipcError("AI_RATE_LIMITED", "AI request rate limited");
    }

    requestTimestamps.push(now());
    return null;
  }

  /**
   * Fetch with P0 network retry and rate-limit baseline.
   *
   * Why: transient transport errors should retry with bounded backoff.
   */
  async function fetchWithPolicy(args: {
    url: string;
    init: RequestInit;
  }): Promise<ServiceResult<Response>> {
    const rateLimited = consumeRateLimitToken();
    if (rateLimited) {
      return rateLimited;
    }

    for (let attempt = 0; ; attempt += 1) {
      try {
        const res = await fetch(args.url, args.init);
        return { ok: true, data: res };
      } catch (error) {
        const signal = args.init.signal as AbortSignal | undefined;
        if (signal?.aborted) {
          return ipcError("TIMEOUT", "AI request timed out");
        }

        if (attempt >= retryBackoffMs.length) {
          return ipcError(
            "LLM_API_ERROR",
            error instanceof Error ? error.message : "AI request failed",
          );
        }

        await sleep(retryBackoffMs[attempt]);
      }
    }
  }

  /**
   * Emit an AI stream event only while the run is still active.
   *
   * Why: cancel/timeout MUST stop further deltas to keep the UI stable.
   */
  function emitIfActive(entry: RunEntry, event: AiStreamEvent): void {
    if (entry.terminal !== null && event.type === "chunk") {
      return;
    }
    entry.emitEvent(event);
  }

  /**
   * Emit a single stream chunk in-order for the given execution.
   */
  function emitChunk(entry: RunEntry, chunk: string): void {
    if (entry.terminal !== null || chunk.length === 0) {
      return;
    }

    const nextOutputLength = entry.outputText.length + chunk.length;
    if (nextOutputLength > maxSkillOutputChars) {
      entry.controller.abort();
      const oversizedError = buildSkillOutputTooLargeError(nextOutputLength);
      setTerminal({
        entry,
        terminal: "error",
        error: oversizedError,
        logEvent: "ai_run_failed",
        errorCode: oversizedError.code,
      });
      return;
    }

    entry.seq += 1;
    entry.outputText = `${entry.outputText}${chunk}`;

    emitIfActive(entry, {
      type: "chunk",
      executionId: entry.executionId,
      runId: entry.runId,
      traceId: entry.traceId,
      seq: entry.seq,
      chunk,
      ts: Date.now(),
    });
  }

  function clearChunkBatchState(entry: RunEntry): void {
    if (entry.chunkFlushTimer !== null) {
      clearTimeout(entry.chunkFlushTimer);
      entry.chunkFlushTimer = null;
    }
    entry.pendingChunkText = "";
    entry.pendingChunkCount = 0;
  }

  function flushPendingChunks(entry: RunEntry): void {
    if (entry.pendingChunkCount === 0) {
      return;
    }

    const batchedChunk = entry.pendingChunkText;
    clearChunkBatchState(entry);
    emitChunk(entry, batchedChunk);
  }

  /**
   * Queue streamed deltas into bounded-size time-window batches.
   *
   * Why: avoid per-token push storms while preserving ordered text output.
   */
  function queueChunk(entry: RunEntry, chunk: string): void {
    if (entry.terminal !== null || chunk.length === 0) {
      return;
    }

    entry.pendingChunkText += chunk;
    entry.pendingChunkCount += 1;

    if (entry.pendingChunkCount >= STREAM_CHUNK_MAX_BATCH_SIZE) {
      flushPendingChunks(entry);
      return;
    }

    if (entry.chunkFlushTimer !== null) {
      return;
    }

    entry.chunkFlushTimer = setTimeout(() => {
      entry.chunkFlushTimer = null;
      flushPendingChunks(entry);
    }, STREAM_CHUNK_BATCH_WINDOW_MS);
  }

  /**
   * Emit the done terminal event once.
   */
  function emitDone(args: {
    entry: RunEntry;
    terminal: AiStreamTerminal;
    error?: IpcError;
    ts?: number;
  }): void {
    const entry = args.entry;
    if (entry.doneEmitted) {
      return;
    }
    entry.doneEmitted = true;

    emitIfActive(entry, {
      type: "done",
      executionId: entry.executionId,
      runId: entry.runId,
      traceId: entry.traceId,
      terminal: args.terminal,
      outputText: entry.outputText,
      ...(args.error ? { error: args.error } : {}),
      ts: args.ts ?? Date.now(),
    });
  }

  function resolveSchedulerTerminal(
    entry: RunEntry,
    terminal: SkillSchedulerTerminal,
  ): void {
    if (entry.schedulerTerminalResolved) {
      return;
    }
    entry.schedulerTerminalResolved = true;
    entry.resolveSchedulerTerminal(terminal);
  }

  /**
   * Mark a run terminal and collapse lifecycle with a single done event.
   */
  function setTerminal(args: {
    entry: RunEntry;
    terminal: AiStreamTerminal;
    logEvent:
      | "ai_run_completed"
      | "ai_run_failed"
      | "ai_run_canceled"
      | "ai_run_timeout";
    errorCode?: IpcErrorCode;
    error?: IpcError;
    ts?: number;
  }): void {
    const entry = args.entry;
    if (entry.terminal === "cancelled" && args.terminal !== "cancelled") {
      return;
    }
    if (entry.terminal !== null && args.terminal !== "cancelled") {
      return;
    }

    entry.terminal = args.terminal;
    clearChunkBatchState(entry);
    emitDone({
      entry,
      terminal: args.terminal,
      error: args.error,
      ts: args.ts,
    });
    deps.logger.info(args.logEvent, {
      runId: entry.runId,
      executionId: entry.executionId,
      code: args.errorCode,
    });
    resolveSchedulerTerminal(
      entry,
      args.terminal === "completed"
        ? "completed"
        : args.terminal === "cancelled"
          ? "cancelled"
          : args.errorCode === "SKILL_TIMEOUT" ||
              args.error?.code === "SKILL_TIMEOUT"
            ? "timeout"
            : "failed",
    );
    cleanupRun(entry.runId);
  }

  /**
   * Cleanup run resources.
   */
  function cleanupRun(runId: string): void {
    const entry = runs.get(runId);
    if (!entry) {
      return;
    }
    if (entry.timeoutTimer) {
      clearTimeout(entry.timeoutTimer);
    }
    if (entry.completionTimer) {
      clearTimeout(entry.completionTimer);
    }
    if (entry.chunkFlushTimer) {
      clearTimeout(entry.chunkFlushTimer);
    }
    runs.delete(runId);
  }

  function normalizeSkillError(error: IpcError): IpcError {
    if (error.code !== "TIMEOUT") {
      return error;
    }
    return {
      ...error,
      code: "SKILL_TIMEOUT",
      message: "Skill execution timed out",
    };
  }

  function buildSkillOutputTooLargeError(actualChars: number): IpcError {
    return {
      code: "IPC_PAYLOAD_TOO_LARGE",
      message: "Skill output too large",
      details: {
        maxChars: maxSkillOutputChars,
        actualChars,
      },
    };
  }

  /**
   * Reset stream sequence/output before replaying the full prompt.
   */
  function resetForFullPromptReplay(entry: RunEntry): void {
    entry.seq = 0;
    entry.outputText = "";
    clearChunkBatchState(entry);
  }

  /**
   * Identify replayable stream disconnect errors.
   */
  function isReplayableStreamDisconnect(error: IpcError): boolean {
    const details = asObject(error.details);
    return (
      error.code === "LLM_API_ERROR" &&
      details?.reason === "STREAM_DISCONNECTED"
    );
  }

  /**
   * Execute a non-stream OpenAI-compatible request.
   */
  async function runOpenAiNonStream(args: {
    entry: RunEntry;
    cfg: ProviderConfig;
    runtimeMessages: RuntimeMessages;
    model: string;
  }): Promise<ServiceResult<string>> {
    const url = buildApiUrl({
      baseUrl: args.cfg.baseUrl,
      endpointPath: "/v1/chat/completions",
    });

    const fetchRes = await fetchWithPolicy({
      url,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(args.cfg.apiKey
            ? { Authorization: `Bearer ${args.cfg.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: args.model,
          messages: args.runtimeMessages.openAiMessages,
          stream: false,
        }),
        signal: args.entry.controller.signal,
      },
    });
    if (!fetchRes.ok) {
      return fetchRes;
    }
    const res = fetchRes.data;

    if (!res.ok) {
      const mapped = await buildUpstreamHttpError({
        res,
        fallbackMessage: "AI upstream request failed",
      });
      return {
        ok: false,
        error: mapped,
      };
    }

    const jsonRes = await parseJsonResponse(res);
    if (!jsonRes.ok) {
      return jsonRes;
    }
    const json = jsonRes.data;
    const text = extractOpenAiText(json);
    if (typeof text !== "string") {
      return ipcError("INTERNAL", "Invalid OpenAI response shape");
    }
    return { ok: true, data: text };
  }

  /**
   * Execute a non-stream Anthropic request.
   */
  async function runAnthropicNonStream(args: {
    entry: RunEntry;
    cfg: ProviderConfig;
    runtimeMessages: RuntimeMessages;
    model: string;
  }): Promise<ServiceResult<string>> {
    const url = buildApiUrl({
      baseUrl: args.cfg.baseUrl,
      endpointPath: "/v1/messages",
    });

    const fetchRes = await fetchWithPolicy({
      url,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          ...(args.cfg.apiKey ? { "x-api-key": args.cfg.apiKey } : {}),
        },
        body: JSON.stringify({
          model: args.model,
          max_tokens: 256,
          system: args.runtimeMessages.systemText,
          messages: args.runtimeMessages.anthropicMessages,
          stream: false,
        }),
        signal: args.entry.controller.signal,
      },
    });
    if (!fetchRes.ok) {
      return fetchRes;
    }
    const res = fetchRes.data;

    if (!res.ok) {
      const mapped = await buildUpstreamHttpError({
        res,
        fallbackMessage: "AI upstream request failed",
      });
      return {
        ok: false,
        error: mapped,
      };
    }

    const jsonRes = await parseJsonResponse(res);
    if (!jsonRes.ok) {
      return jsonRes;
    }
    const json = jsonRes.data;
    const text = extractAnthropicText(json);
    if (typeof text !== "string") {
      return ipcError("INTERNAL", "Invalid Anthropic response shape");
    }
    return { ok: true, data: text };
  }

  /**
   * Execute a streaming OpenAI-compatible request and emit delta events.
   */
  async function runOpenAiStream(args: {
    entry: RunEntry;
    cfg: ProviderConfig;
    runtimeMessages: RuntimeMessages;
    model: string;
  }): Promise<ServiceResult<true>> {
    const url = buildApiUrl({
      baseUrl: args.cfg.baseUrl,
      endpointPath: "/v1/chat/completions",
    });

    const fetchRes = await fetchWithPolicy({
      url,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(args.cfg.apiKey
            ? { Authorization: `Bearer ${args.cfg.apiKey}` }
            : {}),
        },
        body: JSON.stringify({
          model: args.model,
          messages: args.runtimeMessages.openAiMessages,
          stream: true,
        }),
        signal: args.entry.controller.signal,
      },
    });
    if (!fetchRes.ok) {
      return fetchRes;
    }
    const res = fetchRes.data;

    if (!res.ok) {
      const mapped = await buildUpstreamHttpError({
        res,
        fallbackMessage: "AI upstream request failed",
      });
      return {
        ok: false,
        error: mapped,
      };
    }

    if (!res.body) {
      return ipcError("INTERNAL", "Missing streaming response body");
    }

    let sawDone = false;
    try {
      for await (const msg of readSse({ body: res.body })) {
        if (args.entry.terminal !== null) {
          break;
        }
        if (msg.data === "[DONE]") {
          sawDone = true;
          break;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(msg.data);
        } catch {
          continue;
        }
        const delta = extractOpenAiDelta(parsed);
        if (typeof delta !== "string" || delta.length === 0) {
          continue;
        }

        queueChunk(args.entry, delta);
      }
    } catch (error) {
      if (args.entry.controller.signal.aborted) {
        return ipcError("CANCELED", "AI request canceled");
      }
      return ipcError("LLM_API_ERROR", "Streaming connection interrupted", {
        reason: "STREAM_DISCONNECTED",
        retryable: true,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (args.entry.controller.signal.aborted) {
      return ipcError("CANCELED", "AI request canceled");
    }
    if (args.entry.terminal === null && !sawDone) {
      return ipcError("LLM_API_ERROR", "Streaming connection interrupted", {
        reason: "STREAM_DISCONNECTED",
        retryable: true,
      });
    }

    return { ok: true, data: true };
  }

  /**
   * Execute a streaming Anthropic request and emit delta events.
   */
  async function runAnthropicStream(args: {
    entry: RunEntry;
    cfg: ProviderConfig;
    runtimeMessages: RuntimeMessages;
    model: string;
  }): Promise<ServiceResult<true>> {
    const url = buildApiUrl({
      baseUrl: args.cfg.baseUrl,
      endpointPath: "/v1/messages",
    });

    const fetchRes = await fetchWithPolicy({
      url,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
          ...(args.cfg.apiKey ? { "x-api-key": args.cfg.apiKey } : {}),
        },
        body: JSON.stringify({
          model: args.model,
          max_tokens: 256,
          system: args.runtimeMessages.systemText,
          messages: args.runtimeMessages.anthropicMessages,
          stream: true,
        }),
        signal: args.entry.controller.signal,
      },
    });
    if (!fetchRes.ok) {
      return fetchRes;
    }
    const res = fetchRes.data;

    if (!res.ok) {
      const mapped = await buildUpstreamHttpError({
        res,
        fallbackMessage: "AI upstream request failed",
      });
      return {
        ok: false,
        error: mapped,
      };
    }

    if (!res.body) {
      return ipcError("INTERNAL", "Missing streaming response body");
    }

    let sawMessageStop = false;
    try {
      for await (const msg of readSse({ body: res.body })) {
        if (args.entry.terminal !== null) {
          break;
        }

        if (msg.event === "message_stop") {
          sawMessageStop = true;
          break;
        }

        if (msg.event !== "content_block_delta") {
          continue;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(msg.data);
        } catch {
          continue;
        }
        const delta = extractAnthropicDelta(parsed);
        if (typeof delta !== "string" || delta.length === 0) {
          continue;
        }

        queueChunk(args.entry, delta);
      }
    } catch (error) {
      if (args.entry.controller.signal.aborted) {
        return ipcError("CANCELED", "AI request canceled");
      }
      return ipcError("LLM_API_ERROR", "Streaming connection interrupted", {
        reason: "STREAM_DISCONNECTED",
        retryable: true,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (args.entry.controller.signal.aborted) {
      return ipcError("CANCELED", "AI request canceled");
    }
    if (args.entry.terminal === null && !sawMessageStop) {
      return ipcError("LLM_API_ERROR", "Streaming connection interrupted", {
        reason: "STREAM_DISCONNECTED",
        retryable: true,
      });
    }

    return { ok: true, data: true };
  }

  async function runNonStreamWithProvider(args: {
    entry: RunEntry;
    cfg: ProviderConfig;
    runtimeMessages: RuntimeMessages;
    model: string;
  }): Promise<ServiceResult<string>> {
    if (args.cfg.provider === "anthropic") {
      return await runAnthropicNonStream(args);
    }
    return await runOpenAiNonStream(args);
  }

  async function runNonStreamWithFailover(args: {
    entry: RunEntry;
    primary: ProviderConfig;
    backup: ProviderConfig | null;
    runtimeMessages: RuntimeMessages;
    model: string;
  }): Promise<ServiceResult<string>> {
    const primaryState = providerResolver.getProviderHealthState(args.primary);
    const canHalfOpenProbe =
      primaryState.status === "degraded" &&
      primaryState.degradedAtMs !== null &&
      now() - primaryState.degradedAtMs >= PROVIDER_HALF_OPEN_AFTER_MS;

    if (
      primaryState.status === "degraded" &&
      !canHalfOpenProbe &&
      args.backup !== null
    ) {
      deps.logger.info("ai_provider_failover", {
        traceId: args.entry.traceId,
        from: args.primary.provider,
        to: args.backup.provider,
        reason: "primary_degraded",
      });
      const backupRes = await runNonStreamWithProvider({
        ...args,
        cfg: args.backup,
      });
      if (backupRes.ok) {
        return backupRes;
      }
      if (isProviderAvailabilityError(backupRes.error)) {
        return buildProviderUnavailableError({
          traceId: args.entry.traceId,
          primary: args.primary,
          backup: args.backup,
        });
      }
      return backupRes;
    }

    if (canHalfOpenProbe) {
      deps.logger.info("ai_provider_half_open_probe", {
        traceId: args.entry.traceId,
        provider: args.primary.provider,
      });
    }

    const primaryRes = await runNonStreamWithProvider({
      ...args,
      cfg: args.primary,
    });
    if (primaryRes.ok) {
      providerResolver.markProviderSuccess({
        cfg: args.primary,
        traceId: args.entry.traceId,
        fromHalfOpen: canHalfOpenProbe,
      });
      return primaryRes;
    }

    if (!isProviderAvailabilityError(primaryRes.error)) {
      return primaryRes;
    }

    const state = providerResolver.markProviderFailure({
      cfg: args.primary,
      traceId: args.entry.traceId,
      reason: primaryRes.error.code,
    });

    if (state.status !== "degraded") {
      if (args.backup !== null) {
        return buildProviderUnavailableError({
          traceId: args.entry.traceId,
          primary: args.primary,
          backup: args.backup,
        });
      }
      return primaryRes;
    }

    if (args.backup === null) {
      return primaryRes;
    }

    deps.logger.info("ai_provider_failover", {
      traceId: args.entry.traceId,
      from: args.primary.provider,
      to: args.backup.provider,
      reason: canHalfOpenProbe
        ? "half_open_probe_failed"
        : "primary_unavailable",
    });

    const backupRes = await runNonStreamWithProvider({
      ...args,
      cfg: args.backup,
    });
    if (backupRes.ok) {
      return backupRes;
    }
    if (isProviderAvailabilityError(backupRes.error)) {
      return buildProviderUnavailableError({
        traceId: args.entry.traceId,
        primary: args.primary,
        backup: args.backup,
      });
    }

    return backupRes;
  }

  const runSkill: AiService["runSkill"] = async (args) => {
    const cfgRes = await providerResolver.resolveProviderConfig({
      env: deps.env,
      runtimeAiTimeoutMs: runtimeGovernance.ai.timeoutMs,
      getFakeServer,
      getProxySettings: deps.getProxySettings,
    });
    if (!cfgRes.ok) {
      if (cfgRes.error.code === "AI_NOT_CONFIGURED") {
        return ipcError(
          "AI_PROVIDER_UNAVAILABLE",
          "请先在设置中配置 AI 服务",
          cfgRes.error.details,
        );
      }
      return cfgRes;
    }
    const primaryCfg = cfgRes.data.primary;
    const backupCfg = cfgRes.data.backup;

    const runId = randomUUID();
    const executionId = runId;
    const traceId = randomUUID();
    const controller = new AbortController();
    const sessionKey = resolveSessionKey(args.context);
    const chatMessageManager = getChatMessageManager(sessionKey);
    const history = chatMessageManager.getMessages().map((message) => ({
      role: message.role,
      content: message.content,
    }));
    const runtimeMessages = buildRuntimeMessages({
      systemPrompt: args.systemPrompt,
      mode: args.mode,
      system: args.system,
      input: args.input,
      history,
    });
    const promptTokens = estimateTokenCount(args.input);
    const projectedTokens = promptTokens + DEFAULT_REQUEST_MAX_TOKENS_ESTIMATE;
    const hasExplicitEnvTimeout =
      (typeof deps.env.CN_AI_TIMEOUT_MS === "string" &&
        deps.env.CN_AI_TIMEOUT_MS.trim().length > 0) ||
      (typeof deps.env.CREONOW_AI_TIMEOUT_MS === "string" &&
        deps.env.CREONOW_AI_TIMEOUT_MS.trim().length > 0);
    const skillTimeoutMs = resolveSkillTimeoutMs({
      timeoutMs: args.timeoutMs,
      fallbackEnvTimeoutMs: hasExplicitEnvTimeout
        ? primaryCfg.timeoutMs
        : undefined,
    });
    let resolveCompletion: (terminal: SkillSchedulerTerminal) => void = () =>
      undefined;
    const completionPromise = new Promise<SkillSchedulerTerminal>((resolve) => {
      resolveCompletion = resolve;
    });
    const entry: RunEntry = {
      executionId,
      runId,
      traceId,
      controller,
      timeoutTimer: null,
      completionTimer: null,
      chunkFlushTimer: null,
      pendingChunkText: "",
      pendingChunkCount: 0,
      stream: args.stream,
      startedAt: args.ts,
      terminal: null,
      doneEmitted: false,
      schedulerTerminalResolved: false,
      resolveSchedulerTerminal: resolveCompletion,
      seq: 0,
      outputText: "",
      emitEvent: args.emitEvent,
    };
    runs.set(runId, entry);

    deps.logger.info("ai_run_started", {
      runId,
      executionId,
      traceId,
      provider: primaryCfg.provider,
      stream: args.stream,
      timeoutMs: skillTimeoutMs,
    });

    const consumeSessionTokenBudget = (): Err | null => {
      const currentTotal = sessionTokenTotalsByKey.get(sessionKey) ?? 0;
      if (currentTotal + projectedTokens > sessionTokenBudget) {
        return ipcError(
          "AI_SESSION_TOKEN_BUDGET_EXCEEDED",
          "AI session token budget exceeded",
          {
            traceId,
            sessionKey,
            sessionTokenBudget,
            currentTotal,
            projectedTokens,
          },
        );
      }
      return null;
    };

    const persistSuccessfulTurn = (assistantOutput: string): void => {
      const baseTs = now();
      chatMessageManager.add({
        id: randomUUID(),
        role: "user",
        content: args.input,
        timestamp: baseTs,
        skillId: args.skillId,
        metadata: {
          tokenCount: promptTokens,
          model: args.model,
        },
      });
      chatMessageManager.add({
        id: randomUUID(),
        role: "assistant",
        content: assistantOutput,
        timestamp: baseTs + 1,
        skillId: args.skillId,
        metadata: {
          tokenCount: estimateTokenCount(assistantOutput),
          model: args.model,
        },
      });
    };

    const persistTraceAndGetDegradation = (
      assistantOutput: string,
    ): TracePersistenceDegradation | undefined => {
      if (!deps.traceStore) {
        return undefined;
      }

      const persisted = deps.traceStore.persistGenerationTrace({
        traceId,
        runId,
        executionId,
        skillId: args.skillId,
        mode: args.mode,
        model: args.model,
        inputText: args.input,
        outputText: assistantOutput,
        context: args.context,
        startedAt: entry.startedAt,
        completedAt: now(),
      });

      if (persisted.ok) {
        return undefined;
      }

      const degradation: TracePersistenceDegradation = {
        code: "TRACE_PERSISTENCE_DEGRADED",
        message: "Trace persistence failed",
        runId,
        traceId,
        cause: {
          code: persisted.error.code,
          message: persisted.error.message,
        },
      };

      deps.logger.error("ai_trace_persistence_degraded", {
        code: degradation.code,
        runId: degradation.runId,
        traceId: degradation.traceId,
        causeCode: degradation.cause.code,
        causeMessage: degradation.cause.message,
      });

      return degradation;
    };

    function armSkillTimeout(): void {
      if (entry.timeoutTimer) {
        clearTimeout(entry.timeoutTimer);
      }
      entry.timeoutTimer = setTimeout(() => {
        if (entry.terminal !== null) {
          return;
        }
        controller.abort();

        setTerminal({
          entry,
          terminal: "error",
          error: {
            code: "SKILL_TIMEOUT",
            message: "Skill execution timed out",
          },
          logEvent: "ai_run_timeout",
          errorCode: "SKILL_TIMEOUT",
        });
      }, skillTimeoutMs);
    }

    const executeNonStream = async (): Promise<
      ServiceResult<{
        executionId: string;
        runId: string;
        traceId: string;
        outputText?: string;
        degradation?: TracePersistenceDegradation;
      }>
    > => {
      try {
        const budgetExceeded = consumeSessionTokenBudget();
        if (budgetExceeded) {
          setTerminal({
            entry,
            terminal: "error",
            error: budgetExceeded.error,
            logEvent: "ai_run_failed",
            errorCode: budgetExceeded.error.code,
          });
          return budgetExceeded;
        }

        const currentTotal = sessionTokenTotalsByKey.get(sessionKey) ?? 0;
        const res = await runNonStreamWithFailover({
          entry,
          primary: primaryCfg,
          backup: backupCfg,
          runtimeMessages,
          model: args.model,
        });

        if (!res.ok) {
          const normalizedError = normalizeSkillError(res.error);
          setTerminal({
            entry,
            terminal: "error",
            error: normalizedError,
            logEvent: "ai_run_failed",
            errorCode: normalizedError.code,
          });
          return { ok: false, error: normalizedError };
        }

        if (res.data.length > maxSkillOutputChars) {
          const oversizedError = buildSkillOutputTooLargeError(res.data.length);
          setTerminal({
            entry,
            terminal: "error",
            error: oversizedError,
            logEvent: "ai_run_failed",
            errorCode: oversizedError.code,
          });
          return { ok: false, error: oversizedError };
        }

        entry.outputText = res.data;
        const completionTokens = estimateTokenCount(res.data);
        sessionTokenTotalsByKey.set(
          sessionKey,
          currentTotal + promptTokens + completionTokens,
        );
        persistSuccessfulTurn(res.data);
        const degradation = persistTraceAndGetDegradation(res.data);

        setTerminal({
          entry,
          terminal: "completed",
          logEvent: "ai_run_completed",
        });
        return {
          ok: true,
          data: {
            executionId,
            runId,
            traceId,
            outputText: res.data,
            ...(degradation ? { degradation } : {}),
          },
        };
      } catch (error) {
        const aborted = controller.signal.aborted;
        if (aborted) {
          if (entry.terminal === "error") {
            return ipcError("SKILL_TIMEOUT", "Skill execution timed out");
          }
          setTerminal({
            entry,
            terminal: "cancelled",
            logEvent: "ai_run_canceled",
            errorCode: "CANCELED",
          });
          return ipcError("CANCELED", "AI request canceled");
        }

        setTerminal({
          entry,
          terminal: "error",
          error: {
            code: "INTERNAL",
            message: "AI request failed",
            details: {
              message: error instanceof Error ? error.message : String(error),
            },
          },
          logEvent: "ai_run_failed",
          errorCode: "INTERNAL",
        });
        return ipcError("INTERNAL", "AI request failed");
      } finally {
        cleanupRun(runId);
      }
    };

    const scheduled = await skillScheduler.schedule({
      sessionKey,
      executionId,
      runId,
      traceId,
      onQueueEvent: (queueState) => {
        args.emitEvent({
          type: "queue",
          executionId,
          runId,
          traceId,
          status: queueState.status,
          queuePosition: queueState.queuePosition,
          queued: queueState.queued,
          globalRunning: queueState.globalRunning,
          ts: now(),
        });
      },
      start: () => {
        armSkillTimeout();
        if (args.stream) {
          const budgetExceeded = consumeSessionTokenBudget();
          if (budgetExceeded) {
            setTerminal({
              entry,
              terminal: "error",
              error: budgetExceeded.error,
              logEvent: "ai_run_failed",
              errorCode: budgetExceeded.error.code,
            });
            return {
              response: Promise.resolve(
                budgetExceeded as ServiceResult<{
                  executionId: string;
                  runId: string;
                  traceId: string;
                  outputText?: string;
                  degradation?: TracePersistenceDegradation;
                }>,
              ),
              completion: completionPromise,
            };
          }

          void (async () => {
            try {
              let replayAttempts = 0;
              for (;;) {
                const res =
                  primaryCfg.provider === "anthropic"
                    ? await runAnthropicStream({
                        entry,
                        cfg: primaryCfg,
                        runtimeMessages,
                        model: args.model,
                      })
                    : await runOpenAiStream({
                        entry,
                        cfg: primaryCfg,
                        runtimeMessages,
                        model: args.model,
                      });

                if (res.ok) {
                  break;
                }

                if (entry.terminal !== null) {
                  return;
                }

                const normalizedError = normalizeSkillError(res.error);
                if (
                  !isReplayableStreamDisconnect(normalizedError) ||
                  replayAttempts >= 1
                ) {
                  setTerminal({
                    entry,
                    terminal:
                      normalizedError.code === "CANCELED"
                        ? "cancelled"
                        : "error",
                    error: normalizedError,
                    logEvent:
                      normalizedError.code === "SKILL_TIMEOUT"
                        ? "ai_run_timeout"
                        : normalizedError.code === "CANCELED"
                          ? "ai_run_canceled"
                          : "ai_run_failed",
                    errorCode: normalizedError.code,
                  });
                  return;
                }

                replayAttempts += 1;
                resetForFullPromptReplay(entry);
                deps.logger.info("ai_stream_replay_retry", {
                  runId,
                  executionId,
                  traceId,
                  attempt: replayAttempts,
                });

                const waitMs =
                  retryBackoffMs[
                    Math.min(replayAttempts - 1, retryBackoffMs.length - 1)
                  ] ?? 0;
                if (waitMs > 0) {
                  await sleep(waitMs);
                }
              }

              if (entry.terminal !== null) {
                return;
              }

              flushPendingChunks(entry);
              if (entry.terminal !== null) {
                return;
              }

              if (entry.completionTimer !== null) {
                return;
              }

              // Completion is deferred one tick so a near-simultaneous cancel can win.
              entry.completionTimer = setTimeout(() => {
                entry.completionTimer = null;
                if (entry.terminal !== null) {
                  return;
                }

                const currentTotal =
                  sessionTokenTotalsByKey.get(sessionKey) ?? 0;
                const completionTokens = estimateTokenCount(entry.outputText);
                sessionTokenTotalsByKey.set(
                  sessionKey,
                  currentTotal + promptTokens + completionTokens,
                );
                persistSuccessfulTurn(entry.outputText);
                persistTraceAndGetDegradation(entry.outputText);

                setTerminal({
                  entry,
                  terminal: "completed",
                  logEvent: "ai_run_completed",
                });
              }, STREAM_COMPLETION_SETTLE_DELAY_MS);
            } catch (error) {
              if (entry.terminal !== null) {
                return;
              }

              const aborted = controller.signal.aborted;
              if (aborted) {
                setTerminal({
                  entry,
                  terminal: "cancelled",
                  logEvent: "ai_run_canceled",
                  errorCode: "CANCELED",
                });
                return;
              }

              setTerminal({
                entry,
                terminal: "error",
                error: {
                  code: "INTERNAL",
                  message: "AI request failed",
                  details: {
                    message:
                      error instanceof Error ? error.message : String(error),
                  },
                },
                logEvent: "ai_run_failed",
                errorCode: "INTERNAL",
              });
            }
          })();

          return {
            response: Promise.resolve({
              ok: true,
              data: { executionId, runId, traceId },
            }),
            completion: completionPromise,
          };
        }

        return {
          response: executeNonStream(),
          completion: completionPromise,
        };
      },
    });

    if (!scheduled.ok) {
      resolveSchedulerTerminal(entry, "failed");
      cleanupRun(runId);
      return scheduled;
    }

    return scheduled;
  };

  const listModels: AiService["listModels"] = async () => {
    const cfgRes = await providerResolver.resolveProviderConfig({
      env: deps.env,
      runtimeAiTimeoutMs: runtimeGovernance.ai.timeoutMs,
      getFakeServer,
      getProxySettings: deps.getProxySettings,
    });
    if (!cfgRes.ok) {
      return cfgRes;
    }

    const cfg = cfgRes.data.primary;
    const provider = cfg.provider;
    const providerName = providerDisplayName(provider);

    const url = buildApiUrl({
      baseUrl: cfg.baseUrl,
      endpointPath: "/v1/models",
    });
    const fetchRes = await fetchWithPolicy({
      url,
      init: {
        method: "GET",
        headers: {
          ...(cfg.apiKey
            ? provider === "anthropic"
              ? {
                  "x-api-key": cfg.apiKey,
                  "anthropic-version": "2023-06-01",
                }
              : { Authorization: `Bearer ${cfg.apiKey}` }
            : {}),
        },
      },
    });
    if (!fetchRes.ok) {
      return fetchRes;
    }
    const res = fetchRes.data;

    if (!res.ok) {
      const mapped = await buildUpstreamHttpError({
        res,
        fallbackMessage: "AI model catalog request failed",
      });
      return {
        ok: false,
        error: mapped,
      };
    }

    const jsonRes = await parseJsonResponse(res);
    if (!jsonRes.ok) {
      return jsonRes;
    }
    const json = jsonRes.data;
    const items = extractOpenAiModels(json).map((item) => ({
      id: item.id,
      name: item.name,
      provider: providerName,
    }));

    return {
      ok: true,
      data: {
        source: provider,
        items,
      },
    };
  };
  const cancel: AiService["cancel"] = (args) => {
    const executionId = (args.executionId ?? args.runId ?? "").trim();
    if (executionId.length === 0) {
      return ipcError("INVALID_ARGUMENT", "executionId is required");
    }

    const entry = runs.get(executionId);
    if (!entry) {
      return { ok: true, data: { canceled: true } };
    }

    if (entry.terminal !== null) {
      return { ok: true, data: { canceled: true } };
    }

    entry.controller.abort();
    setTerminal({
      entry,
      terminal: "cancelled",
      logEvent: "ai_run_canceled",
      errorCode: "CANCELED",
      ts: args.ts,
    });

    return { ok: true, data: { canceled: true } };
  };

  const feedback: AiService["feedback"] = (args) => {
    if (deps.traceStore) {
      const persisted = deps.traceStore.recordTraceFeedback({
        runId: args.runId,
        action: args.action,
        evidenceRef: args.evidenceRef,
        ts: args.ts,
      });
      if (!persisted.ok) {
        deps.logger.error("ai_trace_feedback_persist_failed", {
          runId: args.runId,
          action: args.action,
          code: persisted.error.code,
          message: persisted.error.message,
        });
        return persisted;
      }
    }

    deps.logger.info("ai_feedback_received", {
      runId: args.runId,
      action: args.action,
      evidenceRefLen: args.evidenceRef.trim().length,
    });
    return { ok: true, data: { recorded: true } };
  };

  return { runSkill, listModels, cancel, feedback };
}
