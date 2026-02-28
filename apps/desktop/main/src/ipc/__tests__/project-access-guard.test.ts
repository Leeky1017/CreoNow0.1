import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import { registerContextFsHandlers } from "../contextFs";
import { registerKnowledgeGraphIpcHandlers } from "../knowledgeGraph";
import { registerMemoryIpcHandlers } from "../memory";
import { createProjectSessionBindingRegistry } from "../projectSessionBinding";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createIpcHarness(): {
  handlers: Map<string, Handler>;
  ipcMain: IpcMain;
} {
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;
  return { handlers, ipcMain };
}

function createEvent(webContentsId: number): { sender: { id: number } } {
  return { sender: { id: webContentsId } };
}

// Scenario: contextFs/memory/knowledge handlers reject mismatched bound projectId [ADDED]
{
  const binding = createProjectSessionBindingRegistry();
  binding.bind({ webContentsId: 77, projectId: "project-bound" });

  const logger = createLogger();

  const contextHarness = createIpcHarness();
  registerContextFsHandlers({
    ipcMain: contextHarness.ipcMain,
    db: null,
    logger,
    userDataDir: "<test-user-data>",
    watchService: {
      start: () => ({ ok: true, data: { watching: true } }),
      stop: () => ({ ok: true, data: { watching: false } }),
      isWatching: () => false,
    },
    projectSessionBinding: binding,
  });

  const contextRulesList = contextHarness.handlers.get("context:rules:list");
  assert.ok(contextRulesList, "expected context:rules:list handler");

  const contextDenied = (await contextRulesList!(createEvent(77), {
    projectId: "project-other",
  })) as {
    ok: boolean;
    error?: { code?: string };
  };
  assert.equal(contextDenied.ok, false);
  assert.equal(contextDenied.error?.code, "FORBIDDEN");

  const memoryHarness = createIpcHarness();
  registerMemoryIpcHandlers({
    ipcMain: memoryHarness.ipcMain,
    db: null,
    logger,
    projectSessionBinding: binding,
  });

  const memoryList = memoryHarness.handlers.get("memory:entry:list");
  assert.ok(memoryList, "expected memory:entry:list handler");

  const memoryDenied = (await memoryList!(createEvent(77), {
    projectId: "project-other",
  })) as {
    ok: boolean;
    error?: { code?: string };
  };
  assert.equal(memoryDenied.ok, false);
  assert.equal(memoryDenied.error?.code, "FORBIDDEN");

  const knowledgeHarness = createIpcHarness();
  registerKnowledgeGraphIpcHandlers({
    ipcMain: knowledgeHarness.ipcMain,
    db: null,
    logger,
    projectSessionBinding: binding,
  });

  const knowledgeList = knowledgeHarness.handlers.get("knowledge:entity:list");
  assert.ok(knowledgeList, "expected knowledge:entity:list handler");

  const knowledgeDenied = (await knowledgeList!(createEvent(77), {
    projectId: "project-other",
  })) as {
    ok: boolean;
    error?: { code?: string };
  };
  assert.equal(knowledgeDenied.ok, false);
  assert.equal(knowledgeDenied.error?.code, "FORBIDDEN");
}

// Scenario: unbound renderer session must fail closed for project-scoped IPC [ADDED]
{
  const binding = createProjectSessionBindingRegistry();

  const logger = createLogger();
  const contextHarness = createIpcHarness();

  registerContextFsHandlers({
    ipcMain: contextHarness.ipcMain,
    db: null,
    logger,
    userDataDir: "<test-user-data>",
    watchService: {
      start: () => ({ ok: true, data: { watching: true } }),
      stop: () => ({ ok: true, data: { watching: false } }),
      isWatching: () => false,
    },
    projectSessionBinding: binding,
  });

  const contextRulesList = contextHarness.handlers.get("context:rules:list");
  assert.ok(contextRulesList, "expected context:rules:list handler");

  const deniedWhenUnbound = (await contextRulesList!(createEvent(999), {
    projectId: "project-guess",
  })) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(deniedWhenUnbound.ok, false);
  assert.equal(deniedWhenUnbound.error?.code, "FORBIDDEN");
}
