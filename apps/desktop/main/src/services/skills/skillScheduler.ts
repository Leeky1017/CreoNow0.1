import { ipcError, type ServiceResult, type Err } from "../shared/ipcResult";
export type { ServiceResult };

export type SkillSchedulerTerminal =
  | "completed"
  | "failed"
  | "cancelled"
  | "timeout";

export type SkillQueueStatus = {
  sessionKey: string;
  executionId: string;
  runId: string;
  traceId: string;
  status:
    | "queued"
    | "started"
    | "completed"
    | "failed"
    | "cancelled"
    | "timeout";
  queuePosition: number;
  queued: number;
  globalRunning: number;
};

type SkillTaskStartResult<T> = {
  response: Promise<ServiceResult<T>>;
  completion: Promise<SkillSchedulerTerminal>;
};

type SkillTask<T> = {
  sessionKey: string;
  executionId: string;
  runId: string;
  traceId: string;
  start: () => SkillTaskStartResult<T>;
  onQueueEvent?: (status: SkillQueueStatus) => void;
  resolveResult: (result: ServiceResult<T>) => void;
};

type SessionQueueState = {
  runningRunId: string | null;
  pending: SkillTask<unknown>[];
};

type SchedulerErrorSource = "response" | "completion";

type SchedulerLogger = {
  error: (event: string, data?: Record<string, unknown>) => void;
};

type ResponseSettleState =
  | { kind: "pending" }
  | { kind: "settled"; result: ServiceResult<unknown> }
  | { kind: "errored"; failure: Err };

type CompletionSettleState =
  | { kind: "pending" }
  | { kind: "settled"; terminal: SkillSchedulerTerminal }
  | { kind: "errored"; failure: Err };

export type SkillScheduler = {
  schedule: <T>(args: {
    sessionKey: string;
    executionId: string;
    runId: string;
    traceId: string;
    dependsOn?: string[];
    isDependencyAvailable?: (dependencyId: string) => boolean;
    onQueueEvent?: (status: SkillQueueStatus) => void;
    start: () => SkillTaskStartResult<T>;
  }) => Promise<ServiceResult<T>>;
};

function normalizeDependencies(dependsOn: string[] | undefined): string[] {
  if (!dependsOn) {
    return [];
  }
  const normalized = dependsOn
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return [...new Set(normalized)];
}

function normalizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error);
}

function buildTaskErrorContext(args: {
  task: SkillTask<unknown>;
  errorSource: SchedulerErrorSource;
  error: unknown;
}): Record<string, unknown> {
  const errorMessage = normalizeErrorMessage(args.error);
  const context: Record<string, unknown> = {
    sessionKey: args.task.sessionKey,
    taskId: args.task.runId,
    errorSource: args.errorSource,
    errorMessage,
  };
  if (args.task.executionId.trim().length > 0) {
    context.executionId = args.task.executionId;
  }
  return context;
}

function buildTaskPathError(args: {
  logger: SchedulerLogger;
  task: SkillTask<unknown>;
  errorSource: SchedulerErrorSource;
  error: unknown;
}): Err {
  const event =
    args.errorSource === "response"
      ? "skill_response_error"
      : "skill_completion_error";
  const context = buildTaskErrorContext({
    task: args.task,
    errorSource: args.errorSource,
    error: args.error,
  });
  args.logger.error(event, context);
  return ipcError("INTERNAL", "Skill scheduler task failed", context);
}

function buildTaskResultErrorDetails(
  task: SkillTask<unknown>,
): Record<string, unknown> {
  return {
    sessionKey: task.sessionKey,
    taskId: task.runId,
    ...(task.executionId.trim().length > 0
      ? { executionId: task.executionId }
      : {}),
  };
}

function buildTerminalResultError(args: {
  task: SkillTask<unknown>;
  terminal: SkillSchedulerTerminal;
}): Err | null {
  if (args.terminal === "cancelled") {
    return ipcError(
      "CANCELED",
      "Skill execution canceled",
      buildTaskResultErrorDetails(args.task),
    );
  }
  if (args.terminal === "timeout") {
    return ipcError(
      "SKILL_TIMEOUT",
      "Skill execution timed out",
      buildTaskResultErrorDetails(args.task),
    );
  }
  if (args.terminal === "failed") {
    return ipcError(
      "INTERNAL",
      "Skill scheduler task failed",
      buildTaskResultErrorDetails(args.task),
    );
  }
  return null;
}

function toQueueStatus(args: {
  task: SkillTask<unknown>;
  status:
    | "queued"
    | "started"
    | "completed"
    | "failed"
    | "cancelled"
    | "timeout";
  queuePosition: number;
  queued: number;
  globalRunning: number;
}): SkillQueueStatus {
  return {
    sessionKey: args.task.sessionKey,
    executionId: args.task.executionId,
    runId: args.task.runId,
    traceId: args.task.traceId,
    status: args.status,
    queuePosition: args.queuePosition,
    queued: args.queued,
    globalRunning: args.globalRunning,
  };
}

function driveTaskSettlement(ctx: {
  task: SkillTask<unknown>;
  started: SkillTaskStartResult<unknown>;
  logger: SchedulerLogger;
  slotRecoveryTimeoutMs: number;
  onFinalize: (terminal: SkillSchedulerTerminal) => void;
}): void {
  let resolved = false;
  let finalized = false;
  let slotRecoveryTimer: ReturnType<typeof setTimeout> | null = null;
  let responseState: ResponseSettleState = { kind: "pending" };
  let completionState: CompletionSettleState = { kind: "pending" };
  const resolveResultOnce = (result: ServiceResult<unknown>): void => {
    if (resolved) {
      return;
    }
    resolved = true;
    ctx.task.resolveResult(result);
  };
  const finalizeOnce = (terminal: SkillSchedulerTerminal): void => {
    if (finalized) {
      return;
    }
    finalized = true;
    if (slotRecoveryTimer) {
      clearTimeout(slotRecoveryTimer);
      slotRecoveryTimer = null;
    }
    ctx.onFinalize(terminal);
  };
  const completionTerminalResultError = (): Err | null => {
    if (completionState.kind !== "settled") {
      return null;
    }
    return buildTerminalResultError({
      task: ctx.task,
      terminal: completionState.terminal,
    });
  };
  const resolveWithResponsePriority = (
    result: ServiceResult<unknown>,
  ): void => {
    if (result.ok) {
      const terminalError = completionTerminalResultError();
      if (terminalError) {
        resolveResultOnce(terminalError);
        return;
      }
    }
    if (
      result.ok &&
      completionState.kind === "errored" &&
      responseState.kind === "settled"
    ) {
      resolveResultOnce(completionState.failure);
      return;
    }
    resolveResultOnce(result);
  };
  const settleTerminalIfPossible = (): void => {
    if (responseState.kind === "errored") {
      finalizeOnce("failed");
      return;
    }
    if (responseState.kind === "settled" && !responseState.result.ok) {
      finalizeOnce("failed");
      return;
    }
    if (completionState.kind === "errored") {
      finalizeOnce("failed");
      return;
    }
    if (
      completionState.kind === "settled" &&
      completionState.terminal !== "completed" &&
      responseState.kind === "pending"
    ) {
      if (
        completionState.terminal === "cancelled" ||
        completionState.terminal === "timeout"
      ) {
        const terminalError = completionTerminalResultError();
        if (terminalError) {
          resolveResultOnce(terminalError);
        }
        finalizeOnce(completionState.terminal);
      }
      return;
    }
    if (
      responseState.kind === "settled" &&
      completionState.kind === "settled"
    ) {
      finalizeOnce(completionState.terminal);
    }
  };

  slotRecoveryTimer = setTimeout(() => {
    if (finalized) {
      return;
    }
    const timeoutError = buildTerminalResultError({
      task: ctx.task,
      terminal: "timeout",
    });
    if (timeoutError) {
      resolveResultOnce(timeoutError);
    }
    finalizeOnce("timeout");
  }, ctx.slotRecoveryTimeoutMs);

  void ctx.started.response
    .then((result) => {
      responseState = { kind: "settled", result };
      if (result.ok && completionState.kind === "pending") {
        queueMicrotask(() => {
          resolveWithResponsePriority(result);
          settleTerminalIfPossible();
        });
        return;
      }
      resolveWithResponsePriority(result);
      settleTerminalIfPossible();
    })
    .catch((error) => {
      responseState = {
        kind: "errored",
        failure: buildTaskPathError({
          logger: ctx.logger,
          task: ctx.task,
          errorSource: "response",
          error,
        }),
      };
      const terminalError = completionTerminalResultError();
      resolveResultOnce(terminalError ?? responseState.failure);
      settleTerminalIfPossible();
    });

  void ctx.started.completion
    .then((terminal) => {
      completionState = { kind: "settled", terminal };
      settleTerminalIfPossible();
    })
    .catch((error) => {
      completionState = {
        kind: "errored",
        failure: buildTaskPathError({
          logger: ctx.logger,
          task: ctx.task,
          errorSource: "completion",
          error,
        }),
      };
      resolveResultOnce(completionState.failure);
      settleTerminalIfPossible();
    });
}

/**
 * Create a queue-backed scheduler for skill execution.
 *
 * Why: P3 requires deterministic session FIFO + global concurrency + overflow
 * guard while keeping queue state observable for the AI panel.
 */
export function createSkillScheduler(args?: {
  globalConcurrencyLimit?: number;
  sessionQueueLimit?: number;
  slotRecoveryTimeoutMs?: number;
  logger?: SchedulerLogger;
}): SkillScheduler {
  const globalConcurrencyLimit = Math.max(
    1,
    Math.floor(args?.globalConcurrencyLimit ?? 8),
  );
  const sessionQueueLimit = Math.max(
    1,
    Math.floor(args?.sessionQueueLimit ?? 20),
  );
  const slotRecoveryTimeoutMs = (() => {
    const DEFAULT_SLOT_RECOVERY_TIMEOUT_MS = 125_000;
    const raw = args?.slotRecoveryTimeoutMs;
    if (
      typeof raw !== "number" ||
      !Number.isFinite(raw) ||
      !Number.isInteger(raw) ||
      raw <= 0
    ) {
      return DEFAULT_SLOT_RECOVERY_TIMEOUT_MS;
    }
    return Math.max(1, raw);
  })();

  const sessions = new Map<string, SessionQueueState>();
  const readySessionQueue: string[] = [];
  const readySessionSet = new Set<string>();
  const logger: SchedulerLogger = args?.logger ?? {
    error: (event, data) => {
      process.stderr.write(`${JSON.stringify({ event, ...data })}\n`);
    },
  };
  let globalRunning = 0;

  function getSessionState(sessionKey: string): SessionQueueState {
    const existing = sessions.get(sessionKey);
    if (existing) {
      return existing;
    }
    const created: SessionQueueState = {
      runningRunId: null,
      pending: [],
    };
    sessions.set(sessionKey, created);
    return created;
  }

  function enqueueReadySession(sessionKey: string): void {
    if (readySessionSet.has(sessionKey)) {
      return;
    }
    readySessionSet.add(sessionKey);
    readySessionQueue.push(sessionKey);
  }

  function emitQueueStatus(
    task: SkillTask<unknown>,
    status:
      | "queued"
      | "started"
      | "completed"
      | "failed"
      | "cancelled"
      | "timeout",
    queuePosition: number,
    queued: number,
  ): void {
    task.onQueueEvent?.(
      toQueueStatus({
        task,
        status,
        queuePosition,
        queued,
        globalRunning,
      }),
    );
  }

  function emitPendingQueuePositions(sessionKey: string): void {
    const state = sessions.get(sessionKey);
    if (!state) {
      return;
    }
    const hasRunning = state.runningRunId !== null;
    const queued = state.pending.length;
    for (let i = 0; i < state.pending.length; i += 1) {
      const task = state.pending[i];
      if (!task) {
        continue;
      }
      emitQueueStatus(task, "queued", hasRunning ? i + 1 : i, queued);
    }
  }

  function cleanupSessionIfIdle(sessionKey: string): void {
    const state = sessions.get(sessionKey);
    if (!state) {
      return;
    }
    if (state.runningRunId === null && state.pending.length === 0) {
      sessions.delete(sessionKey);
    }
  }

  function finalizeTask(
    sessionKey: string,
    task: SkillTask<unknown>,
    terminal: SkillSchedulerTerminal,
  ): void {
    const state = sessions.get(sessionKey);
    if (!state) {
      return;
    }

    if (state.runningRunId === task.runId) {
      state.runningRunId = null;
      globalRunning = Math.max(0, globalRunning - 1);
    }

    emitQueueStatus(
      task,
      terminal === "completed"
        ? "completed"
        : terminal === "cancelled"
          ? "cancelled"
          : terminal === "timeout"
            ? "timeout"
            : "failed",
      0,
      state.pending.length,
    );

    if (state.pending.length > 0) {
      emitPendingQueuePositions(sessionKey);
      enqueueReadySession(sessionKey);
    } else {
      cleanupSessionIfIdle(sessionKey);
    }

    pump();
  }

  function startTask(sessionKey: string, task: SkillTask<unknown>): void {
    const state = sessions.get(sessionKey);
    if (!state) {
      return;
    }

    state.runningRunId = task.runId;
    globalRunning += 1;
    emitQueueStatus(task, "started", 0, state.pending.length);

    let started: SkillTaskStartResult<unknown>;
    try {
      started = task.start();
    } catch (error) {
      task.resolveResult(
        ipcError("INTERNAL", "Skill scheduler failed to start task", {
          sessionKey: task.sessionKey,
          taskId: task.runId,
          errorMessage: normalizeErrorMessage(error),
          ...(task.executionId.trim().length > 0
            ? { executionId: task.executionId }
            : {}),
        }),
      );
      finalizeTask(sessionKey, task, "failed");
      return;
    }

    driveTaskSettlement({
      task,
      started,
      logger,
      slotRecoveryTimeoutMs,
      onFinalize: (terminal) => finalizeTask(sessionKey, task, terminal),
    });
  }

  function pump(): void {
    while (
      globalRunning < globalConcurrencyLimit &&
      readySessionQueue.length > 0
    ) {
      const sessionKey = readySessionQueue.shift();
      if (!sessionKey) {
        break;
      }
      readySessionSet.delete(sessionKey);

      const state = sessions.get(sessionKey);
      if (!state) {
        continue;
      }
      if (state.runningRunId !== null) {
        continue;
      }
      const next = state.pending.shift();
      if (!next) {
        cleanupSessionIfIdle(sessionKey);
        continue;
      }

      startTask(sessionKey, next);
    }
  }

  return {
    schedule: async <T>(args2: {
      sessionKey: string;
      executionId: string;
      runId: string;
      traceId: string;
      dependsOn?: string[];
      isDependencyAvailable?: (dependencyId: string) => boolean;
      onQueueEvent?: (status: SkillQueueStatus) => void;
      start: () => SkillTaskStartResult<T>;
    }): Promise<ServiceResult<T>> => {
      const dependencies = normalizeDependencies(args2.dependsOn);
      if (dependencies.length > 0) {
        const missing = dependencies.filter((dependency) =>
          args2.isDependencyAvailable
            ? !args2.isDependencyAvailable(dependency)
            : false,
        );
        if (missing.length > 0) {
          return ipcError(
            "SKILL_DEPENDENCY_MISSING",
            "Skill dependency missing",
            missing,
          );
        }
      }

      const state = getSessionState(args2.sessionKey);
      if (state.pending.length >= sessionQueueLimit) {
        return ipcError("SKILL_QUEUE_OVERFLOW", "Skill queue overflow", {
          sessionKey: args2.sessionKey,
          limit: sessionQueueLimit,
        });
      }

      return await new Promise<ServiceResult<T>>((resolve) => {
        const task: SkillTask<T> = {
          sessionKey: args2.sessionKey,
          executionId: args2.executionId,
          runId: args2.runId,
          traceId: args2.traceId,
          start: args2.start,
          onQueueEvent: args2.onQueueEvent,
          resolveResult: resolve,
        };

        state.pending.push(task as SkillTask<unknown>);
        emitPendingQueuePositions(args2.sessionKey);
        enqueueReadySession(args2.sessionKey);
        pump();
      });
    },
  };
}
