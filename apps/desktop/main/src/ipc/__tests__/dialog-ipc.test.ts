import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import { registerDialogIpcHandlers } from "../dialog";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

type ShowOpenDialogResult = {
  canceled: boolean;
  filePaths: string[];
};

type ShowOpenDialogOptions = {
  properties?: string[];
  title?: string;
};

type Harness = {
  handlers: Map<string, Handler>;
  lastDialogOptions: ShowOpenDialogOptions | undefined;
  invoke: <T>(channel: string, payload?: unknown) => Promise<T>;
};

function createHarness(args?: {
  dialogResult?: ShowOpenDialogResult;
  dialogThrows?: string;
}): Harness {
  const handlers = new Map<string, Handler>();
  let lastDialogOptions: ShowOpenDialogOptions | undefined;

  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  const showOpenDialog = async (
    options: ShowOpenDialogOptions,
  ): Promise<ShowOpenDialogResult> => {
    lastDialogOptions = options;

    if (args?.dialogThrows) {
      throw new Error(args.dialogThrows);
    }

    return (
      args?.dialogResult ?? {
        canceled: false,
        filePaths: ["/home/user/project"],
      }
    );
  };

  registerDialogIpcHandlers({
    ipcMain,
    showOpenDialog,
  });

  return {
    handlers,
    get lastDialogOptions() {
      return lastDialogOptions;
    },
    invoke: async <T>(channel: string, payload: unknown = {}) => {
      const handler = handlers.get(channel);
      assert.ok(handler, `expected IPC handler ${channel} to be registered`);
      return (await handler({}, payload)) as T;
    },
  };
}

async function runScenario(
  name: string,
  fn: () => Promise<void> | void,
): Promise<void> {
  try {
    await fn();
  } catch (error) {
    throw new Error(
      `[${name}] ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function main(): Promise<void> {
  // IPC-FE-OPENF-S1: handler is registered as dialog:folder:open
  await runScenario(
    "S1 dialog:folder:open handler should be registered",
    async () => {
      const harness = createHarness();
      assert.ok(
        harness.handlers.has("dialog:folder:open"),
        "expected dialog:folder:open handler to be registered",
      );
    },
  );

  // IPC-FE-OPENF-S2: returns null (via selectedPath=undefined) when user cancels
  await runScenario(
    "S2 should return ok with no selectedPath when user cancels dialog",
    async () => {
      const harness = createHarness({
        dialogResult: { canceled: true, filePaths: [] },
      });

      const response = await harness.invoke<{
        ok: boolean;
        data?: { selectedPath?: string };
      }>("dialog:folder:open");

      assert.equal(response.ok, true);
      assert.equal(response.data?.selectedPath, undefined);
    },
  );

  // IPC-FE-OPENF-S3: returns selected directory path
  await runScenario("S3 should return selected directory path", async () => {
    const harness = createHarness({
      dialogResult: {
        canceled: false,
        filePaths: ["/home/user/my-project"],
      },
    });

    const response = await harness.invoke<{
      ok: boolean;
      data?: { selectedPath?: string };
    }>("dialog:folder:open");

    assert.equal(response.ok, true);
    assert.equal(response.data?.selectedPath, "/home/user/my-project");
  });

  // IPC-FE-OPENF-S4: only allows openDirectory property
  await runScenario(
    "S4 should call showOpenDialog with only openDirectory property",
    async () => {
      const harness = createHarness();
      await harness.invoke("dialog:folder:open");

      assert.ok(harness.lastDialogOptions, "expected dialog to be called");
      assert.deepEqual(harness.lastDialogOptions.properties, ["openDirectory"]);
    },
  );

  // IPC-FE-OPENF-S5: showOpenDialog throws → INTERNAL error
  await runScenario(
    "S5 should return INTERNAL error when showOpenDialog throws",
    async () => {
      const harness = createHarness({
        dialogThrows: "native dialog crash",
      });

      const response = await harness.invoke<{
        ok: boolean;
        error?: { code: string; message: string };
      }>("dialog:folder:open");

      assert.equal(response.ok, false);
      assert.equal(response.error?.code, "INTERNAL");
    },
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
