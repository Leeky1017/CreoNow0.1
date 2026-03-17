import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KgEntity, KgRelation } from "../../../stores/kgStore";
import {
  KnowledgeGraphPanel,
  shouldClearRelationEditingAfterDelete,
} from "../KnowledgeGraphPanel";
import * as kgViewPreferences from "../kgViewPreferences";

type ServiceResult =
  | { ok: true; data?: { id?: string } }
  | { ok: false; error: { code: string; message: string } };

type MockKgState = {
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  entities: KgEntity[];
  relations: KgRelation[];
  lastError: null;
  bootstrapForProject: (projectId: string | null) => Promise<void>;
  clearError: () => void;
  entityCreate: () => Promise<ServiceResult>;
  entityUpdate: ReturnType<typeof vi.fn>;
  entityDelete: () => Promise<ServiceResult>;
  relationCreate: () => Promise<ServiceResult>;
  relationUpdate: () => Promise<ServiceResult>;
  relationDelete: ReturnType<typeof vi.fn>;
};

let mockKgState: MockKgState;

vi.mock("../../../stores/kgStore", () => ({
  useKgStore: (selector: (state: MockKgState) => unknown) =>
    selector(mockKgState),
}));

function makeEntity(args: {
  id: string;
  type: KgEntity["type"];
  name: string;
  metadataJson?: string;
}): KgEntity {
  return {
    id: args.id,
    projectId: "project-1",
    type: args.type,
    name: args.name,
    description: "",
    attributes: {},
    aiContextLevel: "when_detected",
    aliases: [],
    metadataJson: args.metadataJson ?? "{}",
    version: 1,
    createdAt: "2026-02-14T00:00:00.000Z",
    updatedAt: "2026-02-14T00:00:00.000Z",
  };
}

function makeRelation(): KgRelation {
  return {
    id: "rel-1",
    projectId: "project-1",
    sourceEntityId: "char-1",
    targetEntityId: "loc-1",
    relationType: "盟友",
    description: "",
    createdAt: "2026-02-14T00:00:00.000Z",
  };
}

describe("kg async validation", () => {
  beforeEach(() => {
    mockKgState = {
      bootstrapStatus: "ready",
      entities: [
        makeEntity({ id: "char-1", type: "character", name: "林远" }),
        makeEntity({ id: "loc-1", type: "location", name: "旧港" }),
        makeEntity({ id: "ev-1", type: "event", name: "雨夜冲突" }),
        makeEntity({ id: "ev-2", type: "event", name: "旧港会谈" }),
        makeEntity({ id: "ev-3", type: "event", name: "码头伏击" }),
      ],
      relations: [makeRelation()],
      lastError: null,
      bootstrapForProject: async () => {},
      clearError: () => {},
      entityCreate: async () => ({ ok: true }),
      entityUpdate: vi.fn(async () => ({ ok: true })),
      entityDelete: async () => ({ ok: true }),
      relationCreate: async () => ({ ok: true }),
      relationUpdate: async () => ({ ok: true }),
      relationDelete: vi.fn(async () => ({ ok: true })),
    };
  });

  it("KG-S0-AV-S1 relationDelete failure does not clear editing state", async () => {
    const shouldClear = shouldClearRelationEditingAfterDelete({
      editing: {
        mode: "relation",
        id: "rel-1",
        relationType: "盟友",
      },
      targetRelationId: "rel-1",
      result: {
        ok: false,
        error: { code: "INTERNAL_ERROR", message: "delete failed" },
      },
    });

    expect(shouldClear).toBe(false);
  });

  it("KG-S0-AV-S2 entityUpdate failure does not save view preferences", async () => {
    mockKgState.entityUpdate = vi.fn(async () => ({
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "update failed" },
    }));

    const saveSpy = vi.spyOn(kgViewPreferences, "saveKgViewPreferences");

    render(<KnowledgeGraphPanel projectId="project-1" />);

    const node = screen.getByText("林远").closest("[data-node-id='char-1']");
    const canvas = screen.getByTestId("knowledge-graph-canvas");

    expect(node).toBeTruthy();

    fireEvent.mouseDown(node as Element, { clientX: 300, clientY: 180 });
    fireEvent.mouseMove(canvas, { clientX: 340, clientY: 220 });
    fireEvent.mouseUp(canvas);

    await waitFor(() => {
      expect(mockKgState.entityUpdate).toHaveBeenCalledTimes(1);
    });

    expect(saveSpy).not.toHaveBeenCalledWith(
      "project-1",
      expect.objectContaining({ lastDraggedNodeId: "char-1" }),
    );
  });

  it("KG-S0-AV-S3 batch entityUpdate partial failure reports errors", async () => {
    mockKgState.entityUpdate = vi.fn(async ({ id }: { id: string }) => {
      if (id === "ev-2") {
        return {
          ok: false,
          error: { code: "INTERNAL_ERROR", message: "first failed" },
        };
      }
      if (id === "ev-3") {
        throw new Error("second failed");
      }
      return { ok: true };
    });

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(<KnowledgeGraphPanel projectId="project-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Timeline" }));

    fireEvent.dragStart(screen.getByTestId("timeline-event-ev-2"));
    fireEvent.dragOver(screen.getByTestId("timeline-event-ev-1"));
    fireEvent.drop(screen.getByTestId("timeline-event-ev-1"));

    await waitFor(() => {
      expect(mockKgState.entityUpdate).toHaveBeenCalledTimes(3);
    });

    await waitFor(() => {
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("2/3"),
        expect.any(Array),
      );
    });

    warnSpy.mockRestore();
  });
});
