import fs from "node:fs";
import path from "node:path";

import type { IpcMain } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";
import type { Logger } from "../logging/logger";

const MAX_LOG_SIZE_BYTES = 5 * 1024 * 1024;

const VALID_SOURCES = new Set(["unhandledrejection", "error"]);

interface RendererErrorPayload {
  source: "unhandledrejection" | "error";
  name: string;
  message: string;
  stack?: string;
  timestamp: string;
}

function validatePayload(raw: unknown): RendererErrorPayload {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("payload must be an object");
  }
  const p = raw as Record<string, unknown>;
  if (typeof p.source !== "string" || !VALID_SOURCES.has(p.source)) {
    throw new Error("invalid source");
  }
  if (typeof p.name !== "string" || typeof p.message !== "string") {
    throw new Error("name and message must be strings");
  }
  if (typeof p.timestamp !== "string") {
    throw new Error("timestamp must be a string");
  }
  return {
    source: p.source as RendererErrorPayload["source"],
    name: p.name,
    message: p.message,
    stack: typeof p.stack === "string" ? p.stack : undefined,
    timestamp: p.timestamp,
  };
}

function getRendererErrorLogPath(userDataDir: string): string {
  return path.join(userDataDir, "logs", "renderer-errors.log");
}

function rotateIfNeeded(logPath: string): void {
  try {
    const stat = fs.statSync(logPath);
    if (stat.size <= MAX_LOG_SIZE_BYTES) {
      return;
    }
    const content = fs.readFileSync(logPath, "utf8");
    const lines = content.split("\n");
    const half = Math.floor(lines.length / 2);
    fs.writeFileSync(logPath, lines.slice(half).join("\n"), "utf8");
  } catch {
    // File may not exist yet — nothing to rotate.
  }
}

export function registerRendererLogIpcHandlers(args: {
  ipcMain: IpcMain;
  userDataDir: string;
  logger: Logger;
}): void {
  args.ipcMain.handle(
    "app:renderer:logerror",
    async (_event, raw: unknown): Promise<IpcResponse<{ logged: true }>> => {
      try {
        const payload = validatePayload(raw);
        const logPath = getRendererErrorLogPath(args.userDataDir);
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        rotateIfNeeded(logPath);
        fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`, "utf8");
        return { ok: true, data: { logged: true } };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          "[RendererLog] Failed to write renderer error log",
          error,
        );
        return { ok: true, data: { logged: true } };
      }
    },
  );
}
