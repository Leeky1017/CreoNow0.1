import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import { registerStatsIpcHandlers } from "../stats";

type Handler = (event: unknown, payload?: unknown) => Promise<unknown>;

type Harness = {
  invoke: <T>(channel: string, payload?: unknown) => Promise<T>;
};

function createHarness(dbReady: boolean): Harness {
  const handlers = new Map<string, Handler>();

  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  registerStatsIpcHandlers({
    ipcMain,
    db: dbReady ? ({} as never) : null,
    logger: {
      info: () => {},
      warn: () => {},
      error: () => {},
      debug: () => {},
    } as never,
  });

  return {
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
  await runScenario("S1 DB 未就绪时返回 DB_ERROR", async () => {
    const harness = createHarness(false);

    const range = await harness.invoke<{
      ok: boolean;
      error?: { code: string; message: string };
    }>("stats:range:get", { from: "2026-01-01", to: "2026-01-02" });

    assert.equal(range.ok, false);
    assert.equal(range.error?.code, "DB_ERROR");
    assert.equal(range.error?.message, "Database not ready");
  });

  await runScenario("S2 from 非法格式应被拦截", async () => {
    const harness = createHarness(true);

    const res = await harness.invoke<{
      ok: boolean;
      error?: { code: string; message: string };
    }>("stats:range:get", { from: "2026/01/01", to: "2026-01-02" });

    assert.equal(res.ok, false);
    assert.equal(res.error?.code, "INVALID_ARGUMENT");
    assert.equal(res.error?.message, "from must be YYYY-MM-DD");
  });

  await runScenario("S3 to 非法格式应被拦截", async () => {
    const harness = createHarness(true);

    const res = await harness.invoke<{
      ok: boolean;
      error?: { code: string; message: string };
    }>("stats:range:get", { from: "2026-01-01", to: "2026/01/02" });

    assert.equal(res.ok, false);
    assert.equal(res.error?.code, "INVALID_ARGUMENT");
    assert.equal(res.error?.message, "to must be YYYY-MM-DD");
  });

  await runScenario("S4 from 晚于 to 应被拦截", async () => {
    const harness = createHarness(true);

    const res = await harness.invoke<{
      ok: boolean;
      error?: { code: string; message: string };
    }>("stats:range:get", { from: "2026-01-03", to: "2026-01-02" });

    assert.equal(res.ok, false);
    assert.equal(res.error?.code, "INVALID_ARGUMENT");
    assert.equal(res.error?.message, "from must be <= to");
  });
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
