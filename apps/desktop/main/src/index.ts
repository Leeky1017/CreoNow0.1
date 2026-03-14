import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { BrowserWindow, app, dialog, ipcMain, safeStorage } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";
import { applyBrowserWindowSecurityPolicy } from "./browserWindowSecurity";
import { initDb, type DbInitOk } from "./db/init";
import { registerGlobalExceptionHandlers } from "./globalExceptionHandlers";
import { registerAiIpcHandlers } from "./ipc/ai";
import { registerAiProxyIpcHandlers } from "./ipc/aiProxy";
import { registerContextIpcHandlers } from "./ipc/context";
import { registerConstraintsIpcHandlers } from "./ipc/constraints";
import { registerDialogIpcHandlers } from "./ipc/dialog";
import { registerFileIpcHandlers } from "./ipc/file";
import { registerExportIpcHandlers } from "./ipc/export";
import { registerJudgeIpcHandlers } from "./ipc/judge";
import { registerKnowledgeGraphIpcHandlers } from "./ipc/knowledgeGraph";
import { registerEmbeddingIpcHandlers } from "./ipc/embedding";
import { registerMemoryIpcHandlers } from "./ipc/memory";
import { registerProjectIpcHandlers } from "./ipc/project";
import { registerRagIpcHandlers } from "./ipc/rag";
import { registerSearchIpcHandlers } from "./ipc/search";
import { registerSkillIpcHandlers } from "./ipc/skills";
import { registerStatsIpcHandlers } from "./ipc/stats";
import { registerDbDebugIpcHandlers } from "./ipc/debugChannelGate";
import { createValidatedIpcMain } from "./ipc/runtime-validation";
import { registerVersionIpcHandlers } from "./ipc/version";
import { registerWindowIpcHandlers } from "./ipc/window";
import { registerRendererLogIpcHandlers } from "./ipc/rendererLog";
import { createProjectSessionBindingRegistry } from "./ipc/projectSessionBinding";
import { createMainLogger, type Logger } from "./logging/logger";
import { createEmbeddingService } from "./services/embedding/embeddingService";
import { createOnnxEmbeddingRuntime } from "./services/embedding/onnxRuntime";
import { createSemanticChunkIndexService } from "./services/embedding/semanticChunkIndexService";
import { createJudgeService } from "./services/judge/judgeService";
import { createJudgeQualityService } from "./services/ai/judgeQualityService";
import { createKgRecognitionRuntime } from "./services/kg/kgRecognitionRuntime";
import { createStateExtractor } from "./services/kg/stateExtractor";
import { createContextProjectScopedCache } from "./services/context/projectScopedCache";
import { createCreonowWatchService } from "./services/context/watchService";
import { createProjectLifecycle } from "./services/projects/projectLifecycle";
import { createUtilityProcessFoundation } from "./services/utilityprocess/utilityProcessFoundation";
import { resolvePreloadEntryPathFromBuildConfig } from "./runtimePathResolver";
import { resolveRuntimeGovernanceFromEnv } from "./config/runtimeGovernance";
import {
  createDebouncedSaveWindowState,
  loadWindowState,
  WINDOW_STATE_DEFAULTS,
} from "./windowState";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Allow E2E to isolate `userData` to a temp directory.
 *
 * Why: Windows E2E must be repeatable and must not touch a developer's real profile.
 */
function enableE2EUserDataIsolation(): void {
  const userDataDir = process.env.CREONOW_USER_DATA_DIR;
  if (typeof userDataDir !== "string" || userDataDir.length === 0) {
    return;
  }

  // Must be set before app 'ready' for full isolation.
  app.setPath("userData", userDataDir);
}

/**
 * Resolve the preload entry path across build output formats.
 *
 * Why: electron-vite may emit different extensions depending on config/environment.
 */
function resolvePreloadPath(): string {
  return resolvePreloadEntryPathFromBuildConfig({
    mainModuleDir: __dirname,
  });
}

/**
 * Resolve builtin skills directory across dev + build outputs.
 *
 * Why: electron-builder packages only `dist/**`, but dev runs from `main/src`.
 */
function resolveBuiltinSkillsDir(mainDir: string): string {
  const candidates = [
    path.join(mainDir, "skills"), // build: dist/main/skills
    path.join(mainDir, "../skills"), // dev: main/skills
  ];
  for (const p of candidates) {
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        return p;
      }
    } catch {
      // Ignore.
    }
  }
  return candidates[0];
}

/**
 * Create the app's main BrowserWindow.
 *
 * Why: keep a single place for window defaults used by E2E and later features.
 */
export function createMainWindow(logger: Logger): BrowserWindow {
  const preload = resolvePreloadPath();
  const isE2E = process.env.CREONOW_E2E === "1";
  const isWindows = process.platform === "win32";

  const userDataDir = app.getPath("userData");
  const saved = loadWindowState(userDataDir);
  const width = saved?.width ?? WINDOW_STATE_DEFAULTS.width;
  const height = saved?.height ?? WINDOW_STATE_DEFAULTS.height;

  const positionOpts: { x: number; y: number } | Record<string, never> =
    saved !== null ? { x: saved.x, y: saved.y } : {};

  const win = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 640,
    ...positionOpts,
    ...(isWindows ? { frame: false } : {}),
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // ── Window state persistence (debounced) ──
  const debouncedSave = createDebouncedSaveWindowState(userDataDir);

  const persistBounds = (): void => {
    if (win.isMaximized() || win.isFullScreen()) {
      return;
    }
    const bounds = win.getBounds();
    debouncedSave.save({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  };

  win.on("move", persistBounds);
  win.on("resize", persistBounds);
  win.on("close", () => {
    debouncedSave.flush();
  });

  applyBrowserWindowSecurityPolicy({
    windowLike: win,
    logger,
    devServerUrl: process.env.VITE_DEV_SERVER_URL,
  });

  if (isWindows) {
    win.setAutoHideMenuBar(true);
    win.setMenuBarVisibility(false);
    win.removeMenu();
  }

  if (process.env.VITE_DEV_SERVER_URL) {
    let target = process.env.VITE_DEV_SERVER_URL;
    if (isE2E) {
      const devUrl = new URL(target);
      devUrl.searchParams.set("creonow_e2e", "1");
      target = devUrl.toString();
    }
    try {
      const loadResult = win.loadURL(target);
      void Promise.resolve(loadResult).catch((error) => {
        logger.error("window_load_failed", {
          target,
          message: error instanceof Error ? error.message : String(error),
        });
      });
    } catch (error) {
      logger.error("window_load_failed", {
        target,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    const target = path.join(__dirname, "../renderer/index.html");
    try {
      const loadResult = win.loadFile(target, {
        query: isE2E ? { creonow_e2e: "1" } : {},
      });
      void Promise.resolve(loadResult).catch((error) => {
        logger.error("window_load_failed", {
          target,
          message: error instanceof Error ? error.message : String(error),
        });
      });
    } catch (error) {
      logger.error("window_load_failed", {
        target,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return win;
}

function parsePositiveInteger(
  raw: string | undefined,
  fallback: number,
): number {
  if (typeof raw !== "string") {
    return fallback;
  }
  const trimmed = raw.trim();
  if (!/^\d+$/u.test(trimmed)) {
    return fallback;
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

/**
 * Register all IPC handlers.
 *
 * Why: dependencies are explicit (no implicit injection) and handlers must always
 * return an Envelope `{ ok: true|false }` without leaking exceptions across IPC.
 */
function registerIpcHandlers(deps: {
  db: DbInitOk["db"] | null;
  logger: Logger;
  userDataDir: string;
  builtinSkillsDir: string;
  env: NodeJS.ProcessEnv;
}): void {
  const runtimeGovernance = resolveRuntimeGovernanceFromEnv(deps.env);
  const onnxModelPath = deps.env.CREONOW_ONNX_MODEL_PATH?.trim() ?? "";
  const onnxProvider = deps.env.CREONOW_ONNX_PROVIDER?.trim() ?? "cpu";
  const onnxDimension = parsePositiveInteger(
    deps.env.CREONOW_ONNX_DIMENSION,
    384,
  );
  const onnxRuntime =
    onnxModelPath.length > 0
      ? createOnnxEmbeddingRuntime({
          logger: deps.logger,
          modelPath: onnxModelPath,
          provider: onnxProvider,
          dimension: onnxDimension,
        })
      : undefined;

  const judgeService = createJudgeService({
    logger: deps.logger,
    isE2E: process.env.CREONOW_E2E === "1",
  });
  const judgeQualityService = createJudgeQualityService({
    logger: deps.logger,
  });
  const watchService = createCreonowWatchService({ logger: deps.logger });
  const contextCache = createContextProjectScopedCache({
    logger: deps.logger,
    watchService,
  });
  const projectLifecycle = createProjectLifecycle({
    logger: deps.logger,
    timeoutMs: 5_000,
  });
  projectLifecycle.register({
    id: "context",
    unbind: ({ projectId, traceId, signal }) => {
      if (signal.aborted) {
        return;
      }
      contextCache.unbindProject({ projectId, traceId });
    },
    bind: ({ projectId, traceId, signal }) => {
      if (signal.aborted) {
        return;
      }
      contextCache.bindProject({ projectId, traceId });
    },
  });
  const embeddingService = createEmbeddingService({
    logger: deps.logger,
    onnxRuntime,
  });
  const semanticIndex = createSemanticChunkIndexService({
    logger: deps.logger,
    embedding: embeddingService,
    defaultModel: deps.env.CREONOW_EMBEDDING_MODEL ?? "default",
  });
  const recognitionRuntime = deps.db
    ? createKgRecognitionRuntime({
        db: deps.db,
        logger: deps.logger,
      })
    : null;
  const stateExtractor = deps.db
    ? createStateExtractor({
        db: deps.db,
        logger: deps.logger,
      })
    : null;

  const ragRerank = {
    enabled: deps.env.CREONOW_RAG_RERANK === "1",
    model: deps.env.CREONOW_RAG_RERANK_MODEL,
  };

  const guardedIpcMain = createValidatedIpcMain({
    ipcMain,
    logger: deps.logger,
    defaultTimeoutMs: 30_000,
  });
  const utilityProcessFoundation = createUtilityProcessFoundation();
  deps.logger.info("utility_process_foundation_ready", {
    compute_role: utilityProcessFoundation.compute.getRole(),
    data_role: utilityProcessFoundation.data.getRole(),
  });
  const projectSessionBinding = createProjectSessionBindingRegistry();
  app.on("web-contents-created", (_event, webContents) => {
    webContents.once("destroyed", () => {
      projectSessionBinding.clear({ webContentsId: webContents.id });
    });
  });
  const secretStorage = {
    isEncryptionAvailable: () => safeStorage.isEncryptionAvailable(),
    encryptString: (plainText: string) => safeStorage.encryptString(plainText),
    decryptString: (cipherText: Buffer) =>
      safeStorage.decryptString(cipherText),
  };

  guardedIpcMain.handle(
    "app:system:ping",
    async (): Promise<IpcResponse<Record<string, never>>> => {
      return { ok: true, data: {} };
    },
  );

  registerWindowIpcHandlers({
    ipcMain: guardedIpcMain,
    platform: process.platform,
    resolveWindowFromEvent: (event) =>
      BrowserWindow.fromWebContents(event.sender),
  });

  registerDialogIpcHandlers({
    ipcMain: guardedIpcMain,
    showOpenDialog: (options) => dialog.showOpenDialog(options),
  });

  registerDbDebugIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    env: deps.env,
  });

  registerAiIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    userDataDir: deps.userDataDir,
    builtinSkillsDir: deps.builtinSkillsDir,
    logger: deps.logger,
    env: deps.env,
    secretStorage,
    projectSessionBinding,
  });

  registerAiProxyIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    secretStorage,
  });

  registerProjectIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    userDataDir: deps.userDataDir,
    logger: deps.logger,
    projectSessionBinding,
    projectLifecycle,
  });

  registerContextIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    userDataDir: deps.userDataDir,
    watchService,
    projectSessionBinding,
  });

  registerConstraintsIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
  });

  registerJudgeIpcHandlers({
    ipcMain: guardedIpcMain,
    judgeService,
    judgeQualityService,
    logger: deps.logger,
  });

  registerFileIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    recognitionRuntime,
    stateExtractor,
    semanticIndex,
    computeRunner: utilityProcessFoundation.compute,
    embeddingQueueDebounceMs: runtimeGovernance.embedding.queueDebounceMs,
  });

  registerExportIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    userDataDir: deps.userDataDir,
  });

  registerStatsIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
  });

  registerEmbeddingIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    embedding: embeddingService,
    semanticIndex,
    computeRunner: utilityProcessFoundation.compute,
    defaultModel: deps.env.CREONOW_EMBEDDING_MODEL ?? "default",
  });

  registerSearchIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    semanticIndex,
  });

  registerRagIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    embedding: embeddingService,
    ragRerank,
    semanticIndex,
    computeRunner: utilityProcessFoundation.compute,
    defaultModel: deps.env.CREONOW_EMBEDDING_MODEL ?? "default",
  });

  registerSkillIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    userDataDir: deps.userDataDir,
    builtinSkillsDir: deps.builtinSkillsDir,
    logger: deps.logger,
    dataProcess: utilityProcessFoundation.data,
  });

  registerMemoryIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    projectSessionBinding,
  });

  registerKnowledgeGraphIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
    recognitionRuntime,
    projectSessionBinding,
  });

  registerVersionIpcHandlers({
    ipcMain: guardedIpcMain,
    db: deps.db,
    logger: deps.logger,
  });

  registerRendererLogIpcHandlers({
    ipcMain: guardedIpcMain,
    userDataDir: deps.userDataDir,
    logger: deps.logger,
  });
}

function logAppInitFatal(error: unknown): void {
  const payload =
    error instanceof Error
      ? { error: error.message, stack: error.stack }
      : { error: String(error) };

  try {
    const logger = createMainLogger(app.getPath("userData"));
    logger.error("app_init_fatal", payload);
  } catch (loggerError) {
    try {
      const originalContext =
        error instanceof Error
          ? `${error.message}${error.stack ? `\n${error.stack}` : ""}`
          : String(error);
      const loggerContext =
        loggerError instanceof Error
          ? `${loggerError.message}${loggerError.stack ? `\n${loggerError.stack}` : ""}`
          : String(loggerError);
      process.stderr.write(
        `[FATAL] app_init_fatal logger write failed\noriginal: ${originalContext}\nlogger_error: ${loggerContext}\n`,
      );
    } catch {
      // Swallow to ensure startup rejection is fully handled.
    }
  }
}

enableE2EUserDataIsolation();

// ── Single-instance lock ──
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// ── Second-instance handling: focus existing window ──
// Registered immediately after lock acquisition (before whenReady) to avoid
// startup race: a second instance launched during the first's initialisation
// must always find the listener already in place.
app.on("second-instance", () => {
  const wins = BrowserWindow.getAllWindows();
  const win = wins.length > 0 ? wins[0] : null;
  if (!win) {
    return;
  }
  if (win.isMinimized()) {
    win.restore();
  }
  win.focus();
});

app
  .whenReady()
  .then(() => {
    const userDataDir = app.getPath("userData");
    const logger = createMainLogger(userDataDir);
    logger.info("app_ready", { user_data_dir: "<userData>" });

    registerGlobalExceptionHandlers({
      processLike: process,
      appLike: app,
      logger,
      shutdownTimeoutMs: parsePositiveInteger(
        process.env.CREONOW_FATAL_SHUTDOWN_TIMEOUT_MS,
        10_000,
      ),
    });

    const dbRes = initDb({ userDataDir, logger });
    const db: DbInitOk["db"] | null = dbRes.ok ? dbRes.db : null;
    if (!dbRes.ok) {
      logger.error("db_init_failed", { code: dbRes.error.code });
    }

    registerIpcHandlers({
      db,
      logger,
      userDataDir,
      builtinSkillsDir: resolveBuiltinSkillsDir(__dirname),
      env: process.env,
    });

    createMainWindow(logger);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(logger);
      }
    });

    app.on("before-quit", () => {
      if (!db) {
        return;
      }
      try {
        db.close();
      } catch (error) {
        logger.error("db_close_failed", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });
  })
  .catch((error) => {
    logAppInitFatal(error);
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
