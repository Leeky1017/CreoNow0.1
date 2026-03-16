import { describe, expect, it, vi } from "vitest";

import type {
  IpcChannel,
  IpcInvokeResult,
  IpcRequest,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import { createKgStore, type IpcInvoke } from "../kgStore";

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

function createEntity(
  projectId: string,
  id: string,
): IpcResponseData<"knowledge:entity:list">["items"][number] {
  return {
    id,
    projectId,
    type: "character",
    name: `name-${id}`,
    description: "",
    attributes: {},
    aliases: [],
    aiContextLevel: "always",
    createdAt: "2026-02-14T00:00:00.000Z",
    updatedAt: "2026-02-14T00:00:00.000Z",
    version: 1,
  };
}

describe("kgStore race scenarios", () => {
  it("WB-S2-SRF-S1 ignores stale kg results after rapid project switch", async () => {
    const pendingByProject = new Map<
      string,
      Deferred<IpcInvokeResult<"knowledge:entity:list">>
    >([
      ["project-a", deferred<IpcInvokeResult<"knowledge:entity:list">>()],
      ["project-b", deferred<IpcInvokeResult<"knowledge:entity:list">>()],
    ]);

    const invoke: IpcInvoke = async (channel, payload) => {
      if (channel === "knowledge:entity:list") {
        const request = payload as IpcRequest<"knowledge:entity:list">;
        const pending = pendingByProject.get(request.projectId);
        if (!pending) {
          throw new Error(`Unexpected projectId: ${request.projectId}`);
        }
        return await pending.promise;
      }
      if (channel === "knowledge:relation:list") {
        return ok(channel, { items: [], totalCount: 0 });
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createKgStore({ invoke });

    const firstBootstrap = store.getState().bootstrapForProject("project-a");
    await vi.waitFor(() => {
      expect(store.getState().projectId).toBe("project-a");
    });

    const secondBootstrap = store.getState().bootstrapForProject("project-b");
    await vi.waitFor(() => {
      expect(store.getState().projectId).toBe("project-b");
    });

    pendingByProject.get("project-b")!.resolve(
      ok("knowledge:entity:list", {
        items: [createEntity("project-b", "entity-b")],
        totalCount: 1,
      }),
    );
    await secondBootstrap;

    expect(store.getState().entities.map((entity) => entity.id)).toEqual([
      "entity-b",
    ]);

    pendingByProject.get("project-a")!.resolve(
      ok("knowledge:entity:list", {
        items: [createEntity("project-a", "entity-a")],
        totalCount: 1,
      }),
    );
    await firstBootstrap;

    const state = store.getState();
    expect(state.projectId).toBe("project-b");
    expect(state.entities.map((entity) => entity.id)).toEqual([
      "entity-b",
    ]);
    expect(state.bootstrapStatus).toBe("ready");
    expect(state.lastError).toBeNull();
  });
});
