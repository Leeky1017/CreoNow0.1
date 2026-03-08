/**
 * Global error handlers for the renderer process.
 *
 * Catches unhandled exceptions and promise rejections that escape React's
 * error boundary, preventing silent white-screen crashes.
 *
 * Must be installed **before** ReactDOM.createRoot().render().
 */

export interface GlobalErrorEntry {
  source: "unhandledrejection" | "error";
  name: string;
  message: string;
  stack: string | undefined;
  timestamp: string;
}

export interface InstallGlobalErrorHandlersOptions {
  onError: (entry: GlobalErrorEntry) => void;
  showToast: (title: string, description: string) => void;
  /** Override for testing — defaults to Date.now */
  now?: () => number;
}

export const TOAST_DEDUP_WINDOW_MS = 1000;

/**
 * Custom event name used to bridge global error toast requests to React.
 */
export const GLOBAL_ERROR_TOAST_EVENT = "creonow:global-error-toast";

export interface GlobalErrorToastDetail {
  title: string;
  description: string;
}

function extractErrorInfo(error: unknown): {
  name: string;
  message: string;
  stack: string | undefined;
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
    stack: undefined,
  };
}

/**
 * Install global error and unhandledrejection listeners on `window`.
 *
 * Returns uninstall function that removes both listeners.
 */
export function installGlobalErrorHandlers(
  options: InstallGlobalErrorHandlersOptions,
): () => void {
  const { onError, showToast, now = Date.now } = options;
  const dedupMap = new Map<string, number>();
  let inHandler = false;

  function handleEntry(entry: GlobalErrorEntry): void {
    if (inHandler) {
      return;
    }
    inHandler = true;
    try {
      // Always forward to logging — dedup does NOT affect log delivery
      try {
        onError(entry);
      } catch (err) {
        console.error("[globalErrorHandler] onError callback threw:", err);
      }

      // Toast dedup: same name+message within TOAST_DEDUP_WINDOW_MS → skip
      const key = `${entry.name}:${entry.message}`;
      const ts = now();
      const lastTs = dedupMap.get(key);
      if (lastTs === undefined || ts - lastTs >= TOAST_DEDUP_WINDOW_MS) {
        dedupMap.set(key, ts);
        showToast(entry.name, entry.message);
      }
    } finally {
      inHandler = false;
    }
  }

  function onUnhandledRejection(event: PromiseRejectionEvent): void {
    event.preventDefault();
    const info = extractErrorInfo(event.reason);
    handleEntry({
      source: "unhandledrejection",
      ...info,
      timestamp: new Date().toISOString(),
    });
  }

  function onWindowError(event: ErrorEvent): void {
    const info = event.error
      ? extractErrorInfo(event.error)
      : { name: "UnknownError", message: event.message, stack: undefined };
    handleEntry({
      source: "error",
      ...info,
      timestamp: new Date().toISOString(),
    });
  }

  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onWindowError);

  return () => {
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    window.removeEventListener("error", onWindowError);
  };
}
