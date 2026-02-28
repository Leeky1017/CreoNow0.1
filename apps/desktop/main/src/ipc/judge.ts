import type { IpcMain } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";
import {
  JUDGE_RESULT_CHANNEL,
  type JudgeResultEvent,
} from "@shared/types/judge";
import type { Logger } from "../logging/logger";
import type { JudgeQualityService } from "../services/ai/judgeQualityService";
import type {
  JudgeModelState,
  JudgeService,
} from "../services/judge/judgeService";

type JudgeEvaluatePayload = {
  projectId?: unknown;
  traceId?: unknown;
  text?: unknown;
  contextSummary?: unknown;
};

/**
 * Validate judge evaluate payload at IPC boundary.
 *
 * Why: handler must return deterministic INVALID_ARGUMENT errors.
 */
function parseJudgeEvaluatePayload(args: {
  payload: JudgeEvaluatePayload | undefined;
}):
  | {
      ok: true;
      data: {
        projectId: string;
        traceId: string;
        text: string;
        contextSummary: string;
      };
    }
  | { ok: false; error: { code: "INVALID_ARGUMENT"; message: string } } {
  const payload = args.payload ?? {};
  const projectId =
    typeof payload.projectId === "string" ? payload.projectId : "";
  const traceId = typeof payload.traceId === "string" ? payload.traceId : "";
  const text = typeof payload.text === "string" ? payload.text : "";
  const contextSummary =
    typeof payload.contextSummary === "string" ? payload.contextSummary : "";

  if (projectId.trim().length === 0) {
    return {
      ok: false,
      error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
    };
  }
  if (traceId.trim().length === 0) {
    return {
      ok: false,
      error: { code: "INVALID_ARGUMENT", message: "traceId is required" },
    };
  }
  if (text.trim().length === 0) {
    return {
      ok: false,
      error: { code: "INVALID_ARGUMENT", message: "text is required" },
    };
  }
  if (contextSummary.trim().length === 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        message: "contextSummary is required",
      },
    };
  }

  return {
    ok: true,
    data: {
      projectId: projectId.trim(),
      traceId: traceId.trim(),
      text,
      contextSummary,
    },
  };
}

/**
 * Register `judge:*` IPC handlers.
 *
 * Why: renderer must be able to observe model readiness and trigger ensure
 * deterministically for Windows E2E.
 */
export function registerJudgeIpcHandlers(deps: {
  ipcMain: IpcMain;
  judgeService: JudgeService;
  judgeQualityService: JudgeQualityService;
  logger: Logger;
}): void {
  deps.ipcMain.handle(
    "judge:model:getstate",
    async (): Promise<IpcResponse<{ state: JudgeModelState }>> => {
      return { ok: true, data: { state: deps.judgeService.getState() } };
    },
  );

  deps.ipcMain.handle(
    "judge:model:ensure",
    async (
      _e,
      payload: { timeoutMs?: number } | undefined,
    ): Promise<IpcResponse<{ state: JudgeModelState }>> => {
      const timeoutMs = payload?.timeoutMs;
      if (timeoutMs !== undefined && typeof timeoutMs !== "number") {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "timeoutMs must be number",
          },
        };
      }
      const res = await deps.judgeService.ensure({ timeoutMs });
      return res.ok
        ? { ok: true, data: { state: res.data } }
        : { ok: false, error: res.error };
    },
  );

  deps.ipcMain.handle(
    "judge:quality:evaluate",
    async (
      e,
      payload: JudgeEvaluatePayload,
    ): Promise<IpcResponse<{ accepted: true; result: JudgeResultEvent }>> => {
      const parsed = parseJudgeEvaluatePayload({ payload });
      if (!parsed.ok) {
        return { ok: false, error: parsed.error };
      }

      let evaluated: Awaited<
        ReturnType<typeof deps.judgeQualityService.evaluate>
      >;
      try {
        evaluated = await deps.judgeQualityService.evaluate(parsed.data);
      } catch (error) {
        deps.logger.error("judge_quality_evaluate_failed", {
          traceId: parsed.data.traceId,
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to evaluate judge quality",
          },
        };
      }

      if (!evaluated.ok) {
        return { ok: false, error: evaluated.error };
      }

      const event: JudgeResultEvent = {
        projectId: parsed.data.projectId,
        traceId: parsed.data.traceId,
        severity: evaluated.data.severity,
        labels: evaluated.data.labels,
        summary: evaluated.data.summary,
        partialChecksSkipped: evaluated.data.partialChecksSkipped,
        ts: Date.now(),
      };

      try {
        e.sender.send(JUDGE_RESULT_CHANNEL, event);
      } catch (error) {
        deps.logger.error("judge_result_push_failed", {
          traceId: event.traceId,
          message: error instanceof Error ? error.message : String(error),
        });
        return {
          ok: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "Failed to push judge result",
          },
        };
      }

      return {
        ok: true,
        data: { accepted: true, result: event },
      };
    },
  );
}
