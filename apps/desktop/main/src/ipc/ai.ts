import type { IpcMain } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import { estimateUtf8TokenCount as estimateTokenCount } from "@shared/tokenBudget";
import { nowTs } from "@shared/timeUtils";
import {
  SKILL_QUEUE_STATUS_CHANNEL,
  SKILL_STREAM_CHUNK_CHANNEL,
  SKILL_STREAM_DONE_CHANNEL,
  type AiStreamEvent,
} from "@shared/types/ai";
import type { Logger } from "../logging/logger";
import { createIpcPushBackpressureGate } from "./pushBackpressure";
import { createAiService } from "../services/ai/aiService";
import { createSqliteTraceStore } from "../services/ai/traceStore";
import { resolveRuntimeGovernanceFromEnv } from "../config/runtimeGovernance";
import {
  type SecretStorageAdapter,
  createAiProxySettingsService,
} from "../services/ai/aiProxySettingsService";
import { createMemoryService } from "../services/memory/memoryService";
import {
  recordSkillFeedbackAndLearn,
  type SkillFeedbackAction,
} from "../services/memory/preferenceLearning";
import { createStatsService } from "../services/stats/statsService";
import { createSkillService } from "../services/skills/skillService";
import { createSkillExecutor } from "../services/skills/skillExecutor";
import { createContextLayerAssemblyService } from "../services/context/layerAssemblyService";
import { createKnowledgeGraphService } from "../services/kg/kgService";
import { DegradationCounter } from "../services/shared/degradationCounter";
import { createDbNotReadyError } from "./dbError";
import type { ProjectSessionBindingRegistry } from "./projectSessionBinding";

type SkillRunPayload = {
  skillId: string;
  input: string;
  mode: "agent" | "plan" | "ask";
  model: string;
  candidateCount?: number;
  context?: { projectId?: string; documentId?: string };
  promptDiagnostics?: { stablePrefixHash: string; promptHash: string };
  stream: boolean;
};

type SkillRunUsage = {
  promptTokens: number;
  completionTokens: number;
  sessionTotalTokens: number;
  estimatedCostUsd?: number;
};

type SkillRunCandidate = {
  id: string;
  runId: string;
  text: string;
  summary: string;
};

type SkillRunResponse = {
  executionId: string;
  runId: string;
  outputText?: string;
  candidates?: SkillRunCandidate[];
  usage?: SkillRunUsage;
  promptDiagnostics?: { stablePrefixHash: string; promptHash: string };
};

type SkillRunResponseDataInput = SkillRunResponse & {
  contextPrompt?: string;
};

type ModelCatalogResponse = {
  source: "proxy" | "openai" | "anthropic";
  items: Array<{ id: string; name: string; provider: string }>;
};

type SkillFeedbackPayload = {
  runId: string;
  action: SkillFeedbackAction;
  evidenceRef: string;
};

type SkillFeedbackResponse = {
  recorded: true;
  learning?: {
    ignored: boolean;
    ignoredReason?: string;
    learned: boolean;
    learnedMemoryId?: string;
    signalCount?: number;
    threshold?: number;
  };
};

type ChatSendPayload = {
  message: string;
  projectId?: string;
  documentId?: string;
};

type ChatSendResponse = {
  accepted: true;
  messageId: string;
  echoed: string;
};

type ChatListPayload = {
  projectId?: string;
};

type ChatMessageRole = "user" | "assistant";

type ChatHistoryMessage = {
  messageId: string;
  projectId: string;
  role: ChatMessageRole;
  content: string;
  skillId?: string;
  timestamp: number;
  traceId: string;
};

type ChatListResponse = {
  items: ChatHistoryMessage[];
};

type ChatClearPayload = {
  projectId?: string;
};

type ChatClearResponse = {
  cleared: true;
  removed: number;
};

const AI_CANDIDATE_COUNT_MIN = 1;
const AI_CANDIDATE_COUNT_MAX = 5;

type ModelPricing = {
  promptPer1kTokens: number;
  completionPer1kTokens: number;
};

/**
 * Parse candidateCount input and enforce the fixed 1..5 range.
 */
function parseCandidateCount(
  raw: number | undefined,
):
  | { ok: true; data: number }
  | { ok: false; error: { code: "INVALID_ARGUMENT"; message: string } } {
  if (raw === undefined) {
    return { ok: true, data: 1 };
  }
  if (!Number.isFinite(raw) || !Number.isInteger(raw)) {
    return {
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        message: "candidateCount must be an integer between 1 and 5",
      },
    };
  }
  if (raw < AI_CANDIDATE_COUNT_MIN || raw > AI_CANDIDATE_COUNT_MAX) {
    return {
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        message: "candidateCount must be between 1 and 5",
      },
    };
  }
  return { ok: true, data: raw };
}

/**
 * Build a concise card summary for candidate rendering.
 */
function summarizeCandidateText(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 120) {
    return normalized;
  }
  return `${normalized.slice(0, 117)}...`;
}

/**
 * Normalize AI run response payload to the IPC contract surface.
 *
 * Why: executor internals (e.g. `contextPrompt`) must never leak across IPC
 * response validation boundaries.
 */
export function toSkillRunResponseData(
  data: SkillRunResponseDataInput,
): SkillRunResponse {
  return {
    executionId: data.executionId,
    runId: data.runId,
    ...(typeof data.outputText === "string"
      ? { outputText: data.outputText }
      : {}),
    ...(Array.isArray(data.candidates) ? { candidates: data.candidates } : {}),
    ...(data.usage ? { usage: data.usage } : {}),
    ...(data.promptDiagnostics
      ? { promptDiagnostics: data.promptDiagnostics }
      : {}),
  };
}

/**
 * Normalize skill id to the leaf token.
 */
function leafSkillId(skillId: string): string {
  const parts = skillId.split(":");
  return parts[parts.length - 1] ?? skillId;
}

/**
 * Derive deterministic prompt-token input text for usage accounting.
 */
function promptInputForUsage(payload: SkillRunPayload): string {
  if (payload.input.trim().length > 0) {
    return payload.input;
  }
  if (leafSkillId(payload.skillId) === "continue") {
    return "请基于当前文档上下文继续写作。";
  }
  return payload.input;
}

/**
 * Parse per-model pricing from env JSON.
 *
 * Format:
 * {"gpt-5.2":{"promptPer1kTokens":0.0015,"completionPer1kTokens":0.003}}
 */
function parseModelPricingMap(
  env: NodeJS.ProcessEnv,
): Map<string, ModelPricing> {
  const raw = env.CREONOW_AI_MODEL_PRICING_JSON;
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return new Map();
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return new Map();
    }
    const entries = Object.entries(parsed as Record<string, unknown>);
    const map = new Map<string, ModelPricing>();
    for (const [model, value] of entries) {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        continue;
      }
      const record = value as Record<string, unknown>;
      const prompt = record.promptPer1kTokens;
      const completion = record.completionPer1kTokens;
      if (
        typeof prompt !== "number" ||
        !Number.isFinite(prompt) ||
        prompt < 0 ||
        typeof completion !== "number" ||
        !Number.isFinite(completion) ||
        completion < 0
      ) {
        continue;
      }
      map.set(model, {
        promptPer1kTokens: prompt,
        completionPer1kTokens: completion,
      });
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Validate and normalize chat project scope key.
 *
 * Why: chat history must be isolated by project to prevent cross-project leakage.
 */
function resolveChatProjectId(args: {
  projectId?: string;
  boundProjectId?: string | null;
}):
  | { ok: true; data: string }
  | {
      ok: false;
      error:
        | { code: "INVALID_ARGUMENT"; message: string }
        | { code: "FORBIDDEN"; message: string };
    } {
  const boundProjectId = args.boundProjectId?.trim() ?? "";
  const requestedProjectId = args.projectId?.trim() ?? "";

  if (requestedProjectId.length === 0) {
    if (boundProjectId.length > 0) {
      return { ok: true, data: boundProjectId };
    }
    return {
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        message: "projectId is required",
      },
    };
  }

  if (boundProjectId.length > 0 && requestedProjectId !== boundProjectId) {
    return {
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "projectId is not active for this renderer session",
      },
    };
  }

  return { ok: true, data: requestedProjectId };
}

/**
 * Best-effort emit a stream event to the renderer that invoked the skill.
 *
 * Why: renderer cannot access Node APIs; streaming must cross IPC as push events.
 */
function safeEmitToRenderer(args: {
  logger: Logger;
  sender: Electron.WebContents;
  event: AiStreamEvent;
}): void {
  const channel =
    args.event.type === "chunk"
      ? SKILL_STREAM_CHUNK_CHANNEL
      : args.event.type === "queue"
        ? SKILL_QUEUE_STATUS_CHANNEL
        : SKILL_STREAM_DONE_CHANNEL;
  try {
    args.sender.send(channel, args.event);
  } catch (error) {
    args.logger.error("ai_stream_send_failed", {
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

type AiIpcDeps = {
  ipcMain: IpcMain;
  db: Database.Database | null;
  userDataDir: string;
  builtinSkillsDir: string;
  logger: Logger;
  env: NodeJS.ProcessEnv;
  secretStorage?: SecretStorageAdapter;
  projectSessionBinding?: ProjectSessionBindingRegistry;
};

type AiIpcContext = {
  deps: AiIpcDeps;
  runtimeGovernance: ReturnType<typeof resolveRuntimeGovernanceFromEnv>;
  aiService: ReturnType<typeof createAiService>;
  skillExecutor: ReturnType<typeof createSkillExecutor>;
  runRegistry: Map<
    string,
    { startedAt: number; context?: SkillRunPayload["context"] }
  >;
  chatHistoryByProject: Map<string, ChatHistoryMessage[]>;
  sessionTokenTotalsByContext: Map<string, number>;
  modelPricingByModel: Map<string, ModelPricing>;
  pushBackpressureByRenderer: Map<
    number,
    ReturnType<typeof createIpcPushBackpressureGate>
  >;
};

function getOrCreatePushBackpressureGate(
  ctx: AiIpcContext,
  sender: Electron.WebContents,
): ReturnType<typeof createIpcPushBackpressureGate> {
  const existing = ctx.pushBackpressureByRenderer.get(sender.id);
  if (existing) {
    return existing;
  }
  const created = createIpcPushBackpressureGate({
    limitPerSecond: ctx.runtimeGovernance.ai.streamRateLimitPerSecond,
    onDrop: (event) => {
      ctx.deps.logger.info("ipc_push_backpressure_triggered", {
        rendererId: sender.id,
        channel: SKILL_STREAM_CHUNK_CHANNEL,
        timestamp: event.timestamp,
        droppedInWindow: event.droppedInWindow,
        limitPerSecond: event.limitPerSecond,
      });
    },
  });
  ctx.pushBackpressureByRenderer.set(sender.id, created);
  return created;
}

function rememberRunInRegistry(
  ctx: AiIpcContext,
  args: { runId: string; context?: SkillRunPayload["context"] },
): void {
  ctx.runRegistry.set(args.runId, {
    startedAt: nowTs(),
    context: args.context,
  });
  const cutoff = nowTs() - 24 * 60 * 60 * 1000;
  for (const [runId, entry] of ctx.runRegistry) {
    if (entry.startedAt < cutoff) {
      ctx.runRegistry.delete(runId);
    }
  }
}

function resolveUsageContextKey(context?: SkillRunPayload["context"]): string {
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

function buildSkillRunUsage(
  ctx: AiIpcContext,
  args: {
    model: string;
    context?: SkillRunPayload["context"];
    promptTokens: number;
    completionTokens: number;
  },
): SkillRunUsage {
  const key = resolveUsageContextKey(args.context);
  const delta =
    Math.max(0, args.promptTokens) + Math.max(0, args.completionTokens);
  const nextTotal = (ctx.sessionTokenTotalsByContext.get(key) ?? 0) + delta;
  ctx.sessionTokenTotalsByContext.set(key, nextTotal);

  const pricing = ctx.modelPricingByModel.get(args.model.trim());
  const estimatedCostUsd =
    pricing === undefined
      ? undefined
      : Number(
          (
            (Math.max(0, args.promptTokens) / 1000) *
              pricing.promptPer1kTokens +
            (Math.max(0, args.completionTokens) / 1000) *
              pricing.completionPer1kTokens
          ).toFixed(6),
        );

  return {
    promptTokens: Math.max(0, args.promptTokens),
    completionTokens: Math.max(0, args.completionTokens),
    sessionTotalTokens: nextTotal,
    ...(typeof estimatedCostUsd === "number" ? { estimatedCostUsd } : {}),
  };
}

/**
 * Register `ai:skill:*` IPC handlers.
 *
 * Why: AI runtime lives in the main process (secrets + network + observability),
 * while the renderer only consumes typed results and stream events.
 */
export function registerAiIpcHandlers(deps: AiIpcDeps): void {
  const runtimeGovernance = resolveRuntimeGovernanceFromEnv(deps.env);
  const pushBackpressureByRenderer = new Map<
    number,
    ReturnType<typeof createIpcPushBackpressureGate>
  >();

  const aiService = createAiService({
    logger: deps.logger,
    env: deps.env,
    ...(deps.db
      ? {
          traceStore: createSqliteTraceStore({
            db: deps.db,
            logger: deps.logger,
          }),
        }
      : {}),
    getProxySettings: () => {
      if (!deps.db) {
        return null;
      }
      const svc = createAiProxySettingsService({
        db: deps.db,
        logger: deps.logger,
        secretStorage: deps.secretStorage,
      });
      const res = svc.getRaw();
      return res.ok ? res.data : null;
    },
  });
  const runRegistry = new Map<
    string,
    { startedAt: number; context?: SkillRunPayload["context"] }
  >();
  const chatHistoryByProject = new Map<string, ChatHistoryMessage[]>();
  const sessionTokenTotalsByContext = new Map<string, number>();
  const modelPricingByModel = parseModelPricingMap(deps.env);
  const degradationCounter = new DegradationCounter();
  const memoryServiceForContext =
    deps.db !== null
      ? createMemoryService({
          db: deps.db,
          logger: deps.logger,
          degradationCounter,
        })
      : undefined;
  const contextAssemblyService = createContextLayerAssemblyService(
    undefined,
    deps.db
      ? {
          logger: deps.logger,
          degradationCounter,
          kgService: createKnowledgeGraphService({
            db: deps.db,
            logger: deps.logger,
          }),
          ...(memoryServiceForContext
            ? { memoryService: memoryServiceForContext }
            : {}),
        }
      : undefined,
  );
  const skillExecutor = createSkillExecutor({
    resolveSkill: (skillId) => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }
      const skillSvc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
      });
      const resolved = skillSvc.resolveForRun({ id: skillId });
      if (!resolved.ok) {
        return {
          ok: false,
          error: resolved.error,
        };
      }
      return {
        ok: true,
        data: {
          id: resolved.data.skill.id,
          prompt: resolved.data.skill.prompt,
          output: resolved.data.skill.output,
          enabled: resolved.data.enabled,
          valid: resolved.data.skill.valid,
          inputType: resolved.data.inputType,
          dependsOn: resolved.data.skill.dependsOn,
          timeoutMs: resolved.data.skill.timeoutMs,
          error_code: resolved.data.skill.error_code,
          error_message: resolved.data.skill.error_message,
        },
      };
    },
    checkDependencies: ({ dependsOn }) => {
      if (!deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }

      const skillSvc = createSkillService({
        db: deps.db,
        userDataDir: deps.userDataDir,
        builtinSkillsDir: deps.builtinSkillsDir,
        logger: deps.logger,
      });

      const missing: string[] = [];
      for (const dependencyId of dependsOn) {
        const available = skillSvc.isDependencyAvailable({ dependencyId });
        if (!available.ok) {
          return {
            ok: false,
            error: available.error,
          };
        }
        if (!available.data.available) {
          missing.push(dependencyId);
        }
      }

      if (missing.length > 0) {
        return {
          ok: false,
          error: {
            code: "SKILL_DEPENDENCY_MISSING",
            message: "Skill dependency missing",
            details: missing,
          },
        };
      }

      return { ok: true, data: true };
    },
    runSkill: async (args) => {
      return await aiService.runSkill(args);
    },
    assembleContext: async (args) => {
      return await contextAssemblyService.assemble(args);
    },
    logger: {
      warn: (event, data) => deps.logger.info(event, data),
    },
  });

  const ctx: AiIpcContext = {
    deps,
    runtimeGovernance,
    aiService,
    skillExecutor,
    runRegistry,
    chatHistoryByProject,
    sessionTokenTotalsByContext,
    modelPricingByModel,
    pushBackpressureByRenderer,
  };

  deps.ipcMain.handle(
    "ai:models:list",
    async (): Promise<IpcResponse<ModelCatalogResponse>> => {
      try {
        const res = await aiService.listModels();
        return res.ok
          ? { ok: true, data: res.data }
          : { ok: false, error: res.error };
      } catch (error) {
        deps.logger.error("ai_models_list_ipc_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "INTERNAL", message: "AI models list failed" },
        };
      }
    },
  );
  registerAiSkillRunHandler(ctx);
  registerAiSkillLifecycleHandlers(ctx);
  registerAiChatHandlers(ctx);
}

function registerAiSkillRunHandler(ctx: AiIpcContext): void {
  ctx.deps.ipcMain.handle(
    "ai:skill:run",
    async (
      e,
      payload: SkillRunPayload,
    ): Promise<IpcResponse<SkillRunResponse>> => {
      if (payload.skillId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "skillId is required" },
        };
      }
      if (payload.model.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "model is required" },
        };
      }
      if (!ctx.deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }

      const candidateCountRes = parseCandidateCount(payload.candidateCount);
      if (!candidateCountRes.ok) {
        return {
          ok: false,
          error: candidateCountRes.error,
        };
      }
      const candidateCount = candidateCountRes.data;
      const effectiveStream = candidateCount > 1 ? false : payload.stream;
      const promptTokensForResult = estimateTokenCount(
        promptInputForUsage(payload),
      );

      const pushBackpressure = getOrCreatePushBackpressureGate(ctx, e.sender);

      const emitEvent = (event: AiStreamEvent): void => {
        const eventToSend: AiStreamEvent =
          event.type === "done"
            ? {
                ...event,
                result: {
                  success: event.terminal === "completed",
                  output: event.outputText,
                  metadata: {
                    model: payload.model,
                    promptTokens: promptTokensForResult,
                    completionTokens: estimateTokenCount(event.outputText),
                  },
                  traceId: event.traceId,
                  ...(event.error ? { error: event.error } : {}),
                },
              }
            : event;

        if (!pushBackpressure.shouldDeliver(eventToSend)) {
          return;
        }

        safeEmitToRenderer({
          logger: ctx.deps.logger,
          sender: e.sender,
          event: eventToSend,
        });
      };

      const stats = createStatsService({
        db: ctx.deps.db,
        logger: ctx.deps.logger,
      });
      const inc = stats.increment({
        ts: nowTs(),
        delta: { skillsUsed: 1 },
      });
      if (!inc.ok) {
        ctx.deps.logger.error("stats_increment_skills_used_failed", {
          code: inc.error.code,
          message: inc.error.message,
        });
      }

      try {
        if (candidateCount === 1) {
          const res = await ctx.skillExecutor.execute({
            skillId: payload.skillId,
            input: payload.input,
            mode: payload.mode,
            model: payload.model,
            context: payload.context,
            stream: effectiveStream,
            ts: nowTs(),
            emitEvent,
          });
          if (!res.ok) {
            return { ok: false, error: res.error };
          }

          rememberRunInRegistry(ctx, {
            runId: res.data.runId,
            context: payload.context,
          });

          const outputText = res.data.outputText;
          if (typeof outputText === "string") {
            const promptTokens = estimateTokenCount(
              promptInputForUsage(payload),
            );
            const completionTokens = estimateTokenCount(outputText);
            const usage = buildSkillRunUsage(ctx, {
              model: payload.model,
              context: payload.context,
              promptTokens,
              completionTokens,
            });
            const candidates: SkillRunCandidate[] = [
              {
                id: "candidate-1",
                runId: res.data.runId,
                text: outputText,
                summary: summarizeCandidateText(outputText),
              },
            ];

            return {
              ok: true,
              data: toSkillRunResponseData({
                ...res.data,
                candidates,
                usage,
                promptDiagnostics: payload.promptDiagnostics,
              }),
            };
          }

          return {
            ok: true,
            data: toSkillRunResponseData({
              ...res.data,
              promptDiagnostics: payload.promptDiagnostics,
            }),
          };
        }

        const runs: Array<{
          executionId: string;
          runId: string;
          outputText: string;
        }> = [];
        for (let index = 0; index < candidateCount; index += 1) {
          const res = await ctx.skillExecutor.execute({
            skillId: payload.skillId,
            input: payload.input,
            mode: payload.mode,
            model: payload.model,
            context: payload.context,
            stream: false,
            ts: nowTs(),
            emitEvent,
          });
          if (!res.ok) {
            return { ok: false, error: res.error };
          }
          rememberRunInRegistry(ctx, {
            runId: res.data.runId,
            context: payload.context,
          });
          runs.push({
            executionId: res.data.executionId,
            runId: res.data.runId,
            outputText: res.data.outputText ?? "",
          });
        }

        const candidates: SkillRunCandidate[] = runs.map((item, index) => ({
          id: `candidate-${index + 1}`,
          runId: item.runId,
          text: item.outputText,
          summary: summarizeCandidateText(item.outputText),
        }));
        const completionTokens = runs.reduce(
          (sum, item) => sum + estimateTokenCount(item.outputText),
          0,
        );
        const promptTokens =
          estimateTokenCount(promptInputForUsage(payload)) * candidateCount;
        const usage = buildSkillRunUsage(ctx, {
          model: payload.model,
          context: payload.context,
          promptTokens,
          completionTokens,
        });
        const primary = runs[0];
        if (!primary) {
          return {
            ok: false,
            error: { code: "INTERNAL", message: "No candidates generated" },
          };
        }
        return {
          ok: true,
          data: toSkillRunResponseData({
            executionId: primary.executionId,
            runId: primary.runId,
            outputText: primary.outputText,
            candidates,
            usage,
            promptDiagnostics: payload.promptDiagnostics,
          }),
        };
      } catch (error) {
        ctx.deps.logger.error("ai_run_ipc_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "INTERNAL", message: "AI run failed" },
        };
      }
    },
  );
}

function registerAiSkillLifecycleHandlers(ctx: AiIpcContext): void {
  ctx.deps.ipcMain.handle(
    "ai:skill:cancel",
    async (
      _e,
      payload: { runId?: string; executionId?: string },
    ): Promise<IpcResponse<{ canceled: true }>> => {
      const executionIdValue =
        typeof payload.executionId === "string"
          ? payload.executionId.trim()
          : "";
      const runIdValue =
        typeof payload.runId === "string" ? payload.runId.trim() : "";
      if (executionIdValue.length === 0 && runIdValue.length > 0) {
        ctx.deps.logger.info("deprecated_field", {
          channel: "ai:skill:cancel",
          field: "runId",
        });
      }
      const executionId =
        executionIdValue.length > 0 ? executionIdValue : runIdValue;
      if (executionId.length === 0) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "executionId is required",
          },
        };
      }

      try {
        const res = ctx.aiService.cancel({
          executionId,
          runId: runIdValue.length > 0 ? runIdValue : undefined,
          ts: nowTs(),
        });
        return res.ok
          ? { ok: true, data: res.data }
          : { ok: false, error: res.error };
      } catch (error) {
        ctx.deps.logger.error("ai_cancel_ipc_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "INTERNAL", message: "AI cancel failed" },
        };
      }
    },
  );

  ctx.deps.ipcMain.handle(
    "ai:skill:feedback",
    async (
      _e,
      payload: SkillFeedbackPayload,
    ): Promise<IpcResponse<SkillFeedbackResponse>> => {
      if (payload.runId.trim().length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "runId is required" },
        };
      }

      if (!ctx.runRegistry.has(payload.runId)) {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "runId not found" },
        };
      }

      if (!ctx.deps.db) {
        return {
          ok: false,
          error: createDbNotReadyError(),
        };
      }

      try {
        const memSvc = createMemoryService({
          db: ctx.deps.db,
          logger: ctx.deps.logger,
        });
        const settings = memSvc.getSettings();
        if (!settings.ok) {
          return { ok: false, error: settings.error };
        }

        const learning = recordSkillFeedbackAndLearn({
          db: ctx.deps.db,
          logger: ctx.deps.logger,
          settings: settings.data,
          runId: payload.runId,
          action: payload.action,
          evidenceRef: payload.evidenceRef,
        });
        if (!learning.ok) {
          return { ok: false, error: learning.error };
        }

        const res = ctx.aiService.feedback({
          runId: payload.runId,
          action: payload.action,
          evidenceRef: payload.evidenceRef,
          ts: nowTs(),
        });
        return res.ok
          ? {
              ok: true,
              data: {
                recorded: true,
                learning: {
                  ignored: learning.data.ignored,
                  ignoredReason: learning.data.ignoredReason,
                  learned: learning.data.learned,
                  learnedMemoryId: learning.data.learnedMemoryId,
                  signalCount: learning.data.signalCount,
                  threshold: learning.data.threshold,
                },
              },
            }
          : { ok: false, error: res.error };
      } catch (error) {
        ctx.deps.logger.error("ai_feedback_ipc_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: { code: "INTERNAL", message: "AI feedback failed" },
        };
      }
    },
  );
}

function registerAiChatHandlers(ctx: AiIpcContext): void {
  ctx.deps.ipcMain.handle(
    "ai:chat:send",
    async (
      event,
      payload: ChatSendPayload,
    ): Promise<IpcResponse<ChatSendResponse>> => {
      const message = payload.message.trim();
      if (message.length === 0) {
        return {
          ok: false,
          error: { code: "INVALID_ARGUMENT", message: "message is required" },
        };
      }

      const projectId = resolveChatProjectId({
        projectId: payload.projectId,
        boundProjectId: ctx.deps.projectSessionBinding?.resolveProjectId({
          webContentsId: event.sender.id,
        }),
      });
      if (!projectId.ok) {
        return {
          ok: false,
          error: projectId.error,
        };
      }

      const timestamp = nowTs();
      const projectMessages =
        ctx.chatHistoryByProject.get(projectId.data) ?? [];
      if (
        projectMessages.length >= ctx.runtimeGovernance.ai.chatMessageCapacity
      ) {
        return {
          ok: false,
          error: {
            code: "CONFLICT",
            message: "会话消息已达上限，请先归档旧会话后继续",
          },
        };
      }
      const messageId = `chat-${timestamp}`;
      const nextMessage: ChatHistoryMessage = {
        messageId,
        projectId: projectId.data,
        role: "user",
        content: message,
        timestamp,
        traceId: `trace-${messageId}`,
      };
      const nextMessages = [...projectMessages, nextMessage];
      ctx.chatHistoryByProject.set(projectId.data, nextMessages);

      return {
        ok: true,
        data: {
          accepted: true,
          messageId,
          echoed: message,
        },
      };
    },
  );

  ctx.deps.ipcMain.handle(
    "ai:chat:list",
    async (
      event,
      payload: ChatListPayload,
    ): Promise<IpcResponse<ChatListResponse>> => {
      const projectId = resolveChatProjectId({
        projectId: payload.projectId,
        boundProjectId: ctx.deps.projectSessionBinding?.resolveProjectId({
          webContentsId: event.sender.id,
        }),
      });
      if (!projectId.ok) {
        return {
          ok: false,
          error: projectId.error,
        };
      }

      const messages = ctx.chatHistoryByProject.get(projectId.data) ?? [];
      return {
        ok: true,
        data: { items: [...messages] },
      };
    },
  );

  ctx.deps.ipcMain.handle(
    "ai:chat:clear",
    async (
      event,
      payload: ChatClearPayload,
    ): Promise<IpcResponse<ChatClearResponse>> => {
      const projectId = resolveChatProjectId({
        projectId: payload.projectId,
        boundProjectId: ctx.deps.projectSessionBinding?.resolveProjectId({
          webContentsId: event.sender.id,
        }),
      });
      if (!projectId.ok) {
        return {
          ok: false,
          error: projectId.error,
        };
      }

      const removed = ctx.chatHistoryByProject.get(projectId.data)?.length ?? 0;
      ctx.chatHistoryByProject.delete(projectId.data);

      return {
        ok: true,
        data: {
          cleared: true,
          removed,
        },
      };
    },
  );
}
