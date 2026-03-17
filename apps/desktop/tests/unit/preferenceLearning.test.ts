import assert from "node:assert/strict";

import type Database from "better-sqlite3";

import type { Logger } from "../../main/src/logging/logger";
import { recordSkillFeedbackAndLearn } from "../../main/src/services/memory/preferenceLearning";

type FeedbackRow = {
  feedbackId: string;
  runId: string;
  action: string;
  evidenceRef: string | null;
  ignored: number;
  ignoredReason: string | null;
  createdAt: number;
};

type MemoryRow = {
  memoryId: string;
  type: string;
  scope: string;
  origin: string;
  projectId: null;
  sourceRef: string | null;
  content: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

/**
 * Create a no-op logger.
 *
 * Why: preference learning requires an explicit logger dependency.
 */
function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDbStub(): {
  db: Database.Database;
  data: { feedback: FeedbackRow[]; memories: MemoryRow[] };
} {
  const feedback: FeedbackRow[] = [];
  const memories: MemoryRow[] = [];

  const db = {
    prepare: (sql: string) => {
      if (sql.startsWith("INSERT INTO skill_feedback")) {
        return {
          run: (
            feedbackId: string,
            runId: string,
            action: string,
            evidenceRef: string | null,
            ignored: number,
            ignoredReason: string | null,
            createdAt: number,
          ) => {
            feedback.push({
              feedbackId,
              runId,
              action,
              evidenceRef,
              ignored,
              ignoredReason,
              createdAt,
            });
          },
        };
      }

      if (sql.startsWith("SELECT COUNT(*) as count FROM skill_feedback")) {
        return {
          get: (action: string, evidenceRef: string) => ({
            count: feedback.filter(
              (row) =>
                row.action === action &&
                row.evidenceRef === evidenceRef &&
                row.ignored === 0,
            ).length,
          }),
        };
      }

      if (sql.startsWith("SELECT memory_id as memoryId FROM user_memory")) {
        return {
          get: (sourceRef: string) => {
            const hit = memories.find(
              (row) =>
                row.origin === "learned" &&
                row.scope === "global" &&
                row.projectId === null &&
                row.sourceRef === sourceRef,
            );
            return hit ? { memoryId: hit.memoryId } : undefined;
          },
        };
      }

      if (sql.startsWith("UPDATE user_memory SET content")) {
        return {
          run: (content: string, ts: number, memoryId: string) => {
            const hit = memories.find((row) => row.memoryId === memoryId);
            if (!hit) {
              return;
            }
            hit.content = content;
            hit.updatedAt = ts;
            hit.deletedAt = null;
          },
        };
      }

      if (sql.startsWith("INSERT INTO user_memory")) {
        return {
          run: (
            memoryId: string,
            type: string,
            scope: string,
            sourceRef: string,
            content: string,
            createdAt: number,
            updatedAt: number,
          ) => {
            memories.push({
              memoryId,
              type,
              scope,
              origin: "learned",
              projectId: null,
              sourceRef,
              content,
              createdAt,
              updatedAt,
              deletedAt: null,
            });
          },
        };
      }

      throw new Error(`Unexpected SQL: ${sql}`);
    },
  } as unknown as Database.Database;

  return { db, data: { feedback, memories } };
}

const logger = createLogger();

{
  const { db } = createDbStub();
  const settings = {
    injectionEnabled: true,
    preferenceLearningEnabled: true,
    privacyModeEnabled: false,
    preferenceLearningThreshold: 1,
  };

  const empty = recordSkillFeedbackAndLearn({
    db,
    logger,
    settings,
    runId: "run_1",
    action: "accept",
    evidenceRef: "",
  });
  assert.equal(empty.ok, true);
  if (empty.ok) {
    assert.equal(empty.data.ignored, true);
    assert.equal(empty.data.learned, false);
  }

  const tooShort = recordSkillFeedbackAndLearn({
    db,
    logger,
    settings,
    runId: "run_2",
    action: "accept",
    evidenceRef: "hi",
  });
  assert.equal(tooShort.ok, true);
  if (tooShort.ok) {
    assert.equal(tooShort.data.ignored, true);
    assert.equal(tooShort.data.learned, false);
  }
}

{
  const { db, data } = createDbStub();
  const settings = {
    injectionEnabled: true,
    preferenceLearningEnabled: true,
    privacyModeEnabled: false,
    preferenceLearningThreshold: 1,
  };

  const learned = recordSkillFeedbackAndLearn({
    db,
    logger,
    settings,
    runId: "run_3",
    action: "accept",
    evidenceRef: "prefer-bullets",
  });
  assert.equal(learned.ok, true);
  if (learned.ok) {
    assert.equal(learned.data.ignored, false);
    assert.equal(learned.data.learned, true);
    assert.ok(learned.data.learnedMemoryId);
  }

  assert.equal(data.memories.length, 1);
  assert.equal(data.memories[0]?.content, "prefer-bullets");
  assert.equal(data.memories[0]?.sourceRef, "prefer-bullets");
}
