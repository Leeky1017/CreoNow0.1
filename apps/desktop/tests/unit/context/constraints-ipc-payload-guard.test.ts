import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import type { IpcResponse } from "@shared/types/ipc-generated";
import { registerConstraintsIpcHandlers } from "../../../main/src/ipc/constraints";
import type { Logger } from "../../../main/src/logging/logger";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

type FakeIpcMain = {
  handle: (channel: string, handler: Handler) => void;
};

async function createTempDir(): Promise<string> {
  return await fs.mkdtemp(
    path.join(os.tmpdir(), "CreoNow constraints payload "),
  );
}

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDbStub(args: {
  projectId: string;
  rootPath: string;
}): Database.Database {
  const row = { rootPath: args.rootPath };
  const prepare = () => {
    return {
      get: (projectId: string) => {
        return projectId === args.projectId ? row : undefined;
      },
    };
  };
  return { prepare } as unknown as Database.Database;
}

function createIpcHarness(): {
  ipcMain: FakeIpcMain;
  handlers: Map<string, Handler>;
} {
  const handlers = new Map<string, Handler>();
  const ipcMain: FakeIpcMain = {
    handle: (channel, handler) => {
      handlers.set(channel, handler);
    },
  };
  return { ipcMain, handlers };
}

const projectId = `proj_${randomUUID()}`;
const projectRoot = await createTempDir();
const db = createDbStub({ projectId, rootPath: projectRoot });
const logger = createLogger();
const { ipcMain, handlers } = createIpcHarness();

registerConstraintsIpcHandlers({
  ipcMain: ipcMain as unknown as IpcMain,
  db,
  logger,
});

const cases: Array<{
  channel:
    | "constraints:policy:list"
    | "constraints:policy:create"
    | "constraints:policy:update"
    | "constraints:policy:delete"
    | "constraints:policy:get"
    | "constraints:policy:set";
  payload: unknown;
}> = [
  { channel: "constraints:policy:list", payload: null },
  { channel: "constraints:policy:list", payload: { projectId: 1 } },
  { channel: "constraints:policy:create", payload: [] },
  {
    channel: "constraints:policy:create",
    payload: { projectId, constraint: { text: 123 } },
  },
  { channel: "constraints:policy:update", payload: "oops" },
  {
    channel: "constraints:policy:update",
    payload: { projectId, constraintId: "c1", patch: { priority: "100" } },
  },
  { channel: "constraints:policy:delete", payload: 42 },
  {
    channel: "constraints:policy:delete",
    payload: { projectId, constraintId: false },
  },
  { channel: "constraints:policy:get", payload: undefined },
  { channel: "constraints:policy:get", payload: { projectId: {} } },
  { channel: "constraints:policy:set", payload: true },
  {
    channel: "constraints:policy:set",
    payload: { projectId, constraints: "bad" },
  },
];

for (const testCase of cases) {
  const handler = handlers.get(testCase.channel);
  assert.ok(handler, `Missing handler ${testCase.channel}`);

  const result = (await handler({}, testCase.payload)) as IpcResponse<unknown>;
  assert.equal(result.ok, false, `${testCase.channel} should reject payload`);
  if (!result.ok) {
    assert.equal(
      result.error.code,
      "INVALID_ARGUMENT",
      `${testCase.channel} should return INVALID_ARGUMENT`,
    );
  }
}

await fs.rm(projectRoot, { recursive: true, force: true });
