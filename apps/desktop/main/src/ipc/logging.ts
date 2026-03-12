import fs from "node:fs";
import path from "node:path";
import type { IpcMain } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";

function getRendererErrorLogPath(userDataDir: string): string {
  return path.join(userDataDir, "logs", "renderer-errors.log");
}

const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

function rotateIfNeeded(logPath: string): void {
  try {
    const stat = fs.statSync(logPath);
    if (stat.size <= MAX_LOG_SIZE_BYTES) {
      return;
    }
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n");
    const halfIndex = Math.floor(lines.length / 2);
    fs.writeFileSync(logPath, lines.slice(halfIndex).join("\n"), "utf8");
  } catch {
    // Rotation failure is non-fatal
  }
}

/**
 * Register `log:renderererror:write` IPC handler.
 *
 * Why: renderer 全局未处理异常需要落盘到主进程日志，
 * 以便在 DevTools 不可用时仍可追溯错误历史。
 */
export function registerLoggingIpcHandlers(deps: {
  ipcMain: IpcMain;
  userDataDir: string;
}): void {
  deps.ipcMain.handle(
    "log:renderererror:write",
    async (
      _event,
      payload: {
        source: "unhandledrejection" | "error";
        name: string;
        message: string;
        stack?: string;
        timestamp: string;
      },
    ): Promise<IpcResponse<Record<string, never>>> => {
      try {
        const logPath = getRendererErrorLogPath(deps.userDataDir);
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        rotateIfNeeded(logPath);
        fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`, "utf8");
        return { ok: true, data: {} };
      } catch (err) {
        console.error("renderer error log write failed", err);
        return { ok: true, data: {} };
      }
    },
  );
}
