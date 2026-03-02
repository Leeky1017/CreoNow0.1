import assert from "node:assert/strict";
import path from "node:path";

import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import { registerExportIpcHandlers } from "../export";
import { createProjectSessionBindingRegistry } from "../projectSessionBinding";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

function createMockIpcMain(): {
  ipcMain: IpcMain;
  invoke: (channel: string, payload: unknown) => Promise<unknown>;
  invokeFrom: (
    webContentsId: number,
    channel: string,
    payload: unknown,
  ) => Promise<unknown>;
} {
  const handlers = new Map<string, Handler>();
  return {
    ipcMain: {
      handle: (channel: string, listener: Handler) => {
        handlers.set(channel, listener);
      },
    } as unknown as IpcMain,
    invoke: async (channel: string, payload: unknown) => {
      const handler = handlers.get(channel);
      assert.ok(handler, `expected handler ${channel}`);
      return handler({}, payload);
    },
    invokeFrom: async (
      webContentsId: number,
      channel: string,
      payload: unknown,
    ) => {
      const handler = handlers.get(channel);
      assert.ok(handler, `expected handler ${channel}`);
      return handler({ sender: { id: webContentsId } }, payload);
    },
  };
}

function createLogger(): { logger: Logger; errors: string[] } {
  const errors: string[] = [];
  return {
    errors,
    logger: {
      logPath: path.join(process.cwd(), "tmp.log"),
      info: () => {},
      error: (event) => {
        errors.push(event);
      },
    },
  };
}

async function main(): Promise<void> {
  const dbReadyHarness = createMockIpcMain();
  const dbReadyLogger = createLogger();

  registerExportIpcHandlers({
    ipcMain: dbReadyHarness.ipcMain,
    db: {} as never,
    logger: dbReadyLogger.logger,
    userDataDir: process.cwd(),
  });

  const invalidPayload = (await dbReadyHarness.invoke(
    "export:document:markdown",
    null,
  )) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(invalidPayload.ok, false);
  assert.equal(invalidPayload.error?.code, "INVALID_ARGUMENT");

  const invalidDocumentId = (await dbReadyHarness.invoke(
    "export:document:pdf",
    { projectId: "p1", documentId: 42 },
  )) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(invalidDocumentId.ok, false);
  assert.equal(invalidDocumentId.error?.code, "INVALID_ARGUMENT");

  const invalidBundlePayload = (await dbReadyHarness.invoke(
    "export:project:bundle",
    { projectId: 7 },
  )) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(invalidBundlePayload.ok, false);
  assert.equal(invalidBundlePayload.error?.code, "INVALID_ARGUMENT");

  const dbMissingHarness = createMockIpcMain();
  const dbMissingLogger = createLogger();

  registerExportIpcHandlers({
    ipcMain: dbMissingHarness.ipcMain,
    db: null,
    logger: dbMissingLogger.logger,
    userDataDir: process.cwd(),
  });

  const dbMissing = (await dbMissingHarness.invoke("export:document:txt", {
    projectId: 1,
  })) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(dbMissing.ok, false);
  assert.equal(dbMissing.error?.code, "DB_ERROR");

  const binding = createProjectSessionBindingRegistry();
  binding.bind({ webContentsId: 77, projectId: "project-bound" });

  const guardHarness = createMockIpcMain();
  const guardLogger = createLogger();

  registerExportIpcHandlers({
    ipcMain: guardHarness.ipcMain,
    db: {} as never,
    logger: guardLogger.logger,
    userDataDir: process.cwd(),
    projectSessionBinding: binding,
  });

  const exportDenied = (await guardHarness.invokeFrom(
    77,
    "export:document:markdown",
    { projectId: "project-other", documentId: "doc-1" },
  )) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(exportDenied.ok, false);
  assert.equal(exportDenied.error?.code, "FORBIDDEN");

  const bundleDeniedWhenUnbound = (await guardHarness.invokeFrom(
    999,
    "export:project:bundle",
    { projectId: "project-guess" },
  )) as {
    ok: boolean;
    error?: { code?: string };
  };

  assert.equal(bundleDeniedWhenUnbound.ok, false);
  assert.equal(bundleDeniedWhenUnbound.error?.code, "FORBIDDEN");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
