import assert from "node:assert/strict";

import type { IpcMain } from "electron";

import { registerContextBudgetHandlers } from "../contextBudget";

type Handler = (event: unknown, payload: unknown) => Promise<unknown>;

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
  const handlers = new Map<string, Handler>();

  const ipcMain = {
    handle: (channel: string, listener: Handler) => {
      handlers.set(channel, listener);
    },
  } as unknown as IpcMain;

  const logger = {
    info: () => {},
    error: () => {},
  };

  registerContextBudgetHandlers({
    ipcMain,
    logger: logger as never,
    contextAssemblyService: {
      getBudgetProfile: () => ({
        version: 1,
        tokenizerId: "gpt-tokenizer",
        tokenizerVersion: "1",
        layers: {
          rules: { ratio: 0.25, minimumTokens: 50 },
          settings: { ratio: 0.25, minimumTokens: 50 },
          retrieved: { ratio: 0.25, minimumTokens: 50 },
          immediate: { ratio: 0.25, minimumTokens: 50 },
        },
      }),
      updateBudgetProfile: () => {
        throw new Error("should not be called for invalid payload");
      },
    } as never,
  });

  const updateHandler = handlers.get("context:budget:update");
  assert.ok(updateHandler, "expected context:budget:update to be registered");

  await runScenario("CB1 null payload should return INVALID_ARGUMENT", async () => {
    const response = (await updateHandler({}, null)) as {
      ok: boolean;
      error?: { code?: string };
    };

    assert.equal(response.ok, false);
    assert.equal(response.error?.code, "INVALID_ARGUMENT");
  });

  await runScenario(
    "CB2 malformed nested field should return INVALID_ARGUMENT",
    async () => {
      const response = (await updateHandler({}, {
        version: 1,
        tokenizerId: "gpt-tokenizer",
        tokenizerVersion: "1",
        layers: {
          rules: { ratio: 0.25, minimumTokens: 50 },
          settings: { ratio: 0.25, minimumTokens: 50 },
          retrieved: { ratio: 0.25, minimumTokens: "50" },
          immediate: { ratio: 0.25, minimumTokens: 50 },
        },
      })) as {
        ok: boolean;
        error?: { code?: string };
      };

      assert.equal(response.ok, false);
      assert.equal(response.error?.code, "INVALID_ARGUMENT");
    },
  );
}

void main();
