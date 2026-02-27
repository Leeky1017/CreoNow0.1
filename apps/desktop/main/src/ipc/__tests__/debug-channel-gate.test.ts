import assert from "node:assert/strict";

import type Database from "better-sqlite3";
import type { IpcMain } from "electron";

import type { Logger } from "../../logging/logger";
import { registerDbDebugIpcHandlers } from "../debugChannelGate";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

function createLogger(): Logger {
  return {
    logPath: "<test>",
    info: () => undefined,
    error: () => undefined,
  };
}

function createDb(tableNames: string[]): Database.Database {
  return {
    prepare: () => ({
      all: () => tableNames.map((name) => ({ name })),
    }),
  } as unknown as Database.Database;
}

function createHarness(args: {
  env: NodeJS.ProcessEnv;
  tableNames: string[];
}): {
  handlers: Map<string, Handler>;
  ipcMain: IpcMain;
  db: Database.Database;
  logger: Logger;
  env: NodeJS.ProcessEnv;
} {
  const handlers = new Map<string, Handler>();
  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  return {
    handlers,
    ipcMain,
    db: createDb(args.tableNames),
    logger: createLogger(),
    env: args.env,
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
    "IPC-S2-DBG-S1 production 环境不注册 debug 通道",
    async () => {
      const harness = createHarness({
        env: { NODE_ENV: "production" },
        tableNames: ["zeta", "alpha"],
      });

      registerDbDebugIpcHandlers({
        ipcMain: harness.ipcMain,
        db: harness.db,
        logger: harness.logger,
        env: harness.env,
      });

      assert.equal(harness.handlers.has("db:debug:tablenames"), false);
    },
  );

  await runScenario(
    "IPC-S2-DBG-S2 缺失 NODE_ENV 默认 fail-closed",
    async () => {
      const harness = createHarness({
        env: {},
        tableNames: ["zeta", "alpha"],
      });

      registerDbDebugIpcHandlers({
        ipcMain: harness.ipcMain,
        db: harness.db,
        logger: harness.logger,
        env: harness.env,
      });

      assert.equal(harness.handlers.has("db:debug:tablenames"), false);
    },
  );

  await runScenario(
    "IPC-S2-DBG-S3 non-production 环境保留调试能力",
    async () => {
      const harness = createHarness({
        env: { NODE_ENV: "development" },
        tableNames: ["zeta", "alpha"],
      });

      registerDbDebugIpcHandlers({
        ipcMain: harness.ipcMain,
        db: harness.db,
        logger: harness.logger,
        env: harness.env,
      });

      const handler = harness.handlers.get("db:debug:tablenames");
      assert.ok(
        handler,
        "expected db:debug:tablenames handler to be registered",
      );

      const response = (await handler({}, {})) as {
        ok: boolean;
        data?: { tableNames: string[] };
      };

      assert.equal(response.ok, true);
      assert.deepEqual(response.data?.tableNames, ["alpha", "zeta"]);
    },
  );

  await runScenario(
    "IPC-S2-DBG-S4 显式开关允许测试外开启调试通道",
    async () => {
      const harness = createHarness({
        env: { CREONOW_ENABLE_DB_DEBUG: "1", NODE_ENV: "production" },
        tableNames: ["zeta", "alpha"],
      });

      registerDbDebugIpcHandlers({
        ipcMain: harness.ipcMain,
        db: harness.db,
        logger: harness.logger,
        env: harness.env,
      });

      assert.equal(harness.handlers.has("db:debug:tablenames"), true);
    },
  );

  await runScenario(
    "IPC-S2-DBG-S5 E2E 环境允许调试通道用于验收",
    async () => {
      const harness = createHarness({
        env: { CREONOW_E2E: "1", NODE_ENV: "production" },
        tableNames: ["zeta", "alpha"],
      });

      registerDbDebugIpcHandlers({
        ipcMain: harness.ipcMain,
        db: harness.db,
        logger: harness.logger,
        env: harness.env,
      });

      assert.equal(harness.handlers.has("db:debug:tablenames"), true);
    },
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
