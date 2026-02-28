import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import { registerWindowIpcHandlers } from "../window";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

type FakeWindow = {
  isMaximized: () => boolean;
  isMinimized: () => boolean;
  isFullScreen: () => boolean;
  minimize: () => void;
  maximize: () => void;
  unmaximize: () => void;
  close: () => void;
};

type ThrowTargets = Partial<Record<keyof FakeWindow, string>>;

type Harness = {
  handlers: Map<string, Handler>;
  calls: string[];
  maximizeState: { value: boolean };
  invoke: <T>(channel: string, payload?: unknown) => Promise<T>;
};

function createHarness(args?: {
  platform?: NodeJS.Platform;
  hasWindow?: boolean;
  initiallyMaximized?: boolean;
  throwOn?: ThrowTargets;
}): Harness {
  const handlers = new Map<string, Handler>();
  const calls: string[] = [];
  const maximizeState = { value: args?.initiallyMaximized ?? false };

  const maybeThrow = (method: keyof FakeWindow): void => {
    const message = args?.throwOn?.[method];
    if (message) {
      throw new Error(message);
    }
  };

  const win: FakeWindow = {
    isMaximized: () => {
      maybeThrow("isMaximized");
      return maximizeState.value;
    },
    isMinimized: () => {
      maybeThrow("isMinimized");
      return false;
    },
    isFullScreen: () => {
      maybeThrow("isFullScreen");
      return false;
    },
    minimize: () => {
      maybeThrow("minimize");
      calls.push("minimize");
    },
    maximize: () => {
      maybeThrow("maximize");
      calls.push("maximize");
      maximizeState.value = true;
    },
    unmaximize: () => {
      maybeThrow("unmaximize");
      calls.push("unmaximize");
      maximizeState.value = false;
    },
    close: () => {
      maybeThrow("close");
      calls.push("close");
    },
  };

  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  registerWindowIpcHandlers({
    ipcMain,
    platform: args?.platform ?? "win32",
    resolveWindowFromEvent: () => {
      if (args?.hasWindow === false) {
        return null;
      }
      return win;
    },
  });

  return {
    handlers,
    calls,
    maximizeState,
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
  await runScenario(
    "W1 should expose enabled window state on Windows",
    async () => {
      const harness = createHarness({
        platform: "win32",
        initiallyMaximized: false,
      });
      const response = await harness.invoke<{
        ok: boolean;
        data?: {
          controlsEnabled: boolean;
          isMaximized: boolean;
          isMinimized: boolean;
          isFullScreen: boolean;
          platform: string;
        };
      }>("app:window:getstate");

      assert.equal(response.ok, true);
      assert.equal(response.data?.controlsEnabled, true);
      assert.equal(response.data?.isMaximized, false);
      assert.equal(response.data?.platform, "win32");
    },
  );

  await runScenario("W2 should minimize/close/toggle maximize", async () => {
    const harness = createHarness({
      platform: "win32",
      initiallyMaximized: false,
    });

    const minResponse = await harness.invoke<{ ok: boolean }>(
      "app:window:minimize",
    );
    assert.equal(minResponse.ok, true);

    const maxResponse = await harness.invoke<{ ok: boolean }>(
      "app:window:togglemaximized",
    );
    assert.equal(maxResponse.ok, true);
    assert.equal(harness.maximizeState.value, true);

    const restoreResponse = await harness.invoke<{ ok: boolean }>(
      "app:window:togglemaximized",
    );
    assert.equal(restoreResponse.ok, true);
    assert.equal(harness.maximizeState.value, false);

    const closeResponse = await harness.invoke<{ ok: boolean }>(
      "app:window:close",
    );
    assert.equal(closeResponse.ok, true);

    assert.deepEqual(harness.calls, [
      "minimize",
      "maximize",
      "unmaximize",
      "close",
    ]);
  });

  await runScenario(
    "W3 should reject action channels on non-Windows",
    async () => {
      const harness = createHarness({ platform: "linux" });

      const unsupported = await harness.invoke<{
        ok: boolean;
        error?: { code: string };
      }>("app:window:minimize");

      assert.equal(unsupported.ok, false);
      assert.equal(unsupported.error?.code, "UNSUPPORTED");
    },
  );

  await runScenario(
    "W4 should return NOT_FOUND when no BrowserWindow is resolved",
    async () => {
      const harness = createHarness({ platform: "win32", hasWindow: false });

      const response = await harness.invoke<{
        ok: boolean;
        error?: { code: string };
      }>("app:window:close");

      assert.equal(response.ok, false);
      assert.equal(response.error?.code, "NOT_FOUND");
    },
  );

  await runScenario(
    "W5 should map getstate runtime exceptions to INTERNAL",
    async () => {
      const harness = createHarness({
        platform: "win32",
        throwOn: { isMaximized: "boom-state" },
      });

      const response = await harness.invoke<{
        ok: boolean;
        error?: { code: string; message: string };
      }>("app:window:getstate");

      assert.equal(response.ok, false);
      assert.equal(response.error?.code, "INTERNAL");
      assert.match(response.error?.message ?? "", /get window state/);
    },
  );

  await runScenario(
    "W6 should map action runtime exceptions to INTERNAL",
    async () => {
      const harness = createHarness({
        platform: "win32",
        throwOn: { minimize: "boom-minimize" },
      });

      const response = await harness.invoke<{
        ok: boolean;
        error?: { code: string; message: string };
      }>("app:window:minimize");

      assert.equal(response.ok, false);
      assert.equal(response.error?.code, "INTERNAL");
      assert.match(response.error?.message ?? "", /Failed to minimize window/);
      assert.deepEqual(harness.calls, []);
    },
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
