import assert from "node:assert/strict";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import type { CreonowWatchService } from "../../services/context/watchService";
import { registerContextFsHandlers } from "../contextFs";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDeps(args: {
  handlers: Map<string, Handler>;
  watchService: CreonowWatchService;
}): {
  ipcMain: IpcMain;
  db: Database.Database;
  logger: Logger;
  userDataDir: string;
  watchService: CreonowWatchService;
} {
  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      args.handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  return {
    ipcMain,
    db: {} as Database.Database,
    logger: createLogger(),
    userDataDir: "<test-user-data>",
    watchService: args.watchService,
  };
}

const handlers = new Map<string, Handler>();
let stopCalled = 0;

registerContextFsHandlers(
  createDeps({
    handlers,
    watchService: {
      start: () => ({ ok: true, data: { watching: true } }),
      stop: () => {
        stopCalled += 1;
        return { ok: true, data: { watching: false } };
      },
      isWatching: () => false,
    },
  }),
);

const watchStop = handlers.get("context:watch:stop");
assert.ok(watchStop, "context:watch:stop handler should exist");
let watchStopRejected = false;
let watchStopResponse: unknown;
try {
  watchStopResponse = await watchStop!(
    {},
    { projectId: 42 } as unknown as { projectId: string },
  );
} catch {
  watchStopRejected = true;
}

assert.equal(
  watchStopRejected,
  false,
  "context:watch:stop should not reject on malformed projectId",
);
assert.deepEqual(watchStopResponse, {
  ok: false,
  error: { code: "INVALID_ARGUMENT", message: "projectId is required" },
});
assert.equal(stopCalled, 0, "watchService.stop should not run on invalid payload");

const rulesRead = handlers.get("context:rules:read");
assert.ok(rulesRead, "context:rules:read handler should exist");
let rulesReadRejected = false;
let rulesReadResponse: unknown;
try {
  rulesReadResponse = await rulesRead!(
    {},
    { projectId: "p-1", path: 42 } as unknown as {
      projectId: string;
      path: string;
    },
  );
} catch {
  rulesReadRejected = true;
}

assert.equal(
  rulesReadRejected,
  false,
  "context:rules:read should not reject on malformed path",
);
assert.deepEqual(rulesReadResponse, {
  ok: false,
  error: { code: "INVALID_ARGUMENT", message: "Invalid rules path" },
});
