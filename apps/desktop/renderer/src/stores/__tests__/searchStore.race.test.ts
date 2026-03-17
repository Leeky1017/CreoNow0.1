import { describe, expect, it, vi } from "vitest";

import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import { createSearchStore, type IpcInvoke } from "../searchStore";

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

function createSearchResponse(
  query: string,
): IpcResponseData<"search:fts:query"> {
  return {
    total: 1,
    hasMore: false,
    indexState: "ready",
    results: [
      {
        projectId: "project-1",
        documentId: `doc-${query}`,
        documentTitle: `Doc ${query}`,
        documentType: "chapter",
        snippet: `snippet-${query}`,
        score: 0.95,
        updatedAt: 1,
        anchor: { start: 0, end: query.length },
        highlights: [{ start: 0, end: query.length }],
      },
    ],
  };
}

describe("searchStore race scenarios", () => {
  it("forwards scope to search IPC payload", async () => {
    const invoke: IpcInvoke = async (channel, payload) => {
      if (channel !== "search:fts:query") {
        throw new Error(`Unexpected channel: ${channel}`);
      }
      expect(payload).toMatchObject({
        projectId: "project-1",
        query: "alpha",
        scope: "all",
      } satisfies Partial<IpcRequest<"search:fts:query">>);

      return ok("search:fts:query", createSearchResponse("alpha"));
    };

    const store = createSearchStore({ invoke });
    store.getState().setQuery("alpha");
    store.getState().setScope("all");

    await store.getState().runFulltext({ projectId: "project-1", limit: 20 });

    expect(store.getState().status).toBe("ready");
    expect(store.getState().items).toHaveLength(1);
  });

  it("WB-S2-SRF-S2 prevents stale search results from overriding latest query", async () => {
    const pendingByQuery = new Map<
      string,
      Deferred<IpcInvokeResult<"search:fts:query">>
    >([
      ["alpha", deferred<IpcInvokeResult<"search:fts:query">>()],
      ["alpha-beta", deferred<IpcInvokeResult<"search:fts:query">>()],
    ]);

    const invoke: IpcInvoke = async (channel, payload) => {
      if (channel !== "search:fts:query") {
        throw new Error(`Unexpected channel: ${channel}`);
      }
      const request = payload as IpcRequest<"search:fts:query">;
      const pending = pendingByQuery.get(request.query);
      if (!pending) {
        throw new Error(`Unexpected query: ${request.query}`);
      }
      return await pending.promise;
    };

    const store = createSearchStore({ invoke });

    store.getState().setQuery("alpha");
    const firstRun = store.getState().runFulltext({ projectId: "project-1" });
    await vi.waitFor(() => {
      expect(store.getState().status).toBe("loading");
    });

    store.getState().setQuery("alpha-beta");
    const secondRun = store.getState().runFulltext({ projectId: "project-1" });

    pendingByQuery
      .get("alpha-beta")!
      .resolve(ok("search:fts:query", createSearchResponse("alpha-beta")));
    await secondRun;

    expect(store.getState().items.map((item) => item.snippet)).toEqual([
      "snippet-alpha-beta",
    ]);

    pendingByQuery
      .get("alpha")!
      .resolve(ok("search:fts:query", createSearchResponse("alpha")));
    await firstRun;

    const state = store.getState();
    expect(state.query).toBe("alpha-beta");
    expect(state.status).toBe("ready");
    expect(state.items.map((item) => item.snippet)).toEqual([
      "snippet-alpha-beta",
    ]);
    expect(state.lastError).toBeNull();
  });

  it("WB-S2-SRF-S3 converts invoke throw into stable error state", async () => {
    const invoke: IpcInvoke = async () => {
      throw new Error("search backend unavailable");
    };

    const store = createSearchStore({ invoke });
    store.getState().setQuery("alpha");

    await expect(
      store.getState().runFulltext({ projectId: "project-1" }),
    ).resolves.toBeUndefined();

    const state = store.getState();
    expect(state.status).toBe("error");
    expect(state.items).toEqual([]);
    expect(state.total).toBe(0);
    expect(state.hasMore).toBe(false);
    expect(state.lastError).toMatchObject({
      code: "INTERNAL",
      message: "Search request failed",
      details: {
        message: "search backend unavailable",
      },
    });
  });
});
