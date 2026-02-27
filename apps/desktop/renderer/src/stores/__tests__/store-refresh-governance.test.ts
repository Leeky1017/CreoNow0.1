import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  IpcChannel,
  IpcError,
  IpcInvokeResult,
  IpcResponseData,
} from "@shared/types/ipc-generated";
import { createKgStore, type IpcInvoke } from "../kgStore";

function ok<C extends IpcChannel>(
  _channel: C,
  data: IpcResponseData<C>,
): IpcInvokeResult<C> {
  return { ok: true, data };
}

function err<C extends IpcChannel>(
  _channel: C,
  error: IpcError,
): IpcInvokeResult<C> {
  return { ok: false, error };
}

function createEntity(
  projectId: string,
  id: string,
): IpcResponseData<"knowledge:entity:create"> {
  return {
    id,
    projectId,
    type: "character",
    name: `name-${id}`,
    description: "",
    attributes: {},
    aliases: [],
    aiContextLevel: "always",
    createdAt: "2026-02-27T00:00:00.000Z",
    updatedAt: "2026-02-27T00:00:00.000Z",
    version: 1,
  };
}

describe("store refresh governance", () => {
  it("captures refresh failure after mutation (AUD-C9-S1)", async () => {
    const refreshError: IpcError = {
      code: "INTERNAL",
      message: "refresh failed",
    };

    const invoke: IpcInvoke = async (channel) => {
      if (channel === "knowledge:entity:create") {
        return ok(channel, createEntity("project-1", "entity-1"));
      }
      if (channel === "knowledge:entity:list") {
        return err(channel, refreshError);
      }
      if (channel === "knowledge:relation:list") {
        return ok(channel, { items: [] });
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createKgStore({ invoke });
    store.setState({ projectId: "project-1" });

    const result = await store.getState().entityCreate({
      name: "entity-1",
      type: "character",
    });

    expect(result.ok).toBe(true);
    expect(store.getState().lastError).toMatchObject(refreshError);
  });

  it("static scan clears void refresh patterns in critical stores (AUD-C9-S8)", () => {
    const kgStoreSource = readFileSync(
      resolve(process.cwd(), "renderer/src/stores/kgStore.tsx"),
      "utf8",
    );
    const memoryStoreSource = readFileSync(
      resolve(process.cwd(), "renderer/src/stores/memoryStore.tsx"),
      "utf8",
    );
    const projectStoreSource = readFileSync(
      resolve(process.cwd(), "renderer/src/stores/projectStore.tsx"),
      "utf8",
    );

    expect(kgStoreSource).not.toMatch(/void get\(\)\.refresh\(\)/);
    expect(memoryStoreSource).not.toMatch(/void get\(\)\.refresh\(\)/);
    expect(projectStoreSource).not.toMatch(/void get\(\)\.refresh\(\)/);
    expect(projectStoreSource).not.toMatch(/void get\(\)\.bootstrap\(\)/);
  });
});
