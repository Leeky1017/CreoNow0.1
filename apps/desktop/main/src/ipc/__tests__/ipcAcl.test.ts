import assert from "node:assert/strict";

import type { IpcMainInvokeEvent } from "electron";

import { s } from "../contract/schema";
import { wrapIpcRequestResponse } from "../runtime-validation";
import type { IpcResponse } from "@shared/types/ipc-generated";

type TestLogger = {
  info: (event: string, data?: Record<string, unknown>) => void;
  error: (event: string, data?: Record<string, unknown>) => void;
};

function createLogger(): TestLogger {
  return {
    info: () => undefined,
    error: () => undefined,
  };
}

function createEvent(url: string, webContentsId = 1): IpcMainInvokeEvent {
  return {
    senderFrame: { url },
    sender: { id: webContentsId },
  } as unknown as IpcMainInvokeEvent;
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

async function invokeWrapped(args: {
  event: IpcMainInvokeEvent;
  channel: string;
}): Promise<IpcResponse<unknown>> {
  const wrapped = wrapIpcRequestResponse({
    channel: args.channel,
    requestSchema: s.object({}),
    responseSchema: s.object({ ok: s.literal(true) }),
    logger: createLogger(),
    timeoutMs: 5_000,
    handler: async () => ({
      ok: true,
      data: { ok: true },
    }),
  });

  return (await wrapped(args.event, {})) as IpcResponse<unknown>;
}

async function main(): Promise<void> {
  await runScenario(
    "SIA-S1 should reject non-allowlisted origin with FORBIDDEN/origin_not_allowed",
    async () => {
      const response = await invokeWrapped({
        event: createEvent("https://evil.com"),
        channel: "file:document:list",
      });

      assert.equal(response.ok, false);
      if (response.ok) {
        assert.fail("expected FORBIDDEN response");
      }
      assert.equal(response.error.code, "FORBIDDEN");
      assert.equal(
        (response.error.details as { reason?: string } | undefined)?.reason,
        "origin_not_allowed",
      );
    },
  );

  await runScenario("SIA-S2 should allow localhost dev origin", async () => {
    const response = await invokeWrapped({
      event: createEvent("http://localhost:5173/index.html"),
      channel: "file:document:list",
    });

    assert.equal(response.ok, true);
  });

  await runScenario(
    "SIA-S2 should allow VITE_DEV_SERVER_URL origin",
    async () => {
      const response = await invokeWrapped({
        event: createEvent("http://127.0.0.1:4173/editor"),
        channel: "file:document:list",
      });

      assert.equal(response.ok, true);
    },
  );

  await runScenario("SIA-S2 should allow production file origin", async () => {
    const response = await invokeWrapped({
      event: createEvent("file:///Applications/CreoNow/index.html"),
      channel: "file:document:list",
    });

    assert.equal(response.ok, true);
  });

  await runScenario("SIA-S2 should allow about:blank for non-privileged channels", async () => {
    const response = await invokeWrapped({
      event: createEvent("about:blank"),
      channel: "project:project:create",
    });

    assert.equal(response.ok, true);
  });
}

process.env.VITE_DEV_SERVER_URL = "http://127.0.0.1:4173";

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
