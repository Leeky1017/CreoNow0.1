import type { Logger } from "../../logging/logger";
import { createKeyedMutex } from "../shared/concurrency";

export type ProjectLifecycleTimers = {
  setTimeout: (callback: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (handle: ReturnType<typeof setTimeout>) => void;
};

export type ProjectLifecycleParticipant = {
  id: string;
  unbind: (args: {
    projectId: string;
    traceId: string;
    signal: AbortSignal;
  }) => void | Promise<void>;
  bind: (args: {
    projectId: string;
    traceId: string;
    signal: AbortSignal;
  }) => void | Promise<void>;
};

export type ProjectLifecycle = {
  register: (participant: ProjectLifecycleParticipant) => void;
  unbindAll: (args: { projectId: string; traceId: string }) => Promise<void>;
  bindAll: (args: { projectId: string; traceId: string }) => Promise<void>;
  switchProject: <T>(args: {
    fromProjectId: string;
    toProjectId: string;
    traceId: string;
    persist: () => Promise<T>;
  }) => Promise<T>;
};

function normalizeTimeoutMs(timeoutMs: number | undefined): number {
  if (typeof timeoutMs !== "number" || !Number.isFinite(timeoutMs)) {
    return 5_000;
  }
  const value = Math.floor(timeoutMs);
  if (value <= 0) {
    return 0;
  }
  return value;
}

export function createProjectLifecycle(deps: {
  logger: Logger;
  timeoutMs?: number;
  timers?: ProjectLifecycleTimers;
}): ProjectLifecycle {
  const timeoutMs = normalizeTimeoutMs(deps.timeoutMs);
  const timers = deps.timers ?? {
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
  };

  const participants = new Map<string, ProjectLifecycleParticipant>();
  const switchMutex = createKeyedMutex();
  const scopeByProjectId = new Map<string, string>();
  const activeProjectByScope = new Map<string, string>();
  const inflightSwitchByScopeAndTarget = new Map<string, Promise<unknown>>();

  function resolveScopeKey(projectId: string): string {
    const normalizedProjectId = projectId.trim();
    if (normalizedProjectId.length === 0) {
      return "";
    }
    return scopeByProjectId.get(normalizedProjectId) ?? normalizedProjectId;
  }

  async function runStep(args: {
    step: "unbind" | "bind";
    participant: ProjectLifecycleParticipant;
    projectId: string;
    traceId: string;
  }): Promise<void> {
    const normalizedProjectId = args.projectId.trim();
    if (normalizedProjectId.length === 0) {
      return;
    }

    const controller = new AbortController();
    let operation:
      | void
      | Promise<void>
      | { then: (onFulfilled: () => void, onRejected?: (error: unknown) => void) => unknown };

    try {
      operation =
        args.step === "unbind"
          ? args.participant.unbind({
              projectId: normalizedProjectId,
              traceId: args.traceId,
              signal: controller.signal,
            })
          : args.participant.bind({
              projectId: normalizedProjectId,
              traceId: args.traceId,
              signal: controller.signal,
            });
    } catch (error) {
      deps.logger.error("project_lifecycle_step_failed", {
        step: args.step,
        participantId: args.participant.id,
        projectId: normalizedProjectId,
        traceId: args.traceId,
        message: error instanceof Error ? error.message : String(error),
      });
      return;
    }

    if (operation === undefined) {
      return;
    }

    const operationPromise = Promise.resolve(operation);
    if (timeoutMs === 0) {
      try {
        await operationPromise;
      } catch (error) {
        deps.logger.error("project_lifecycle_step_failed", {
          step: args.step,
          participantId: args.participant.id,
          projectId: normalizedProjectId,
          traceId: args.traceId,
          message: error instanceof Error ? error.message : String(error),
        });
      }
      return;
    }

    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
    type StepOutcome =
      | { kind: "ok" }
      | { kind: "timeout" }
      | { kind: "error"; error: unknown };

    const operationOutcomePromise: Promise<StepOutcome> = operationPromise
      .then((): StepOutcome => ({ kind: "ok" }))
      .catch((error): StepOutcome => ({ kind: "error", error }));

    const timeoutOutcomePromise = new Promise<StepOutcome>((resolve) => {
      timeoutHandle = timers.setTimeout(() => {
        resolve({ kind: "timeout" });
        controller.abort();
      }, timeoutMs);
    });

    try {
      const outcome = await Promise.race<StepOutcome>([
        operationOutcomePromise,
        timeoutOutcomePromise,
      ]);

      if (outcome.kind === "timeout") {
        deps.logger.error("project_lifecycle_step_timed_out", {
          step: args.step,
          participantId: args.participant.id,
          projectId: normalizedProjectId,
          traceId: args.traceId,
          timeoutMs,
        });
        void operationOutcomePromise.then((settled) => {
          if (settled.kind !== "error") {
            return;
          }
          deps.logger.error("project_lifecycle_step_failed", {
            step: args.step,
            participantId: args.participant.id,
            projectId: normalizedProjectId,
            traceId: args.traceId,
            message:
              settled.error instanceof Error
                ? settled.error.message
                : String(settled.error),
          });
        });
        return;
      }

      if (outcome.kind === "error") {
        deps.logger.error("project_lifecycle_step_failed", {
          step: args.step,
          participantId: args.participant.id,
          projectId: normalizedProjectId,
          traceId: args.traceId,
          message:
            outcome.error instanceof Error
              ? outcome.error.message
              : String(outcome.error),
        });
      }
    } finally {
      if (timeoutHandle) {
        timers.clearTimeout(timeoutHandle);
      }
    }
  }

  return {
    register: (participant) => {
      const id = participant.id.trim();
      if (id.length === 0) {
        return;
      }
      participants.set(id, { ...participant, id });
    },

    unbindAll: async ({ projectId, traceId }) => {
      for (const participant of participants.values()) {
        await runStep({
          step: "unbind",
          participant,
          projectId,
          traceId,
        });
      }
    },

    bindAll: async ({ projectId, traceId }) => {
      for (const participant of participants.values()) {
        await runStep({
          step: "bind",
          participant,
          projectId,
          traceId,
        });
      }
    },

    switchProject: async ({ fromProjectId, toProjectId, traceId, persist }) => {
      const normalizedFrom = fromProjectId.trim();
      const normalizedTo = toProjectId.trim();
      const scopeKey = resolveScopeKey(normalizedFrom);
      if (scopeKey.length > 0) {
        scopeByProjectId.set(normalizedFrom, scopeKey);
      }

      const dedupeKey = `${scopeKey}->${normalizedTo}`;
      const existingInflight = inflightSwitchByScopeAndTarget.get(dedupeKey);
      if (existingInflight) {
        return (await existingInflight) as Awaited<ReturnType<typeof persist>>;
      }

      const runPromise = switchMutex.runExclusive(scopeKey, async () => {
        const currentFrom =
          activeProjectByScope.get(scopeKey) ?? normalizedFrom;
        if (scopeKey.length > 0) {
          scopeByProjectId.set(currentFrom, scopeKey);
        }

        if (currentFrom !== normalizedTo) {
          for (const participant of participants.values()) {
            await runStep({
              step: "unbind",
              participant,
              projectId: currentFrom,
              traceId,
            });
          }
        }

        const result = await persist();

        if (currentFrom !== normalizedTo) {
          for (const participant of participants.values()) {
            await runStep({
              step: "bind",
              participant,
              projectId: normalizedTo,
              traceId,
            });
          }
          if (scopeKey.length > 0) {
            activeProjectByScope.set(scopeKey, normalizedTo);
            scopeByProjectId.set(normalizedTo, scopeKey);
          }
        }

        return result;
      });

      inflightSwitchByScopeAndTarget.set(dedupeKey, runPromise);
      try {
        return await runPromise;
      } finally {
        if (inflightSwitchByScopeAndTarget.get(dedupeKey) === runPromise) {
          inflightSwitchByScopeAndTarget.delete(dedupeKey);
        }
      }
    },
  };
}
