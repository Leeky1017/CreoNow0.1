/**
 * 渲染进程全局未处理异常兜底。
 *
 * Why: 未被业务 .catch() / try-catch 捕获的 async rejection 和 runtime error
 * 只会停留在 DevTools 控制台，用户毫无感知。此模块在 React 挂载前注册
 * window 级监听器，确保这些遗漏的异常被拦截、通知用户、并落盘日志。
 */

export interface GlobalErrorEntry {
  source: "unhandledrejection" | "error";
  name: string;
  message: string;
  stack: string | undefined;
  timestamp: string;
}

const DEDUP_WINDOW_MS = 1000;

export function installGlobalErrorHandlers(options: {
  onError: (entry: GlobalErrorEntry) => void;
  onToast: (entry: GlobalErrorEntry) => void;
}): () => void {
  const dedupMap = new Map<string, number>();

  function process(entry: GlobalErrorEntry): void {
    options.onError(entry);

    const key = `${entry.name}:${entry.message}`;
    const now = Date.now();
    const lastTime = dedupMap.get(key);
    if (lastTime !== undefined && now - lastTime < DEDUP_WINDOW_MS) {
      return;
    }
    dedupMap.set(key, now);
    options.onToast(entry);
  }

  function onUnhandledRejection(event: PromiseRejectionEvent): void {
    event.preventDefault();
    const reason: unknown = event.reason;
    const entry: GlobalErrorEntry =
      reason instanceof Error
        ? {
            source: "unhandledrejection",
            name: reason.name,
            message: reason.message,
            stack: reason.stack,
            timestamp: new Date().toISOString(),
          }
        : {
            source: "unhandledrejection",
            name: "UnknownError",
            message: String(reason),
            stack: undefined,
            timestamp: new Date().toISOString(),
          };
    process(entry);
  }

  function onError(event: ErrorEvent): void {
    const err: unknown = event.error;
    const entry: GlobalErrorEntry =
      err instanceof Error
        ? {
            source: "error",
            name: err.name,
            message: err.message,
            stack: err.stack,
            timestamp: new Date().toISOString(),
          }
        : {
            source: "error",
            name: "UnknownError",
            message: event.message || String(err),
            stack: undefined,
            timestamp: new Date().toISOString(),
          };
    process(entry);
  }

  window.addEventListener("unhandledrejection", onUnhandledRejection);
  window.addEventListener("error", onError);

  return () => {
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
    window.removeEventListener("error", onError);
  };
}
