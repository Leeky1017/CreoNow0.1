import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import type { Logger } from "../../logging/logger";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type PersistGenerationTraceInput = {
  traceId: string;
  runId: string;
  executionId: string;
  skillId: string;
  mode: "agent" | "plan" | "ask";
  model: string;
  inputText: string;
  outputText: string;
  context?: { projectId?: string; documentId?: string };
  startedAt: number;
  completedAt: number;
};

export type RecordTraceFeedbackInput = {
  runId: string;
  action: "accept" | "reject" | "partial";
  evidenceRef: string;
  ts: number;
};

export type TraceStore = {
  persistGenerationTrace: (
    args: PersistGenerationTraceInput,
  ) => ServiceResult<{ traceId: string }>;
  recordTraceFeedback: (
    args: RecordTraceFeedbackInput,
  ) => ServiceResult<{ feedbackId: string }>;
  getTraceIdByRunId: (runId: string) => string | null;
};

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function createSqliteTraceStore(args: {
  db: Database.Database;
  logger: Logger;
  now?: () => number;
}): TraceStore {
  const now = args.now ?? (() => Date.now());

  const insertTraceStmt = args.db.prepare(`
    INSERT INTO generation_traces (
      trace_id,
      run_id,
      execution_id,
      skill_id,
      mode,
      model,
      input_text,
      output_text,
      project_id,
      document_id,
      started_at,
      completed_at,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const selectTraceIdByRunStmt = args.db.prepare(`
    SELECT trace_id AS traceId
    FROM generation_traces
    WHERE run_id = ?
    LIMIT 1
  `);

  const insertFeedbackStmt = args.db.prepare(`
    INSERT INTO trace_feedback (
      feedback_id,
      trace_id,
      run_id,
      action,
      evidence_ref,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  return {
    persistGenerationTrace: (input) => {
      try {
        insertTraceStmt.run(
          input.traceId,
          input.runId,
          input.executionId,
          input.skillId,
          input.mode,
          input.model,
          input.inputText,
          input.outputText,
          input.context?.projectId?.trim() || null,
          input.context?.documentId?.trim() || null,
          input.startedAt,
          input.completedAt,
          now(),
        );
        return { ok: true, data: { traceId: input.traceId } };
      } catch (error) {
        const message = normalizeErrorMessage(error);
        args.logger.error("trace_store_persist_failed", {
          traceId: input.traceId,
          runId: input.runId,
          message,
        });
        return ipcError("DB_ERROR", "Failed to persist generation trace", {
          traceId: input.traceId,
          runId: input.runId,
          message,
        });
      }
    },

    recordTraceFeedback: (input) => {
      const row = selectTraceIdByRunStmt.get(input.runId) as
        | { traceId: string }
        | undefined;

      if (!row?.traceId) {
        return ipcError("NOT_FOUND", "traceId not found for runId", {
          runId: input.runId,
        });
      }

      const feedbackId = randomUUID();

      try {
        insertFeedbackStmt.run(
          feedbackId,
          row.traceId,
          input.runId,
          input.action,
          input.evidenceRef,
          input.ts,
        );
        return { ok: true, data: { feedbackId } };
      } catch (error) {
        const message = normalizeErrorMessage(error);
        args.logger.error("trace_store_feedback_failed", {
          traceId: row.traceId,
          runId: input.runId,
          message,
        });
        return ipcError("DB_ERROR", "Failed to persist trace feedback", {
          traceId: row.traceId,
          runId: input.runId,
          message,
        });
      }
    },

    getTraceIdByRunId: (runId) => {
      const row = selectTraceIdByRunStmt.get(runId) as
        | { traceId: string }
        | undefined;
      if (!row?.traceId) {
        return null;
      }
      return row.traceId;
    },
  };
}
