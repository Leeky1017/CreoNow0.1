import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import {
  KG_SUGGESTION_CHANNEL,
  type KgSuggestionEntityType,
  type KgSuggestionEvent,
} from "@shared/types/kg";
import type { IpcErrorCode } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import {
  createKnowledgeGraphService,
  type KnowledgeEntity,
  type KnowledgeEntityType,
  type ServiceResult,
} from "./kgService";

type RecognitionCandidate = {
  name: string;
  type: KnowledgeEntityType;
};

type RecognitionResult = {
  candidates: RecognitionCandidate[];
};

type RecognitionTask = {
  taskId: string;
  projectId: string;
  documentId: string;
  sessionId: string;
  contentText: string;
  traceId: string;
  sender: Electron.WebContents | null;
  canceled: boolean;
};

type RecognitionSessionState = {
  dismissedKeys: Set<string>;
  suggestions: Map<string, StoredSuggestion>;
};

type StoredSuggestion = {
  taskId: string;
  suggestionId: string;
  projectId: string;
  documentId: string;
  sessionId: string;
  traceId: string;
  name: string;
  type: KnowledgeEntityType;
  dedupeKey: string;
  createdAt: string;
};

type RecognitionMetrics = {
  succeeded: number;
  failed: number;
  completed: number;
  peakRunning: number;
  completionOrder: string[];
  canceledTaskIds: string[];
};

type Recognizer = {
  recognize: (args: {
    projectId: string;
    documentId: string;
    sessionId: string;
    contentText: string;
    traceId: string;
  }) => Promise<ServiceResult<RecognitionResult>>;
};

export type RecognitionEnqueueResult = {
  taskId: string | null;
  status: "started" | "queued" | "skipped";
  queuePosition: number;
};

export type RecognitionStatsResult = {
  running: number;
  queued: number;
  maxConcurrency: number;
  peakRunning: number;
  completed: number;
  completionOrder: string[];
  canceledTaskIds: string[];
};

export type KgRecognitionRuntime = {
  enqueue: (args: {
    projectId: string;
    documentId: string;
    sessionId: string;
    contentText: string;
    traceId: string;
    sender: Electron.WebContents | null;
  }) => ServiceResult<RecognitionEnqueueResult>;
  cancel: (args: {
    projectId: string;
    sessionId: string;
    taskId: string;
  }) => ServiceResult<{ canceled: true }>;
  acceptSuggestion: (args: {
    projectId: string;
    sessionId: string;
    suggestionId: string;
  }) => ServiceResult<KnowledgeEntity>;
  dismissSuggestion: (args: {
    projectId: string;
    sessionId: string;
    suggestionId: string;
  }) => ServiceResult<{ dismissed: true }>;
  stats: (args: {
    projectId: string;
    sessionId: string;
  }) => ServiceResult<RecognitionStatsResult>;
};

function toErr<T>(
  code: IpcErrorCode,
  message: string,
  details?: unknown,
): ServiceResult<T> {
  return {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };
}

function normalizeSuggestionKey(args: {
  name: string;
  type: KnowledgeEntityType;
}): string {
  return `${args.type}:${args.name.trim().toLowerCase()}`;
}

function inferSuggestionType(name: string): KnowledgeEntityType {
  if (/(仓库|城|镇|村|山|馆|楼)$/u.test(name)) {
    return "location";
  }
  return "character";
}

function normalizeCharacterName(rawName: string): string {
  const trimmed = rawName.trim();
  const stopCharIndex = trimmed.search(/[的在了和与并第]/u);
  if (stopCharIndex <= 0) {
    return trimmed;
  }
  return trimmed.slice(0, stopCharIndex).trim();
}

async function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return;
  }
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Create a deterministic mock recognizer for KG suggestions.
 *
 * Why: tests must avoid real LLM calls while still exercising async recognition
 * and failure/degrade paths.
 */
function createMockRecognizer(): Recognizer {
  return {
    recognize: async ({ contentText }) => {
      if (process.env.CREONOW_KG_RECOGNITION_FORCE_UNAVAILABLE === "1") {
        return toErr(
          "KG_RECOGNITION_UNAVAILABLE",
          "recognition service unavailable",
        );
      }

      const delayMs = Number.parseInt(
        process.env.CREONOW_KG_RECOGNITION_MOCK_DELAY_MS ?? "0",
        10,
      );
      if (Number.isFinite(delayMs) && delayMs > 0) {
        await sleep(delayMs);
      }

      const candidates = new Map<string, RecognitionCandidate>();

      const quotedPattern = /「([^」]{2,32})」/gu;
      for (const match of contentText.matchAll(quotedPattern)) {
        const rawName = match[1]?.trim() ?? "";
        if (rawName.length === 0) {
          continue;
        }
        const type = inferSuggestionType(rawName);
        candidates.set(normalizeSuggestionKey({ name: rawName, type }), {
          name: rawName,
          type,
        });
      }

      const characterPattern = /林[\u4e00-\u9fa5]{1,3}/gu;
      for (const match of contentText.matchAll(characterPattern)) {
        const rawName = match[0]?.trim() ?? "";
        const normalizedName = normalizeCharacterName(rawName);
        if (normalizedName.length < 2) {
          continue;
        }
        const type: KnowledgeEntityType = "character";
        candidates.set(normalizeSuggestionKey({ name: normalizedName, type }), {
          name: normalizedName,
          type,
        });
      }

      const locationPattern = /[\u4e00-\u9fa5]{1,16}(仓库|城|镇|村|山|馆|楼)/gu;
      for (const match of contentText.matchAll(locationPattern)) {
        const rawName = match[0]?.trim() ?? "";
        if (rawName.length === 0) {
          continue;
        }
        const type: KnowledgeEntityType = "location";
        candidates.set(normalizeSuggestionKey({ name: rawName, type }), {
          name: rawName,
          type,
        });
      }

      const orderedCandidates = [...candidates.values()].sort((a, b) => {
        if (b.name.length !== a.name.length) {
          return b.name.length - a.name.length;
        }
        return a.name.localeCompare(b.name);
      });

      return {
        ok: true,
        data: {
          candidates: orderedCandidates,
        },
      };
    },
  };
}

function createSuggestionOps(ctx: {
  sessions: Map<string, RecognitionSessionState>;
  kgService: ReturnType<typeof createKnowledgeGraphService>;
}): Pick<
  KgRecognitionRuntime,
  "acceptSuggestion" | "dismissSuggestion"
> {
  function getSession(sessionId: string): RecognitionSessionState {
    const existing = ctx.sessions.get(sessionId);
    if (existing) {
      return existing;
    }
    const created: RecognitionSessionState = {
      dismissedKeys: new Set<string>(),
      suggestions: new Map<string, StoredSuggestion>(),
    };
    ctx.sessions.set(sessionId, created);
    return created;
  }

  return {
    acceptSuggestion: ({ projectId, sessionId, suggestionId }) => {
      const normalizedProjectId = projectId.trim();
      const normalizedSessionId = sessionId.trim();
      const normalizedSuggestionId = suggestionId.trim();
      if (
        normalizedProjectId.length === 0 ||
        normalizedSessionId.length === 0 ||
        normalizedSuggestionId.length === 0
      ) {
        return toErr(
          "INVALID_ARGUMENT",
          "projectId/sessionId/suggestionId is required",
        );
      }

      const sessionState = getSession(normalizedSessionId);
      const suggestion = sessionState.suggestions.get(normalizedSuggestionId);
      if (
        !suggestion ||
        suggestion.projectId !== normalizedProjectId ||
        suggestion.sessionId !== normalizedSessionId
      ) {
        return toErr("NOT_FOUND", "suggestion not found");
      }

      const createRes = ctx.kgService.entityCreate({
        projectId: normalizedProjectId,
        type: suggestion.type,
        name: suggestion.name,
      });

      if (!createRes.ok && createRes.error.code !== "KG_ENTITY_DUPLICATE") {
        return createRes;
      }

      if (createRes.ok) {
        sessionState.suggestions.delete(normalizedSuggestionId);
        return createRes;
      }

      const existingRes = ctx.kgService.entityList({
        projectId: normalizedProjectId,
      });
      if (!existingRes.ok) {
        return existingRes;
      }

      const existingEntity = existingRes.data.items.find(
        (entity) =>
          entity.type === suggestion.type &&
          entity.name.trim().toLowerCase() ===
            suggestion.name.trim().toLowerCase(),
      );
      if (!existingEntity) {
        return toErr("DB_ERROR", "failed to resolve duplicated entity");
      }

      sessionState.suggestions.delete(normalizedSuggestionId);
      return { ok: true, data: existingEntity };
    },

    dismissSuggestion: ({ projectId, sessionId, suggestionId }) => {
      const normalizedProjectId = projectId.trim();
      const normalizedSessionId = sessionId.trim();
      const normalizedSuggestionId = suggestionId.trim();
      if (
        normalizedProjectId.length === 0 ||
        normalizedSessionId.length === 0 ||
        normalizedSuggestionId.length === 0
      ) {
        return toErr(
          "INVALID_ARGUMENT",
          "projectId/sessionId/suggestionId is required",
        );
      }

      const sessionState = getSession(normalizedSessionId);
      const suggestion = sessionState.suggestions.get(normalizedSuggestionId);
      if (
        !suggestion ||
        suggestion.projectId !== normalizedProjectId ||
        suggestion.sessionId !== normalizedSessionId
      ) {
        return toErr("NOT_FOUND", "suggestion not found");
      }

      sessionState.dismissedKeys.add(suggestion.dedupeKey);
      sessionState.suggestions.delete(normalizedSuggestionId);
      return { ok: true, data: { dismissed: true } };
    },
  };
}

function buildRuntimeStats(
  running: Map<string, unknown>,
  queue: unknown[],
  maxConcurrency: number,
  metrics: {
    peakRunning: number;
    completed: number;
    completionOrder: string[];
    canceledTaskIds: string[];
  },
) {
  return {
    running: running.size,
    queued: queue.length,
    maxConcurrency,
    peakRunning: metrics.peakRunning,
    completed: metrics.completed,
    completionOrder: [...metrics.completionOrder],
    canceledTaskIds: [...metrics.canceledTaskIds],
  };
}

/**
 * Create queue-backed KG recognition runtime.
 *
 * Why: autosave-triggered recognition must remain async/non-blocking and enforce
 * max-concurrency=4 with queue + cancellation semantics.
 */
export function createKgRecognitionRuntime(args: {
  db: Database.Database;
  logger: Logger;
  recognizer?: Recognizer;
  maxConcurrency?: number;
}): KgRecognitionRuntime {
  const recognizer = args.recognizer ?? createMockRecognizer();
  const maxConcurrency = Math.max(1, Math.floor(args.maxConcurrency ?? 4));

  const queue: RecognitionTask[] = [];
  const running = new Map<string, RecognitionTask>();
  const sessions = new Map<string, RecognitionSessionState>();
  const metrics: RecognitionMetrics = {
    succeeded: 0,
    failed: 0,
    completed: 0,
    peakRunning: 0,
    completionOrder: [],
    canceledTaskIds: [],
  };
  const kgService = createKnowledgeGraphService({
    db: args.db,
    logger: args.logger,
  });

  function getSessionState(sessionId: string): RecognitionSessionState {
    const existing = sessions.get(sessionId);
    if (existing) {
      return existing;
    }
    const created: RecognitionSessionState = {
      dismissedKeys: new Set<string>(),
      suggestions: new Map<string, StoredSuggestion>(),
    };
    sessions.set(sessionId, created);
    return created;
  }

  function safeSendSuggestion(
    sender: Electron.WebContents | null,
    payload: KgSuggestionEvent,
  ): void {
    if (!sender) {
      return;
    }
    try {
      sender.send(KG_SUGGESTION_CHANNEL, payload);
    } catch (error) {
      args.logger.error("kg_suggestion_push_failed", {
        code: "INTERNAL",
        message: error instanceof Error ? error.message : String(error),
        task_id: payload.taskId,
      });
    }
  }

  async function processTask(
    task: RecognitionTask,
  ): Promise<"succeeded" | "failed" | "canceled"> {
    const recognitionRes = await recognizer.recognize({
      projectId: task.projectId,
      documentId: task.documentId,
      sessionId: task.sessionId,
      contentText: task.contentText,
      traceId: task.traceId,
    });

    if (task.canceled) {
      metrics.canceledTaskIds.push(task.taskId);
      return "canceled";
    }

    if (!recognitionRes.ok) {
      if (recognitionRes.error.code === "KG_RECOGNITION_UNAVAILABLE") {
        args.logger.error("kg_recognition_unavailable", {
          code: recognitionRes.error.code,
          project_id: task.projectId,
          document_id: task.documentId,
          session_id: task.sessionId,
          trace_id: task.traceId,
        });
        return "failed";
      }

      args.logger.error("kg_recognition_failed", {
        code: recognitionRes.error.code,
        message: recognitionRes.error.message,
        project_id: task.projectId,
        document_id: task.documentId,
        session_id: task.sessionId,
        trace_id: task.traceId,
      });
      return "failed";
    }

    const listRes = kgService.entityList({ projectId: task.projectId });
    if (!listRes.ok) {
      args.logger.error("kg_recognition_entity_list_failed", {
        code: listRes.error.code,
        message: listRes.error.message,
        task_id: task.taskId,
      });
      return "failed";
    }

    const existingKeys = new Set(
      listRes.data.items.map((entity) =>
        normalizeSuggestionKey({ name: entity.name, type: entity.type }),
      ),
    );

    const sessionState = getSessionState(task.sessionId);

    for (const candidate of recognitionRes.data.candidates) {
      const dedupeKey = normalizeSuggestionKey({
        name: candidate.name,
        type: candidate.type,
      });
      if (existingKeys.has(dedupeKey)) {
        continue;
      }
      if (sessionState.dismissedKeys.has(dedupeKey)) {
        continue;
      }

      const duplicated = [...sessionState.suggestions.values()].some(
        (suggestion) => suggestion.dedupeKey === dedupeKey,
      );
      if (duplicated) {
        continue;
      }

      const suggestionId = randomUUID();
      const createdAt = new Date().toISOString();
      const stored: StoredSuggestion = {
        taskId: task.taskId,
        suggestionId,
        projectId: task.projectId,
        documentId: task.documentId,
        sessionId: task.sessionId,
        traceId: task.traceId,
        name: candidate.name,
        type: candidate.type,
        dedupeKey,
        createdAt,
      };
      sessionState.suggestions.set(suggestionId, stored);

      safeSendSuggestion(task.sender, {
        taskId: stored.taskId,
        suggestionId: stored.suggestionId,
        projectId: stored.projectId,
        documentId: stored.documentId,
        sessionId: stored.sessionId,
        name: stored.name,
        type: stored.type as KgSuggestionEntityType,
        traceId: stored.traceId,
        createdAt: stored.createdAt,
      });
    }

    return "succeeded";
  }

  function pump(): void {
    while (running.size < maxConcurrency && queue.length > 0) {
      const next = queue.shift();
      if (!next) {
        break;
      }

      running.set(next.taskId, next);
      metrics.peakRunning = Math.max(metrics.peakRunning, running.size);

      void processTask(next)
        .then((outcome) => {
          if (outcome === "succeeded") {
            metrics.succeeded += 1;
            metrics.completed += 1;
            metrics.completionOrder.push(next.taskId);
            return;
          }
          if (outcome === "failed") {
            metrics.failed += 1;
          }
        })
        .catch((error) => {
          args.logger.error("kg_recognition_worker_failed", {
            code: "INTERNAL",
            message: error instanceof Error ? error.message : String(error),
            task_id: next.taskId,
          });
          metrics.failed += 1;
        })
        .finally(() => {
          running.delete(next.taskId);
          pump();
        });
    }
  }

  const suggestionOps = createSuggestionOps({ sessions, kgService });

  return {
    enqueue: ({
      projectId,
      documentId,
      sessionId,
      contentText,
      traceId,
      sender,
    }) => {
      const normalizedProjectId = projectId.trim();
      const normalizedDocumentId = documentId.trim();
      const normalizedSessionId = sessionId.trim();
      const normalizedContentText = contentText.trim();
      const normalizedTraceId = traceId.trim();

      if (
        normalizedProjectId.length === 0 ||
        normalizedDocumentId.length === 0 ||
        normalizedSessionId.length === 0 ||
        normalizedTraceId.length === 0
      ) {
        return toErr(
          "INVALID_ARGUMENT",
          "projectId/documentId/sessionId/traceId is required",
        );
      }

      if (normalizedContentText.length === 0) {
        return {
          ok: true,
          data: {
            taskId: null,
            status: "skipped",
            queuePosition: 0,
          },
        };
      }

      const task: RecognitionTask = {
        taskId: randomUUID(),
        projectId: normalizedProjectId,
        documentId: normalizedDocumentId,
        sessionId: normalizedSessionId,
        contentText: normalizedContentText,
        traceId: normalizedTraceId,
        sender,
        canceled: false,
      };

      queue.push(task);
      const queuePosition = Math.max(0, queue.length - 1);
      const status: "started" | "queued" =
        running.size < maxConcurrency && queuePosition === 0
          ? "started"
          : "queued";

      pump();

      return {
        ok: true,
        data: {
          taskId: task.taskId,
          status,
          queuePosition,
        },
      };
    },

    cancel: ({ projectId, sessionId, taskId }) => {
      const normalizedProjectId = projectId.trim();
      const normalizedSessionId = sessionId.trim();
      const normalizedTaskId = taskId.trim();

      if (
        normalizedProjectId.length === 0 ||
        normalizedSessionId.length === 0 ||
        normalizedTaskId.length === 0
      ) {
        return toErr(
          "INVALID_ARGUMENT",
          "projectId/sessionId/taskId is required",
        );
      }

      const queueIndex = queue.findIndex(
        (t) =>
          t.taskId === normalizedTaskId &&
          t.projectId === normalizedProjectId &&
          t.sessionId === normalizedSessionId,
      );
      if (queueIndex >= 0) {
        queue.splice(queueIndex, 1);
        metrics.canceledTaskIds.push(normalizedTaskId);
        return { ok: true, data: { canceled: true } };
      }

      const runningTask = running.get(normalizedTaskId);
      if (
        runningTask &&
        runningTask.projectId === normalizedProjectId &&
        runningTask.sessionId === normalizedSessionId
      ) {
        runningTask.canceled = true;
        return { ok: true, data: { canceled: true } };
      }

      return toErr("NOT_FOUND", "recognition task not found", {
        taskId: normalizedTaskId,
      });
    },

    ...suggestionOps,

    stats: ({ projectId, sessionId }) => {
      if (projectId.trim().length === 0 || sessionId.trim().length === 0) {
        return toErr("INVALID_ARGUMENT", "projectId/sessionId is required");
      }
      return {
        ok: true,
        data: buildRuntimeStats(running, queue, maxConcurrency, metrics),
      };
    },
  };
}
