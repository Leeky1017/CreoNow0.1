import assert from "node:assert/strict";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import type {
  ContextInspectResult,
  ContextLayerAssemblyService,
} from "../../services/context/layerAssemblyService";
import { registerContextAssemblyHandlers } from "../contextAssembly";
import { createProjectSessionBindingRegistry } from "../projectSessionBinding";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => {},
    error: () => {},
  };
}

function createDb(): Database.Database {
  return {
    prepare: () => ({
      get: () => ({ rootPath: "/tmp/project-root" }),
    }),
  } as unknown as Database.Database;
}

function createContextAssemblyService(args: {
  inspectCalls: { value: number };
}): ContextLayerAssemblyService {
  const inspectResult: ContextInspectResult = {
    layersDetail: {
      rules: { content: "", source: [], tokenCount: 0, truncated: false },
      settings: { content: "", source: [], tokenCount: 0, truncated: false },
      retrieved: { content: "", source: [], tokenCount: 0, truncated: false },
      immediate: { content: "", source: [], tokenCount: 0, truncated: false },
    },
    totals: { tokenCount: 0, warningsCount: 0 },
    inspectMeta: {
      debugMode: true,
      requestedBy: "unit-test",
      requestedAt: Date.now(),
    },
  };

  return {
    getBudgetProfile: () => ({
      version: 1,
      tokenizerId: "test-tokenizer",
      tokenizerVersion: "1",
      maxPromptTokens: 2048,
      reserveResponseTokens: 512,
      perLayerCaps: {
        rules: 0.25,
        retrieved: 0.25,
        memory: 0.25,
        settings: 0.25,
      },
      updatedAt: "2026-01-01T00:00:00.000Z",
    }),
    updateBudgetProfile: () => ({
      ok: false,
      error: { code: "NOT_IMPLEMENTED", message: "not used in this test" },
    }),
    assemble: async () => {
      throw new Error("not used in this test");
    },
    inspect: async () => {
      args.inspectCalls.value += 1;
      return inspectResult;
    },
  } as unknown as ContextLayerAssemblyService;
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

const inspectCalls = { value: 0 };
const harness = createIpcHarness();
const projectSessionBinding = createProjectSessionBindingRegistry();
projectSessionBinding.bind({ webContentsId: 42, projectId: "project-1" });

registerContextAssemblyHandlers({
  ipcMain: harness.ipcMain,
  db: createDb(),
  logger: createLogger(),
  contextAssemblyService: createContextAssemblyService({ inspectCalls }),
  inFlightByDocument: new Map<string, number>(),
  projectSessionBinding,
});

const inspectHandler = harness.handlers.get("context:prompt:inspect");
assert.ok(inspectHandler, "context:prompt:inspect handler should be registered");

const basePayload = {
  projectId: "project-1",
  documentId: "doc-1",
  cursorPosition: 1,
  skillId: "skill-1",
  debugMode: true,
  requestedBy: "viewer-user",
};

const viewerResponse = (await inspectHandler!(createEvent(42), {
  ...basePayload,
  callerRole: "viewer",
})) as {
  ok: boolean;
  error?: { code?: string };
};
assert.equal(viewerResponse.ok, false);
assert.equal(viewerResponse.error?.code, "CONTEXT_INSPECT_FORBIDDEN");

const ownerSelfAssertResponse = (await inspectHandler!(createEvent(42), {
  ...basePayload,
  callerRole: "owner",
})) as {
  ok: boolean;
  error?: { code?: string };
};
assert.equal(
  ownerSelfAssertResponse.ok,
  false,
  "same sender self-assert owner should not bypass inspect guard",
);
assert.equal(
  ownerSelfAssertResponse.error?.code,
  "CONTEXT_INSPECT_FORBIDDEN",
);
assert.equal(inspectCalls.value, 0, "forbidden requests must not call inspect()");

const trustedInspectCalls = { value: 0 };
const trustedHarness = createIpcHarness();
const trustedBinding = createProjectSessionBindingRegistry();
trustedBinding.bind({ webContentsId: 84, projectId: "project-1" });

registerContextAssemblyHandlers({
  ipcMain: trustedHarness.ipcMain,
  db: createDb(),
  logger: createLogger(),
  contextAssemblyService: createContextAssemblyService({
    inspectCalls: trustedInspectCalls,
  }),
  inFlightByDocument: new Map<string, number>(),
  projectSessionBinding: trustedBinding,
  resolveInspectRole: ({ webContentsId }) => {
    return webContentsId === 84 ? "owner" : null;
  },
});

const trustedInspectHandler = trustedHarness.handlers.get("context:prompt:inspect");
assert.ok(
  trustedInspectHandler,
  "context:prompt:inspect handler should be registered for trusted scenario",
);

const trustedResponse = (await trustedInspectHandler!(createEvent(84), {
  ...basePayload,
  callerRole: "viewer",
})) as {
  ok: boolean;
  error?: { code?: string };
};
assert.equal(
  trustedResponse.ok,
  true,
  "trusted sender/session role should allow inspect regardless of payload.callerRole",
);
assert.equal(
  trustedInspectCalls.value,
  1,
  "trusted allowed request should call inspect() exactly once",
);
