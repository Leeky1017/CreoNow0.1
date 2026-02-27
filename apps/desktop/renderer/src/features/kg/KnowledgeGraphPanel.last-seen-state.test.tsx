import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KgEntity, KgRelation } from "../../stores/kgStore";
import { KnowledgeGraphPanel } from "./KnowledgeGraphPanel";

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
  relationDelete: () => Promise<ServiceResult>;
};

let mockKgState: MockKgState;

vi.mock("../../stores/kgStore", () => ({
  useKgStore: (selector: (state: MockKgState) => unknown) =>
    selector(mockKgState),
}));

function makeEntity(): KgEntity {
  return {
    id: "entity-1",
    projectId: "project-1",
    type: "character",
    name: "林远",
    description: "冷静",
    attributes: {},
    aiContextLevel: "when_detected",
    aliases: [],
    metadataJson: "{}",
    version: 1,
    createdAt: "2026-02-14T00:00:00.000Z",
    updatedAt: "2026-02-14T00:00:00.000Z",
  };
}

describe("KnowledgeGraphPanel.last-seen-state", () => {
  beforeEach(() => {
    mockKgState = {
      bootstrapStatus: "ready",
      entities: [makeEntity()],
      relations: [],
      lastError: null,
      bootstrapForProject: async () => {},
      clearError: () => {},
      entityCreate: async () => ({ ok: true }),
      entityUpdate: vi.fn(async () => ({ ok: true })),
      entityDelete: async () => ({ ok: true }),
      relationCreate: async () => ({ ok: true }),
      relationUpdate: async () => ({ ok: true }),
      relationDelete: async () => ({ ok: true }),
    };
  });

  it("KG-S3-KGLS-UI-S1 shows empty lastSeenState and saves updates", async () => {
    const user = userEvent.setup();

    render(<KnowledgeGraphPanel projectId="project-1" />);

    await user.click(screen.getByRole("button", { name: "List" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    const input = screen.getByTestId("kg-entity-last-seen-state");
    expect(input).toHaveValue("");

    await user.type(input, "受伤但清醒");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(mockKgState.entityUpdate).toHaveBeenCalledWith({
        id: "entity-1",
        patch: expect.objectContaining({
          lastSeenState: "受伤但清醒",
        }),
      });
    });
  });
});
