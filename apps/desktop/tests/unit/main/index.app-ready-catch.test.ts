import { describe, expect, it, vi } from "vitest";

type BootHarness = {
  appQuit: ReturnType<typeof vi.fn>;
  loggerError: ReturnType<typeof vi.fn>;
};

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await new Promise<void>((resolve) => setImmediate(resolve));
}

async function bootIndexWithWhenReady(
  whenReadyPromise: Promise<void>,
): Promise<BootHarness> {
  vi.resetModules();

  const appQuit = vi.fn();
  const loggerError = vi.fn();
  const loggerInfo = vi.fn();

  const browserWindow = vi.fn(function MockBrowserWindow() {
    return {
      loadURL: vi.fn(async () => undefined),
      loadFile: vi.fn(async () => undefined),
      isMaximized: vi.fn(() => false),
      isFullScreen: vi.fn(() => false),
      isMinimized: vi.fn(() => false),
      getBounds: vi.fn(() => ({ x: 0, y: 0, width: 1280, height: 800 })),
      on: vi.fn(),
      restore: vi.fn(),
      focus: vi.fn(),
    };
  });
  Object.assign(browserWindow, {
    getAllWindows: vi.fn(() => []),
  });

  vi.doMock("electron", () => ({
    app: {
      whenReady: vi.fn(() => whenReadyPromise),
      getPath: vi.fn(() => "/tmp/creonow-test-user-data"),
      getVersion: vi.fn(() => "0.0.0-test"),
      setPath: vi.fn(),
      on: vi.fn(),
      quit: appQuit,
      requestSingleInstanceLock: vi.fn(() => true),
    },
    BrowserWindow: browserWindow,
    ipcMain: {
      handle: vi.fn(),
    },
    safeStorage: {
      isEncryptionAvailable: vi.fn(() => true),
      encryptString: vi.fn((plainText: string) => Buffer.from(plainText)),
      decryptString: vi.fn((cipherText: Buffer) => cipherText.toString("utf8")),
    },
    crashReporter: {
      start: vi.fn(),
    },
  }));

  vi.doMock("../../../main/src/logging/logger", () => ({
    createMainLogger: vi.fn(() => ({
      logPath: "<test>",
      info: loggerInfo,
      error: loggerError,
    })),
  }));

  vi.doMock("../../../main/src/db/init", () => ({
    initDb: vi.fn(() => ({
      ok: false as const,
      error: { code: "DB_INIT_FAILED", message: "mock db init failed" },
    })),
  }));

  vi.doMock("../../../main/src/ipc/ai", () => ({
    registerAiIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/aiProxy", () => ({
    registerAiProxyIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/context", () => ({
    registerContextIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/constraints", () => ({
    registerConstraintsIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/file", () => ({
    registerFileIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/export", () => ({
    registerExportIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/judge", () => ({
    registerJudgeIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/knowledgeGraph", () => ({
    registerKnowledgeGraphIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/embedding", () => ({
    registerEmbeddingIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/memory", () => ({
    registerMemoryIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/project", () => ({
    registerProjectIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/rag", () => ({
    registerRagIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/search", () => ({
    registerSearchIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/skills", () => ({
    registerSkillIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/stats", () => ({
    registerStatsIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/version", () => ({
    registerVersionIpcHandlers: vi.fn(),
  }));
  vi.doMock("../../../main/src/ipc/runtime-validation", () => ({
    createValidatedIpcMain: vi.fn(() => ({
      handle: vi.fn(),
    })),
  }));

  vi.doMock("../../../main/src/services/embedding/embeddingService", () => ({
    createEmbeddingService: vi.fn(() => ({})),
  }));
  vi.doMock(
    "../../../main/src/services/embedding/semanticChunkIndexService",
    () => ({
      createSemanticChunkIndexService: vi.fn(() => ({})),
    }),
  );
  vi.doMock("../../../main/src/services/judge/judgeService", () => ({
    createJudgeService: vi.fn(() => ({})),
  }));
  vi.doMock("../../../main/src/services/ai/judgeQualityService", () => ({
    createJudgeQualityService: vi.fn(() => ({})),
  }));
  vi.doMock("../../../main/src/services/kg/kgRecognitionRuntime", () => ({
    createKgRecognitionRuntime: vi.fn(() => null),
  }));
  vi.doMock("../../../main/src/runtimePathResolver", () => ({
    resolvePreloadEntryPathFromBuildConfig: vi.fn(
      () => "/tmp/mock-preload.cjs",
    ),
  }));

  vi.doMock("../../../main/src/windowState", () => ({
    loadWindowState: vi.fn(() => null),
    createDebouncedSaveWindowState: vi.fn(() => ({
      save: vi.fn(),
      flush: vi.fn(),
      cancel: vi.fn(),
    })),
    WINDOW_STATE_DEFAULTS: { x: 0, y: 0, width: 1280, height: 800 },
  }));

  vi.doMock("../../../main/src/services/context/watchService", () => ({
    createCreonowWatchService: vi.fn(() => ({})),
  }));

  await import("../../../main/src/index");
  return {
    appQuit,
    loggerError,
  };
}

describe("main index app ready catch", () => {
  it("logs app_init_fatal and quits when app ready chain rejects", async () => {
    let rejectReady: (reason: unknown) => void = () => {};
    const whenReadyPromise = new Promise<void>((_resolve, reject) => {
      rejectReady = reject;
    });

    const fatal = new Error("app ready failed");
    const harness = await bootIndexWithWhenReady(whenReadyPromise);
    rejectReady(fatal);
    await flushMicrotasks();

    expect(harness.loggerError).toHaveBeenCalledWith(
      "app_init_fatal",
      expect.objectContaining({
        error: "app ready failed",
        stack: fatal.stack,
      }),
    );
    expect(harness.appQuit).toHaveBeenCalledTimes(1);
  });

  it("writes stderr fallback when fatal logger write fails", async () => {
    let rejectReady: (reason: unknown) => void = () => {};
    const whenReadyPromise = new Promise<void>((_resolve, reject) => {
      rejectReady = reject;
    });

    const fatal = new Error("app ready failed");
    const loggerSinkFailure = new Error("logger sink unavailable");
    const harness = await bootIndexWithWhenReady(whenReadyPromise);
    harness.loggerError.mockImplementationOnce(() => {
      throw loggerSinkFailure;
    });

    const stderrWriteSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    try {
      rejectReady(fatal);
      await flushMicrotasks();

      expect(stderrWriteSpy).toHaveBeenCalled();
      const mergedStderrOutput = stderrWriteSpy.mock.calls
        .map(([chunk]) => String(chunk))
        .join("\n");
      expect(mergedStderrOutput).toContain("app ready failed");
      expect(mergedStderrOutput).toContain("logger sink unavailable");
      expect(harness.appQuit).toHaveBeenCalledTimes(1);
    } finally {
      stderrWriteSpy.mockRestore();
    }
  });

  it("swallows stderr fallback failure without uncaught exceptions", async () => {
    let rejectReady: (reason: unknown) => void = () => {};
    const whenReadyPromise = new Promise<void>((_resolve, reject) => {
      rejectReady = reject;
    });

    const fatal = new Error("app ready failed");
    const loggerSinkFailure = new Error("logger sink unavailable");
    const harness = await bootIndexWithWhenReady(whenReadyPromise);
    harness.loggerError.mockImplementationOnce(() => {
      throw loggerSinkFailure;
    });

    const uncaught: unknown[] = [];
    const onUncaught = (error: unknown): void => {
      uncaught.push(error);
    };
    process.on("uncaughtException", onUncaught);

    const stderrWriteSpy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => {
        throw new Error("stderr unavailable");
      });

    try {
      rejectReady(fatal);
      await flushMicrotasks();

      expect(harness.appQuit).toHaveBeenCalledTimes(1);
      expect(uncaught).toHaveLength(0);
    } finally {
      process.off("uncaughtException", onUncaught);
      stderrWriteSpy.mockRestore();
    }
  });

  it("does not quit on successful app ready path", async () => {
    const harness = await bootIndexWithWhenReady(Promise.resolve());
    await flushMicrotasks();

    const hasAppInitFatalLog = harness.loggerError.mock.calls.some(
      ([event]) => event === "app_init_fatal",
    );
    expect(hasAppInitFatalLog).toBe(false);
    expect(harness.appQuit).not.toHaveBeenCalled();
  });

  it("prevents unhandled rejection leakage via chain-tail catch", async () => {
    let rejectReady: (reason: unknown) => void = () => {};
    const whenReadyPromise = new Promise<void>((_resolve, reject) => {
      rejectReady = reject;
    });

    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown): void => {
      unhandled.push(reason);
    };
    process.on("unhandledRejection", onUnhandled);

    try {
      await bootIndexWithWhenReady(whenReadyPromise);
      rejectReady(new Error("leak-check"));
      await flushMicrotasks();
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }

    expect(unhandled).toHaveLength(0);
  });
});
