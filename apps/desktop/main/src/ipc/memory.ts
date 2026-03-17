import type { IpcMain, WebContents } from "electron";
import type Database from "better-sqlite3";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";
import {
  createMemoryService,
  type MemoryInjectionPreview,
  type MemoryScope,
  type MemorySettings,
  type MemoryType,
  type UserMemoryItem,
} from "../services/memory/memoryService";
import {
  createInMemoryMemoryTraceService,
  type GenerationTrace,
  type MemoryTraceService,
} from "../services/memory/memoryTraceService";
import {
  createEpisodicMemoryService,
  createSqliteEpisodeRepository,
  type DistillGeneratedRule,
  type DistillProgressEvent,
  type DistillTrigger,
  type EpisodicMemoryService,
  type EpisodeQueryInput,
  type EpisodeRecord,
  type EpisodeRecordInput,
  type SemanticMemoryRule,
  type SemanticMemoryScope,
  type SemanticMemoryRulePlaceholder,
} from "../services/memory/episodicMemoryService";
import { guardAndNormalizeProjectAccess } from "./projectAccessGuard";
import type { ProjectSessionBindingRegistry } from "./projectSessionBinding";

type MemoryCreatePayload = {
  type: MemoryType;
  scope: MemoryScope;
  projectId?: string;
  documentId?: string;
  content: string;
};

type MemoryListPayload = {
  projectId?: string;
  documentId?: string;
  includeDeleted?: boolean;
};

type MemoryUpdatePayload = {
  memoryId: string;
  patch: Partial<
    Pick<
      UserMemoryItem,
      "type" | "scope" | "projectId" | "documentId" | "content"
    >
  >;
};

type MemoryDeletePayload = { memoryId: string };
type EpisodeRecordPayload = EpisodeRecordInput;
type EpisodeQueryPayload = EpisodeQueryInput;
type SemanticListPayload = { projectId: string };
type SemanticAddPayload = {
  projectId: string;
  rule: string;
  category: SemanticMemoryRule["category"];
  confidence: number;
  scope?: SemanticMemoryScope;
  supportingEpisodes?: string[];
  contradictingEpisodes?: string[];
  userConfirmed?: boolean;
  userModified?: boolean;
};
type SemanticUpdatePayload = {
  projectId: string;
  ruleId: string;
  patch: Partial<
    Pick<
      SemanticMemoryRule,
      | "rule"
      | "category"
      | "confidence"
      | "scope"
      | "supportingEpisodes"
      | "contradictingEpisodes"
      | "userConfirmed"
      | "userModified"
    >
  >;
};
type SemanticConflictResolvePayload = {
  projectId: string;
  conflictId: string;
  chosenRuleId: string;
};
type SemanticDeletePayload = { projectId: string; ruleId: string };
type SemanticPromotePayload = { projectId: string; ruleId: string };
type ClearProjectPayload = { projectId: string; confirmed: boolean };
type ClearAllPayload = { confirmed: boolean };
type SemanticDistillPayload = { projectId: string; trigger?: DistillTrigger };
type TraceGetPayload = { projectId: string; generationId: string };
type TraceFeedbackPayload = {
  projectId: string;
  generationId: string;
  verdict: "correct" | "incorrect";
  reason?: string;
};

function tryGetSender(event: unknown): WebContents | null {
  if (!event || typeof event !== "object") {
    return null;
  }
  const maybeSender = (event as { sender?: unknown }).sender;
  if (!maybeSender || typeof maybeSender !== "object") {
    return null;
  }
  const typed = maybeSender as {
    id?: unknown;
    send?: (channel: string, payload: unknown) => void;
  };
  if (typeof typed.id !== "number" || typeof typed.send !== "function") {
    return null;
  }
  return maybeSender as WebContents;
}

type HandleWithProjectAccessFn = <TPayload, TResponse>(
  channel: string,
  listener: (
    event: unknown,
    payload: TPayload,
  ) => Promise<IpcResponse<TResponse>>,
) => void;

function registerMemoryEntryHandlers(ctx: {
  db: Database.Database | null;
  logger: Logger;
  handleWithProjectAccess: HandleWithProjectAccessFn;
}): void {
  const { db, logger, handleWithProjectAccess } = ctx;

  handleWithProjectAccess(
    "memory:entry:create",
    async (
      _e,
      payload: MemoryCreatePayload,
    ): Promise<IpcResponse<UserMemoryItem>> => {
      if (!db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createMemoryService({ db, logger });
      const res = svc.create(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:entry:list",
    async (
      _e,
      payload: MemoryListPayload,
    ): Promise<IpcResponse<{ items: UserMemoryItem[] }>> => {
      if (!db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createMemoryService({ db, logger });
      const res = svc.list(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:entry:update",
    async (
      _e,
      payload: MemoryUpdatePayload,
    ): Promise<IpcResponse<UserMemoryItem>> => {
      if (!db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createMemoryService({ db, logger });
      const res = svc.update({
        memoryId: payload.memoryId,
        patch: payload.patch,
      });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:entry:delete",
    async (
      _e,
      payload: MemoryDeletePayload,
    ): Promise<IpcResponse<{ deleted: true }>> => {
      if (!db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createMemoryService({ db, logger });
      const res = svc.delete({ memoryId: payload.memoryId });
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:settings:get",
    async (): Promise<IpcResponse<MemorySettings>> => {
      if (!db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createMemoryService({ db, logger });
      const res = svc.getSettings();
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:settings:update",
    async (
      _e,
      payload: { patch: Partial<MemorySettings> },
    ): Promise<IpcResponse<MemorySettings>> => {
      if (!db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createMemoryService({ db, logger });
      const res = svc.updateSettings(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:injection:preview",
    async (
      _e,
      payload: { projectId?: string; documentId?: string; queryText?: string },
    ): Promise<IpcResponse<MemoryInjectionPreview>> => {
      if (!db) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      const svc = createMemoryService({ db, logger });
      const res = svc.previewInjection(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}

// eslint-disable-next-line max-lines-per-function -- Handler registration groups related memory IPC channels in one place.
function registerMemoryEpisodicAndTraceHandlers(ctx: {
  episodicService: EpisodicMemoryService | null;
  traceService: MemoryTraceService;
  rememberSender: (event: unknown) => void;
  handleWithProjectAccess: HandleWithProjectAccessFn;
}): void {
  const {
    episodicService,
    traceService,
    rememberSender,
    handleWithProjectAccess,
  } = ctx;

  handleWithProjectAccess(
    "memory:episode:record",
    async (
      e,
      payload: EpisodeRecordPayload,
    ): Promise<
      IpcResponse<{
        accepted: true;
        episodeId: string;
        retryCount: number;
        implicitSignal:
          | "DIRECT_ACCEPT"
          | "LIGHT_EDIT"
          | "HEAVY_REWRITE"
          | "FULL_REJECT"
          | "UNDO_AFTER_ACCEPT"
          | "REPEATED_SCENE_SKILL";
        implicitWeight: number;
      }>
    > => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      rememberSender(e);
      const res = await episodicService.recordEpisode(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:episode:query",
    async (
      e,
      payload: EpisodeQueryPayload,
    ): Promise<
      IpcResponse<{
        items: EpisodeRecord[];
        memoryDegraded: boolean;
        fallbackRules: string[];
        semanticRules: SemanticMemoryRulePlaceholder[];
      }>
    > => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }

      rememberSender(e);
      const res = episodicService.queryEpisodes(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:semantic:list",
    async (
      e,
      payload: SemanticListPayload,
    ): Promise<
      IpcResponse<{
        items: SemanticMemoryRule[];
        conflictQueue: Array<{ id: string; ruleIds: string[]; status: string }>;
      }>
    > => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.listSemanticMemory(payload);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      return {
        ok: true,
        data: {
          items: res.data.items,
          conflictQueue: res.data.conflictQueue.map((item) => ({
            id: item.id,
            ruleIds: [...item.ruleIds],
            status: item.status,
          })),
        },
      };
    },
  );

  handleWithProjectAccess(
    "memory:semantic:add",
    async (
      e,
      payload: SemanticAddPayload,
    ): Promise<IpcResponse<{ item: SemanticMemoryRule }>> => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.addSemanticMemory(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:semantic:update",
    async (
      e,
      payload: SemanticUpdatePayload,
    ): Promise<IpcResponse<{ item: SemanticMemoryRule }>> => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.updateSemanticMemory(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:conflict:resolve",
    async (
      e,
      payload: SemanticConflictResolvePayload,
    ): Promise<
      IpcResponse<{
        item: { id: string; ruleIds: string[]; status: "pending" | "resolved" };
        keptRule: SemanticMemoryRule;
      }>
    > => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.resolveSemanticConflict(payload);
      if (!res.ok) {
        return { ok: false, error: res.error };
      }
      return {
        ok: true,
        data: {
          item: {
            id: res.data.item.id,
            ruleIds: [...res.data.item.ruleIds],
            status: res.data.item.status,
          },
          keptRule: res.data.keptRule,
        },
      };
    },
  );

  handleWithProjectAccess(
    "memory:semantic:delete",
    async (
      e,
      payload: SemanticDeletePayload,
    ): Promise<IpcResponse<{ deleted: true }>> => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.deleteSemanticMemory(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:scope:promote",
    async (
      e,
      payload: SemanticPromotePayload,
    ): Promise<IpcResponse<{ item: SemanticMemoryRule }>> => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.promoteSemanticMemory(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:clear:project",
    async (
      e,
      payload: ClearProjectPayload,
    ): Promise<
      IpcResponse<{ ok: true; deletedEpisodes: number; deletedRules: number }>
    > => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.clearProjectMemory(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:clear:all",
    async (
      e,
      payload: ClearAllPayload,
    ): Promise<
      IpcResponse<{ ok: true; deletedEpisodes: number; deletedRules: number }>
    > => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = episodicService.clearAllMemory(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:semantic:distill",
    async (
      e,
      payload: SemanticDistillPayload,
    ): Promise<IpcResponse<{ accepted: true; runId: string }>> => {
      if (!episodicService) {
        return {
          ok: false,
          error: { code: "DB_ERROR", message: "Database not ready" },
        };
      }
      rememberSender(e);
      const res = await episodicService.distillSemanticMemory(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:trace:get",
    async (
      e,
      payload: TraceGetPayload,
    ): Promise<IpcResponse<{ trace: GenerationTrace }>> => {
      rememberSender(e);
      const res = traceService.getTrace(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );

  handleWithProjectAccess(
    "memory:trace:feedback",
    async (
      e,
      payload: TraceFeedbackPayload,
    ): Promise<IpcResponse<{ accepted: true; feedbackId: string }>> => {
      rememberSender(e);
      const res = traceService.recordFeedback(payload);
      return res.ok
        ? { ok: true, data: res.data }
        : { ok: false, error: res.error };
    },
  );
}

/**
 * Register `memory:*` IPC handlers.
 */
export function registerMemoryIpcHandlers(deps: {
  ipcMain: IpcMain;
  db: Database.Database | null;
  logger: Logger;
  episodicService?: EpisodicMemoryService;
  distillLlm?: (args: {
    projectId: string;
    trigger: DistillTrigger;
    snapshotEpisodes: EpisodeRecord[];
    clusters: Array<{
      sceneType: string;
      skillUsed: string;
      episodes: EpisodeRecord[];
    }>;
  }) => DistillGeneratedRule[];
  distillScheduler?: (job: () => void) => void;
  traceService?: MemoryTraceService;
  projectSessionBinding?: ProjectSessionBindingRegistry;
}): void {
  const distillSubscribers = new Map<number, WebContents>();

  function rememberSender(event: unknown): void {
    const sender = tryGetSender(event);
    if (!sender) {
      return;
    }
    distillSubscribers.set(sender.id, sender);
  }

  function broadcastDistillProgress(event: DistillProgressEvent): void {
    for (const [senderId, sender] of distillSubscribers) {
      try {
        sender.send("memory:distill:progress", event);
      } catch (error) {
        distillSubscribers.delete(senderId);
        deps.logger.error("memory_distill_progress_send_failed", {
          senderId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const episodicService =
    deps.episodicService ??
    (deps.db
      ? createEpisodicMemoryService({
          repository: createSqliteEpisodeRepository({
            db: deps.db,
            logger: deps.logger,
          }),
          logger: deps.logger,
          distillLlm: deps.distillLlm,
          distillScheduler: deps.distillScheduler,
          onDistillProgress: broadcastDistillProgress,
        })
      : null);
  const traceService = deps.traceService ?? createInMemoryMemoryTraceService();

  function handleWithProjectAccess<TPayload, TResponse>(
    channel: string,
    listener: (
      event: unknown,
      payload: TPayload,
    ) => Promise<IpcResponse<TResponse>>,
  ): void {
    deps.ipcMain.handle(channel, async (event, payload) => {
      const guarded = guardAndNormalizeProjectAccess({
        event,
        payload,
        projectSessionBinding: deps.projectSessionBinding,
      });
      if (!guarded.ok) {
        return guarded.response as IpcResponse<TResponse>;
      }
      return listener(event, payload as TPayload);
    });
  }

  registerMemoryEntryHandlers({
    db: deps.db,
    logger: deps.logger,
    handleWithProjectAccess,
  });

  registerMemoryEpisodicAndTraceHandlers({
    episodicService,
    traceService,
    rememberSender,
    handleWithProjectAccess,
  });
}
