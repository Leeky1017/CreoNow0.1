import assert from "node:assert/strict";

import { s } from "../../main/src/ipc/contract/schema";
import { wrapIpcRequestResponse } from "../../main/src/ipc/runtime-validation";
import type { IpcResponse } from "@shared/types/ipc-generated";

type TestLogger = {
  info: (event: string, data?: Record<string, unknown>) => void;
  error: (event: string, data?: Record<string, unknown>) => void;
  errors: Array<{ event: string; data?: Record<string, unknown> }>;
};

/**
 * Build a deterministic logger spy for runtime wrapper tests.
 */
function createTestLogger(): TestLogger {
  const errors: Array<{ event: string; data?: Record<string, unknown> }> = [];

  return {
    info: () => undefined,
    error: (event, data) => {
      errors.push({ event, data });
    },
    errors,
  };
}

/**
 * Invoke wrapped IPC listener with a minimal synthetic event for unit tests.
 */
async function invokeWrapped(
  wrapped: ReturnType<typeof wrapIpcRequestResponse>,
  payload: unknown,
): Promise<IpcResponse<unknown>> {
  return (await wrapped(
    {
      senderFrame: { url: "file:///index.html" },
      sender: { id: 1 },
    } as Parameters<typeof wrapped>[0],
    payload,
  )) as IpcResponse<unknown>;
}

// S2: 请求校验失败时业务逻辑不执行 [ADDED]
{
  const logger = createTestLogger();
  let called = false;

  const wrapped = wrapIpcRequestResponse({
    channel: "test:request:invalid",
    requestSchema: s.object({ title: s.string() }),
    responseSchema: s.object({ ok: s.literal(true) }),
    logger,
    timeoutMs: 30_000,
    handler: async (_event, _payload) => {
      called = true;
      return { ok: true, data: { ok: true } };
    },
  });

  const res = await invokeWrapped(wrapped, { title: 123 });
  assert.equal(called, false);
  assert.equal(res.ok, false);
  if (res.ok) {
    assert.fail("expected error envelope");
  }
  assert.equal(res.error.code, "VALIDATION_ERROR");
  assert.equal(Array.isArray(res.error.details), true);
}

// S1: Request-Response 返回非 envelope 被判定为协议错误 [ADDED]
{
  const logger = createTestLogger();

  const wrapped = wrapIpcRequestResponse({
    channel: "test:response:non-envelope",
    requestSchema: s.object({}),
    responseSchema: s.object({ id: s.string() }),
    logger,
    timeoutMs: 30_000,
    handler: async () => ({ id: "doc-1" }),
  });

  const res = await invokeWrapped(wrapped, {});
  assert.equal(res.ok, false);
  if (res.ok) {
    assert.fail("expected error envelope");
  }
  assert.equal(res.error.code, "INTERNAL_ERROR");
  assert.equal(
    logger.errors.some((entry) => entry.event === "ipc_protocol_violation"),
    true,
  );
}

// S3: 响应校验失败时返回结构化错误 [ADDED]
{
  const logger = createTestLogger();

  const wrapped = wrapIpcRequestResponse({
    channel: "test:response:invalid-schema",
    requestSchema: s.object({}),
    responseSchema: s.object({ id: s.string() }),
    logger,
    timeoutMs: 30_000,
    handler: async () => ({ ok: true, data: { id: 123 } }),
  });

  const res = await invokeWrapped(wrapped, {});
  assert.equal(res.ok, false);
  if (res.ok) {
    assert.fail("expected error envelope");
  }
  assert.equal(res.error.code, "INTERNAL_ERROR");
  assert.equal(res.error.message, "Response payload does not match IPC contract");
}

// S4: 未捕获异常统一映射为 INTERNAL_ERROR [ADDED]
{
  const logger = createTestLogger();

  const wrapped = wrapIpcRequestResponse({
    channel: "test:error:unknown",
    requestSchema: s.object({}),
    responseSchema: s.object({ ok: s.literal(true) }),
    logger,
    timeoutMs: 30_000,
    handler: async () => {
      throw new Error("secret-stack-should-not-leak");
    },
  });

  const res = await invokeWrapped(wrapped, {});
  assert.equal(res.ok, false);
  if (res.ok) {
    assert.fail("expected error envelope");
  }
  assert.equal(res.error.code, "INTERNAL_ERROR");
  assert.equal(res.error.message, "Internal error");
  assert.equal(
    JSON.stringify(res).includes("secret-stack-should-not-leak"),
    false,
  );
}

// S5: 超时触发后返回 IPC_TIMEOUT 并执行清理 [ADDED]
{
  const logger = createTestLogger();
  let cleaned = false;

  const wrapped = wrapIpcRequestResponse({
    channel: "test:timeout:cleanup",
    requestSchema: s.object({}),
    responseSchema: s.object({ ok: s.literal(true) }),
    logger,
    timeoutMs: 10,
    onTimeoutCleanup: async () => {
      cleaned = true;
    },
    handler: async () =>
      await new Promise((resolve) => {
        setTimeout(() => resolve({ ok: true, data: { ok: true } }), 50);
      }),
  });

  const res = await invokeWrapped(wrapped, {});
  assert.equal(res.ok, false);
  if (res.ok) {
    assert.fail("expected error envelope");
  }
  assert.equal(res.error.code, "IPC_TIMEOUT");
  assert.equal(cleaned, true);
}
