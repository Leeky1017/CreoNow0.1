import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../../logging/logger";
import type { MemorySettings } from "../memoryService";
import {
  recordSkillFeedbackAndLearn,
  type PreferenceLearningOutcome,
  type ServiceResult,
} from "../preferenceLearning";

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function defaultSettings(overrides?: Partial<MemorySettings>): MemorySettings {
  return {
    memoryEnabled: true,
    preferenceLearningEnabled: true,
    preferenceLearningThreshold: 3,
    privacyModeEnabled: false,
    ...overrides,
  } as MemorySettings;
}

/**
 * Minimal DB stub for preferenceLearning scenarios.
 *
 * Tracks INSERT statements and provides configurable SELECT results
 * so tests can verify exactly what was written.
 */
function createDbStub(args?: {
  feedbackCounts?: Partial<Record<"accept" | "reject" | "partial", number>>;
  existingLearnedMemoryId?: string | null;
  onInsertFeedback?: (params: unknown[]) => void;
  onInsertMemory?: (params: unknown[]) => void;
  onUpdateMemory?: (params: unknown[]) => void;
}): Database.Database {
  const feedbackCounts = {
    accept: args?.feedbackCounts?.accept ?? 0,
    reject: args?.feedbackCounts?.reject ?? 0,
    partial: args?.feedbackCounts?.partial ?? 0,
  };
  const existingId = args?.existingLearnedMemoryId ?? null;

  const db = {
    prepare: (sql: string) => {
      // --- INSERT skill_feedback ---
      if (sql.includes("INSERT INTO skill_feedback")) {
        return {
          run: (...params: unknown[]) => {
            args?.onInsertFeedback?.(params);
          },
        };
      }

      // --- COUNT accepted signals ---
      if (
        sql.includes("SELECT COUNT(*)") &&
        sql.includes("skill_feedback") &&
        sql.includes("action = ?")
      ) {
        return {
          get: (action: "accept" | "reject" | "partial") => ({
            count: feedbackCounts[action] ?? 0,
          }),
        };
      }

      // --- SELECT existing learned memory ---
      if (
        sql.includes("SELECT memory_id") &&
        sql.includes("user_memory") &&
        sql.includes("source_ref")
      ) {
        return {
          get: () => (existingId ? { memoryId: existingId } : undefined),
        };
      }

      // --- INSERT user_memory ---
      if (sql.includes("INSERT INTO user_memory")) {
        return {
          run: (...params: unknown[]) => {
            args?.onInsertMemory?.(params);
          },
        };
      }

      // --- UPDATE user_memory ---
      if (sql.includes("UPDATE user_memory")) {
        return {
          run: (...params: unknown[]) => {
            args?.onUpdateMemory?.(params);
          },
        };
      }

      // Fallback: no-op statement
      return { run: () => {}, get: () => undefined };
    },
  } as unknown as Database.Database;

  return db;
}

function ok(
  r: ServiceResult<PreferenceLearningOutcome>,
): PreferenceLearningOutcome {
  assert.equal(r.ok, true, "expected ok result");
  return (r as { ok: true; data: PreferenceLearningOutcome }).data;
}

// ─── S1: Record accept feedback → recorded, not ignored ────────────────────
{
  const inserted: unknown[][] = [];
  const db = createDbStub({
    feedbackCounts: { accept: 1 }, // below threshold of 3
    onInsertFeedback: (p) => inserted.push(p),
  });

  const result = recordSkillFeedbackAndLearn({
    db,
    logger: createLogger(),
    settings: defaultSettings(),
    runId: "run-001",
    action: "accept",
    evidenceRef: "prefer-short-sentences",
    ts: 1000,
  });

  const outcome = ok(result);
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.ignored, false);
  assert.equal(outcome.learned, false, "below threshold → not learned");
  assert.equal(outcome.signalCount, 1);
  assert.equal(outcome.threshold, 3);
  assert.equal(inserted.length, 1, "one feedback row inserted");

  // Verify the inserted row carries the right action and evidence_ref
  const row = inserted[0]!;
  assert.equal(row[2], "accept"); // action
  assert.equal(row[3], "prefer-short-sentences"); // evidence_ref
  assert.equal(row[4], 0); // ignored = false → 0
}

// ─── S2: preferenceLearningEnabled=false → ignored ─────────────────────────
{
  const inserted: unknown[][] = [];
  const db = createDbStub({
    onInsertFeedback: (p) => inserted.push(p),
  });

  const result = recordSkillFeedbackAndLearn({
    db,
    logger: createLogger(),
    settings: defaultSettings({ preferenceLearningEnabled: false }),
    runId: "run-002",
    action: "accept",
    evidenceRef: "use-active-voice",
    ts: 2000,
  });

  const outcome = ok(result);
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.ignored, true);
  assert.equal(outcome.ignoredReason, "learning_disabled");
  assert.equal(outcome.learned, false);
  assert.equal(inserted.length, 1);

  const row = inserted[0]!;
  assert.equal(row[3], null, "evidenceRef stored as null when disabled");
  assert.equal(row[4], 1, "ignored flag = 1");
}

// ─── S3: Empty evidenceRef → recorded with evidenceRef=null, ignored ───────
{
  const inserted: unknown[][] = [];
  const db = createDbStub({
    onInsertFeedback: (p) => inserted.push(p),
  });

  const result = recordSkillFeedbackAndLearn({
    db,
    logger: createLogger(),
    settings: defaultSettings(),
    runId: "run-003",
    action: "accept",
    evidenceRef: "",
    ts: 3000,
  });

  const outcome = ok(result);
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.ignored, true);
  assert.equal(outcome.ignoredReason, "empty");
  assert.equal(outcome.learned, false);

  const row = inserted[0]!;
  assert.equal(row[3], null, "evidenceRef is null for empty input");
}

// ─── S4: Privacy mode rejects non-alphanumeric evidenceRef ─────────────────
{
  const inserted: unknown[][] = [];
  const db = createDbStub({
    onInsertFeedback: (p) => inserted.push(p),
  });

  const result = recordSkillFeedbackAndLearn({
    db,
    logger: createLogger(),
    settings: defaultSettings({ privacyModeEnabled: true }),
    runId: "run-004",
    action: "accept",
    evidenceRef: "contains spaces!", // fails PRIVACY_TOKEN_RE
    ts: 4000,
  });

  const outcome = ok(result);
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.ignored, true);
  assert.equal(outcome.ignoredReason, "privacy_mode_reject");
  assert.equal(outcome.learned, false);

  const row = inserted[0]!;
  assert.equal(row[3], null, "evidenceRef null when privacy rejects");
}

// ─── S5: Threshold reached → learned=true, learnedMemoryId exists ──────────
{
  const insertedMemories: unknown[][] = [];
  const db = createDbStub({
    feedbackCounts: { accept: 3 }, // equals threshold
    existingLearnedMemoryId: null, // no prior learned memory → INSERT path
    onInsertMemory: (p) => insertedMemories.push(p),
  });

  const result = recordSkillFeedbackAndLearn({
    db,
    logger: createLogger(),
    settings: defaultSettings({ preferenceLearningThreshold: 3 }),
    runId: "run-005",
    action: "accept",
    evidenceRef: "prefer-metaphors",
    ts: 5000,
  });

  const outcome = ok(result);
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.ignored, false);
  assert.equal(outcome.learned, true);
  assert.ok(outcome.learnedMemoryId, "learnedMemoryId should be present");
  assert.equal(outcome.signalCount, 3);
  assert.equal(outcome.threshold, 3);
  assert.equal(insertedMemories.length, 1, "one user_memory row inserted");
}

// ─── S6: Reject action → recorded and counted as negative signal ───────────
{
  const inserted: unknown[][] = [];
  const db = createDbStub({
    feedbackCounts: { accept: 2, reject: 1 },
    onInsertFeedback: (p) => inserted.push(p),
  });

  const result = recordSkillFeedbackAndLearn({
    db,
    logger: createLogger(),
    settings: defaultSettings(),
    runId: "run-006",
    action: "reject",
    evidenceRef: "avoid-passive-voice",
    ts: 6000,
  });

  const outcome = ok(result);
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.ignored, false);
  assert.equal(outcome.learned, false);
  assert.equal(outcome.signalCount, 2);
  assert.equal(outcome.rejectCount, 1);
  assert.equal(outcome.partialCount, 0);
  assert.equal(outcome.weightedScore, 1);

  const row = inserted[0]!;
  assert.equal(row[2], "reject"); // action preserved
  assert.equal(
    row[3],
    "avoid-passive-voice",
    "evidenceRef retained for learning",
  );
  assert.equal(row[4], 0, "ignored = 0");
}

// ─── S7: Partial feedback lowers weighted score and blocks learning ─────────
{
  const inserted: unknown[][] = [];
  const insertedMemories: unknown[][] = [];
  const db = createDbStub({
    feedbackCounts: { accept: 3, partial: 2 },
    onInsertFeedback: (p) => inserted.push(p),
    onInsertMemory: (p) => insertedMemories.push(p),
  });

  const result = recordSkillFeedbackAndLearn({
    db,
    logger: createLogger(),
    settings: defaultSettings({ preferenceLearningThreshold: 3 }),
    runId: "run-007",
    action: "partial",
    evidenceRef: "prefer-short-sentences",
    ts: 7000,
  });

  const outcome = ok(result);
  assert.equal(outcome.recorded, true);
  assert.equal(outcome.ignored, false);
  assert.equal(
    outcome.learned,
    false,
    "partial should reduce weighted score below threshold",
  );
  assert.equal(outcome.signalCount, 3);
  assert.equal(outcome.rejectCount, 0);
  assert.equal(outcome.partialCount, 2);
  assert.equal(outcome.weightedScore, 2);
  assert.equal(inserted.length, 1);
  assert.equal(
    insertedMemories.length,
    0,
    "no learned memory upsert when weighted score is insufficient",
  );
}

console.log("preferenceLearning.test.ts: all assertions passed");
