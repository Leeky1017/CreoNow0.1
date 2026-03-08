import { describe, expect, it, vi, beforeEach } from "vitest";
import type { IpcMain, IpcMainInvokeEvent } from "electron";

import type { IpcResponse } from "@shared/types/ipc-generated";
import { MAX_DOCUMENT_SIZE_BYTES } from "../../services/documents/documentCoreService";

/**
 * S-SIZE-1 ~ S-SIZE-5: 文档 5 MB 大小限制 — IPC 层拦截
 *
 * 策略：直接调用 registerFileIpcHandlers 注入 fake ipcMain，
 * 捕获 handler 后传入不同大小的 contentJson 验证行为。
 */

/* ---------- helpers ---------- */

function makeContentJson(targetBytes: number): string {
  // Build a valid JSON string with specified byte length
  // JSON.stringify("xxx") → "\"xxx\"" which is the raw string with quotes
  // We produce raw JSON text: a quoted string
  const overhead = 2; // opening and closing quote marks
  const fillLength = targetBytes - overhead;
  if (fillLength <= 0) return '""';
  const char = "x";
  let payload = '"' + char.repeat(fillLength) + '"';
  let actual = Buffer.byteLength(payload, "utf-8");
  // Adjust if needed
  while (actual > targetBytes && fillLength > 0) {
    payload = '"' + char.repeat(fillLength - (actual - targetBytes)) + '"';
    actual = Buffer.byteLength(payload, "utf-8");
  }
  return payload;
}

type SavePayload = {
  projectId: string;
  documentId: string;
  contentJson: string;
  actor: "user" | "auto";
  reason: "manual-save" | "autosave";
};

type SaveHandler = (
  event: IpcMainInvokeEvent,
  payload: SavePayload,
) => Promise<IpcResponse<{ updatedAt: number; contentHash: string }>>;

/* ---------- test setup ---------- */

let saveHandler: SaveHandler | undefined;

function createFakeIpcMain(): IpcMain & { _handlers: Map<string, SaveHandler> } {
  const handlers = new Map<string, SaveHandler>();
  return {
    handle: (channel: string, handler: SaveHandler) => {
      handlers.set(channel, handler);
    },
    _handlers: handlers,
  } as unknown as IpcMain & { _handlers: Map<string, SaveHandler> };
}

const fakeLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

const fakeEvent = {} as IpcMainInvokeEvent;

function baseSavePayload(contentJson: string): SavePayload {
  return {
    projectId: "proj-1",
    documentId: "doc-1",
    contentJson,
    actor: "user",
    reason: "manual-save",
  };
}

/* ---------- tests ---------- */

describe("file:document:save — 文档大小限制", () => {
  beforeEach(async () => {
    vi.resetModules();
    const { registerFileIpcHandlers } = await import("../file");
    const fakeIpc = createFakeIpcMain();

    // db=null triggers early "DB not ready" for small docs, but
    // size check should happen before DB access for large docs
    registerFileIpcHandlers({
      ipcMain: fakeIpc,
      db: null as never,
      logger: fakeLogger as never,
    });

    saveHandler = fakeIpc._handlers.get("file:document:save");
  });

  it("AC-2: 7.3 MB 文档返回 DOCUMENT_SIZE_EXCEEDED", async () => {
    const sevenMB = Math.ceil(7.3 * 1024 * 1024);
    const contentJson = makeContentJson(sevenMB);
    expect(Buffer.byteLength(contentJson, "utf-8")).toBeGreaterThan(MAX_DOCUMENT_SIZE_BYTES);

    const result = await saveHandler!(fakeEvent, baseSavePayload(contentJson));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DOCUMENT_SIZE_EXCEEDED");
      expect(result.error.message).toMatch(/7\.3\s*MB/u);
    }
  });

  it("AC-2 边界值: 5,242,881 字节被拦截", async () => {
    const contentJson = makeContentJson(MAX_DOCUMENT_SIZE_BYTES + 1);
    expect(Buffer.byteLength(contentJson, "utf-8")).toBeGreaterThan(MAX_DOCUMENT_SIZE_BYTES);

    const result = await saveHandler!(fakeEvent, baseSavePayload(contentJson));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DOCUMENT_SIZE_EXCEEDED");
    }
  });

  it("AC-3: autosave 6 MB 同样被拦截", async () => {
    const sixMB = 6 * 1024 * 1024;
    const contentJson = makeContentJson(sixMB);

    const result = await saveHandler!(fakeEvent, {
      ...baseSavePayload(contentJson),
      actor: "auto",
      reason: "autosave",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DOCUMENT_SIZE_EXCEEDED");
    }
  });

  it("AC-5: 中文多字节字符体积计算使用字节而非字符数", async () => {
    // 1,747,627 个中文字符 ≈ 5.24 MB UTF-8（每字 3 字节）
    // string.length ≈ 1.7M 但字节数 > 5 MB → 应被拦截
    const charCount = 1_747_627;
    const payload = "中".repeat(charCount);
    const contentJson = JSON.stringify(payload);
    const byteSize = Buffer.byteLength(contentJson, "utf-8");

    expect(byteSize).toBeGreaterThan(MAX_DOCUMENT_SIZE_BYTES);
    expect(contentJson.length).toBeLessThan(MAX_DOCUMENT_SIZE_BYTES);

    const result = await saveHandler!(fakeEvent, baseSavePayload(contentJson));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DOCUMENT_SIZE_EXCEEDED");
    }
  });

  it("AC-1: 正常大小文档不触发 DOCUMENT_SIZE_EXCEEDED（被 DB_ERROR 而非体积拦截）", async () => {
    // db=null 时，小文档应走到 DB 检查而非体积拦截
    const smallJson = JSON.stringify({ type: "doc", content: [] });
    const result = await saveHandler!(fakeEvent, baseSavePayload(smallJson));
    // 应该返回 DB_ERROR（因为 db=null），而不是 DOCUMENT_SIZE_EXCEEDED
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("DB_ERROR");
    }
  });

  it("AC-2 边界值: 恰好 5,242,880 字节不触发 DOCUMENT_SIZE_EXCEEDED", async () => {
    const contentJson = makeContentJson(MAX_DOCUMENT_SIZE_BYTES);
    expect(Buffer.byteLength(contentJson, "utf-8")).toBe(MAX_DOCUMENT_SIZE_BYTES);

    const result = await saveHandler!(fakeEvent, baseSavePayload(contentJson));
    // Should NOT be DOCUMENT_SIZE_EXCEEDED — should pass through to DB check
    if (!result.ok) {
      expect(result.error.code).not.toBe("DOCUMENT_SIZE_EXCEEDED");
    }
  });

  it("AC-5: 相同字符数的 ASCII 内容在限制内不触发 DOCUMENT_SIZE_EXCEEDED", async () => {
    // 1,747,627 个 ASCII 字符 ≈ 1.7 MB → 不应触发体积限制
    const charCount = 1_747_627;
    const payload = "a".repeat(charCount);
    const contentJson = JSON.stringify(payload);

    expect(Buffer.byteLength(contentJson, "utf-8")).toBeLessThan(MAX_DOCUMENT_SIZE_BYTES);

    const result = await saveHandler!(fakeEvent, baseSavePayload(contentJson));
    if (!result.ok) {
      expect(result.error.code).not.toBe("DOCUMENT_SIZE_EXCEEDED");
    }
  });
});
