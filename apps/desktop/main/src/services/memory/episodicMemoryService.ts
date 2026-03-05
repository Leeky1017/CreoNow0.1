import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { IpcErrorCode } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import { createKeyedMutex } from "../shared/concurrency";
import {
  IMPLICIT_SIGNAL_WEIGHTS,
  assembleMemoryLayers,
  calculateDecayScore,
  classifyDecayLevel,
  resolveImplicitFeedback,
} from "./episodicMemoryHelpers";
import { ipcError, type ServiceResult, type Err } from "../shared/ipcResult";
export type { ServiceResult };

export {
  IMPLICIT_SIGNAL_WEIGHTS,
  assembleMemoryLayers,
  calculateDecayScore,
  classifyDecayLevel,
  resolveImplicitFeedback,
};

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_WRITE_ATTEMPTS = 3;
const MIN_RECALL_LIMIT = 3;
const MAX_RECALL_LIMIT = 5;
const DISTILL_BATCH_TRIGGER_SIZE = 50;
const CONFLICT_RECENT_WINDOW_DAYS = 30;
const TO_COMPRESS_THRESHOLD_DAYS = 14;
const SEMANTIC_DECAY_FACTOR = 0.98;

export const EPISODIC_ACTIVE_BUDGET = 1_000;
export const EPISODIC_COMPRESSED_BUDGET = 5_000;
export const SEMANTIC_RULE_BUDGET = 200;

const EPISODIC_TTL_DAYS = 180;
const COMPRESSED_TTL_DAYS = 365;
const DEGRADE_EVENT_VECTOR_OFFLINE = "MEMORY_DEGRADE_VECTOR_OFFLINE";
const DEGRADE_EVENT_DISTILL_IO_FAILED = "MEMORY_DEGRADE_DISTILL_IO_FAILED";
const DEGRADE_EVENT_ALL_MEMORY_UNAVAILABLE =
  "MEMORY_DEGRADE_ALL_MEMORY_UNAVAILABLE";

export type DecayLevel = "active" | "decaying" | "to_compress" | "to_evict";
export type DistillTrigger = "batch" | "idle" | "manual" | "conflict";
export type DistillProgressStage =
  | "started"
  | "clustered"
  | "patterned"
  | "generated"
  | "completed"
  | "failed";

export type SemanticMemoryCategory =
  | "style"
  | "structure"
  | "character"
  | "pacing"
  | "vocabulary";

export type SemanticMemoryScope = "global" | "project";

export type DistillProgressEvent = {
  runId: string;
  projectId: string;
  trigger: DistillTrigger;
  stage: DistillProgressStage;
  progress: number;
  message?: string;
  errorCode?: IpcErrorCode;
};

export type ImplicitSignal =
  | "DIRECT_ACCEPT"
  | "LIGHT_EDIT"
  | "HEAVY_REWRITE"
  | "FULL_REJECT"
  | "UNDO_AFTER_ACCEPT"
  | "REPEATED_SCENE_SKILL";

export type WorkingMemoryLayerItem = {
  id: string;
  projectId: string;
  sessionId: string;
  kind: string;
  tokenCount: number;
  importance: number;
  createdAt: number;
  updatedAt: number;
  content: string;
};

export type EpisodeRecord = {
  id: string;
  projectId: string;
  scope: "project";
  version: 1;
  chapterId: string;
  sceneType: string;
  skillUsed: string;
  inputContext: string;
  candidates: string[];
  selectedIndex: number;
  finalText: string;
  explicit?: string;
  editDistance: number;
  implicitSignal: ImplicitSignal;
  implicitWeight: number;
  importance: number;
  recallCount: number;
  lastRecalledAt?: number;
  compressed: boolean;
  userConfirmed: boolean;
  decayScore?: number;
  decayLevel?: DecayLevel;
  createdAt: number;
  updatedAt: number;
};

export type SemanticMemoryRulePlaceholder = {
  id: string;
  projectId: string;
  scope: SemanticMemoryScope;
  version: 1;
  rule: string;
  confidence: number;
  createdAt: number;
  updatedAt: number;
};

export type SemanticMemoryRule = {
  id: string;
  projectId: string;
  scope: SemanticMemoryScope;
  version: 1;
  rule: string;
  category: SemanticMemoryCategory;
  confidence: number;
  supportingEpisodes: string[];
  contradictingEpisodes: string[];
  userConfirmed: boolean;
  userModified: boolean;
  recentlyUpdated?: boolean;
  conflictMarked?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SemanticConflictQueueItem = {
  id: string;
  projectId: string;
  ruleIds: string[];
  reason: "direct_contradiction";
  status: "pending" | "resolved";
  createdAt: number;
  updatedAt: number;
};

export type DistillGeneratedRule = {
  rule: string;
  category: SemanticMemoryCategory;
  confidence: number;
  supportingEpisodes: string[];
  contradictingEpisodes: string[];
  scope?: SemanticMemoryScope;
};

export type MemoryLayerAssembly = {
  immediate: {
    projectId: string;
    sessionId: string;
    items: WorkingMemoryLayerItem[];
  };
  episodic: {
    items: EpisodeRecord[];
  };
  settings: {
    rules: SemanticMemoryRulePlaceholder[];
    memoryDegraded: boolean;
    fallbackRules: string[];
  };
};

export type EpisodeRecordInput = {
  projectId: string;
  chapterId: string;
  sceneType: string;
  skillUsed: string;
  inputContext: string;
  candidates: string[];
  selectedIndex: number;
  finalText: string;
  explicit?: string;
  editDistance: number;
  importance?: number;
  acceptedWithoutEdit?: boolean;
  undoAfterAccept?: boolean;
  repeatedSceneSkillCount?: number;
  userConfirmed?: boolean;
  targetEpisodeId?: string;
};

export type EpisodeQueryInput = {
  projectId: string;
  sceneType: string;
  queryText?: string;
  limit?: number;
};

export type EpisodeRepository = {
  insertEpisode: (episode: EpisodeRecord) => void | Promise<void>;
  updateEpisodeSignal: (args: {
    episodeId: string;
    signal: ImplicitSignal;
    weight: number;
    updatedAt: number;
  }) => boolean;
  listEpisodesByScene: (args: {
    projectId: string;
    sceneType: string;
    includeCompressed: boolean;
  }) => EpisodeRecord[];
  listEpisodesByProject: (args: {
    projectId: string;
    includeCompressed: boolean;
  }) => EpisodeRecord[];
  markEpisodesRecalled: (args: { ids: string[]; recalledAt: number }) => void;
  countEpisodes: (args: { projectId: string; compressed: boolean }) => number;
  deleteExpiredEpisodes: (args: {
    projectId: string;
    compressed: boolean;
    beforeTs: number;
  }) => number;
  deleteLruEpisodes: (args: {
    projectId: string;
    compressed: boolean;
    overflow: number;
  }) => number;
  compressEpisodes: (args: { projectId: string; beforeTs: number }) => number;
  purgeCompressedEpisodes: (args: {
    projectId: string;
    beforeTs: number;
    overflow: number;
  }) => number;
  listSemanticPlaceholders: (args: {
    projectId: string;
    includeGlobal: boolean;
    limit: number;
  }) => SemanticMemoryRulePlaceholder[];
  upsertSemanticPlaceholder: (rule: SemanticMemoryRulePlaceholder) => void;
  deleteSemanticPlaceholder: (args: {
    projectId?: string;
    ruleId: string;
    scope?: SemanticMemoryScope;
  }) => boolean;
  clearEpisodesByProject: (args: { projectId: string }) => number;
  clearAllEpisodes: () => number;
  clearSemanticPlaceholdersByProject: (args: { projectId: string }) => number;
  clearAllSemanticPlaceholders: () => number;
};

export type EpisodicMemoryService = {
  recordEpisode: (args: EpisodeRecordInput) => Promise<ServiceResult<{
    accepted: true;
    episodeId: string;
    retryCount: number;
    implicitSignal: ImplicitSignal;
    implicitWeight: number;
  }>>;
  queryEpisodes: (args: EpisodeQueryInput) => ServiceResult<{
    items: EpisodeRecord[];
    memoryDegraded: boolean;
    fallbackRules: string[];
    semanticRules: SemanticMemoryRulePlaceholder[];
  }>;
  realtimeEvictionTrigger: (args: { projectId: string }) => ServiceResult<{
    deleted: number;
  }>;
  dailyDecayRecomputeTrigger: () => ServiceResult<{ updated: number }>;
  weeklyCompressTrigger: (args: { projectId: string }) => ServiceResult<{
    compressed: number;
  }>;
  monthlyPurgeTrigger: (args: { projectId: string }) => ServiceResult<{
    deleted: number;
  }>;
  getRetryQueueSize: () => number;
  listSemanticMemory: (args: { projectId: string }) => ServiceResult<{
    items: SemanticMemoryRule[];
    conflictQueue: SemanticConflictQueueItem[];
  }>;
  addSemanticMemory: (args: {
    projectId: string;
    rule: string;
    category: SemanticMemoryCategory;
    confidence: number;
    scope?: SemanticMemoryScope;
    supportingEpisodes?: string[];
    contradictingEpisodes?: string[];
    userConfirmed?: boolean;
    userModified?: boolean;
  }) => ServiceResult<{ item: SemanticMemoryRule }>;
  updateSemanticMemory: (args: {
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
  }) => ServiceResult<{ item: SemanticMemoryRule }>;
  deleteSemanticMemory: (args: {
    projectId: string;
    ruleId: string;
  }) => ServiceResult<{ deleted: true }>;
  promoteSemanticMemory: (args: {
    projectId: string;
    ruleId: string;
  }) => ServiceResult<{ item: SemanticMemoryRule }>;
  clearProjectMemory: (args: {
    projectId: string;
    confirmed: boolean;
  }) => ServiceResult<{
    ok: true;
    deletedEpisodes: number;
    deletedRules: number;
  }>;
  clearAllMemory: (args: { confirmed: boolean }) => ServiceResult<{
    ok: true;
    deletedEpisodes: number;
    deletedRules: number;
  }>;
  distillSemanticMemory: (args: {
    projectId: string;
    trigger?: DistillTrigger;
  }) => Promise<ServiceResult<{ accepted: true; runId: string }>>;
  listConflictQueue: (args: {
    projectId: string;
  }) => ServiceResult<{ items: SemanticConflictQueueItem[] }>;
};

export type InMemoryEpisodeRepository = EpisodeRepository & {
  seedEpisodes: (episodes: EpisodeRecord[]) => void;
  dump: () => {
    episodes: EpisodeRecord[];
    semanticRules: SemanticMemoryRulePlaceholder[];
  };
};

/**
 * Compute lexical overlap score for mixed recall ranking.
 *
 * Why: P0 only needs a deterministic semantic approximation without LLM/vector dependencies.
 */
function lexicalOverlapScore(queryText: string, sourceText: string): number {
  const queryTokens = queryText
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 0);

  if (queryTokens.length === 0) {
    return 0;
  }

  const sourceTokens = new Set(
    sourceText
      .toLowerCase()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter((token) => token.length > 0),
  );

  let hit = 0;
  const sourceLower = sourceText.toLowerCase();
  for (const token of queryTokens) {
    if (sourceLower.includes(token) || sourceTokens.has(token)) {
      hit += 1;
    }
  }
  return hit / queryTokens.length;
}

/**
 * Clamp recall size to the Spec-defined 3-5 range.
 *
 * Why: callers should never accidentally over-fetch and break prompt token budgets.
 */
function normalizeRecallLimit(limit: number | undefined): number {
  if (typeof limit !== "number" || !Number.isFinite(limit)) {
    return MAX_RECALL_LIMIT;
  }
  const rounded = Math.trunc(limit);
  if (rounded < MIN_RECALL_LIMIT) {
    return MIN_RECALL_LIMIT;
  }
  if (rounded > MAX_RECALL_LIMIT) {
    return MAX_RECALL_LIMIT;
  }
  return rounded;
}

/**
 * Build an in-memory episode repository for deterministic unit/integration tests.
 *
 * Why: service logic should be testable without native SQLite dependencies.
 */
export function createInMemoryEpisodeRepository(args?: {
  failInsertAttempts?: number;
}): InMemoryEpisodeRepository {
  const episodes: EpisodeRecord[] = [];
  const semanticRules: SemanticMemoryRulePlaceholder[] = [];
  let failInsertAttempts = Math.max(0, args?.failInsertAttempts ?? 0);

  function sortLruCandidates(items: EpisodeRecord[]): EpisodeRecord[] {
    return [...items].sort((a, b) => {
      if (a.importance !== b.importance) {
        return a.importance - b.importance;
      }
      if (a.recallCount !== b.recallCount) {
        return a.recallCount - b.recallCount;
      }
      const aRecall = a.lastRecalledAt ?? 0;
      const bRecall = b.lastRecalledAt ?? 0;
      if (aRecall !== bRecall) {
        return aRecall - bRecall;
      }
      if (a.createdAt !== b.createdAt) {
        return a.createdAt - b.createdAt;
      }
      return a.id.localeCompare(b.id);
    });
  }

  return {
    insertEpisode: (episode) => {
      if (failInsertAttempts > 0) {
        failInsertAttempts -= 1;
        throw new Error("mock insert failed");
      }
      episodes.push({ ...episode, candidates: [...episode.candidates] });
    },
    updateEpisodeSignal: ({ episodeId, signal, weight, updatedAt }) => {
      const item = episodes.find((episode) => episode.id === episodeId);
      if (!item) {
        return false;
      }
      item.implicitSignal = signal;
      item.implicitWeight = weight;
      item.updatedAt = updatedAt;
      return true;
    },
    listEpisodesByScene: ({ projectId, sceneType, includeCompressed }) => {
      return episodes
        .filter((episode) => episode.projectId === projectId)
        .filter((episode) => episode.sceneType === sceneType)
        .filter((episode) => (includeCompressed ? true : !episode.compressed))
        .map((episode) => ({
          ...episode,
          candidates: [...episode.candidates],
        }));
    },
    listEpisodesByProject: ({ projectId, includeCompressed }) => {
      return episodes
        .filter((episode) => episode.projectId === projectId)
        .filter((episode) => (includeCompressed ? true : !episode.compressed));
    },
    markEpisodesRecalled: ({ ids, recalledAt }) => {
      const set = new Set(ids);
      for (const item of episodes) {
        if (!set.has(item.id)) {
          continue;
        }
        item.recallCount += 1;
        item.lastRecalledAt = recalledAt;
        item.updatedAt = recalledAt;
      }
    },
    countEpisodes: ({ projectId, compressed }) => {
      return episodes.filter(
        (episode) =>
          episode.projectId === projectId && episode.compressed === compressed,
      ).length;
    },
    deleteExpiredEpisodes: ({ projectId, compressed, beforeTs }) => {
      const beforeSize = episodes.length;
      const keep = episodes.filter((episode) => {
        if (episode.projectId !== projectId) {
          return true;
        }
        if (episode.compressed !== compressed) {
          return true;
        }
        if (episode.userConfirmed) {
          return true;
        }
        return episode.createdAt >= beforeTs;
      });
      episodes.splice(0, episodes.length, ...keep);
      return beforeSize - keep.length;
    },
    deleteLruEpisodes: ({ projectId, compressed, overflow }) => {
      if (overflow <= 0) {
        return 0;
      }
      const candidates = sortLruCandidates(
        episodes.filter(
          (episode) =>
            episode.projectId === projectId &&
            episode.compressed === compressed &&
            !episode.userConfirmed,
        ),
      );
      const toDelete = new Set(
        candidates.slice(0, overflow).map((item) => item.id),
      );
      if (toDelete.size === 0) {
        return 0;
      }
      const beforeSize = episodes.length;
      const keep = episodes.filter((episode) => !toDelete.has(episode.id));
      episodes.splice(0, episodes.length, ...keep);
      return beforeSize - keep.length;
    },
    compressEpisodes: ({ projectId, beforeTs }) => {
      let compressed = 0;
      for (const episode of episodes) {
        if (episode.projectId !== projectId) {
          continue;
        }
        if (episode.compressed) {
          continue;
        }
        if (episode.userConfirmed) {
          continue;
        }
        if (episode.createdAt >= beforeTs) {
          continue;
        }

        episode.compressed = true;
        episode.candidates = [];
        episode.inputContext = episode.inputContext.slice(0, 800);
        episode.finalText = episode.finalText.slice(0, 800);
        compressed += 1;
      }
      return compressed;
    },
    purgeCompressedEpisodes: ({ projectId, beforeTs, overflow }) => {
      const beforeSize = episodes.length;

      let keep = episodes.filter((episode) => {
        if (episode.projectId !== projectId) {
          return true;
        }
        if (!episode.compressed) {
          return true;
        }
        if (episode.userConfirmed) {
          return true;
        }
        return episode.createdAt >= beforeTs;
      });

      if (overflow > 0) {
        const candidates = sortLruCandidates(
          keep.filter(
            (episode) =>
              episode.projectId === projectId &&
              episode.compressed &&
              !episode.userConfirmed,
          ),
        );
        const overflowDelete = new Set(
          candidates.slice(0, overflow).map((item) => item.id),
        );
        keep = keep.filter((episode) => !overflowDelete.has(episode.id));
      }

      episodes.splice(0, episodes.length, ...keep);
      return beforeSize - keep.length;
    },
    listSemanticPlaceholders: ({ projectId, includeGlobal, limit }) => {
      return semanticRules
        .filter((rule) =>
          includeGlobal
            ? rule.scope === "global" || rule.projectId === projectId
            : rule.projectId === projectId && rule.scope === "project",
        )
        .slice(0, limit)
        .map((rule) => ({ ...rule }));
    },
    upsertSemanticPlaceholder: (rule) => {
      const idx = semanticRules.findIndex((item) => item.id === rule.id);
      if (idx >= 0) {
        semanticRules[idx] = { ...rule };
        return;
      }
      semanticRules.push({ ...rule });
    },
    deleteSemanticPlaceholder: ({ projectId, ruleId, scope }) => {
      const before = semanticRules.length;
      const keep = semanticRules.filter((rule) => {
        if (rule.id !== ruleId) {
          return true;
        }
        if (projectId !== undefined && rule.projectId !== projectId) {
          return true;
        }
        if (scope !== undefined && rule.scope !== scope) {
          return true;
        }
        return false;
      });
      semanticRules.splice(0, semanticRules.length, ...keep);
      return before !== keep.length;
    },
    clearEpisodesByProject: ({ projectId }) => {
      const before = episodes.length;
      const keep = episodes.filter(
        (episode) => episode.projectId !== projectId,
      );
      episodes.splice(0, episodes.length, ...keep);
      return before - keep.length;
    },
    clearAllEpisodes: () => {
      const before = episodes.length;
      episodes.splice(0, episodes.length);
      return before;
    },
    clearSemanticPlaceholdersByProject: ({ projectId }) => {
      const before = semanticRules.length;
      const keep = semanticRules.filter(
        (rule) => !(rule.projectId === projectId && rule.scope === "project"),
      );
      semanticRules.splice(0, semanticRules.length, ...keep);
      return before - keep.length;
    },
    clearAllSemanticPlaceholders: () => {
      const before = semanticRules.length;
      semanticRules.splice(0, semanticRules.length);
      return before;
    },
    seedEpisodes: (seed) => {
      episodes.splice(0, episodes.length, ...seed.map((item) => ({ ...item })));
    },
    dump: () => ({
      episodes: episodes.map((item) => ({
        ...item,
        candidates: [...item.candidates],
      })),
      semanticRules: semanticRules.map((rule) => ({ ...rule })),
    }),
  };
}

type EpisodeRow = {
  id: string;
  projectId: string;
  scope: string;
  version: number;
  chapterId: string;
  sceneType: string;
  skillUsed: string;
  inputContext: string;
  candidatesJson: string;
  selectedIndex: number;
  finalText: string;
  explicit: string | null;
  editDistance: number;
  implicitSignal: string;
  implicitWeight: number;
  importance: number;
  recallCount: number;
  lastRecalledAt: number | null;
  compressed: number;
  userConfirmed: number;
  createdAt: number;
  updatedAt: number;
};

type SemanticPlaceholderRow = {
  id: string;
  projectId: string;
  scope: string;
  version: number;
  rule: string;
  confidence: number;
  createdAt: number;
  updatedAt: number;
};

/**
 * Map database rows into typed episode records.
 *
 * Why: DB payload validation must happen at boundaries before IPC exposure.
 */
function rowToEpisode(row: EpisodeRow): EpisodeRecord | null {
  const signal = row.implicitSignal as ImplicitSignal;
  if (!(signal in IMPLICIT_SIGNAL_WEIGHTS)) {
    return null;
  }
  if (row.scope !== "project") {
    return null;
  }
  if (row.version !== 1) {
    return null;
  }

  let candidates: string[] = [];
  try {
    const parsed = JSON.parse(row.candidatesJson) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      candidates = parsed;
    }
  } catch {
    candidates = [];
  }

  return {
    id: row.id,
    projectId: row.projectId,
    scope: "project",
    version: 1,
    chapterId: row.chapterId,
    sceneType: row.sceneType,
    skillUsed: row.skillUsed,
    inputContext: row.inputContext,
    candidates,
    selectedIndex: row.selectedIndex,
    finalText: row.finalText,
    explicit: row.explicit ?? undefined,
    editDistance: row.editDistance,
    implicitSignal: signal,
    implicitWeight: row.implicitWeight,
    importance: row.importance,
    recallCount: row.recallCount,
    lastRecalledAt: row.lastRecalledAt ?? undefined,
    compressed: row.compressed === 1,
    userConfirmed: row.userConfirmed === 1,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Build a SQLite-backed episode repository.
 *
 * Why: production P0 requires persistent episodic storage and indexed recall paths.
 */
export function createSqliteEpisodeRepository(args: {
  db: Database.Database;
  logger: Logger;
}): EpisodeRepository {
  return {
    insertEpisode: (episode) => {
      args.db
        .prepare(
          "INSERT INTO memory_episodes (episode_id, project_id, scope, version, chapter_id, scene_type, skill_used, input_context, candidates_json, selected_index, final_text, explicit_feedback, edit_distance, implicit_signal, implicit_weight, importance, recall_count, last_recalled_at, compressed, user_confirmed, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .run(
          episode.id,
          episode.projectId,
          episode.scope,
          episode.version,
          episode.chapterId,
          episode.sceneType,
          episode.skillUsed,
          episode.inputContext,
          JSON.stringify(episode.candidates),
          episode.selectedIndex,
          episode.finalText,
          episode.explicit ?? null,
          episode.editDistance,
          episode.implicitSignal,
          episode.implicitWeight,
          episode.importance,
          episode.recallCount,
          episode.lastRecalledAt ?? null,
          episode.compressed ? 1 : 0,
          episode.userConfirmed ? 1 : 0,
          episode.createdAt,
          episode.updatedAt,
        );
    },
    updateEpisodeSignal: ({ episodeId, signal, weight, updatedAt }) => {
      const result = args.db
        .prepare(
          "UPDATE memory_episodes SET implicit_signal = ?, implicit_weight = ?, updated_at = ? WHERE episode_id = ?",
        )
        .run(signal, weight, updatedAt, episodeId);
      return result.changes > 0;
    },
    listEpisodesByScene: ({ projectId, sceneType, includeCompressed }) => {
      const rows = args.db
        .prepare<
          [string, string, number],
          EpisodeRow
        >("SELECT episode_id as id, project_id as projectId, scope, version, chapter_id as chapterId, scene_type as sceneType, skill_used as skillUsed, input_context as inputContext, candidates_json as candidatesJson, selected_index as selectedIndex, final_text as finalText, explicit_feedback as explicit, edit_distance as editDistance, implicit_signal as implicitSignal, implicit_weight as implicitWeight, importance, recall_count as recallCount, last_recalled_at as lastRecalledAt, compressed, user_confirmed as userConfirmed, created_at as createdAt, updated_at as updatedAt FROM memory_episodes WHERE project_id = ? AND scene_type = ? AND (? = 1 OR compressed = 0)")
        .all(projectId, sceneType, includeCompressed ? 1 : 0);

      const parsed: EpisodeRecord[] = [];
      for (const row of rows) {
        const episode = rowToEpisode(row);
        if (episode) {
          parsed.push(episode);
        }
      }
      return parsed;
    },
    listEpisodesByProject: ({ projectId, includeCompressed }) => {
      const rows = args.db
        .prepare<
          [string, number],
          EpisodeRow
        >("SELECT episode_id as id, project_id as projectId, scope, version, chapter_id as chapterId, scene_type as sceneType, skill_used as skillUsed, input_context as inputContext, candidates_json as candidatesJson, selected_index as selectedIndex, final_text as finalText, explicit_feedback as explicit, edit_distance as editDistance, implicit_signal as implicitSignal, implicit_weight as implicitWeight, importance, recall_count as recallCount, last_recalled_at as lastRecalledAt, compressed, user_confirmed as userConfirmed, created_at as createdAt, updated_at as updatedAt FROM memory_episodes WHERE project_id = ? AND (? = 1 OR compressed = 0)")
        .all(projectId, includeCompressed ? 1 : 0);

      const parsed: EpisodeRecord[] = [];
      for (const row of rows) {
        const episode = rowToEpisode(row);
        if (episode) {
          parsed.push(episode);
        }
      }
      return parsed;
    },
    markEpisodesRecalled: ({ ids, recalledAt }) => {
      if (ids.length === 0) {
        return;
      }
      const stmt = args.db.prepare(
        "UPDATE memory_episodes SET recall_count = recall_count + 1, last_recalled_at = ?, updated_at = ? WHERE episode_id = ?",
      );
      const tx = args.db.transaction((episodeIds: string[]) => {
        for (const episodeId of episodeIds) {
          stmt.run(recalledAt, recalledAt, episodeId);
        }
      });
      tx(ids);
    },
    countEpisodes: ({ projectId, compressed }) => {
      const row = args.db
        .prepare<
          [string, number],
          { count: number }
        >("SELECT COUNT(*) as count FROM memory_episodes WHERE project_id = ? AND compressed = ?")
        .get(projectId, compressed ? 1 : 0);
      return row?.count ?? 0;
    },
    deleteExpiredEpisodes: ({ projectId, compressed, beforeTs }) => {
      const result = args.db
        .prepare(
          "DELETE FROM memory_episodes WHERE project_id = ? AND compressed = ? AND created_at < ? AND user_confirmed = 0",
        )
        .run(projectId, compressed ? 1 : 0, beforeTs);
      return result.changes;
    },
    deleteLruEpisodes: ({ projectId, compressed, overflow }) => {
      if (overflow <= 0) {
        return 0;
      }
      const ids = args.db
        .prepare<[string, number, number], { id: string }>(
          "SELECT episode_id as id FROM memory_episodes WHERE project_id = ? AND compressed = ? AND user_confirmed = 0 ORDER BY importance ASC, recall_count ASC, COALESCE(last_recalled_at, 0) ASC, created_at ASC LIMIT ?",
        )
        .all(projectId, compressed ? 1 : 0, overflow)
        .map((row) => row.id);
      if (ids.length === 0) {
        return 0;
      }
      const stmt = args.db.prepare(
        "DELETE FROM memory_episodes WHERE episode_id = ?",
      );
      const tx = args.db.transaction((episodeIds: string[]) => {
        let deleted = 0;
        for (const episodeId of episodeIds) {
          const result = stmt.run(episodeId);
          deleted += result.changes;
        }
        return deleted;
      });
      return tx(ids);
    },
    compressEpisodes: ({ projectId, beforeTs }) => {
      const result = args.db
        .prepare(
          "UPDATE memory_episodes SET compressed = 1, candidates_json = '[]', input_context = SUBSTR(input_context, 1, 800), final_text = SUBSTR(final_text, 1, 800) WHERE project_id = ? AND compressed = 0 AND user_confirmed = 0 AND created_at < ?",
        )
        .run(projectId, beforeTs);
      return result.changes;
    },
    purgeCompressedEpisodes: ({ projectId, beforeTs, overflow }) => {
      let deleted = 0;
      deleted += args.db
        .prepare(
          "DELETE FROM memory_episodes WHERE project_id = ? AND compressed = 1 AND user_confirmed = 0 AND created_at < ?",
        )
        .run(projectId, beforeTs).changes;

      if (overflow > 0) {
        const ids = args.db
          .prepare<[string, number], { id: string }>(
            "SELECT episode_id as id FROM memory_episodes WHERE project_id = ? AND compressed = 1 AND user_confirmed = 0 ORDER BY created_at ASC LIMIT ?",
          )
          .all(projectId, overflow)
          .map((row) => row.id);
        if (ids.length > 0) {
          const stmt = args.db.prepare(
            "DELETE FROM memory_episodes WHERE episode_id = ?",
          );
          const tx = args.db.transaction((episodeIds: string[]) => {
            let purged = 0;
            for (const episodeId of episodeIds) {
              purged += stmt.run(episodeId).changes;
            }
            return purged;
          });
          deleted += tx(ids);
        }
      }

      return deleted;
    },
    listSemanticPlaceholders: ({ projectId, includeGlobal, limit }) => {
      const rows = args.db
        .prepare<
          [string, number, number],
          SemanticPlaceholderRow
        >("SELECT rule_id as id, project_id as projectId, scope, version, rule_text as rule, confidence, created_at as createdAt, updated_at as updatedAt FROM memory_semantic_placeholders WHERE (project_id = ? AND scope = 'project') OR (scope = 'global' AND ? = 1) ORDER BY updated_at DESC LIMIT ?")
        .all(projectId, includeGlobal ? 1 : 0, limit);

      return rows
        .filter(
          (row) =>
            (row.scope === "project" || row.scope === "global") &&
            row.version === 1,
        )
        .map((row) => ({
          id: row.id,
          projectId: row.projectId,
          scope: row.scope as SemanticMemoryScope,
          version: 1 as const,
          rule: row.rule,
          confidence: row.confidence,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));
    },
    upsertSemanticPlaceholder: (rule) => {
      args.db
        .prepare(
          "INSERT INTO memory_semantic_placeholders (rule_id, project_id, scope, version, rule_text, confidence, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(rule_id) DO UPDATE SET project_id = excluded.project_id, scope = excluded.scope, version = excluded.version, rule_text = excluded.rule_text, confidence = excluded.confidence, updated_at = excluded.updated_at",
        )
        .run(
          rule.id,
          rule.projectId,
          rule.scope,
          rule.version,
          rule.rule,
          rule.confidence,
          rule.createdAt,
          rule.updatedAt,
        );
    },
    deleteSemanticPlaceholder: ({ projectId, ruleId, scope }) => {
      let sql = "DELETE FROM memory_semantic_placeholders WHERE rule_id = ?";
      const params: Array<string> = [ruleId];
      if (projectId !== undefined) {
        sql += " AND project_id = ?";
        params.push(projectId);
      }
      if (scope !== undefined) {
        sql += " AND scope = ?";
        params.push(scope);
      }
      const result = args.db.prepare(sql).run(...params);
      return result.changes > 0;
    },
    clearEpisodesByProject: ({ projectId }) => {
      const result = args.db
        .prepare("DELETE FROM memory_episodes WHERE project_id = ?")
        .run(projectId);
      return result.changes;
    },
    clearAllEpisodes: () => {
      const result = args.db.prepare("DELETE FROM memory_episodes").run();
      return result.changes;
    },
    clearSemanticPlaceholdersByProject: ({ projectId }) => {
      const result = args.db
        .prepare(
          "DELETE FROM memory_semantic_placeholders WHERE project_id = ? AND scope = 'project'",
        )
        .run(projectId);
      return result.changes;
    },
    clearAllSemanticPlaceholders: () => {
      const result = args.db
        .prepare("DELETE FROM memory_semantic_placeholders")
        .run();
      return result.changes;
    },
  };
}

/**
 * Create episodic memory service with explicit repository injection.
 *
 * Why: P0 logic must be independently testable while keeping SQLite as production SSOT.
 */

type EpisodicServiceArgs = {
  repository: EpisodeRepository;
  logger: Logger;
  now?: () => number;
  semanticRecall?: (args: {
    projectId: string;
    sceneType: string;
    queryText: string;
    limit: number;
    episodes: EpisodeRecord[];
  }) => EpisodeRecord[];
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
  onDistillProgress?: (event: DistillProgressEvent) => void;
};

type EpisodicState = {
  retryQueue: EpisodeRecordInput[];
  knownProjectIds: Set<string>;
  pendingEpisodeCountByProject: Map<string, number>;
  retryPendingByProject: Map<string, boolean>;
  distillingProjects: Set<string>;
  scheduledBatchDistillProjects: Set<string>;
  projectMutex: ReturnType<typeof createKeyedMutex>;
  semanticRulesByProject: Map<string, SemanticMemoryRule[]>;
  conflictQueueByProject: Map<string, SemanticConflictQueueItem[]>;
  distillIoDegradedProjects: Set<string>;
};

type EpisodicSmallHelpers = ReturnType<typeof createEpisodicSmallHelpers>;
type EpisodicExecHelpers = ReturnType<typeof createEpisodicExecHelpers>;

type EpisodicCtx = Pick<EpisodicServiceArgs, 'repository' | 'logger' | 'semanticRecall'> & {
  now: () => number;
} & EpisodicState & EpisodicSmallHelpers & EpisodicExecHelpers;

function createEpisodicSmallHelpers(
  args: EpisodicServiceArgs,
  state: EpisodicState,
  now: () => number,
) {
  const { semanticRulesByProject, conflictQueueByProject } = state;

  function cloneSemanticRule(rule: SemanticMemoryRule): SemanticMemoryRule {
    return {
      ...rule,
      supportingEpisodes: [...rule.supportingEpisodes],
      contradictingEpisodes: [...rule.contradictingEpisodes],
    };
  }

  function cloneConflict(
    conflict: SemanticConflictQueueItem,
  ): SemanticConflictQueueItem {
    return {
      ...conflict,
      ruleIds: [...conflict.ruleIds],
    };
  }

  function toPlaceholder(
    rule: SemanticMemoryRule,
  ): SemanticMemoryRulePlaceholder {
    return {
      id: rule.id,
      projectId: rule.projectId,
      scope: rule.scope,
      version: 1,
      rule: rule.rule,
      confidence: rule.confidence,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }

  function normalizeRuleText(rule: string): string {
    return rule.trim().replace(/\s+/g, " ");
  }

  function isConfidenceInRange(confidence: number): boolean {
    return Number.isFinite(confidence) && confidence >= 0 && confidence <= 1;
  }

  function clampConfidence(confidence: number): number {
    if (!Number.isFinite(confidence)) {
      return 0;
    }
    return Math.max(0, Math.min(1, confidence));
  }

  function isDirectContradiction(a: string, b: string): boolean {
    const textA = normalizeRuleText(a);
    const textB = normalizeRuleText(b);
    const shortVsLong =
      (textA.includes("短句") && textB.includes("长句")) ||
      (textA.includes("长句") && textB.includes("短句"));
    return shortVsLong;
  }

  function emitDistillProgress(event: DistillProgressEvent): void {
    args.onDistillProgress?.(event);
  }

  function logDegradeEvent(
    code:
      | typeof DEGRADE_EVENT_VECTOR_OFFLINE
      | typeof DEGRADE_EVENT_DISTILL_IO_FAILED
      | typeof DEGRADE_EVENT_ALL_MEMORY_UNAVAILABLE,
    details: Record<string, unknown>,
  ): void {
    args.logger.error(code, details);
  }

  function invalidateSemanticCache(projectId?: string): void {
    if (projectId) {
      semanticRulesByProject.delete(projectId);
      return;
    }
    semanticRulesByProject.clear();
  }

  function resolveScopePriority(
    projectId: string,
    rules: SemanticMemoryRule[],
  ): SemanticMemoryRule[] {
    const projectRules = rules.filter(
      (rule) => rule.scope === "project" && rule.projectId === projectId,
    );
    const projectCategories = new Set(
      projectRules.map((rule) => rule.category),
    );
    const globalRules = rules.filter(
      (rule) =>
        rule.scope === "global" && !projectCategories.has(rule.category),
    );
    return [...projectRules, ...globalRules];
  }

  function getSemanticRules(projectId: string): SemanticMemoryRule[] {
    const existing = semanticRulesByProject.get(projectId);
    if (existing) {
      return existing;
    }

    const loaded = args.repository
      .listSemanticPlaceholders({
        projectId,
        includeGlobal: true,
        limit: SEMANTIC_RULE_BUDGET,
      })
      .map((rule) => ({
        id: rule.id,
        projectId: rule.projectId,
        scope: rule.scope,
        version: 1 as const,
        rule: rule.rule,
        category: "style" as const,
        confidence: rule.confidence,
        supportingEpisodes: [],
        contradictingEpisodes: [],
        userConfirmed: false,
        userModified: false,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt,
      }));
    semanticRulesByProject.set(projectId, loaded);
    return loaded;
  }

  function getConflictQueue(projectId: string): SemanticConflictQueueItem[] {
    const existing = conflictQueueByProject.get(projectId);
    if (existing) {
      return existing;
    }
    const created: SemanticConflictQueueItem[] = [];
    conflictQueueByProject.set(projectId, created);
    return created;
  }

  function upsertSemanticRule(
    projectId: string,
    nextRule: SemanticMemoryRule,
  ): SemanticMemoryRule {
    const rules = getSemanticRules(projectId);
    const idx = rules.findIndex((rule) => rule.id === nextRule.id);
    if (idx >= 0) {
      rules[idx] = cloneSemanticRule(nextRule);
    } else {
      rules.push(cloneSemanticRule(nextRule));
    }
    args.repository.upsertSemanticPlaceholder(toPlaceholder(nextRule));
    if (nextRule.scope === "global") {
      invalidateSemanticCache();
    }
    return cloneSemanticRule(nextRule);
  }

  function enqueueConflict(args2: {
    projectId: string;
    ruleIds: string[];
  }): void {
    const queue = getConflictQueue(args2.projectId);
    const ts = now();
    queue.push({
      id: randomUUID(),
      projectId: args2.projectId,
      ruleIds: [...args2.ruleIds],
      reason: "direct_contradiction",
      status: "pending",
      createdAt: ts,
      updatedAt: ts,
    });
  }

  function defaultDistillLlm(args2: {
    projectId: string;
    trigger: DistillTrigger;
    snapshotEpisodes: EpisodeRecord[];
    clusters: Array<{
      sceneType: string;
      skillUsed: string;
      episodes: EpisodeRecord[];
    }>;
  }): DistillGeneratedRule[] {
    const outputs: DistillGeneratedRule[] = [];
    for (const cluster of args2.clusters) {
      if (cluster.episodes.length === 0) {
        continue;
      }
      const shortCount = cluster.episodes.filter(
        (episode) => episode.finalText.length <= 30,
      ).length;
      const shortRatio = shortCount / cluster.episodes.length;
      if (shortRatio >= 0.6) {
        outputs.push({
          rule: `${cluster.sceneType}场景偏好短句`,
          category: "pacing",
          confidence: clampConfidence(0.5 + shortRatio * 0.4),
          supportingEpisodes: cluster.episodes.map((episode) => episode.id),
          contradictingEpisodes: [],
          scope: "project",
        });
      }
    }
    return outputs;
  }


  function fallbackRules(): string[] {
    return [
      "Use concise, coherent narration.",
      "Preserve established character voice.",
      "Prefer scene-consistent pacing.",
    ];
  }

  function validateRecordInput(input: EpisodeRecordInput): Err | null {
    if (input.projectId.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "projectId is required");
    }
    if (input.chapterId.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "chapterId is required");
    }
    if (input.sceneType.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "sceneType is required");
    }
    if (input.skillUsed.trim().length === 0) {
      return ipcError("INVALID_ARGUMENT", "skillUsed is required");
    }
    if (!Number.isFinite(input.editDistance) || input.editDistance < 0) {
      return ipcError("INVALID_ARGUMENT", "editDistance is invalid");
    }
    return null;
  }

  function scoreEpisode(args2: {
    episode: EpisodeRecord;
    queryText: string;
    targetSceneType: string;
    currentTs: number;
  }): number {
    const sceneScore =
      args2.episode.sceneType === args2.targetSceneType ? 1 : 0;
    const semanticScore = lexicalOverlapScore(
      args2.queryText,
      `${args2.episode.inputContext} ${args2.episode.finalText}`,
    );
    const age = Math.max(0, args2.currentTs - args2.episode.createdAt);
    const recencyScore = 1 / (1 + age / DAY_MS);
    return (
      sceneScore * 1.2 +
      semanticScore * 1.3 +
      args2.episode.importance * 0.4 +
      recencyScore * 0.1
    );
  }


  return { cloneSemanticRule, cloneConflict, toPlaceholder, normalizeRuleText, isConfidenceInRange, clampConfidence, isDirectContradiction, emitDistillProgress, logDegradeEvent, invalidateSemanticCache, resolveScopePriority, getSemanticRules, getConflictQueue, upsertSemanticRule, enqueueConflict, defaultDistillLlm, fallbackRules, validateRecordInput, scoreEpisode };
}

function createEpisodicExecHelpers(
  args: EpisodicServiceArgs,
  state: EpisodicState,
  derived: { now: () => number; distillScheduler: (job: () => void) => void; distillLlm: EpisodicServiceArgs['distillLlm'] extends infer T ? NonNullable<T> : never },
  helpers: ReturnType<typeof createEpisodicSmallHelpers>,
) {
  const { knownProjectIds, distillingProjects, distillIoDegradedProjects,
    retryPendingByProject, pendingEpisodeCountByProject,
    scheduledBatchDistillProjects, projectMutex } = state;
  const { now, distillScheduler, distillLlm } = derived;
  const { emitDistillProgress, logDegradeEvent, isConfidenceInRange,
    getSemanticRules, normalizeRuleText, clampConfidence,
    upsertSemanticRule, isDirectContradiction, enqueueConflict } = helpers;

  function buildClusters(projectId: string): Array<{
    sceneType: string;
    skillUsed: string;
    episodes: EpisodeRecord[];
  }> {
    const snapshot = args.repository.listEpisodesByProject({
      projectId,
      includeCompressed: false,
    });
    const grouped = new Map<
      string,
      { sceneType: string; skillUsed: string; episodes: EpisodeRecord[] }
    >();
    for (const episode of snapshot) {
      const key = `${episode.sceneType}::${episode.skillUsed}`;
      const current = grouped.get(key);
      if (current) {
        current.episodes.push(episode);
      } else {
        grouped.set(key, {
          sceneType: episode.sceneType,
          skillUsed: episode.skillUsed,
          episodes: [episode],
        });
      }
    }
    return [...grouped.values()];
  }

  function executeDistillation(args2: {
    projectId: string;
    trigger: DistillTrigger;
    runId: string;
    background: boolean;
  }): ServiceResult<{ accepted: true; runId: string }> {
    const ts = now();
    const projectId = args2.projectId;
    knownProjectIds.add(projectId);

    const snapshotEpisodes = args.repository.listEpisodesByProject({
      projectId,
      includeCompressed: false,
    });
    const clusters = buildClusters(projectId);

    emitDistillProgress({
      runId: args2.runId,
      projectId,
      trigger: args2.trigger,
      stage: "started",
      progress: 0.1,
    });
    emitDistillProgress({
      runId: args2.runId,
      projectId,
      trigger: args2.trigger,
      stage: "clustered",
      progress: 0.35,
    });

    let generated: DistillGeneratedRule[];
    try {
      generated = distillLlm({
        projectId,
        trigger: args2.trigger,
        snapshotEpisodes,
        clusters,
      });
    } catch (error) {
      args.logger.error("memory_distill_llm_unavailable", {
        project_id: projectId,
        message: error instanceof Error ? error.message : String(error),
      });
      logDegradeEvent(DEGRADE_EVENT_DISTILL_IO_FAILED, {
        projectId,
        trigger: args2.trigger,
      });
      distillIoDegradedProjects.add(projectId);
      retryPendingByProject.set(projectId, true);
      emitDistillProgress({
        runId: args2.runId,
        projectId,
        trigger: args2.trigger,
        stage: "failed",
        progress: 1,
        errorCode: "MEMORY_DISTILL_LLM_UNAVAILABLE",
      });
      return ipcError(
        "MEMORY_DISTILL_LLM_UNAVAILABLE",
        "Distillation LLM is unavailable",
      );
    }

    emitDistillProgress({
      runId: args2.runId,
      projectId,
      trigger: args2.trigger,
      stage: "patterned",
      progress: 0.6,
    });

    for (const item of generated) {
      if (!isConfidenceInRange(item.confidence)) {
        retryPendingByProject.set(projectId, false);
        emitDistillProgress({
          runId: args2.runId,
          projectId,
          trigger: args2.trigger,
          stage: "failed",
          progress: 1,
          errorCode: "MEMORY_CONFIDENCE_OUT_OF_RANGE",
        });
        return ipcError(
          "MEMORY_CONFIDENCE_OUT_OF_RANGE",
          "Semantic rule confidence out of range",
          {
            confidence: item.confidence,
          },
        );
      }
    }

    const recentCutoff = ts - CONFLICT_RECENT_WINDOW_DAYS * DAY_MS;
    const rules = getSemanticRules(projectId);

    for (const generatedRule of generated) {
      const normalizedRule = normalizeRuleText(generatedRule.rule);
      if (normalizedRule.length === 0) {
        continue;
      }

      const category = generatedRule.category;
      const scope = generatedRule.scope ?? "project";
      const sameCategory = rules.find(
        (rule) =>
          rule.projectId === projectId &&
          rule.category === category &&
          rule.scope === scope,
      );

      if (
        sameCategory &&
        sameCategory.updatedAt < recentCutoff &&
        sameCategory.rule !== normalizedRule
      ) {
        sameCategory.rule = normalizedRule;
        sameCategory.confidence = clampConfidence(generatedRule.confidence);
        sameCategory.supportingEpisodes = [...generatedRule.supportingEpisodes];
        sameCategory.contradictingEpisodes = [
          ...generatedRule.contradictingEpisodes,
        ];
        sameCategory.recentlyUpdated = true;
        sameCategory.updatedAt = ts;
        sameCategory.userModified = false;
        upsertSemanticRule(projectId, sameCategory);
        continue;
      }

      if (
        sameCategory &&
        isDirectContradiction(sameCategory.rule, normalizedRule)
      ) {
        sameCategory.confidence = clampConfidence(
          sameCategory.confidence - 0.2,
        );
        sameCategory.conflictMarked = true;
        sameCategory.updatedAt = ts;
        upsertSemanticRule(projectId, sameCategory);

        const conflictRule: SemanticMemoryRule = {
          id: randomUUID(),
          projectId,
          scope,
          version: 1,
          rule: normalizedRule,
          category,
          confidence: clampConfidence(generatedRule.confidence - 0.2),
          supportingEpisodes: [...generatedRule.supportingEpisodes],
          contradictingEpisodes: [...generatedRule.contradictingEpisodes],
          userConfirmed: false,
          userModified: false,
          conflictMarked: true,
          createdAt: ts,
          updatedAt: ts,
        };
        upsertSemanticRule(projectId, conflictRule);
        enqueueConflict({
          projectId,
          ruleIds: [sameCategory.id, conflictRule.id],
        });
        continue;
      }

      const exact = rules.find(
        (rule) =>
          rule.projectId === projectId &&
          rule.scope === scope &&
          rule.category === category &&
          rule.rule === normalizedRule,
      );
      if (exact) {
        exact.confidence = clampConfidence(generatedRule.confidence);
        exact.supportingEpisodes = [...generatedRule.supportingEpisodes];
        exact.contradictingEpisodes = [...generatedRule.contradictingEpisodes];
        exact.updatedAt = ts;
        exact.recentlyUpdated = false;
        upsertSemanticRule(projectId, exact);
        continue;
      }

      const created: SemanticMemoryRule = {
        id: randomUUID(),
        projectId,
        scope,
        version: 1,
        rule: normalizedRule,
        category,
        confidence: clampConfidence(generatedRule.confidence),
        supportingEpisodes: [...generatedRule.supportingEpisodes],
        contradictingEpisodes: [...generatedRule.contradictingEpisodes],
        userConfirmed: false,
        userModified: false,
        createdAt: ts,
        updatedAt: ts,
      };
      upsertSemanticRule(projectId, created);
    }

    retryPendingByProject.set(projectId, false);
    distillIoDegradedProjects.delete(projectId);
    pendingEpisodeCountByProject.set(projectId, 0);
    emitDistillProgress({
      runId: args2.runId,
      projectId,
      trigger: args2.trigger,
      stage: "generated",
      progress: 0.85,
    });
    emitDistillProgress({
      runId: args2.runId,
      projectId,
      trigger: args2.trigger,
      stage: "completed",
      progress: 1,
    });

    return { ok: true, data: { accepted: true, runId: args2.runId } };
  }

  function scheduleBatchDistillation(projectId: string): void {
    if (
      distillingProjects.has(projectId) ||
      scheduledBatchDistillProjects.has(projectId)
    ) {
      return;
    }
    scheduledBatchDistillProjects.add(projectId);
    const runId = randomUUID();
    distillScheduler(() => {
      void projectMutex.runExclusive(projectId, async () => {
        scheduledBatchDistillProjects.delete(projectId);
        if (distillingProjects.has(projectId)) {
          return;
        }
        distillingProjects.add(projectId);
        try {
          const result = executeDistillation({
            projectId,
            trigger: "batch",
            runId,
            background: true,
          });
          if (!result.ok) {
            args.logger.error("memory_distill_background_failed", {
              project_id: projectId,
              code: result.error.code,
              message: result.error.message,
            });
          }
        } finally {
          distillingProjects.delete(projectId);
        }
      });
    });
  }

  function maybeTriggerBatchDistillation(projectId: string): void {
    const pending = pendingEpisodeCountByProject.get(projectId) ?? 0;
    const retryPending = retryPendingByProject.get(projectId) ?? false;
    if (pending >= DISTILL_BATCH_TRIGGER_SIZE || retryPending) {
      scheduleBatchDistillation(projectId);
    }
  }

  return { buildClusters, executeDistillation, scheduleBatchDistillation, maybeTriggerBatchDistillation };
}

function createEpisodicQueryOps(
  ctx: EpisodicCtx,
): Pick<
  EpisodicMemoryService,
  "queryEpisodes"
> {
  const args = ctx;
  const { now, scoreEpisode, logDegradeEvent, resolveScopePriority, getSemanticRules, toPlaceholder, distillIoDegradedProjects, fallbackRules } = ctx;
  return {
    queryEpisodes: (input) => {
      if (input.projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      if (input.sceneType.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "sceneType is required");
      }

      try {
        const rows = args.repository.listEpisodesByScene({
          projectId: input.projectId,
          sceneType: input.sceneType,
          includeCompressed: false,
        });

        const limit = normalizeRecallLimit(input.limit);
        const trimmedQuery = (input.queryText ?? "").trim();
        const currentTs = now();
        const lexicalRanked = [...rows].sort((a, b) => {
          if (trimmedQuery.length === 0) {
            if (a.createdAt !== b.createdAt) {
              return b.createdAt - a.createdAt;
            }
            return a.id.localeCompare(b.id);
          }

          const scoreA = scoreEpisode({
            episode: a,
            queryText: trimmedQuery,
            targetSceneType: input.sceneType,
            currentTs,
          });
          const scoreB = scoreEpisode({
            episode: b,
            queryText: trimmedQuery,
            targetSceneType: input.sceneType,
            currentTs,
          });

          if (scoreA !== scoreB) {
            return scoreB - scoreA;
          }
          return a.id.localeCompare(b.id);
        });
        let vectorOfflineDegraded = false;
        let ranked = lexicalRanked;
        if (trimmedQuery.length > 0 && args.semanticRecall) {
          try {
            const semanticRanked = args.semanticRecall({
              projectId: input.projectId,
              sceneType: input.sceneType,
              queryText: trimmedQuery,
              limit,
              episodes: rows,
            });
            if (semanticRanked.length > 0) {
              ranked = [...semanticRanked];
            }
          } catch (error) {
            vectorOfflineDegraded = true;
            logDegradeEvent(DEGRADE_EVENT_VECTOR_OFFLINE, {
              projectId: input.projectId,
              sceneType: input.sceneType,
              message: error instanceof Error ? error.message : String(error),
            });
          }
        }

        const items = ranked.slice(0, limit);
        args.repository.markEpisodesRecalled({
          ids: items.map((item) => item.id),
          recalledAt: currentTs,
        });
        const prioritizedSemanticRules = resolveScopePriority(
          input.projectId,
          getSemanticRules(input.projectId),
        )
          .slice(0, SEMANTIC_RULE_BUDGET)
          .map((rule) => toPlaceholder(rule));
        const semanticEmptyDegraded = prioritizedSemanticRules.length === 0;
        const distillIoDegraded = distillIoDegradedProjects.has(
          input.projectId,
        );
        const fallback =
          semanticEmptyDegraded || distillIoDegraded ? fallbackRules() : [];

        return {
          ok: true,
          data: {
            items,
            memoryDegraded:
              vectorOfflineDegraded ||
              semanticEmptyDegraded ||
              distillIoDegraded,
            fallbackRules: fallback,
            semanticRules: prioritizedSemanticRules,
          },
        };
      } catch (error) {
        args.logger.error("memory_episode_query_failed", {
          message: error instanceof Error ? error.message : String(error),
          project_id: input.projectId,
        });
        logDegradeEvent(DEGRADE_EVENT_ALL_MEMORY_UNAVAILABLE, {
          projectId: input.projectId,
          sceneType: input.sceneType,
        });
        return {
          ok: true,
          data: {
            items: [],
            memoryDegraded: true,
            fallbackRules: fallbackRules(),
            semanticRules: [],
          },
        };
      }
    },

  };
}

function createEpisodicTriggerOps(
  ctx: EpisodicCtx,
): Pick<
  EpisodicMemoryService,
  "realtimeEvictionTrigger" | "dailyDecayRecomputeTrigger" | "weeklyCompressTrigger" | "monthlyPurgeTrigger"
> {
  const args = ctx;
  const { now, knownProjectIds, semanticRulesByProject, getSemanticRules, clampConfidence, upsertSemanticRule } = ctx;
  return {
    realtimeEvictionTrigger: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      try {
        const currentTs = now();
        const expireBefore = currentTs - EPISODIC_TTL_DAYS * DAY_MS;
        let deleted = args.repository.deleteExpiredEpisodes({
          projectId,
          compressed: false,
          beforeTs: expireBefore,
        });

        const activeCount = args.repository.countEpisodes({
          projectId,
          compressed: false,
        });
        if (activeCount > EPISODIC_ACTIVE_BUDGET) {
          deleted += args.repository.deleteLruEpisodes({
            projectId,
            compressed: false,
            overflow: activeCount - EPISODIC_ACTIVE_BUDGET,
          });
        }

        return { ok: true, data: { deleted } };
      } catch (error) {
        args.logger.error("memory_realtime_eviction_failed", {
          project_id: projectId,
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed realtime eviction");
      }
    },

    dailyDecayRecomputeTrigger: () => {
      let updated = 0;
      const projects = new Set<string>([
        ...knownProjectIds,
        ...semanticRulesByProject.keys(),
      ]);
      for (const projectId of projects) {
        const episodes = args.repository.listEpisodesByProject({
          projectId,
          includeCompressed: false,
        });
        for (const episode of episodes) {
          const ageInDays = (now() - episode.createdAt) / DAY_MS;
          const score = calculateDecayScore({
            ageInDays,
            recallCount: episode.recallCount,
            importance: episode.importance,
          });
          episode.decayScore = score;
          episode.decayLevel = classifyDecayLevel(score);
          updated += 1;
        }

        const rules = getSemanticRules(projectId);
        for (const rule of rules) {
          if (rule.userConfirmed) {
            continue;
          }
          rule.confidence = clampConfidence(
            rule.confidence * SEMANTIC_DECAY_FACTOR,
          );
          rule.updatedAt = now();
          upsertSemanticRule(projectId, rule);
          updated += 1;
        }
      }

      return { ok: true, data: { updated } };
    },

    weeklyCompressTrigger: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      try {
        const currentTs = now();
        const compressBefore = currentTs - TO_COMPRESS_THRESHOLD_DAYS * DAY_MS;
        const compressed = args.repository.compressEpisodes({
          projectId,
          beforeTs: compressBefore,
        });

        const compressedCount = args.repository.countEpisodes({
          projectId,
          compressed: true,
        });
        if (compressedCount > EPISODIC_COMPRESSED_BUDGET) {
          args.repository.purgeCompressedEpisodes({
            projectId,
            beforeTs: currentTs - COMPRESSED_TTL_DAYS * DAY_MS,
            overflow: compressedCount - EPISODIC_COMPRESSED_BUDGET,
          });
        }

        return { ok: true, data: { compressed } };
      } catch (error) {
        args.logger.error("memory_weekly_compress_failed", {
          project_id: projectId,
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed weekly compress trigger");
      }
    },

    monthlyPurgeTrigger: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      try {
        const currentTs = now();
        const beforeTs = currentTs - COMPRESSED_TTL_DAYS * DAY_MS;
        const compressedCount = args.repository.countEpisodes({
          projectId,
          compressed: true,
        });
        const overflow = Math.max(
          0,
          compressedCount - EPISODIC_COMPRESSED_BUDGET,
        );
        const deleted = args.repository.purgeCompressedEpisodes({
          projectId,
          beforeTs,
          overflow,
        });
        return { ok: true, data: { deleted } };
      } catch (error) {
        args.logger.error("memory_monthly_purge_failed", {
          project_id: projectId,
          message: error instanceof Error ? error.message : String(error),
        });
        return ipcError("DB_ERROR", "Failed monthly purge trigger");
      }
    },

  };
}

function createEpisodicSemanticOps(
  ctx: EpisodicCtx,
): Pick<
  EpisodicMemoryService,
  "listSemanticMemory" | "addSemanticMemory" | "updateSemanticMemory" | "deleteSemanticMemory" | "promoteSemanticMemory"
> {
  const args = ctx;
  const { knownProjectIds, getSemanticRules, cloneSemanticRule, getConflictQueue, cloneConflict, normalizeRuleText, isConfidenceInRange, upsertSemanticRule, now, semanticRulesByProject, invalidateSemanticCache } = ctx;
  return {
    listSemanticMemory: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      knownProjectIds.add(projectId);
      return {
        ok: true,
        data: {
          items: getSemanticRules(projectId).map(cloneSemanticRule),
          conflictQueue: getConflictQueue(projectId).map(cloneConflict),
        },
      };
    },

    addSemanticMemory: (input) => {
      if (input.projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      if (normalizeRuleText(input.rule).length === 0) {
        return ipcError("INVALID_ARGUMENT", "rule is required");
      }
      if (!isConfidenceInRange(input.confidence)) {
        return ipcError(
          "MEMORY_CONFIDENCE_OUT_OF_RANGE",
          "Semantic rule confidence out of range",
          { confidence: input.confidence },
        );
      }
      const ts = now();
      const created: SemanticMemoryRule = {
        id: randomUUID(),
        projectId: input.projectId,
        scope: input.scope ?? "project",
        version: 1,
        rule: normalizeRuleText(input.rule),
        category: input.category,
        confidence: input.confidence,
        supportingEpisodes: [...(input.supportingEpisodes ?? [])],
        contradictingEpisodes: [...(input.contradictingEpisodes ?? [])],
        userConfirmed: input.userConfirmed ?? false,
        userModified: input.userModified ?? false,
        createdAt: ts,
        updatedAt: ts,
      };
      knownProjectIds.add(input.projectId);
      const item = upsertSemanticRule(input.projectId, created);
      return { ok: true, data: { item } };
    },

    updateSemanticMemory: ({ projectId, ruleId, patch }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      const rules = getSemanticRules(projectId);
      const idx = rules.findIndex((rule) => rule.id === ruleId);
      if (idx < 0) {
        return ipcError("NOT_FOUND", "Semantic rule not found", { ruleId });
      }
      if (
        typeof patch.confidence === "number" &&
        !isConfidenceInRange(patch.confidence)
      ) {
        return ipcError(
          "MEMORY_CONFIDENCE_OUT_OF_RANGE",
          "Semantic rule confidence out of range",
          { confidence: patch.confidence },
        );
      }
      const current = rules[idx];
      const next: SemanticMemoryRule = {
        ...current,
        rule:
          patch.rule !== undefined
            ? normalizeRuleText(patch.rule)
            : current.rule,
        category: patch.category ?? current.category,
        confidence: patch.confidence ?? current.confidence,
        scope: patch.scope ?? current.scope,
        supportingEpisodes:
          patch.supportingEpisodes !== undefined
            ? [...patch.supportingEpisodes]
            : [...current.supportingEpisodes],
        contradictingEpisodes:
          patch.contradictingEpisodes !== undefined
            ? [...patch.contradictingEpisodes]
            : [...current.contradictingEpisodes],
        userConfirmed: patch.userConfirmed ?? current.userConfirmed,
        userModified: patch.userModified ?? current.userModified,
        updatedAt: now(),
      };
      const item = upsertSemanticRule(projectId, next);
      return { ok: true, data: { item } };
    },

    deleteSemanticMemory: ({ projectId, ruleId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      const rules = getSemanticRules(projectId);
      const target = rules.find((rule) => rule.id === ruleId);
      if (!target) {
        return ipcError("NOT_FOUND", "Semantic rule not found", { ruleId });
      }
      const keep = rules.filter((rule) => rule.id !== ruleId);
      semanticRulesByProject.set(projectId, keep);
      args.repository.deleteSemanticPlaceholder({
        projectId: target.projectId,
        ruleId: target.id,
        scope: target.scope,
      });
      if (target.scope === "global") {
        invalidateSemanticCache();
      }
      return { ok: true, data: { deleted: true } };
    },

    promoteSemanticMemory: ({ projectId, ruleId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }

      const rules = getSemanticRules(projectId);
      const target = rules.find(
        (rule) =>
          rule.id === ruleId &&
          rule.scope === "project" &&
          rule.projectId === projectId,
      );
      if (!target) {
        return ipcError("NOT_FOUND", "Semantic rule not found", { ruleId });
      }

      const promoted: SemanticMemoryRule = {
        ...target,
        scope: "global",
        updatedAt: now(),
      };
      const item = upsertSemanticRule(projectId, promoted);
      return { ok: true, data: { item } };
    },

  };
}

function createEpisodicManagementOps(
  ctx: EpisodicCtx,
): Pick<
  EpisodicMemoryService,
  "getRetryQueueSize" | "clearProjectMemory" | "clearAllMemory" | "distillSemanticMemory" | "listConflictQueue"
> {
  const args = ctx;
  const { retryQueue, semanticRulesByProject, conflictQueueByProject, knownProjectIds, pendingEpisodeCountByProject, retryPendingByProject, scheduledBatchDistillProjects, distillIoDegradedProjects, distillingProjects, projectMutex, executeDistillation, getConflictQueue, cloneConflict } = ctx;
  return {
    getRetryQueueSize: () => retryQueue.length,

    clearProjectMemory: ({ projectId, confirmed }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      if (!confirmed) {
        return ipcError(
          "MEMORY_CLEAR_CONFIRM_REQUIRED",
          "Project memory clear requires explicit confirmation",
        );
      }
      try {
        const deletedEpisodes = args.repository.clearEpisodesByProject({
          projectId,
        });
        const deletedRules = args.repository.clearSemanticPlaceholdersByProject(
          {
            projectId,
          },
        );
        semanticRulesByProject.delete(projectId);
        conflictQueueByProject.delete(projectId);
        knownProjectIds.delete(projectId);
        pendingEpisodeCountByProject.delete(projectId);
        retryPendingByProject.delete(projectId);
        scheduledBatchDistillProjects.delete(projectId);
        distillIoDegradedProjects.delete(projectId);
        return {
          ok: true,
          data: {
            ok: true,
            deletedEpisodes,
            deletedRules,
          },
        };
      } catch (error) {
        return ipcError("DB_ERROR", "Failed to clear project memory", {
          projectId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },

    clearAllMemory: ({ confirmed }) => {
      if (!confirmed) {
        return ipcError(
          "MEMORY_CLEAR_CONFIRM_REQUIRED",
          "Full memory clear requires explicit confirmation",
        );
      }
      try {
        const deletedEpisodes = args.repository.clearAllEpisodes();
        const deletedRules = args.repository.clearAllSemanticPlaceholders();
        retryQueue.splice(0, retryQueue.length);
        knownProjectIds.clear();
        pendingEpisodeCountByProject.clear();
        retryPendingByProject.clear();
        scheduledBatchDistillProjects.clear();
        semanticRulesByProject.clear();
        conflictQueueByProject.clear();
        distillIoDegradedProjects.clear();
        return {
          ok: true,
          data: {
            ok: true,
            deletedEpisodes,
            deletedRules,
          },
        };
      } catch (error) {
        return ipcError("DB_ERROR", "Failed to clear all memory", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },

    distillSemanticMemory: async ({ projectId, trigger }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      if (distillingProjects.has(projectId)) {
        return ipcError("CONFLICT", "Distillation already in progress", {
          projectId,
        });
      }
      return await projectMutex.runExclusive(projectId, async () => {
        if (distillingProjects.has(projectId)) {
          return ipcError("CONFLICT", "Distillation already in progress", {
            projectId,
          });
        }
        const runId = randomUUID();
        distillingProjects.add(projectId);
        try {
          return executeDistillation({
            projectId,
            trigger: trigger ?? "manual",
            runId,
            background: false,
          });
        } finally {
          distillingProjects.delete(projectId);
        }
      });
    },

    listConflictQueue: ({ projectId }) => {
      if (projectId.trim().length === 0) {
        return ipcError("INVALID_ARGUMENT", "projectId is required");
      }
      return {
        ok: true,
        data: {
          items: getConflictQueue(projectId).map(cloneConflict),
        },
      };
    },
  };
}

export function createEpisodicMemoryService(args: EpisodicServiceArgs): EpisodicMemoryService {
  const now = args.now ?? (() => Date.now());
  const distillScheduler =
    args.distillScheduler ?? ((job: () => void) => queueMicrotask(job));
  const retryQueue: EpisodeRecordInput[] = [];
  const knownProjectIds = new Set<string>();
  const pendingEpisodeCountByProject = new Map<string, number>();
  const retryPendingByProject = new Map<string, boolean>();
  const distillingProjects = new Set<string>();
  const scheduledBatchDistillProjects = new Set<string>();
  const projectMutex = createKeyedMutex();
  const semanticRulesByProject = new Map<string, SemanticMemoryRule[]>();
  const conflictQueueByProject = new Map<string, SemanticConflictQueueItem[]>();
  const distillIoDegradedProjects = new Set<string>();


  const state: EpisodicState = {
    retryQueue,
    knownProjectIds,
    pendingEpisodeCountByProject,
    retryPendingByProject,
    distillingProjects,
    scheduledBatchDistillProjects,
    projectMutex,
    semanticRulesByProject,
    conflictQueueByProject,
    distillIoDegradedProjects,
  };

  const smallHelpers = createEpisodicSmallHelpers(args, state, now);
  const distillLlm = args.distillLlm ?? smallHelpers.defaultDistillLlm;
  const derived = { now, distillScheduler, distillLlm };
  const execHelpers = createEpisodicExecHelpers(args, state, derived, smallHelpers);

  const { validateRecordInput, maybeTriggerBatchDistillation } = { ...smallHelpers, ...execHelpers };

  function ensureCapacity(projectId: string): ServiceResult<void> {
    const eviction = service.realtimeEvictionTrigger({ projectId });
    if (!eviction.ok) {
      return eviction;
    }

    const activeCount = args.repository.countEpisodes({
      projectId,
      compressed: false,
    });

    if (activeCount >= EPISODIC_ACTIVE_BUDGET) {
      const overflow = activeCount - EPISODIC_ACTIVE_BUDGET + 1;
      const deleted = args.repository.deleteLruEpisodes({
        projectId,
        compressed: false,
        overflow,
      });
      const afterDelete = activeCount - deleted;
      if (afterDelete >= EPISODIC_ACTIVE_BUDGET) {
        return ipcError(
          "MEMORY_CAPACITY_EXCEEDED",
          "Active episodic memory budget exceeded",
          {
            projectId,
            activeCount: afterDelete,
            budget: EPISODIC_ACTIVE_BUDGET,
          },
        );
      }
    }

    const compressedCount = args.repository.countEpisodes({
      projectId,
      compressed: true,
    });
    if (compressedCount > EPISODIC_COMPRESSED_BUDGET) {
      const purge = service.monthlyPurgeTrigger({ projectId });
      if (!purge.ok) {
        return purge;
      }
      const afterPurge = args.repository.countEpisodes({
        projectId,
        compressed: true,
      });
      if (afterPurge > EPISODIC_COMPRESSED_BUDGET) {
        return ipcError(
          "MEMORY_CAPACITY_EXCEEDED",
          "Compressed episodic memory budget exceeded",
          {
            projectId,
            compressedCount: afterPurge,
            budget: EPISODIC_COMPRESSED_BUDGET,
          },
        );
      }
    }

    return { ok: true, data: undefined };
  }

  const ctx: EpisodicCtx = {
    repository: args.repository,
    logger: args.logger,
    semanticRecall: args.semanticRecall,
    now,
    ...state,
    ...smallHelpers,
    ...execHelpers,
  };

  const service: EpisodicMemoryService = {
    recordEpisode: async (input) => {
      const invalid = validateRecordInput(input);
      if (invalid) {
        return invalid;
      }

      return await projectMutex.runExclusive(input.projectId, async () => {
        const implicit = resolveImplicitFeedback({
          selectedIndex: input.selectedIndex,
          candidateCount: input.candidates.length,
          editDistance: input.editDistance,
          acceptedWithoutEdit: input.acceptedWithoutEdit,
          undoAfterAccept: input.undoAfterAccept,
          repeatedSceneSkillCount: input.repeatedSceneSkillCount,
        });

        const ts = now();
        knownProjectIds.add(input.projectId);

        if (input.undoAfterAccept && input.targetEpisodeId) {
          const updated = args.repository.updateEpisodeSignal({
            episodeId: input.targetEpisodeId,
            signal: implicit.signal,
            weight: implicit.weight,
            updatedAt: ts,
          });
          if (!updated) {
            return ipcError("NOT_FOUND", "Episode not found", {
              episodeId: input.targetEpisodeId,
            });
          }
          return {
            ok: true,
            data: {
              accepted: true,
              episodeId: input.targetEpisodeId,
              retryCount: 0,
              implicitSignal: implicit.signal,
              implicitWeight: implicit.weight,
            },
          };
        }

        const capacity = ensureCapacity(input.projectId);
        if (!capacity.ok) {
          return capacity;
        }

        const episode: EpisodeRecord = {
          id: randomUUID(),
          projectId: input.projectId,
          scope: "project",
          version: 1,
          chapterId: input.chapterId,
          sceneType: input.sceneType,
          skillUsed: input.skillUsed,
          inputContext: input.inputContext,
          candidates: [...input.candidates],
          selectedIndex: input.selectedIndex,
          finalText: input.finalText,
          explicit: input.explicit,
          editDistance: input.editDistance,
          implicitSignal: implicit.signal,
          implicitWeight: implicit.weight,
          importance: Math.max(0, Math.min(1, input.importance ?? 0.5)),
          recallCount: 0,
          compressed: false,
          userConfirmed: input.userConfirmed ?? false,
          createdAt: ts,
          updatedAt: ts,
        };

        let lastError: unknown = null;
        for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt += 1) {
          try {
            await args.repository.insertEpisode(episode);
            const pending =
              (pendingEpisodeCountByProject.get(input.projectId) ?? 0) + 1;
            pendingEpisodeCountByProject.set(input.projectId, pending);
            maybeTriggerBatchDistillation(input.projectId);
            return {
              ok: true,
              data: {
                accepted: true,
                episodeId: episode.id,
                retryCount: attempt - 1,
                implicitSignal: implicit.signal,
                implicitWeight: implicit.weight,
              },
            };
          } catch (error) {
            lastError = error;
            args.logger.error("memory_episode_write_retry", {
              attempt,
              message: error instanceof Error ? error.message : String(error),
              project_id: input.projectId,
            });
          }
        }

        retryQueue.push(input);
        return ipcError(
          "MEMORY_EPISODE_WRITE_FAILED",
          "Failed to record episode after retries",
          {
            attempts: MAX_WRITE_ATTEMPTS,
            message:
              lastError instanceof Error
                ? lastError.message
                : String(lastError),
          },
        );
      });
    },


    ...createEpisodicQueryOps(ctx),
    ...createEpisodicTriggerOps(ctx),
    ...createEpisodicSemanticOps(ctx),
    ...createEpisodicManagementOps(ctx),
  };

  return service;
}
