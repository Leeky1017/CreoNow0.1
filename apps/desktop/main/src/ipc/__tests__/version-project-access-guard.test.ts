import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import { registerVersionIpcHandlers } from "../version";
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

// Scenario: version:snapshot:create rejects mismatched bound projectId [ADDED]
{
  const binding = createProjectSessionBindingRegistry();
  binding.bind({ webContentsId: 71, projectId: "project-bound" });

  const harness = createIpcHarness();
  registerVersionIpcHandlers({
    ipcMain: harness.ipcMain,
    db: null,
    logger: createLogger(),
    projectSessionBinding: binding,
  });

  const snapshotCreate = harness.handlers.get("version:snapshot:create");
  assert.ok(snapshotCreate, "expected version:snapshot:create handler");

  const denied = (await snapshotCreate!(createEvent(71), {
    projectId: "project-other",
    documentId: "doc-1",
    contentJson: "{\"type\":\"doc\",\"content\":[]}",
    actor: "user",
    reason: "manual-save",
  })) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(denied.ok, false);
  assert.equal(denied.error?.code, "FORBIDDEN");
}

// Scenario: version:snapshot:create fails closed when renderer session is unbound [ADDED]
{
  const binding = createProjectSessionBindingRegistry();

  const harness = createIpcHarness();
  registerVersionIpcHandlers({
    ipcMain: harness.ipcMain,
    db: null,
    logger: createLogger(),
    projectSessionBinding: binding,
  });

  const snapshotCreate = harness.handlers.get("version:snapshot:create");
  assert.ok(snapshotCreate, "expected version:snapshot:create handler");

  const denied = (await snapshotCreate!(createEvent(999), {
    projectId: "project-guess",
    documentId: "doc-1",
    contentJson: "{\"type\":\"doc\",\"content\":[]}",
    actor: "user",
    reason: "manual-save",
  })) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(denied.ok, false);
  assert.equal(denied.error?.code, "FORBIDDEN");
}
