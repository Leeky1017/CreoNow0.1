import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { Logger } from "../../main/src/logging/logger";
import { registerAiIpcHandlers } from "../../main/src/ipc/ai";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../main/src/db/migrations",
);

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function applyAllMigrations(db: Database.Database): void {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql") && !f.includes("vec"))
    .sort();
  for (const file of files) {
    db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8"));
  }
}

const db = new Database(":memory:");
db.pragma("foreign_keys = ON");
applyAllMigrations(db);

const handlers = new Map<string, Handler>();
const ipcMain = {
  handle: (channel: string, listener: Handler) => {
    handlers.set(channel, listener);
  },
} as unknown as IpcMain;

registerAiIpcHandlers({
  ipcMain,
  db,
  userDataDir: "<test-user-data>",
  builtinSkillsDir: "<test-skills>",
  logger: createLogger(),
  env: process.env,
});

const chatSend = handlers.get("ai:chat:send");
const chatList = handlers.get("ai:chat:list");

assert.ok(chatSend, "expected ai:chat:send handler");
assert.ok(chatList, "expected ai:chat:list handler");

const projectId = "project-chat-capacity";

// Send first message to create a session, then reuse it for remaining
const firstSend = (await chatSend?.(
  {},
  { projectId, message: "message-1" },
)) as {
  ok: boolean;
  data?: { sessionId: string };
};
assert.equal(firstSend.ok, true);
const sessionId = firstSend.data?.sessionId;
assert.ok(sessionId);

for (let i = 2; i <= 2000; i += 1) {
  const response = (await chatSend?.(
    {},
    { projectId, sessionId, message: `message-${i}` },
  )) as {
    ok: boolean;
  };
  assert.equal(response.ok, true);
}

const overflow = (await chatSend?.(
  {},
  { projectId, message: "message-overflow" },
)) as {
  ok: boolean;
  error?: { code?: string; message?: string };
};

assert.equal(overflow.ok, false);
if (overflow.ok) {
  assert.fail("expected overflow request to be blocked");
}

assert.equal(overflow.error?.code, "CONFLICT");
assert.match(String(overflow.error?.message ?? ""), /归档|archive/i);

const listed = (await chatList?.({}, { projectId })) as {
  ok: boolean;
  data?: { items: Array<{ content: string }> };
};

assert.equal(listed.ok, true);
assert.equal(listed.data?.items.length, 2000);
assert.equal(listed.data?.items[0]?.content, "message-1");
assert.equal(listed.data?.items[1999]?.content, "message-2000");
