import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import { registerAiIpcHandlers } from "../ai";
import { createProjectSessionBindingRegistry } from "../projectSessionBinding";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../db/migrations",
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

function createHarness(args?: {
  useProjectSessionBinding?: boolean;
  db?: Database.Database;
}): {
  chatSend: Handler;
  chatList: Handler;
  chatClear: Handler;
  chatSessions: Handler;
  chatSessionDelete: Handler;
  binding: ReturnType<typeof createProjectSessionBindingRegistry> | null;
} {
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  const binding = args?.useProjectSessionBinding
    ? createProjectSessionBindingRegistry()
    : null;

  const db =
    args?.db ??
    (() => {
      const memDb = new Database(":memory:");
      memDb.pragma("foreign_keys = ON");
      applyAllMigrations(memDb);
      return memDb;
    })();

  registerAiIpcHandlers({
    ipcMain,
    db,
    userDataDir: "<test-user-data>",
    builtinSkillsDir: "<test-skills>",
    logger: createLogger(),
    env: process.env,
    ...(binding ? { projectSessionBinding: binding } : {}),
  });

  const chatSend = handlers.get("ai:chat:send");
  const chatList = handlers.get("ai:chat:list");
  const chatClear = handlers.get("ai:chat:clear");
  const chatSessions = handlers.get("ai:chat:sessions");
  const chatSessionDelete = handlers.get("ai:chatsession:delete");

  assert.ok(chatSend, "expected ai:chat:send handler to be registered");
  assert.ok(chatList, "expected ai:chat:list handler to be registered");
  assert.ok(chatClear, "expected ai:chat:clear handler to be registered");
  assert.ok(chatSessions, "expected ai:chat:sessions handler to be registered");
  assert.ok(
    chatSessionDelete,
    "expected ai:chatsession:delete handler to be registered",
  );

  return {
    chatSend: chatSend as Handler,
    chatList: chatList as Handler,
    chatClear: chatClear as Handler,
    chatSessions: chatSessions as Handler,
    chatSessionDelete: chatSessionDelete as Handler,
    binding,
  };
}

function createEvent(webContentsId: number): { sender: { id: number } } {
  return {
    sender: { id: webContentsId },
  };
}

// Scenario: chat history must remain isolated by project id [ADDED]
{
  const { chatSend, chatList, chatClear } = createHarness();
  const projectA = "project-a";
  const projectB = "project-b";

  const sendA = (await chatSend(createEvent(1), {
    projectId: projectA,
    message: "Message from A",
  })) as {
    ok: boolean;
  };
  assert.equal(sendA.ok, true);

  const sendB = (await chatSend(createEvent(2), {
    projectId: projectB,
    message: "Message from B",
  })) as {
    ok: boolean;
  };
  assert.equal(sendB.ok, true);

  const listA = (await chatList(createEvent(1), {
    projectId: projectA,
  })) as {
    ok: boolean;
    data?: { items: Array<{ content: string; projectId: string }> };
  };

  assert.equal(listA.ok, true);
  assert.equal(
    listA.data?.items.length,
    1,
    "project A should only see its own chat history",
  );
  assert.equal(listA.data?.items[0]?.projectId, projectA);
  assert.equal(listA.data?.items[0]?.content, "Message from A");

  const clearA = (await chatClear(createEvent(1), {
    projectId: projectA,
  })) as {
    ok: boolean;
  };
  assert.equal(clearA.ok, true);

  const listAAfterClear = (await chatList(createEvent(1), {
    projectId: projectA,
  })) as {
    ok: boolean;
    data?: { items: Array<{ content: string; projectId: string }> };
  };
  assert.equal(listAAfterClear.ok, true);
  assert.equal(
    listAAfterClear.data?.items.length,
    0,
    "project A history should be empty after clear",
  );

  const listBAfterClearA = (await chatList(createEvent(2), {
    projectId: projectB,
  })) as {
    ok: boolean;
    data?: { items: Array<{ content: string; projectId: string }> };
  };
  assert.equal(listBAfterClearA.ok, true);
  assert.equal(
    listBAfterClearA.data?.items.length,
    1,
    "project B history should not be cleared by project A operation",
  );
  assert.equal(listBAfterClearA.data?.items[0]?.projectId, projectB);
  assert.equal(listBAfterClearA.data?.items[0]?.content, "Message from B");
}

// Scenario: session-bound project id must reject mismatched payloads [ADDED]
{
  const { chatSend, chatList, binding } = createHarness({
    useProjectSessionBinding: true,
  });
  assert.ok(binding, "project session binding should be enabled");

  binding.bind({
    webContentsId: 11,
    projectId: "project-bound",
  });

  const mismatched = (await chatSend(createEvent(11), {
    projectId: "project-other",
    message: "should fail",
  })) as {
    ok: boolean;
    error?: { code?: string };
  };
  assert.equal(mismatched.ok, false);
  assert.equal(mismatched.error?.code, "FORBIDDEN");

  const boundSend = (await chatSend(createEvent(11), {
    message: "uses bound project",
  })) as {
    ok: boolean;
  };
  assert.equal(boundSend.ok, true);

  const boundList = (await chatList(createEvent(11), {})) as {
    ok: boolean;
    data?: { items: Array<{ projectId: string; content: string }> };
  };
  assert.equal(boundList.ok, true);
  assert.equal(boundList.data?.items.length, 1);
  assert.equal(boundList.data?.items[0]?.projectId, "project-bound");
  assert.equal(boundList.data?.items[0]?.content, "uses bound project");
}

// Scenario: chat history survives handler re-instantiation (SQLite persistence) [ADDED]
{
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  applyAllMigrations(db);

  const h1 = createHarness({ db });
  const projectId = "project-persist";

  const sendRes = (await h1.chatSend(createEvent(1), {
    projectId,
    message: "hello persistence",
  })) as {
    ok: boolean;
    data?: { sessionId: string };
  };
  assert.equal(sendRes.ok, true);
  assert.ok(sendRes.data?.sessionId, "send should return a sessionId");

  // Re-instantiate handlers with the same DB (simulates restart)
  const h2 = createHarness({ db });
  const listRes = (await h2.chatList(createEvent(1), {
    projectId,
  })) as {
    ok: boolean;
    data?: { items: Array<{ content: string }> };
  };
  assert.equal(listRes.ok, true);
  assert.equal(
    listRes.data?.items.length,
    1,
    "message must survive handler re-instantiation",
  );
  assert.equal(listRes.data?.items[0]?.content, "hello persistence");
}

// Scenario: sessions listing and search [ADDED]
{
  const { chatSend, chatSessions } = createHarness();
  const projectId = "project-sessions";

  await chatSend(createEvent(1), {
    projectId,
    message: "first topic about cats",
  });
  await chatSend(createEvent(1), {
    projectId,
    message: "second topic about dogs",
  });

  const allSessions = (await chatSessions(createEvent(1), { projectId })) as {
    ok: boolean;
    data?: { sessions: Array<{ sessionId: string; title: string }> };
  };
  assert.equal(allSessions.ok, true);
  assert.equal(allSessions.data?.sessions.length, 2, "should have 2 sessions");

  // Search should filter
  const searchRes = (await chatSessions(createEvent(1), {
    projectId,
    query: "cats",
  })) as {
    ok: boolean;
    data?: { sessions: Array<{ sessionId: string; title: string }> };
  };
  assert.equal(searchRes.ok, true);
  assert.equal(
    searchRes.data?.sessions.length,
    1,
    "search should find 1 session",
  );
}

// Scenario: session delete cascades messages [ADDED]
{
  const { chatSend, chatList, chatSessionDelete, chatSessions } =
    createHarness();
  const projectId = "project-delete";

  const sendRes = (await chatSend(createEvent(1), {
    projectId,
    message: "to be deleted",
  })) as {
    ok: boolean;
    data?: { sessionId: string };
  };
  assert.equal(sendRes.ok, true);
  const sessionId = sendRes.data?.sessionId;
  assert.ok(sessionId);

  await chatSessionDelete(createEvent(1), { projectId, sessionId });

  const listRes = (await chatList(createEvent(1), { projectId })) as {
    ok: boolean;
    data?: { items: unknown[] };
  };
  assert.equal(listRes.ok, true);
  assert.equal(
    listRes.data?.items.length,
    0,
    "messages removed after session delete",
  );

  const sessionsRes = (await chatSessions(createEvent(1), { projectId })) as {
    ok: boolean;
    data?: { sessions: unknown[] };
  };
  assert.equal(sessionsRes.ok, true);
  assert.equal(sessionsRes.data?.sessions.length, 0, "session removed");
}

// Scenario: list messages filtered by session [ADDED]
{
  const { chatSend, chatList } = createHarness();
  const projectId = "project-filter";

  const s1 = (await chatSend(createEvent(1), {
    projectId,
    message: "session A msg",
  })) as { ok: boolean; data?: { sessionId: string } };
  assert.equal(s1.ok, true);
  const sessionA = s1.data?.sessionId;
  assert.ok(sessionA);

  await chatSend(createEvent(1), { projectId, message: "session B msg" });

  // List all
  const allMsgs = (await chatList(createEvent(1), { projectId })) as {
    ok: boolean;
    data?: { items: unknown[] };
  };
  assert.equal(allMsgs.data?.items.length, 2, "should have 2 messages total");

  // List by session
  const sessionMsgs = (await chatList(createEvent(1), {
    projectId,
    sessionId: sessionA,
  })) as {
    ok: boolean;
    data?: { items: Array<{ content: string }> };
  };
  assert.equal(sessionMsgs.data?.items.length, 1, "should filter by session");
  assert.equal(sessionMsgs.data?.items[0]?.content, "session A msg");
}
