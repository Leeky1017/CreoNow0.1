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

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isWindowControlsEnabled(platform: NodeJS.Platform): boolean {
  return platform === "win32";
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

  function buildState(win: WindowLike | null): WindowState {
    if (!controlsEnabled || !win) {
      return {
        controlsEnabled,
        isMaximized: false,
        isMinimized: false,
        isFullScreen: false,
        platform: args.platform,
      };
    }

    return {
      controlsEnabled,
      isMaximized: win.isMaximized(),
      isMinimized: win.isMinimized(),
      isFullScreen: win.isFullScreen(),
      platform: args.platform,
    };
  }

  args.ipcMain.handle(
    "app:window:getstate",
    async (event): Promise<IpcResponse<WindowState>> => {
      try {
        const win = controlsEnabled ? resolveWindow(event) : null;
        return {
          ok: true,
          data: buildState(win),
        };
      } catch (error) {
        return toError("INTERNAL", toErrorMessage(error));
      }
    },
  );

  args.ipcMain.handle(
    "app:window:minimize",
    async (event): Promise<IpcResponse<Record<string, never>>> => {
      try {
        const resolved = resolveSupportedWindow(event);
        if (!resolved.ok) {
          return resolved;
        }
        resolved.data.minimize();
        return { ok: true, data: {} };
      } catch (error) {
        return toError("INTERNAL", toErrorMessage(error));
      }
    },
  );

  args.ipcMain.handle(
    "app:window:togglemaximized",
    async (event): Promise<IpcResponse<Record<string, never>>> => {
      try {
        const resolved = resolveSupportedWindow(event);
        if (!resolved.ok) {
          return resolved;
        }

        if (resolved.data.isMaximized()) {
          resolved.data.unmaximize();
        } else {
          resolved.data.maximize();
        }

        return { ok: true, data: {} };
      } catch (error) {
        return toError("INTERNAL", toErrorMessage(error));
      }
    },
  );

  args.ipcMain.handle(
    "app:window:close",
    async (event): Promise<IpcResponse<Record<string, never>>> => {
      try {
        const resolved = resolveSupportedWindow(event);
        if (!resolved.ok) {
          return resolved;
        }
        resolved.data.close();
        return { ok: true, data: {} };
      } catch (error) {
        return toError("INTERNAL", toErrorMessage(error));
      }
    },
  );
}
