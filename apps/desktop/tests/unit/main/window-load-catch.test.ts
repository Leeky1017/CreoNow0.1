import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loadURLMock = vi.fn();
const loadFileMock = vi.fn();

const appMock = {
  whenReady: vi.fn(() => new Promise<void>(() => {})),
  on: vi.fn(),
  quit: vi.fn(),
  setPath: vi.fn(),
  getPath: vi.fn(() => "/tmp/creonow-test-user-data"),
  requestSingleInstanceLock: vi.fn(() => true),
};

vi.mock("../../../main/src/runtimePathResolver", () => ({
  resolvePreloadEntryPathFromBuildConfig: vi.fn(() => "/tmp/mock-preload.cjs"),
}));

vi.mock("../../../main/src/windowState", () => ({
  loadWindowState: vi.fn(() => null),
  createDebouncedSaveWindowState: vi.fn(() => ({
    save: vi.fn(),
    flush: vi.fn(),
    cancel: vi.fn(),
  })),
  WINDOW_STATE_DEFAULTS: { x: 0, y: 0, width: 1280, height: 800 },
}));

vi.mock("electron", () => {
  class BrowserWindowMock {
    static getAllWindows = vi.fn(() => []);

    loadURL = loadURLMock;
    loadFile = loadFileMock;
    isMaximized = vi.fn(() => false);
    isFullScreen = vi.fn(() => false);
    isMinimized = vi.fn(() => false);
    getBounds = vi.fn(() => ({ x: 0, y: 0, width: 1280, height: 800 }));
    on = vi.fn();
    restore = vi.fn();
    focus = vi.fn();
  }

  return {
    BrowserWindow: BrowserWindowMock,
    app: appMock,
    ipcMain: {},
    safeStorage: {
      isEncryptionAvailable: vi.fn(() => false),
      encryptString: vi.fn(),
      decryptString: vi.fn(),
    },
  };
});

const originalDevServerUrl = process.env.VITE_DEV_SERVER_URL;

async function loadCreateMainWindow(): Promise<
  (logger: {
    logPath: string;
    info: (event: string, data?: Record<string, unknown>) => void;
    error: (event: string, data?: Record<string, unknown>) => void;
  }) => unknown
> {
  vi.resetModules();
  const mod = await import("../../../main/src/index");
  return (
    mod as unknown as {
      createMainWindow: (logger: {
        logPath: string;
        info: (event: string, data?: Record<string, unknown>) => void;
        error: (event: string, data?: Record<string, unknown>) => void;
      }) => unknown;
    }
  ).createMainWindow;
}

function createLoggerMock() {
  return {
    logPath: "/tmp/main.log",
    info: vi.fn(),
    error: vi.fn(),
  };
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  if (originalDevServerUrl === undefined) {
    delete process.env.VITE_DEV_SERVER_URL;
  } else {
    process.env.VITE_DEV_SERVER_URL = originalDevServerUrl;
  }
});

describe("createMainWindow load catch", () => {
  it("logs window_load_failed when loadURL rejects", async () => {
    process.env.VITE_DEV_SERVER_URL = "http://127.0.0.1:5173";
    loadURLMock.mockRejectedValueOnce(new Error("dev server unreachable"));

    const createMainWindow = await loadCreateMainWindow();
    const logger = createLoggerMock();
    createMainWindow(logger);
    await flushMicrotasks();

    expect(logger.error).toHaveBeenCalledWith(
      "window_load_failed",
      expect.objectContaining({
        target: "http://127.0.0.1:5173",
        message: "dev server unreachable",
      }),
    );
  });

  it("logs window_load_failed when loadFile rejects", async () => {
    delete process.env.VITE_DEV_SERVER_URL;
    loadFileMock.mockRejectedValueOnce(new Error("index file missing"));

    const createMainWindow = await loadCreateMainWindow();
    const logger = createLoggerMock();
    createMainWindow(logger);
    await flushMicrotasks();

    expect(logger.error).toHaveBeenCalledWith(
      "window_load_failed",
      expect.objectContaining({
        message: "index file missing",
      }),
    );
  });

  it("does not log window_load_failed when load succeeds", async () => {
    process.env.VITE_DEV_SERVER_URL = "http://127.0.0.1:5173";
    loadURLMock.mockResolvedValueOnce(undefined);

    const createMainWindow = await loadCreateMainWindow();
    const logger = createLoggerMock();
    createMainWindow(logger);
    await flushMicrotasks();

    expect(
      logger.error.mock.calls.some(
        (call) => Array.isArray(call) && call[0] === "window_load_failed",
      ),
    ).toBe(false);
  });
});
