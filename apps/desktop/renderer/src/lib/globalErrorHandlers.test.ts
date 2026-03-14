import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  installGlobalErrorHandlers,
  type GlobalErrorEntry,
} from "./globalErrorHandlers";

describe("installGlobalErrorHandlers", () => {
  let onLog: ReturnType<typeof vi.fn<(entry: GlobalErrorEntry) => void>>;
  let onToast: ReturnType<typeof vi.fn<(entry: GlobalErrorEntry) => void>>;
  let cleanup: () => void;

  beforeEach(() => {
    onLog = vi.fn<(entry: GlobalErrorEntry) => void>();
    onToast = vi.fn<(entry: GlobalErrorEntry) => void>();
    cleanup = installGlobalErrorHandlers({ onLog, onToast });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe("unhandledrejection 捕获", () => {
    it("捕获 Error 类型的 rejection，source 为 unhandledrejection", () => {
      const error = new Error("IPC timeout");
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: error,
        promise: Promise.reject(error).catch(() => {}),
      });
      window.dispatchEvent(event);

      expect(onLog).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onLog.mock.calls[0][0];
      expect(entry.source).toBe("unhandledrejection");
      expect(entry.name).toBe("Error");
      expect(entry.message).toBe("IPC timeout");
      expect(entry.stack).toBeDefined();
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it("捕获非 Error 类型的 rejection，name 为 UnknownError", () => {
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: "raw rejection",
        promise: Promise.reject("raw rejection").catch(() => {}),
      });
      window.dispatchEvent(event);

      expect(onLog).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onLog.mock.calls[0][0];
      expect(entry.source).toBe("unhandledrejection");
      expect(entry.name).toBe("UnknownError");
      expect(entry.message).toBe("raw rejection");
      expect(entry.stack).toBeUndefined();
    });

    it("卸载后不再捕获 unhandledrejection", () => {
      cleanup();
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: new Error("after cleanup"),
        promise: Promise.reject(new Error("after cleanup")).catch(() => {}),
      });
      window.dispatchEvent(event);

      expect(onLog).not.toHaveBeenCalled();
    });

    it("调用 event.preventDefault() 阻止默认控制台输出", () => {
      const error = new Error("test");
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: error,
        promise: Promise.reject(error).catch(() => {}),
        cancelable: true,
      });
      const preventSpy = vi.spyOn(event, "preventDefault");
      window.dispatchEvent(event);

      expect(preventSpy).toHaveBeenCalledOnce();
    });
  });

  describe("error 捕获", () => {
    it("捕获 TypeError，source 为 error", () => {
      const error = new TypeError("Cannot read properties of undefined");
      const event = new ErrorEvent("error", {
        error,
        message: error.message,
      });
      window.dispatchEvent(event);

      expect(onLog).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onLog.mock.calls[0][0];
      expect(entry.source).toBe("error");
      expect(entry.name).toBe("TypeError");
      expect(entry.message).toBe("Cannot read properties of undefined");
    });

    it("error 为 undefined 时使用 event.message 和 UnknownError", () => {
      const event = new ErrorEvent("error", {
        error: undefined,
        message: "Script error.",
      });
      window.dispatchEvent(event);

      expect(onLog).toHaveBeenCalledOnce();
      const entry: GlobalErrorEntry = onLog.mock.calls[0][0];
      expect(entry.source).toBe("error");
      expect(entry.name).toBe("UnknownError");
      expect(entry.message).toBe("Script error.");
    });

    it("卸载后不再捕获 error 事件", () => {
      cleanup();

      const catcher = (e: ErrorEvent): void => {
        e.preventDefault();
      };
      window.addEventListener("error", catcher);

      const event = new ErrorEvent("error", {
        error: new Error("after cleanup"),
        cancelable: true,
      });
      window.dispatchEvent(event);

      window.removeEventListener("error", catcher);

      expect(onLog).not.toHaveBeenCalled();
    });
  });

  describe("Toast 去重逻辑", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("同一 name+message 在 1000ms 内触发 3 次，onToast 仅调用 1 次", () => {
      for (let i = 0; i < 3; i++) {
        const error = new Error("repeated");
        const event = new PromiseRejectionEvent("unhandledrejection", {
          reason: error,
          promise: Promise.reject(error).catch(() => {}),
        });
        window.dispatchEvent(event);
        vi.advanceTimersByTime(200);
      }

      expect(onToast).toHaveBeenCalledOnce();
    });

    it("冷却期过后重新触发 onToast", () => {
      const error1 = new Error("repeated");
      const event1 = new PromiseRejectionEvent("unhandledrejection", {
        reason: error1,
        promise: Promise.reject(error1).catch(() => {}),
      });
      window.dispatchEvent(event1);

      vi.advanceTimersByTime(1001);

      const error2 = new Error("repeated");
      const event2 = new PromiseRejectionEvent("unhandledrejection", {
        reason: error2,
        promise: Promise.reject(error2).catch(() => {}),
      });
      window.dispatchEvent(event2);

      expect(onToast).toHaveBeenCalledTimes(2);
    });

    it("不同 name+message 各自独立触发 onToast", () => {
      const errorA = new TypeError("type error");
      const eventA = new PromiseRejectionEvent("unhandledrejection", {
        reason: errorA,
        promise: Promise.reject(errorA).catch(() => {}),
      });
      window.dispatchEvent(eventA);

      vi.advanceTimersByTime(200);

      const errorB = new RangeError("range error");
      const eventB = new PromiseRejectionEvent("unhandledrejection", {
        reason: errorB,
        promise: Promise.reject(errorB).catch(() => {}),
      });
      window.dispatchEvent(eventB);

      expect(onToast).toHaveBeenCalledTimes(2);
    });

    it("去重仅影响 Toast——每次触发 onLog 均被调用", () => {
      for (let i = 0; i < 3; i++) {
        const error = new Error("repeated");
        const event = new PromiseRejectionEvent("unhandledrejection", {
          reason: error,
          promise: Promise.reject(error).catch(() => {}),
        });
        window.dispatchEvent(event);
        vi.advanceTimersByTime(200);
      }

      expect(onLog).toHaveBeenCalledTimes(3);
      expect(onToast).toHaveBeenCalledOnce();
    });
  });

  describe("日志回调失败不触发递归", () => {
    it("onLog 抛出异常不触发新的 onToast", () => {
      onLog.mockImplementation(() => {
        throw new Error("log failed");
      });

      const error = new Error("original");
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: error,
        promise: Promise.reject(error).catch(() => {}),
      });

      expect(() => window.dispatchEvent(event)).not.toThrow();
      expect(onToast).not.toHaveBeenCalled();
    });

    it("onLog 抛出异常时 console.error 被调用", () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      onLog.mockImplementation(() => {
        throw new Error("log failed");
      });

      const error = new Error("original");
      const event = new PromiseRejectionEvent("unhandledrejection", {
        reason: error,
        promise: Promise.reject(error).catch(() => {}),
      });
      window.dispatchEvent(event);

      expect(consoleError).toHaveBeenCalled();
    });
  });
});
