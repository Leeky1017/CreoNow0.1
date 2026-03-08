import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";

interface RegisterLogIpcHandlersArgs {
  ipcMain: {
    handle: (
      channel: string,
      handler: (
        event: Electron.IpcMainInvokeEvent,
        payload: unknown,
      ) => Promise<unknown>,
    ) => void;
  };
  logger: Logger;
}

interface RendererErrorPayload {
  source: "unhandledrejection" | "error";
  name: string;
  message: string;
  stack: string | undefined;
  timestamp: string;
}

function isRendererErrorPayload(
  value: unknown,
): value is RendererErrorPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    (v.source === "unhandledrejection" || v.source === "error") &&
    typeof v.name === "string" &&
    typeof v.message === "string" &&
    typeof v.timestamp === "string"
  );
}

export function registerLogIpcHandlers(
  args: RegisterLogIpcHandlersArgs,
): void {
  args.ipcMain.handle(
    "log:renderer-error",
    async (
      _event: Electron.IpcMainInvokeEvent,
      payload: unknown,
    ): Promise<IpcResponse<Record<string, never>>> => {
      if (!isRendererErrorPayload(payload)) {
        return {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            message: "Invalid renderer error payload",
          },
        };
      }

      args.logger.error("renderer_error", {
        source: payload.source,
        name: payload.name,
        message: payload.message,
        stack: payload.stack,
        timestamp: payload.timestamp,
      });

      return { ok: true, data: {} };
    },
  );
}
