export interface GlobalErrorEntry {
  source: "unhandledrejection" | "error";
  name: string;
  message: string;
  stack: string | undefined;
  timestamp: string;
}

interface GlobalErrorHandlerOptions {
  onLog: (entry: GlobalErrorEntry) => void;
  onToast: (entry: GlobalErrorEntry) => void;
}

const DEDUP_WINDOW_MS = 1000;

function extractErrorInfo(raw: unknown): {
  name: string;
  message: string;
  stack: string | undefined;
} {
  if (raw instanceof Error) {
    return {
      name: raw.name,
      message: raw.message,
      stack: raw.stack,
    };
  }
  return {
    name: "UnknownError",
    message: String(raw),
    stack: undefined,
  };
}

function buildDedupKey(name: string, message: string): string {
  return `${name}:${message}`;
}

export function installGlobalErrorHandlers(
  options: GlobalErrorHandlerOptions,
): () => void {
  const lastToastTime = new Map<string, number>();

  function shouldShowToast(key: string, now: number): boolean {
    const last = lastToastTime.get(key);
    if (last !== undefined && now - last < DEDUP_WINDOW_MS) {
      return false;
    }
    lastToastTime.set(key, now);
    return true;
  }

  function handleError(source: GlobalErrorEntry["source"], raw: unknown): void {
    const { name, message, stack } = extractErrorInfo(raw);
    const entry: GlobalErrorEntry = {
      source,
      name,
      message,
      stack,
      timestamp: new Date().toISOString(),
    };

    try {
      options.onLog(entry);
    } catch (logError) {
      // eslint-disable-next-line no-console
      console.error(
        "[GlobalErrorHandler] onLog failed, suppressing to prevent recursion",
        logError,
      );
      return;
    }

    const key = buildDedupKey(name, message);
    if (shouldShowToast(key, Date.now())) {
      options.onToast(entry);
    }
  }

  function onUnhandledRejection(event: PromiseRejectionEvent): void {
    event.preventDefault();
    handleError("unhandledrejection", event.reason);
  }

  function onError(event: ErrorEvent): void {
    const raw =
      event.error !== undefined && event.error !== null
        ? event.error
        : event.message;
    handleError("error", raw);
  }

  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onError);

  return () => {
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    window.removeEventListener("error", onError);
  };
}
