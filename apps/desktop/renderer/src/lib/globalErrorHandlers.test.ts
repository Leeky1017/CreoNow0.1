import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  installGlobalErrorHandlers,
  TOAST_DEDUP_WINDOW_MS,
  type GlobalErrorEntry,
} from "./globalErrorHandlers";

describe("installGlobalErrorHandlers", () => {
  let onError: ReturnType<typeof vi.fn<(entry: GlobalErrorEntry) => void>>;
  let showToast: ReturnType<typeof vi.fn<(title: string, description: string) => void>>;
  let uninstall: () => void;

  beforeEach(() => {
    onError = vi.fn<(entry: GlobalErrorEntry) => void>();
    showToast = vi.fn<(title: string, description: string) => void>();
  });

  afterEach(() => {
    uninstall?.();
  });

  // --- Task 1.1: unhandledrejection 捕获 ---

  describe("unhandledrejection 捕获", () => {
    it("Error 类型的 reason → onError 收到 source=unhandledrejection, name=Error, message 匹配", () => {
      uninstall = installGlobalErrorHandlers({ onError, showToast });

      const error = new Error("IPC timeout");
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: error,
          promise: Promise.resolve(),
        }),
      );

      expect(onError).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onError.mock.calls[0][0];
      expect(entry.source).toBe("unhandledrejection");
      expect(entry.name).toBe("Error");
      expect(entry.message).toBe("IPC timeout");
    });

    it("非 Error 类型的 reason（字符串） → name=UnknownError, message 为字符串值", () => {
      uninstall = installGlobalErrorHandlers({ onError, showToast });

      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: "raw rejection",
          promise: Promise.resolve(),
        }),
      );

      expect(onError).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onError.mock.calls[0][0];
      expect(entry.name).toBe("UnknownError");
      expect(entry.message).toBe("raw rejection");
    });

    it("卸载后 dispatch unhandledrejection → onError 不被调用", () => {
      uninstall = installGlobalErrorHandlers({ onError, showToast });
      uninstall();

      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: new Error("after uninstall"),
          promise: Promise.resolve(),
        }),
      );

      expect(onError).not.toHaveBeenCalled();
    });
  });

  // --- Task 1.2: error 捕获 ---

  describe("error 事件捕获", () => {
    it("TypeError → onError 收到 source=error, name=TypeError", () => {
      uninstall = installGlobalErrorHandlers({ onError, showToast });

      const error = new TypeError(
        "Cannot read properties of undefined",
      );
      window.dispatchEvent(
        new ErrorEvent("error", { error, message: error.message }),
      );

      expect(onError).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onError.mock.calls[0][0];
      expect(entry.source).toBe("error");
      expect(entry.name).toBe("TypeError");
    });

    it("error 为 undefined、仅有 message → name=UnknownError", () => {
      uninstall = installGlobalErrorHandlers({ onError, showToast });

      window.dispatchEvent(
        new ErrorEvent("error", {
          error: undefined,
          message: "Script error.",
        }),
      );

      expect(onError).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onError.mock.calls[0][0];
      expect(entry.name).toBe("UnknownError");
      expect(entry.message).toBe("Script error.");
    });

    it("卸载后 dispatch error → onError 不被调用", () => {
      uninstall = installGlobalErrorHandlers({ onError, showToast });
      uninstall();

      // Suppress jsdom's uncaught exception reporting for this test
      const suppressHandler = (e: ErrorEvent) => e.preventDefault();
      window.addEventListener("error", suppressHandler);
      try {
        window.dispatchEvent(
          new ErrorEvent("error", {
            error: new Error("after uninstall"),
            message: "after uninstall",
          }),
        );
      } finally {
        window.removeEventListener("error", suppressHandler);
      }

      expect(onError).not.toHaveBeenCalled();
    });
  });

  // --- Task 1.3: Toast 去重逻辑 ---

  describe("Toast 去重", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("同一 name+message 1000ms 内触发 3 次 → showToast 仅调用 1 次", () => {
      uninstall = installGlobalErrorHandlers({
        onError,
        showToast,
        now: () => Date.now(),
      });

      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(
          new PromiseRejectionEvent("unhandledrejection", {
            reason: new Error("dup"),
            promise: Promise.resolve(),
          }),
        );
        vi.advanceTimersByTime(100);
      }

      expect(showToast).toHaveBeenCalledOnce();
    });

    it("冷却 1001ms 后再次触发 → showToast 被调用第 2 次", () => {
      let fakeNow = 0;
      uninstall = installGlobalErrorHandlers({
        onError,
        showToast,
        now: () => fakeNow,
      });

      const fire = () =>
        window.dispatchEvent(
          new PromiseRejectionEvent("unhandledrejection", {
            reason: new Error("dup"),
            promise: Promise.resolve(),
          }),
        );

      fire();
      expect(showToast).toHaveBeenCalledTimes(1);

      fakeNow = TOAST_DEDUP_WINDOW_MS + 1;
      fire();
      expect(showToast).toHaveBeenCalledTimes(2);
    });

    it("不同 name+message 200ms 内各触发 1 次 → showToast 调用 2 次", () => {
      uninstall = installGlobalErrorHandlers({
        onError,
        showToast,
        now: () => Date.now(),
      });

      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: new Error("error-a"),
          promise: Promise.resolve(),
        }),
      );
      vi.advanceTimersByTime(200);
      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: new TypeError("error-b"),
          promise: Promise.resolve(),
        }),
      );

      expect(showToast).toHaveBeenCalledTimes(2);
    });

    it("去重仅影响 Toast — 3 次触发 → onError 被调用 3 次", () => {
      uninstall = installGlobalErrorHandlers({
        onError,
        showToast,
        now: () => Date.now(),
      });

      for (let i = 0; i < 3; i++) {
        window.dispatchEvent(
          new PromiseRejectionEvent("unhandledrejection", {
            reason: new Error("dup"),
            promise: Promise.resolve(),
          }),
        );
      }

      expect(onError).toHaveBeenCalledTimes(3);
      expect(showToast).toHaveBeenCalledOnce();
    });
  });

  // --- Task 1.4: 日志 IPC 调用失败防递归 ---

  describe("IPC 日志失败防递归", () => {
    it("onError 抛出异常时 handler 不崩溃，showToast 仍被调用，console.error 记录异常", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const throwingOnError = vi.fn<(entry: GlobalErrorEntry) => void>(() => {
        throw new Error("IPC send failed");
      });

      uninstall = installGlobalErrorHandlers({
        onError: throwingOnError,
        showToast,
      });

      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: new Error("original"),
          promise: Promise.resolve(),
        }),
      );

      // onError is called once
      expect(throwingOnError).toHaveBeenCalledOnce();
      // showToast is still called despite onError throwing
      expect(showToast).toHaveBeenCalledOnce();
      // console.error logs the caught exception
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[globalErrorHandler] onError callback threw:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("handler 内部的异常不产生递归 — inHandler guard 阻止重入", () => {
      let callCount = 0;
      const recursiveOnError = vi.fn<(entry: GlobalErrorEntry) => void>(() => {
        callCount++;
        if (callCount === 1) {
          // Simulate a sync error inside the handler
          window.dispatchEvent(
            new ErrorEvent("error", {
              error: new Error("recursive"),
              message: "recursive",
            }),
          );
        }
      });

      uninstall = installGlobalErrorHandlers({
        onError: recursiveOnError,
        showToast,
      });

      window.dispatchEvent(
        new PromiseRejectionEvent("unhandledrejection", {
          reason: new Error("trigger"),
          promise: Promise.resolve(),
        }),
      );

      // Only the first call should go through; the recursive dispatch is blocked
      expect(recursiveOnError).toHaveBeenCalledOnce();
    });
  });
});
