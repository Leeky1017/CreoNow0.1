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

function createEvent(
  url: string | null | undefined,
  webContentsId: number,
): IpcMainInvokeEvent {
  return {
    senderFrame: url == null ? undefined : { url },
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

function assertOriginNotAllowed(response: IpcResponse<unknown>): void {
  assert.equal(response.ok, false);
  if (response.ok) {
    assert.fail("expected FORBIDDEN response");
  }
  assert.equal(response.error.code, "FORBIDDEN");
  assert.equal(
    (response.error.details as { reason?: string } | undefined)?.reason,
    "origin_not_allowed",
  );
}

async function main(): Promise<void> {
  await runScenario(
    "SIA-S3 should block disallowed caller before handler execution",
    async () => {
      let called = false;

      const wrapped = wrapIpcRequestResponse({
        channel: "db:debug:tablenames",
        requestSchema: s.object({}),
        responseSchema: s.object({ tableNames: s.array(s.string()) }),
        logger: createLogger(),
        timeoutMs: 5_000,
        handler: async () => {
          called = true;
          return { ok: true, data: { tableNames: ["projects"] } };
        },
      });

      const response = (await wrapped(
        createEvent("https://evil.com/admin", -1),
        {},
      )) as IpcResponse<unknown>;

      assert.equal(called, false);
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
  await runScenario(
    "SIA-S4 should block privileged channel when sender origin is missing",
    async () => {
      let called = false;

      const wrapped = wrapIpcRequestResponse({
        channel: "db:debug:tablenames",
        requestSchema: s.object({}),
        responseSchema: s.object({ tableNames: s.array(s.string()) }),
        logger: createLogger(),
        timeoutMs: 5_000,
        handler: async () => {
          called = true;
          return { ok: true, data: { tableNames: ["projects"] } };
        },
      });

      const response = (await wrapped(
        createEvent(undefined, 1),
        {},
      )) as IpcResponse<unknown>;

      assert.equal(called, false);
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

  await runScenario(
    "SIA-S4 should block privileged channel when sender origin is about:blank",
    async () => {
      let called = false;

      const wrapped = wrapIpcRequestResponse({
        channel: "db:debug:tablenames",
        requestSchema: s.object({}),
        responseSchema: s.object({ tableNames: s.array(s.string()) }),
        logger: createLogger(),
        timeoutMs: 5_000,
        handler: async () => {
          called = true;
          return { ok: true, data: { tableNames: ["projects"] } };
        },
      });

      const response = (await wrapped(
        createEvent("about:blank", 1),
        {},
      )) as IpcResponse<unknown>;

      assert.equal(called, false);
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

  const aboutBlankChannelMatrix = [
    { channel: "file:document:list", shouldAllow: true },
    { channel: "context:assemble", shouldAllow: true },
    { channel: "projective:project:create", shouldAllow: true },
    { channel: "versioning:snapshot:create", shouldAllow: true },
    { channel: "exporter:document:markdown", shouldAllow: true },
    { channel: "project:project:create", shouldAllow: false },
    { channel: "version:snapshot:create", shouldAllow: false },
    { channel: "export:document:markdown", shouldAllow: false },
  ] as const;
  for (const entry of aboutBlankChannelMatrix) {
    await runScenario(
      `SIA-S4 about:blank matrix should ${entry.shouldAllow ? "allow" : "block"} ${entry.channel}`,
      async () => {
        let called = false;

        const wrapped = wrapIpcRequestResponse({
          channel: entry.channel,
          requestSchema: s.object({}),
          responseSchema: s.object({ ok: s.literal(true) }),
          logger: createLogger(),
          timeoutMs: 5_000,
          handler: async () => {
            called = true;
            return { ok: true, data: { ok: true } };
          },
        });

        const response = (await wrapped(
          createEvent("about:blank", 1),
          {},
        )) as IpcResponse<unknown>;

        if (entry.shouldAllow) {
          assert.equal(called, true);
          assert.equal(response.ok, true);
          return;
        }

        assert.equal(called, false);
        assertOriginNotAllowed(response);
      },
    );
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
