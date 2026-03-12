import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  installGlobalErrorHandlers,
  type GlobalErrorEntry,
} from "./globalErrorHandlers";

describe("installGlobalErrorHandlers", () => {
  let onError: ReturnType<typeof vi.fn<(entry: GlobalErrorEntry) => void>>;
  let onToast: ReturnType<typeof vi.fn<(entry: GlobalErrorEntry) => void>>;
  let cleanup: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    onError = vi.fn();
    onToast = vi.fn();
  });

  afterEach(() => {
    cleanup?.();
    vi.useRealTimers();
  });

  // ─── unhandledrejection 捕获 (AC-1, AC-2) ───

  it("PromiseRejectionEvent(Error) → onError 收到 source='unhandledrejection'", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    const err = new Error("IPC timeout");
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: err,
      }),
    );

    expect(onError).toHaveBeenCalledOnce();
    const entry: GlobalErrorEntry = onError.mock.calls[0][0];
    expect(entry.source).toBe("unhandledrejection");
    expect(entry.name).toBe("Error");
    expect(entry.message).toBe("IPC timeout");
    expect(entry.stack).toBeDefined();
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("PromiseRejectionEvent(非 Error) → name='UnknownError'", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: "raw rejection",
      }),
    );

    expect(onError).toHaveBeenCalledOnce();
    const entry: GlobalErrorEntry = onError.mock.calls[0][0];
    expect(entry.name).toBe("UnknownError");
    expect(entry.message).toBe("raw rejection");
  });

  it("卸载后不再捕获 unhandledrejection", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });
    cleanup();

    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new Error("after cleanup"),
      }),
    );

    expect(onError).not.toHaveBeenCalled();
  });

  // ─── error 捕获 (AC-3) ───

  it("ErrorEvent(TypeError) → onError 收到 source='error'", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    const err = new TypeError("Cannot read properties of undefined");
    window.dispatchEvent(
      new ErrorEvent("error", { error: err, message: err.message }),
    );

    expect(onError).toHaveBeenCalledOnce();
    const entry: GlobalErrorEntry = onError.mock.calls[0][0];
    expect(entry.source).toBe("error");
    expect(entry.name).toBe("TypeError");
    expect(entry.message).toBe("Cannot read properties of undefined");
  });

  it("ErrorEvent(无 error 对象) → name='UnknownError'", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    window.dispatchEvent(
      new ErrorEvent("error", { message: "Script error" }),
    );

    expect(onError).toHaveBeenCalledOnce();
    const entry: GlobalErrorEntry = onError.mock.calls[0][0];
    expect(entry.name).toBe("UnknownError");
    expect(entry.message).toBe("Script error");
  });

  it("卸载后不再捕获 error", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });
    cleanup();

    // Re-install a no-op listener to prevent jsdom from throwing
    const noop = (e: ErrorEvent): void => {
      e.preventDefault();
    };
    window.addEventListener("error", noop);
    window.dispatchEvent(
      new ErrorEvent("error", { error: new Error("after cleanup") }),
    );
    window.removeEventListener("error", noop);

    expect(onError).not.toHaveBeenCalled();
  });

  // ─── Toast 去重 (AC-4, AC-5) ───

  it("同一 name+message 1000ms 内触发 3 次 → onToast 仅调用 1 次", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    for (let i = 0; i < 3; i++) {
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          promise: Promise.resolve(),
          reason: new Error("same error"),
        }),
      );
    }

    expect(onToast).toHaveBeenCalledOnce();
  });

  it("去重不影响日志 — 3 次触发 → onError 3 次", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    for (let i = 0; i < 3; i++) {
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          promise: Promise.resolve(),
          reason: new Error("same error"),
        }),
      );
    }

    expect(onError).toHaveBeenCalledTimes(3);
  });

  it("冷却过期后可再次触发 onToast", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new Error("same error"),
      }),
    );
    expect(onToast).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(1001);

    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new Error("same error"),
      }),
    );
    expect(onToast).toHaveBeenCalledTimes(2);
  });

  it("不同 name+message 200ms 内各触发 1 次 → onToast 2 次", () => {
    cleanup = installGlobalErrorHandlers({ onError, onToast });

    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new TypeError("error A"),
      }),
    );
    vi.advanceTimersByTime(200);
    window.dispatchEvent(
      new PromiseRejectionEvent("unhandledrejection", {
        promise: Promise.resolve(),
        reason: new RangeError("error B"),
      }),
    );

    expect(onToast).toHaveBeenCalledTimes(2);
  });
});
