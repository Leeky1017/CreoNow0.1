import type { IpcErrorCode } from "@shared/types/ipc-generated";
import type { Logger } from "../../logging/logger";
import { ipcError, type ServiceResult } from "../shared/ipcResult";
export type { ServiceResult };

export type JudgeModelStatus = "not_ready" | "downloading" | "ready" | "error";

export type JudgeModelState =
  | { status: "not_ready" }
  | { status: "downloading" }
  | { status: "ready" }
  | { status: "error"; error: { code: IpcErrorCode; message: string } };

export type JudgeService = {
  getState: () => JudgeModelState;
  ensure: (args?: {
    timeoutMs?: number;
  }) => Promise<ServiceResult<JudgeModelState>>;
};

/**
 * Sleep for a given duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Run an async operation with a timeout.
 */
async function withTimeout<T>(
  op: () => Promise<T>,
  timeoutMs: number,
): Promise<ServiceResult<T>> {
  let timeoutHandle: NodeJS.Timeout | null = null;
  try {
    const res = await Promise.race([
      op(),
      new Promise<never>((_resolve, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error("timeout")),
          timeoutMs,
        );
      }),
    ]);
    return { ok: true, data: res };
  } catch (error) {
    if (error instanceof Error && error.message === "timeout") {
      return ipcError("TIMEOUT", "Judge model ensure timed out");
    }
    return ipcError(
      "INTERNAL",
      error instanceof Error ? error.message : "Judge ensure failed",
    );
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

/**
 * Create the JudgeService state machine.
 *
 * Why: judge model availability must be observable and Windows E2E-testable even
 * before a real model download/load pipeline is implemented.
 */
export function createJudgeService(deps: {
  logger: Logger;
  isE2E: boolean;
  defaultTimeoutMs?: number;
}): JudgeService {
  let state: JudgeModelState = { status: "not_ready" };
  let inflight: Promise<ServiceResult<JudgeModelState>> | null = null;

  /**
   * Emit a stable state log record.
   *
   * Why: Windows E2E must be able to assert judge state/ensure evidence via
   * `main.log` without relying on UI timing.
   */
  function logState(next: JudgeModelState): void {
    deps.logger.info("judge_state", {
      status: next.status,
      errorCode: next.status === "error" ? next.error.code : undefined,
    });
  }

  /**
   * Update the in-memory state machine.
   *
   * Why: keeping state transitions centralized ensures we never silently skip
   * observability logs for judge readiness.
   */
  function setState(next: JudgeModelState): void {
    state = next;
    logState(next);
  }

  /**
   * Ensure the judge model is available (real or degraded for E2E).
   */
  async function runEnsure(timeoutMs: number): Promise<ServiceResult<true>> {
    if (!deps.isE2E) {
      return ipcError(
        "MODEL_NOT_READY",
        "Judge model ensure is not implemented (non-E2E build)",
      );
    }

    return await withTimeout(async () => {
      await sleep(25);
      return true as const;
    }, timeoutMs);
  }

  return {
    getState: () => state,
    ensure: async (args) => {
      if (state.status === "ready") {
        return { ok: true, data: state };
      }

      if (inflight) {
        return await inflight;
      }

      const timeoutMs = Math.max(
        0,
        args?.timeoutMs ?? deps.defaultTimeoutMs ?? 15_000,
      );

      deps.logger.info("judge_ensure_started", {
        timeoutMs,
        isE2E: deps.isE2E,
      });
      setState({ status: "downloading" });

      inflight = (async () => {
        const ensured = await runEnsure(timeoutMs);
        inflight = null;

        if (!ensured.ok) {
          deps.logger.error("judge_ensure_failed", {
            code: ensured.error.code,
          });
          setState({
            status: "error",
            error: { code: ensured.error.code, message: ensured.error.message },
          });
          return { ok: false, error: ensured.error };
        }

        deps.logger.info("judge_ensure_succeeded", {});
        setState({ status: "ready" });
        return { ok: true, data: state };
      })();

      const result = await inflight;
      if (!result.ok && state.status === "downloading") {
        // Why: never leave state stuck in downloading on failure paths.
        setState({
          status: "error",
          error: { code: result.error.code, message: result.error.message },
        });
      }
      return result;
    },
  };
}
