import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import { registerSkillIpcHandlers } from "../skills";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

function createHarness() {
  const handlers = new Map<string, Handler>();

  const ipcMain = {
    handle: (channel: string, handler: Handler) => {
      handlers.set(channel, handler);
    },
  } as unknown as IpcMain;

  registerSkillIpcHandlers({
    ipcMain,
    db: {} as never,
    userDataDir: "/tmp/user",
    builtinSkillsDir: "/tmp/builtin",
    logger: {
      logPath: "<test>",
      info: () => {},
      error: () => {},
    },
  });

  return handlers;
}

async function main(): Promise<void> {
  const handlers = createHarness();

  const listHandler = handlers.get("skill:registry:list");
  assert.ok(listHandler, "skill:registry:list should be registered");
  const listResponse = (await listHandler?.({}, undefined)) as {
    ok: boolean;
    error?: { code: string };
  };
  assert.equal(listResponse.ok, false);
  assert.equal(listResponse.error?.code, "INVALID_ARGUMENT");

  const readHandler = handlers.get("skill:registry:read");
  assert.ok(readHandler, "skill:registry:read should be registered");
  const readResponse = (await readHandler?.({}, null)) as {
    ok: boolean;
    error?: { code: string };
  };
  assert.equal(readResponse.ok, false);
  assert.equal(readResponse.error?.code, "INVALID_ARGUMENT");

  const toggleHandler = handlers.get("skill:registry:toggle");
  assert.ok(toggleHandler, "skill:registry:toggle should be registered");
  const toggleResponse = (await toggleHandler?.({}, { enabled: "yes" })) as {
    ok: boolean;
    error?: { code: string };
  };
  assert.equal(toggleResponse.ok, false);
  assert.equal(toggleResponse.error?.code, "INVALID_ARGUMENT");
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
