import { describe, expect, it, vi } from "vitest";

import type {
  IpcChannel,
  IpcErrorCode,
  IpcInvokeResult,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import { createEditorStore, type IpcInvoke } from "./editorStore";

function ok<C extends IpcChannel>(
  _channel: C,
  data: IpcResponseData<C>,
): IpcInvokeResult<C> {
  return { ok: true, data };
}

function err<C extends IpcChannel>(
  _channel: C,
  code: IpcErrorCode,
  message: string,
): IpcInvokeResult<C> {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}

function createReadPayload(
  documentId: string,
  projectId = "project-1",
): IpcResponseData<"file:document:read"> {
  return {
    documentId,
    projectId,
    title: "Doc",
    type: "chapter",
    status: "draft",
    parentId: undefined,
    sortOrder: 0,
    contentJson: JSON.stringify({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello" }] },
      ],
    }),
    contentMd: "Hello",
    contentText: "Hello",
    contentHash: "hash-1",
    createdAt: 1,
    updatedAt: 2,
  };
}

describe("editorStore bootstrap and autosave scenarios", () => {
  it("should bootstrap existing project with current document", async () => {
    const calls: string[] = [];
    const invoke: IpcInvoke = async (channel, _payload) => {
      calls.push(channel);
      if (channel === "file:document:getcurrent") {
        return ok(channel, { documentId: "doc-current" });
      }
      if (channel === "file:document:read") {
        return ok(channel, createReadPayload("doc-current"));
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createEditorStore({ invoke });
    await store.getState().bootstrapForProject("project-1");

    const state = store.getState();
    expect(calls).toEqual(["file:document:getcurrent", "file:document:read"]);
    expect(state.bootstrapStatus).toBe("ready");
    expect(state.projectId).toBe("project-1");
    expect(state.documentId).toBe("doc-current");
    expect(state.documentStatus).toBe("draft");
  });

  it("should bootstrap by creating a document when project has no documents", async () => {
    const calls: string[] = [];
    const invoke: IpcInvoke = async (channel, _payload) => {
      calls.push(channel);
      if (channel === "file:document:getcurrent") {
        return err(channel, "NOT_FOUND", "no current document");
      }
      if (channel === "file:document:list") {
        return ok(channel, { items: [] });
      }
      if (channel === "file:document:create") {
        return ok(channel, { documentId: "doc-created" });
      }
      if (channel === "file:document:setcurrent") {
        return ok(channel, { documentId: "doc-created" });
      }
      if (channel === "file:document:read") {
        return ok(channel, createReadPayload("doc-created"));
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createEditorStore({ invoke });
    await store.getState().bootstrapForProject("project-1");

    const state = store.getState();
    expect(calls).toEqual([
      "file:document:getcurrent",
      "file:document:list",
      "file:document:create",
      "file:document:setcurrent",
      "file:document:read",
    ]);
    expect(state.bootstrapStatus).toBe("ready");
    expect(state.documentId).toBe("doc-created");
  });

  it("should set bootstrap status to error when IPC bootstrap fails", async () => {
    const invoke: IpcInvoke = async (channel, _payload) => {
      if (channel === "file:document:getcurrent") {
        return err(channel, "INTERNAL_ERROR", "main process unavailable");
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createEditorStore({ invoke });
    await store.getState().bootstrapForProject("project-1");

    expect(store.getState().bootstrapStatus).toBe("error");
    expect(store.getState().documentId).toBeNull();
  });

  it("should transition autosave to error on failure and recover through retry", async () => {
    let saveAttempt = 0;
    const invoke: IpcInvoke = async (channel, _payload) => {
      if (channel !== "file:document:save") {
        throw new Error(`Unexpected channel: ${channel}`);
      }
      saveAttempt += 1;
      if (saveAttempt === 1) {
        return err(channel, "IO_ERROR", "disk busy");
      }
      return ok(channel, {
        contentHash: "hash-after-retry",
        updatedAt: 3,
      });
    };

    const store = createEditorStore({ invoke });
    store.setState({
      projectId: "project-1",
      documentId: "doc-1",
      lastSavedOrQueuedJson: JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Retry" }] },
        ],
      }),
      autosaveStatus: "idle",
      autosaveError: null,
    });

    await store.getState().save({
      projectId: "project-1",
      documentId: "doc-1",
      contentJson: store.getState().lastSavedOrQueuedJson ?? "",
      actor: "auto",
      reason: "autosave",
    });
    expect(store.getState().autosaveStatus).toBe("error");
    expect(store.getState().autosaveError?.code).toBe("IO_ERROR");

    await store.getState().retryLastAutosave();
    expect(store.getState().autosaveStatus).toBe("saved");
    expect(store.getState().autosaveError).toBeNull();
    expect(saveAttempt).toBe(2);
  });

  it("should prioritize manual-save over queued autosave requests in the same write queue", async () => {
    const callOrder: string[] = [];
    let releaseFirstAutosave = (): void => {};
    const firstAutosaveGate = new Promise<void>((resolve) => {
      releaseFirstAutosave = () => resolve();
    });

    const invoke: IpcInvoke = async (channel, payload) => {
      if (channel !== "file:document:save") {
        throw new Error(`Unexpected channel: ${channel}`);
      }

      const request = payload as { reason: "autosave" | "manual-save" };
      callOrder.push(request.reason);
      if (callOrder.length === 1) {
        await firstAutosaveGate;
      }

      return ok(channel, {
        contentHash: `hash-${callOrder.length}`,
        updatedAt: callOrder.length,
      });
    };

    const store = createEditorStore({ invoke });
    store.setState({
      projectId: "project-1",
      documentId: "doc-1",
      autosaveStatus: "idle",
      autosaveError: null,
      lastSavedOrQueuedJson: JSON.stringify({
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "v1" }] },
        ],
      }),
    });

    const auto1 = store.getState().save({
      projectId: "project-1",
      documentId: "doc-1",
      contentJson: '{"v":1}',
      actor: "auto",
      reason: "autosave",
    });
    const auto2 = store.getState().save({
      projectId: "project-1",
      documentId: "doc-1",
      contentJson: '{"v":2}',
      actor: "auto",
      reason: "autosave",
    });
    const manual = store.getState().save({
      projectId: "project-1",
      documentId: "doc-1",
      contentJson: '{"v":3}',
      actor: "user",
      reason: "manual-save",
    });

    await vi.waitFor(() => {
      expect(callOrder).toEqual(["autosave"]);
    });
    releaseFirstAutosave();

    await Promise.all([auto1, auto2, manual]);

    expect(callOrder).toEqual(["autosave", "manual-save", "autosave"]);
    expect(store.getState().autosaveStatus).toBe("saved");
    expect(store.getState().autosaveError).toBeNull();
  });
  it("should ignore stale bootstrap responses after rapid project switch", async () => {
    type Deferred<T> = {
      promise: Promise<T>;
      resolve: (value: T) => void;
    };

    function deferred<T>(): Deferred<T> {
      let resolve!: (value: T) => void;
      const promise = new Promise<T>((res) => {
        resolve = res;
      });
      return { promise, resolve };
    }

    const pendingCurrentByProject = new Map<
      string,
      Deferred<IpcInvokeResult<"file:document:getcurrent">>
    >([
      ["project-a", deferred<IpcInvokeResult<"file:document:getcurrent">>()],
      ["project-b", deferred<IpcInvokeResult<"file:document:getcurrent">>()],
    ]);

    const invoke: IpcInvoke = async (channel, payload) => {
      if (channel === "file:document:getcurrent") {
        const request = payload as { projectId: string };
        const pending = pendingCurrentByProject.get(request.projectId);
        if (!pending) {
          throw new Error("Unexpected projectId: " + request.projectId);
        }
        return await pending.promise;
      }

      if (channel === "file:document:read") {
        const request = payload as { projectId: string; documentId: string };
        return ok(
          channel,
          createReadPayload(request.documentId, request.projectId),
        );
      }

      throw new Error("Unexpected channel: " + channel);
    };

    const store = createEditorStore({ invoke });

    const firstBootstrap = store.getState().bootstrapForProject("project-a");
    await vi.waitFor(() => {
      expect(store.getState().projectId).toBe("project-a");
      expect(store.getState().bootstrapStatus).toBe("loading");
    });

    const secondBootstrap = store.getState().bootstrapForProject("project-b");
    await vi.waitFor(() => {
      expect(store.getState().projectId).toBe("project-b");
      expect(store.getState().bootstrapStatus).toBe("loading");
    });

    pendingCurrentByProject
      .get("project-b")!
      .resolve(ok("file:document:getcurrent", { documentId: "doc-b" }));
    await secondBootstrap;

    expect(store.getState().documentId).toBe("doc-b");

    pendingCurrentByProject
      .get("project-a")!
      .resolve(ok("file:document:getcurrent", { documentId: "doc-a" }));
    await firstBootstrap;

    const state = store.getState();
    expect(state.projectId).toBe("project-b");
    expect(state.documentId).toBe("doc-b");
    expect(state.bootstrapStatus).toBe("ready");
  });

  it("should set documentCoverImageUrl from file:document:read response", async () => {
    const invoke: IpcInvoke = async (channel, _payload) => {
      if (channel === "file:document:getcurrent") {
        return ok(channel, { documentId: "doc-cover" });
      }
      if (channel === "file:document:read") {
        return ok(channel, {
          ...createReadPayload("doc-cover"),
          coverImageUrl: "https://example.com/cover.jpg",
        });
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createEditorStore({ invoke });
    await store.getState().bootstrapForProject("project-1");

    expect(store.getState().documentCoverImageUrl).toBe(
      "https://example.com/cover.jpg",
    );
  });

  it("should set documentCoverImageUrl to null when response has no coverImageUrl", async () => {
    const invoke: IpcInvoke = async (channel, _payload) => {
      if (channel === "file:document:getcurrent") {
        return ok(channel, { documentId: "doc-no-cover" });
      }
      if (channel === "file:document:read") {
        return ok(channel, createReadPayload("doc-no-cover"));
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createEditorStore({ invoke });
    await store.getState().bootstrapForProject("project-1");

    expect(store.getState().documentCoverImageUrl).toBeNull();
  });
});
