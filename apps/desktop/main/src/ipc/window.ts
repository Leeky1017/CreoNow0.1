import type { IpcMain, IpcMainInvokeEvent } from "electron";

import type { IpcError, IpcResponse } from "@shared/types/ipc-generated";

type WindowLike = {
  isMaximized: () => boolean;
  isMinimized: () => boolean;
  isFullScreen: () => boolean;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
};

type WindowAction = "minimize" | "togglemaximized" | "close";

type WindowState = {
  controlsEnabled: boolean;
  isMaximized: boolean;
  isMinimized: boolean;
  isFullScreen: boolean;
  platform: string;
};

function toError(code: IpcError["code"], message: string): IpcResponse<never> {
  return {
    ok: false,
    error: { code, message },
  };
}

function isWindowControlsEnabled(platform: NodeJS.Platform): boolean {
  return platform === "win32";
}

function toInternalError(action: string, error: unknown): IpcResponse<never> {
  const message = error instanceof Error ? error.message : String(error);
  return toError("INTERNAL", `Failed to ${action} window: ${message}`);
}

export function registerWindowIpcHandlers(args: {
  ipcMain: IpcMain;
  platform: NodeJS.Platform;
  resolveWindowFromEvent: (event: IpcMainInvokeEvent) => WindowLike | null;
}): void {
  const resolveWindow = args.resolveWindowFromEvent;
  const controlsEnabled = isWindowControlsEnabled(args.platform);

  function resolveSupportedWindow(
    event: IpcMainInvokeEvent,
  ): IpcResponse<WindowLike> {
    if (!controlsEnabled) {
      return toError("UNSUPPORTED", "Window controls are not supported");
    }

    const win = resolveWindow(event);
    if (!win) {
      return toError("NOT_FOUND", "BrowserWindow not found");
    }

    return {
      ok: true,
      data: win,
    };
  }

  function buildState(win: WindowLike | null): IpcResponse<WindowState> {
    if (!controlsEnabled || !win) {
      return {
        ok: true,
        data: {
          controlsEnabled,
          isMaximized: false,
          isMinimized: false,
          isFullScreen: false,
          platform: args.platform,
        },
      };
    }

    try {
      return {
        ok: true,
        data: {
          controlsEnabled,
          isMaximized: win.isMaximized(),
          isMinimized: win.isMinimized(),
          isFullScreen: win.isFullScreen(),
          platform: args.platform,
        },
      };
    } catch (error) {
      return toInternalError("get window state", error);
    }
  }

  function runWindowAction(
    event: IpcMainInvokeEvent,
    action: WindowAction,
  ): IpcResponse<Record<string, never>> {
    const resolved = resolveSupportedWindow(event);
    if (!resolved.ok) {
      return resolved;
    }

    try {
      if (action === "minimize") {
        resolved.data.minimize();
      } else if (action === "togglemaximized") {
        if (resolved.data.isMaximized()) {
          resolved.data.unmaximize();
        } else {
          resolved.data.maximize();
        }
      } else {
        resolved.data.close();
      }
      return { ok: true, data: {} };
    } catch (error) {
      return toInternalError(action, error);
    }
  }

  args.ipcMain.handle(
    "app:window:getstate",
    async (event): Promise<IpcResponse<WindowState>> => {
      const win = controlsEnabled ? resolveWindow(event) : null;
      return buildState(win);
    },
  );

  args.ipcMain.handle(
    "app:window:minimize",
    async (event): Promise<IpcResponse<Record<string, never>>> => {
      return runWindowAction(event, "minimize");
    },
  );

  args.ipcMain.handle(
    "app:window:togglemaximized",
    async (event): Promise<IpcResponse<Record<string, never>>> => {
      return runWindowAction(event, "togglemaximized");
    },
  );

  args.ipcMain.handle(
    "app:window:close",
    async (event): Promise<IpcResponse<Record<string, never>>> => {
      return runWindowAction(event, "close");
    },
  );
}
