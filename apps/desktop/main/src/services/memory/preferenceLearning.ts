import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import type { MemoryScope, MemorySettings, MemoryType } from "./memoryService";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type SkillFeedbackAction = "accept" | "reject" | "partial";

export type PreferenceLearningOutcome = {
  recorded: true;
  ignored: boolean;
  ignoredReason?: string;
  learned: boolean;
  learnedMemoryId?: string;
  signalCount?: number;
  threshold?: number;
};

const MIN_EVIDENCE_REF_LEN = 3;
const MAX_EVIDENCE_REF_LEN = 240;
const MAX_PRIVACY_TOKEN_LEN = 64;
const PRIVACY_TOKEN_RE = /^[a-z0-9][a-z0-9._:-]{0,63}$/i;

function nowTs(): number {
  return Date.now();
}

type EvidenceNorm =
  | { ok: true; value: string }
  | { ok: false; reason: string; value: string | null };

/**
 * Normalize an evidenceRef into a bounded, serializable string.
 *
 * Why: we must avoid storing large/sensitive blobs while keeping learning
 * deterministic and testable.
 */
function normalizeEvidenceRef(args: {
  evidenceRef: string;
  privacyModeEnabled: boolean;
}): EvidenceNorm {
  const raw = args.evidenceRef.trim();
  if (raw.length === 0) {
    return { ok: false, reason: "empty", value: null };
  }

  if (args.privacyModeEnabled) {
    if (raw.length < MIN_EVIDENCE_REF_LEN) {
      return { ok: false, reason: "too_short", value: null };
    }
    if (raw.length > MAX_PRIVACY_TOKEN_LEN) {
      return { ok: false, reason: "too_long", value: null };
    }
    if (!PRIVACY_TOKEN_RE.test(raw)) {
      return { ok: false, reason: "privacy_mode_reject", value: null };
    }
    return { ok: true, value: raw };
  }

  const truncated =
    raw.length > MAX_EVIDENCE_REF_LEN
      ? raw.slice(0, MAX_EVIDENCE_REF_LEN)
      : raw;
  if (truncated.length < MIN_EVIDENCE_REF_LEN) {
    return { ok: false, reason: "too_short", value: null };
  }
  return { ok: true, value: truncated };
}

type FeedbackInsertArgs = {
  runId: string;
  action: SkillFeedbackAction;
  evidenceRef: string | null;
  ignored: boolean;
  ignoredReason: string | null;
  ts: number;
};

function insertFeedbackRow(
  db: Database.Database,
  args: FeedbackInsertArgs,
): void {
  db.prepare(
    "INSERT INTO skill_feedback (feedback_id, run_id, action, evidence_ref, ignored, ignored_reason, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(
    randomUUID(),
    args.runId,
    args.action,
    args.evidenceRef,
    args.ignored ? 1 : 0,
    args.ignoredReason,
    args.ts,
  );
}

function countAcceptedSignals(
  db: Database.Database,
  evidenceRef: string,
): number {
  const row = db
    .prepare<
      [string],
      { count: number }
    >("SELECT COUNT(*) as count FROM skill_feedback WHERE action = 'accept' AND evidence_ref = ? AND ignored = 0")
    .get(evidenceRef);
  return row ? row.count : 0;
}

type LearnedUpsertResult = { memoryId: string; created: boolean };

function upsertLearnedPreference(args: {
  db: Database.Database;
  content: string;
  sourceRef: string;
  ts: number;
}): LearnedUpsertResult {
  const existing = args.db
    .prepare<
      [string],
      { memoryId: string }
    >("SELECT memory_id as memoryId FROM user_memory WHERE origin = 'learned' AND scope = 'global' AND project_id IS NULL AND source_ref = ? LIMIT 1")
    .get(args.sourceRef);

  if (existing) {
    args.db
      .prepare<
        [string, number, string]
      >("UPDATE user_memory SET content = ?, updated_at = ?, deleted_at = NULL WHERE memory_id = ?")
      .run(args.content, args.ts, existing.memoryId);
    return { memoryId: existing.memoryId, created: false };
  }

  const memoryId = randomUUID();
  const type: MemoryType = "preference";
  const scope: MemoryScope = "global";
  args.db
    .prepare(
      "INSERT INTO user_memory (memory_id, type, scope, project_id, origin, source_ref, content, created_at, updated_at, deleted_at) VALUES (?, ?, ?, NULL, 'learned', ?, ?, ?, ?, NULL)",
    )
    .run(memoryId, type, scope, args.sourceRef, args.content, args.ts, args.ts);
  return { memoryId, created: true };
}

/**
 * Record an `ai:skill:feedback` signal and optionally create/update a learned preference.
 */
export function recordSkillFeedbackAndLearn(args: {
  db: Database.Database;
  logger: Logger;
  settings: MemorySettings;
  runId: string;
  action: SkillFeedbackAction;
  evidenceRef: string;
  ts?: number;
}): ServiceResult<PreferenceLearningOutcome> {
  if (args.runId.trim().length === 0) {
    return ipcError("INVALID_ARGUMENT", "runId is required");
  }

  const ts = args.ts ?? nowTs();

  if (!args.settings.preferenceLearningEnabled) {
    try {
      insertFeedbackRow(args.db, {
        runId: args.runId,
        action: args.action,
        evidenceRef: null,
        ignored: true,
        ignoredReason: "learning_disabled",
        ts,
      });
    } catch (error) {
      args.logger.error("preference_signal_ingest_failed", {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
      return ipcError("DB_ERROR", "Failed to record feedback");
    }

    args.logger.info("preference_signal_ingested", {
      action: args.action,
      ignored: true,
      learned: false,
      reason: "learning_disabled",
    });

    return {
      ok: true,
      data: {
        recorded: true,
        ignored: true,
        ignoredReason: "learning_disabled",
        learned: false,
      },
    };
  }

  if (args.action !== "accept") {
    try {
      insertFeedbackRow(args.db, {
        runId: args.runId,
        action: args.action,
        evidenceRef: null,
        ignored: true,
        ignoredReason: "unsupported_action",
        ts,
      });
    } catch (error) {
      args.logger.error("preference_signal_ingest_failed", {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
      return ipcError("DB_ERROR", "Failed to record feedback");
    }

    args.logger.info("preference_signal_ingested", {
      action: args.action,
      ignored: true,
      learned: false,
      reason: "unsupported_action",
    });

    return {
      ok: true,
      data: {
        recorded: true,
        ignored: true,
        ignoredReason: "unsupported_action",
        learned: false,
      },
    };
  }

  const normalized = normalizeEvidenceRef({
    evidenceRef: args.evidenceRef,
    privacyModeEnabled: args.settings.privacyModeEnabled,
  });

  if (!normalized.ok) {
    try {
      insertFeedbackRow(args.db, {
        runId: args.runId,
        action: args.action,
        evidenceRef: normalized.value,
        ignored: true,
        ignoredReason: normalized.reason,
        ts,
      });
    } catch (error) {
      args.logger.error("preference_signal_ingest_failed", {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
      return ipcError("DB_ERROR", "Failed to record feedback");
    }

    args.logger.info("preference_signal_ingested", {
      action: args.action,
      ignored: true,
      learned: false,
      reason: normalized.reason,
    });

    return {
      ok: true,
      data: {
        recorded: true,
        ignored: true,
        ignoredReason: normalized.reason,
        learned: false,
      },
    };
  }

  try {
    insertFeedbackRow(args.db, {
      runId: args.runId,
      action: args.action,
      evidenceRef: normalized.value,
      ignored: false,
      ignoredReason: null,
      ts,
    });
  } catch (error) {
    args.logger.error("preference_signal_ingest_failed", {
      code: "DB_ERROR",
      message: error instanceof Error ? error.message : String(error),
    });
    return ipcError("DB_ERROR", "Failed to record feedback");
  }

  const threshold = args.settings.preferenceLearningThreshold;
  const signalCount = countAcceptedSignals(args.db, normalized.value);
  const shouldLearn = signalCount >= threshold;

  let learnedMemoryId: string | undefined;
  let learned = false;
  if (shouldLearn) {
    try {
      const upserted = upsertLearnedPreference({
        db: args.db,
        content: normalized.value,
        sourceRef: normalized.value,
        ts,
      });
      learnedMemoryId = upserted.memoryId;
      learned = true;
      args.logger.info(upserted.created ? "memory_create" : "memory_update", {
        memory_id: upserted.memoryId,
        type: "preference",
        scope: "global",
        origin: "learned",
        content_len: normalized.value.length,
      });
    } catch (error) {
      args.logger.error("preference_learned_memory_upsert_failed", {
        code: "DB_ERROR",
        message: error instanceof Error ? error.message : String(error),
      });
      return ipcError("DB_ERROR", "Failed to persist learned preference");
    }
  }

  args.logger.info("preference_signal_ingested", {
    action: args.action,
    ignored: false,
    learned,
    signal_count: signalCount,
    threshold,
  });

  return {
    ok: true,
    data: {
      recorded: true,
      ignored: false,
      learned,
      learnedMemoryId,
      signalCount,
      threshold,
    },
  };
}
