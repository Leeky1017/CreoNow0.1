import type { Logger } from "./logging/logger";

type FatalEventSource = "uncaughtException" | "unhandledRejection";

type FatalProcessLike = {
  on: (event: FatalEventSource, listener: (reason: unknown) => void) => void;
};

type AppLike = {
  once: (event: "will-quit", listener: () => void) => void;
  quit: () => void;
};

export type GlobalExceptionHandlerDeps = {
  processLike: FatalProcessLike;
  appLike: AppLike;
  logger: Pick<Logger, "error">;
  shutdownTimeoutMs?: number;
  exit?: (code: number) => void;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
};

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;
const installedProcessLikes = new WeakSet<FatalProcessLike>();

function describeReason(reason: unknown): {
  error_type: string;
  message: string;
} {
  if (reason instanceof Error) {
    return {
      error_type: reason.name,
      message: reason.message,
    };
  }

  return {
    error_type: typeof reason,
    message: String(reason),
  };
}

export function registerGlobalExceptionHandlers(
  deps: GlobalExceptionHandlerDeps,
): void {
  if (installedProcessLikes.has(deps.processLike)) {
    return;
  }

  installedProcessLikes.add(deps.processLike);

  const timeoutMs = deps.shutdownTimeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
  const setTimeoutFn = deps.setTimeoutFn ?? setTimeout;
  const clearTimeoutFn = deps.clearTimeoutFn ?? clearTimeout;
  const exit = deps.exit ?? ((code: number) => process.exit(code));

  let shutdownStarted = false;
  let exited = false;

  const exitWithFailure = (): void => {
    if (exited) {
      return;
    }
    exited = true;
    exit(1);
  };

  const handleFatal = (source: FatalEventSource, reason: unknown): void => {
    deps.logger.error("fatal_exception_captured", {
      source,
      ...describeReason(reason),
    });

    if (shutdownStarted) {
      deps.logger.error("fatal_exception_ignored_while_shutting_down", {
        source,
      });
      return;
    }

    shutdownStarted = true;

    const timeout = setTimeoutFn(() => {
      deps.logger.error("fatal_shutdown_timeout", {
        source,
        timeout_ms: timeoutMs,
      });
      exitWithFailure();
    }, timeoutMs);

    deps.appLike.once("will-quit", () => {
      clearTimeoutFn(timeout);
      exitWithFailure();
    });

    try {
      deps.appLike.quit();
    } catch (error) {
      clearTimeoutFn(timeout);
      deps.logger.error("fatal_shutdown_quit_failed", {
        source,
        message: error instanceof Error ? error.message : String(error),
      });
      exitWithFailure();
    }
  };

  try {
    deps.processLike.on("uncaughtException", (error) => {
      handleFatal("uncaughtException", error);
    });

    deps.processLike.on("unhandledRejection", (reason) => {
      handleFatal("unhandledRejection", reason);
    });
  } catch (error) {
    installedProcessLikes.delete(deps.processLike);
    throw error;
  }
}
