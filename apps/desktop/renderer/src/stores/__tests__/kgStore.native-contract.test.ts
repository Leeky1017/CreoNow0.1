import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import type {
  IpcChannel,
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

describe("kgStore native contract", () => {
  it("AUD-C11-S1/S2: exposes native IPC fields without legacy alias fields", async () => {
    const invoke: IpcInvoke = async (channel) => {
      if (channel === "knowledge:entity:list") {
        return ok(channel, {
          items: [
            {
              id: "entity-1",
              projectId: "project-1",
              type: "character",
              name: "Entity One",
              description: "",
              attributes: {},
              aliases: [],
              aiContextLevel: "always",
              createdAt: "2026-02-27T00:00:00.000Z",
              updatedAt: "2026-02-27T00:00:00.000Z",
              version: 1,
            },
          ],
        });
      }
      if (channel === "knowledge:relation:list") {
        return ok(channel, {
          items: [
            {
              id: "relation-1",
              projectId: "project-1",
              sourceEntityId: "entity-1",
              targetEntityId: "entity-2",
              relationType: "ally",
              description: "",
              createdAt: "2026-02-27T00:00:00.000Z",
            },
          ],
        });
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createKgStore({ invoke });
    await store.getState().bootstrapForProject("project-1");

    const entity = store.getState().entities[0] as Record<string, unknown>;
    expect(entity.id).toBe("entity-1");
    expect(entity.type).toBe("character");
    expect(entity.entityId).toBeUndefined();
    expect(entity.entityType).toBeUndefined();

    const relation = store.getState().relations[0] as Record<string, unknown>;
    expect(relation.id).toBe("relation-1");
    expect(relation.sourceEntityId).toBe("entity-1");
    expect(relation.targetEntityId).toBe("entity-2");
    expect(relation.relationId).toBeUndefined();
    expect(relation.fromEntityId).toBeUndefined();
    expect(relation.toEntityId).toBeUndefined();
  });

  it("AUD-C11-S3: entityCreate must not map 'other' to 'faction'", async () => {
    let createTypePayload: string | undefined;

    const invoke: IpcInvoke = async (channel, payload) => {
      if (channel === "knowledge:entity:create") {
        createTypePayload = (payload as { type?: string }).type;
        return ok(channel, {
          id: "entity-created",
          projectId: "project-1",
          type: createTypePayload === "character" ? "character" : "item",
          name: "Created",
          description: "",
          attributes: {},
          aliases: [],
          aiContextLevel: "always",
          createdAt: "2026-02-27T00:00:00.000Z",
          updatedAt: "2026-02-27T00:00:00.000Z",
          version: 1,
        });
      }
      if (channel === "knowledge:entity:list") {
        return ok(channel, {
          items: [],
        });
      }
      if (channel === "knowledge:relation:list") {
        return ok(channel, {
          items: [],
        });
      }
      throw new Error(`Unexpected channel: ${channel}`);
    };

    const store = createKgStore({ invoke });
    store.setState({ projectId: "project-1" });

    const result = await store.getState().entityCreate({
      name: "Legacy Type",
      type: "other",
    });

    expect(result.ok).toBe(true);
    expect(createTypePayload).toBe("character");
  });

  it("AUD-C11-S1/S2: source code must not keep toLegacy adapters", () => {
    const source = readFileSync(
      resolve(process.cwd(), "renderer/src/stores/kgStore.tsx"),
      "utf8",
    );

    expect(source).not.toContain("toLegacyEntity");
    expect(source).not.toContain("toLegacyRelation");
  });
});
