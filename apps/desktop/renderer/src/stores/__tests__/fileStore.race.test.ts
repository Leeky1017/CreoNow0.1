import { describe, expect, it, vi } from "vitest";

import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import { createFileStore, type IpcInvoke } from "../fileStore";

function ok<C extends IpcChannel>(
  _channel: C,
  data: IpcResponseData<C>,
): IpcInvokeResult<C> {
  return { ok: true, data };
}

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

describe("fileStore race scenarios", () => {
  it("WB-S2-SRF-S3 ignores stale file bootstrap result after rapid project switch", async () => {
    const pendingListByProject = new Map<
      string,
      Deferred<IpcInvokeResult<"file:document:list">>
    >([
      ["project-a", deferred<IpcInvokeResult<"file:document:list">>()],
      ["project-b", deferred<IpcInvokeResult<"file:document:list">>()],
    ]);

    const invoke: IpcInvoke = async (channel, payload) => {
      if (channel === "file:document:list") {
        const request = payload as IpcRequest<"file:document:list">;
        const pending = pendingListByProject.get(request.projectId);
        if (!pending) {
          throw new Error(`Unexpected projectId: ${request.projectId}`);
        }
        return await pending.promise;
      }

      if (channel === "file:document:getcurrent") {
        const request = payload as IpcRequest<"file:document:getcurrent">;
        return ok(channel, { documentId: `doc-${request.projectId}` });
      }

      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createFileStore({ invoke });

    const firstBootstrap = store.getState().bootstrapForProject("project-a");
    await vi.waitFor(() => {
      expect(store.getState().projectId).toBe("project-a");
    });

    const secondBootstrap = store.getState().bootstrapForProject("project-b");
    await vi.waitFor(() => {
      expect(store.getState().projectId).toBe("project-b");
    });

    pendingListByProject.get("project-b")!.resolve(
      ok("file:document:list", {
        items: [
          {
            documentId: "doc-project-b",
            title: "Doc B",
            type: "chapter",
            status: "draft",
            parentId: undefined,
            sortOrder: 0,
            updatedAt: 1,
          },
        ],
      }),
    );
    await secondBootstrap;

    expect(store.getState().items.map((item) => item.documentId)).toEqual([
      "doc-project-b",
    ]);

    pendingListByProject.get("project-a")!.resolve(
      ok("file:document:list", {
        items: [
          {
            documentId: "doc-project-a",
            title: "Doc A",
            type: "chapter",
            status: "draft",
            parentId: undefined,
            sortOrder: 0,
            updatedAt: 1,
          },
        ],
      }),
    );
    await firstBootstrap;

    const state = store.getState();
    expect(state.projectId).toBe("project-b");
    expect(state.items.map((item) => item.documentId)).toEqual([
      "doc-project-b",
    ]);
    expect(state.currentDocumentId).toBe("doc-project-b");
    expect(state.bootstrapStatus).toBe("ready");
    expect(state.lastError).toBeNull();
  });
});
