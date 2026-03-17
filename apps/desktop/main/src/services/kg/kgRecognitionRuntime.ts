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

type RecognitionEvidence = {
  source: "pattern" | "quoted" | "context";
  matchedText: string;
};

type RecognitionCandidate = {
  name: string;
  type: KnowledgeEntityType;
  evidence?: RecognitionEvidence;
};

type RecognitionResult = {
  candidates: RecognitionCandidate[];
  degraded: boolean;
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

type NormalizedEnqueueInput = {
  projectId: string;
  documentId: string;
  sessionId: string;
  contentText: string;
  traceId: string;
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
  if (
    /(仓库|城|镇|村|山|馆|楼|谷|岛|洞|林|峰|崖|寺|庙|殿|府|庄|堡)$/u.test(name)
  ) {
    return "location";
  }
  if (EVENT_SUFFIXES.test(name)) {
    return "event";
  }
  if (ITEM_SUFFIXES.test(name)) {
    return "item";
  }
  return "character";
}

function normalizeCharacterName(rawName: string): string {
  const trimmed = rawName.trim();
  const stopCharIndex = trimmed.search(
    /[的在了和与并第提说道问看走来去回到把被让给向从上下用打拿做是有也都就又还但等却正站坐跑起出入叫喊想要能会将则已不可]/u,
  );
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
 * Common Chinese surname list for character name detection.
 */
const COMMON_SURNAMES = [
  "赵",
  "钱",
  "孙",
  "李",
  "周",
  "吴",
  "郑",
  "王",
  "冯",
  "陈",
  "褚",
  "卫",
  "蒋",
  "沈",
  "韩",
  "杨",
  "朱",
  "秦",
  "尤",
  "许",
  "何",
  "吕",
  "施",
  "张",
  "孔",
  "曹",
  "严",
  "华",
  "金",
  "魏",
  "陶",
  "姜",
  "戚",
  "谢",
  "邹",
  "喻",
  "柏",
  "水",
  "窦",
  "章",
  "苏",
  "潘",
  "葛",
  "奚",
  "范",
  "彭",
  "郎",
  "鲁",
  "韦",
  "昌",
  "马",
  "苗",
  "凤",
  "花",
  "方",
  "俞",
  "任",
  "袁",
  "柳",
  "丰",
  "鲍",
  "史",
  "唐",
  "费",
  "廉",
  "岑",
  "薛",
  "雷",
  "贺",
  "倪",
  "汤",
  "滕",
  "殷",
  "罗",
  "毕",
  "郝",
  "邬",
  "安",
  "常",
  "乐",
  "于",
  "时",
  "傅",
  "皮",
  "卞",
  "齐",
  "康",
  "伍",
  "余",
  "元",
  "卜",
  "顾",
  "孟",
  "黄",
  "穆",
  "萧",
  "尹",
  "姚",
  "邵",
  "湛",
  "汪",
  "祁",
  "毛",
  "禹",
  "狄",
  "贝",
  "明",
  "臧",
  "计",
  "伏",
  "成",
  "戴",
  "谈",
  "宋",
  "茅",
  "庞",
  "熊",
  "纪",
  "舒",
  "屈",
  "项",
  "祝",
  "董",
  "梁",
  "杜",
  "阮",
  "蓝",
  "闽",
  "席",
  "季",
  "麻",
  "强",
  "贾",
  "路",
  "娄",
  "危",
  "林",
  "刘",
  "徐",
  "高",
  "夏",
  "田",
  "胡",
  "郭",
  "程",
  "叶",
  "宫",
  "温",
  "白",
  "崔",
  "吉",
  "钮",
  "龚",
  "黎",
  "段",
  "武",
  "江",
  "颜",
  "侯",
  "邢",
  "钟",
  "付",
  "丁",
  "石",
  "肖",
  "谷",
  "邓",
  "曾",
  "欧阳",
  "司马",
  "上官",
  "诸葛",
  "公孙",
  "令狐",
  "慕容",
  "司徒",
  "皇甫",
  "东方",
  "西门",
  "南宫",
  "独孤",
  "长孙",
  "宇文",
] as const;

const SURNAME_PATTERN = new RegExp(
  `(${COMMON_SURNAMES.join("|")})[\\u4e00-\\u9fa5]{1,3}`,
  "gu",
);

/**
 * Event-related keyword patterns for recognizing events.
 */
const EVENT_SUFFIXES =
  /(大会|之战|盟约|仪式|庆典|比武|论道|祭祀|会议|大典|风波|事变|之乱|叛乱|起义)$/u;

/**
 * Item/artifact keyword patterns for recognizing items.
 */
const ITEM_SUFFIXES =
  /(之剑|之刃|神剑|宝剑|法杖|令牌|秘籍|宝典|圣物|神器|法宝|灵石|丹药|卷轴|古籍)$/u;

/**
 * Create a deterministic mock recognizer for KG suggestions.
 *
 * Why: tests must avoid real LLM calls while still exercising async recognition
 * and failure/degrade paths.
 *
 * Enhanced with broader Chinese name pattern matching and evidence chain.
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

      let degraded = false;
      const candidates = new Map<string, RecognitionCandidate>();

      // Pattern 1: Quoted entity names 「...」
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
          evidence: { source: "quoted", matchedText: match[0] },
        });
      }

      // Pattern 2: Common Chinese surname + given name (1-3 chars)
      try {
        for (const match of contentText.matchAll(SURNAME_PATTERN)) {
          const rawName = match[0]?.trim() ?? "";
          const normalizedName = normalizeCharacterName(rawName);
          if (normalizedName.length < 2) {
            continue;
          }
          const type: KnowledgeEntityType = "character";
          candidates.set(
            normalizeSuggestionKey({ name: normalizedName, type }),
            {
              name: normalizedName,
              type,
              evidence: { source: "pattern", matchedText: match[0] },
            },
          );
        }
      } catch {
        degraded = true;
      }

      // Pattern 3: Location suffixes (prefix 1-2 chars to avoid greedy over-match)
      const locationPattern =
        /[\u4e00-\u9fa5]{1,2}(仓库|城|镇|村|山|馆|楼|谷|岛|洞|林|峰|崖|寺|庙|殿|府|庄|堡)/gu;
      for (const match of contentText.matchAll(locationPattern)) {
        const rawName = match[0]?.trim() ?? "";
        if (rawName.length === 0) {
          continue;
        }
        const type: KnowledgeEntityType = "location";
        candidates.set(normalizeSuggestionKey({ name: rawName, type }), {
          name: rawName,
          type,
          evidence: { source: "pattern", matchedText: match[0] },
        });
      }

      // Pattern 4: Event recognition (prefix 2 chars to avoid greedy over-match)
      const eventPattern =
        /[\u4e00-\u9fa5]{2,2}(大会|之战|盟约|仪式|庆典|比武|论道|祭祀|会议|大典|风波|事变|之乱|叛乱|起义)/gu;
      for (const match of contentText.matchAll(eventPattern)) {
        const rawName = match[0]?.trim() ?? "";
        if (rawName.length === 0) {
          continue;
        }
        const type: KnowledgeEntityType = "event";
        candidates.set(normalizeSuggestionKey({ name: rawName, type }), {
          name: rawName,
          type,
          evidence: { source: "pattern", matchedText: match[0] },
        });
      }

      // Pattern 5: Item recognition (prefix 2 chars to avoid greedy over-match)
      const itemPattern =
        /[\u4e00-\u9fa5]{2,2}(之剑|之刃|神剑|宝剑|法杖|令牌|秘籍|宝典|圣物|神器|法宝|灵石|丹药|卷轴|古籍)/gu;
      for (const match of contentText.matchAll(itemPattern)) {
        const rawName = match[0]?.trim() ?? "";
        if (rawName.length === 0) {
          continue;
        }
        const type: KnowledgeEntityType = "item";
        candidates.set(normalizeSuggestionKey({ name: rawName, type }), {
          name: rawName,
          type,
          evidence: { source: "pattern", matchedText: match[0] },
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
          degraded,
        },
      };
    },
  };
}

function createSuggestionOps(ctx: {
  sessions: Map<string, RecognitionSessionState>;
  kgService: ReturnType<typeof createKnowledgeGraphService>;
}): Pick<KgRecognitionRuntime, "acceptSuggestion" | "dismissSuggestion"> {
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

function normalizeEnqueueInput(args: {
  projectId: string;
  documentId: string;
  sessionId: string;
  contentText: string;
  traceId: string;
}): NormalizedEnqueueInput {
  return {
    projectId: args.projectId.trim(),
    documentId: args.documentId.trim(),
    sessionId: args.sessionId.trim(),
    contentText: args.contentText.trim(),
    traceId: args.traceId.trim(),
  };
}

function getOrCreateRecognitionSession(
  sessions: Map<string, RecognitionSessionState>,
  sessionId: string,
): RecognitionSessionState {
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

    if (recognitionRes.data.degraded) {
      args.logger.error("kg_recognition_degraded", {
        code: "KG_RECOGNITION_DEGRADED",
        project_id: task.projectId,
        document_id: task.documentId,
        session_id: task.sessionId,
        trace_id: task.traceId,
      });
    }

    const existingKeys = new Set(
      listRes.data.items.map((entity) =>
        normalizeSuggestionKey({ name: entity.name, type: entity.type }),
      ),
    );

    const sessionState = getOrCreateRecognitionSession(
      sessions,
      task.sessionId,
    );

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
      const normalized = normalizeEnqueueInput({
        projectId,
        documentId,
        sessionId,
        contentText,
        traceId,
      });

      if (
        normalized.projectId.length === 0 ||
        normalized.documentId.length === 0 ||
        normalized.sessionId.length === 0 ||
        normalized.traceId.length === 0
      ) {
        return toErr(
          "INVALID_ARGUMENT",
          "projectId/documentId/sessionId/traceId is required",
        );
      }

      if (normalized.contentText.length === 0) {
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
        projectId: normalized.projectId,
        documentId: normalized.documentId,
        sessionId: normalized.sessionId,
        contentText: normalized.contentText,
        traceId: normalized.traceId,
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
