export type BackgroundTaskCompleted<T> = {
  status: "completed";
  value: T;
};

export type BackgroundTaskFailed = {
  status: "error" | "timeout" | "aborted" | "crashed";
  error: Error;
};

export type BackgroundTaskResult<T> =
  | BackgroundTaskCompleted<T>
  | BackgroundTaskFailed;

export type BackgroundTaskRunArgs<T> = {
  execute?: (signal: AbortSignal) => Promise<T>;
  run?: (signal: AbortSignal) => Promise<T>;
  timeoutMs?: number;
  signal?: AbortSignal;
  crashSignal?: AbortSignal;
};

type InflightCrashResolver = (error: Error) => void;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_TIMEOUT_MESSAGE = "background task timed out";
const DEFAULT_ABORT_MESSAGE = "background task aborted";
const DEFAULT_CRASH_MESSAGE = "utility process crashed";

function toError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(
    typeof error === "string" && error.length > 0 ? error : fallbackMessage,
  );
}

function createAbortError(message = DEFAULT_ABORT_MESSAGE): Error {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

function createTimeoutError(message = DEFAULT_TIMEOUT_MESSAGE): Error {
  const error = new Error(message);
  error.name = "TimeoutError";
  return error;
}

export type BackgroundTaskRunner = {
  run: <T>(args: BackgroundTaskRunArgs<T>) => Promise<BackgroundTaskResult<T>>;
  crashAll: (reason?: unknown) => void;
};

export function createBackgroundTaskRunner(): BackgroundTaskRunner {
  let sequence = 0;
  const inflight = new Map<number, InflightCrashResolver>();

  return {
    async run<T>(
      args: BackgroundTaskRunArgs<T>,
    ): Promise<BackgroundTaskResult<T>> {
      sequence += 1;
      const taskId = sequence;

      const controller = new AbortController();
      let timeoutTriggered = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const detachExternalAbort = (() => {
        if (!args.signal) {
          return () => undefined;
        }

        if (args.signal.aborted) {
          controller.abort(args.signal.reason);
          return () => undefined;
        }

        const onAbort = () => {
          controller.abort(args.signal?.reason);
        };
        args.signal.addEventListener("abort", onAbort, { once: true });
        return () => {
          args.signal?.removeEventListener("abort", onAbort);
        };
      })();

      const timeoutMs =
        Number.isFinite(args.timeoutMs) && (args.timeoutMs ?? 0) > 0
          ? (args.timeoutMs as number)
          : DEFAULT_TIMEOUT_MS;

      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          timeoutTriggered = true;
          controller.abort(createTimeoutError());
        }, timeoutMs);
      }

      let detachCrashSignal = () => undefined;
      const crashedResult = new Promise<BackgroundTaskResult<T>>((resolve) => {
        const settleCrashed = (error: Error) => {
          resolve({ status: "crashed", error });
        };
        inflight.set(taskId, settleCrashed);

        if (!args.crashSignal) {
          return;
        }
        if (args.crashSignal.aborted) {
          settleCrashed(
            toError(args.crashSignal.reason, DEFAULT_CRASH_MESSAGE),
          );
          return;
        }

        const onCrash = () => {
          settleCrashed(
            toError(args.crashSignal?.reason, DEFAULT_CRASH_MESSAGE),
          );
        };
        args.crashSignal.addEventListener("abort", onCrash, { once: true });
        detachCrashSignal = () => {
          args.crashSignal?.removeEventListener("abort", onCrash);
        };
      });

      const executionResult = (async (): Promise<BackgroundTaskResult<T>> => {
        if (controller.signal.aborted) {
          return timeoutTriggered
            ? { status: "timeout", error: createTimeoutError() }
            : { status: "aborted", error: createAbortError() };
        }

        const execute = args.execute ?? args.run;
        if (!execute) {
          return {
            status: "error",
            error: new Error("background task handler is required"),
          };
        }

        try {
          const value = await execute(controller.signal);
          if (controller.signal.aborted) {
            return timeoutTriggered
              ? { status: "timeout", error: createTimeoutError() }
              : { status: "aborted", error: createAbortError() };
          }
          return { status: "completed", value };
        } catch (error) {
          if (controller.signal.aborted) {
            return timeoutTriggered
              ? { status: "timeout", error: createTimeoutError() }
              : { status: "aborted", error: createAbortError() };
          }
          return {
            status: "error",
            error: toError(error, "background task failed"),
          };
        }
      })();

      let detachAbortListener = () => undefined;
      const abortedResult = new Promise<BackgroundTaskResult<T>>((resolve) => {
        if (controller.signal.aborted) {
          resolve(
            timeoutTriggered
              ? { status: "timeout", error: createTimeoutError() }
              : { status: "aborted", error: createAbortError() },
          );
          return;
        }

        const onAbort = () => {
          resolve(
            timeoutTriggered
              ? { status: "timeout", error: createTimeoutError() }
              : { status: "aborted", error: createAbortError() },
          );
        };
        controller.signal.addEventListener("abort", onAbort, { once: true });
        detachAbortListener = () => {
          controller.signal.removeEventListener("abort", onAbort);
        };
      });

      const result = await Promise.race([
        executionResult,
        crashedResult,
        abortedResult,
      ]);

      inflight.delete(taskId);
      detachExternalAbort();
      detachCrashSignal();
      detachAbortListener();
      if (timer) {
        clearTimeout(timer);
      }

      return result;
    },

    crashAll(reason?: unknown): void {
      const crashError = toError(reason, DEFAULT_CRASH_MESSAGE);
      for (const resolve of inflight.values()) {
        resolve(crashError);
      }
      inflight.clear();
    },
  };
}
