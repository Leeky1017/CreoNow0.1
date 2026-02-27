import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KgEntity, KgRelation } from "../../stores/kgStore";
import { KnowledgeGraphPanel } from "./KnowledgeGraphPanel";
import * as graphRenderAdapter from "./graphRenderAdapter";

type MockKgState = {
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  entities: KgEntity[];
  relations: KgRelation[];
  lastError: null;
  bootstrapForProject: (projectId: string | null) => Promise<void>;
  clearError: () => void;
  entityCreate: () => Promise<{ ok: true }>;
  entityUpdate: () => Promise<{ ok: true }>;
  entityDelete: () => Promise<{ ok: true }>;
  relationCreate: () => Promise<{ ok: true }>;
  relationUpdate: () => Promise<{ ok: true }>;
  relationDelete: () => Promise<{ ok: true }>;
};

let mockKgState: MockKgState;

vi.mock("../../stores/kgStore", () => ({
  useKgStore: (selector: (state: MockKgState) => unknown) =>
    selector(mockKgState),
}));

describe("KnowledgeGraphPanel.render", () => {
  beforeEach(() => {
    mockKgState = {
      bootstrapStatus: "ready",
      entities: [
        {
          id: "e-character",
          projectId: "project-1",
          type: "character",
          name: "林远",
          description: "冷静",
          attributes: {},
          aiContextLevel: "when_detected",
          aliases: [],
          metadataJson: "{}",
          version: 1,
          createdAt: "2026-02-08T12:00:00.000Z",
          updatedAt: "2026-02-08T12:00:00.000Z",
        },
        {
          id: "e-location",
          projectId: "project-1",
          type: "location",
          name: "旧港",
          description: "",
          attributes: {},
          aiContextLevel: "when_detected",
          aliases: [],
          metadataJson: "{}",
          version: 1,
          createdAt: "2026-02-08T12:00:00.000Z",
          updatedAt: "2026-02-08T12:00:00.000Z",
        },
      ],
      relations: [
        {
          id: "r-1",
          projectId: "project-1",
          sourceEntityId: "e-character",
          targetEntityId: "e-location",
          relationType: "盟友",
          description: "",
          createdAt: "2026-02-08T12:00:00.000Z",
        },
      ],
      lastError: null,
      bootstrapForProject: async () => {},
      clearError: () => {},
      entityCreate: async () => ({ ok: true }),
      entityUpdate: async () => ({ ok: true }),
      entityDelete: async () => ({ ok: true }),
      relationCreate: async () => ({ ok: true }),
      relationUpdate: async () => ({ ok: true }),
      relationDelete: async () => ({ ok: true }),
    };
  });

  it("should render force-directed graph with typed node colors and relation labels", () => {
    const layoutSpy = vi.spyOn(graphRenderAdapter, "buildForceDirectedGraph");

    render(<KnowledgeGraphPanel projectId="project-1" />);

    expect(layoutSpy).toHaveBeenCalled();
    expect(screen.getByText("盟友")).toBeInTheDocument();

    const characterNode = document.querySelector(
      '[data-node-id="e-character"]',
    ) as HTMLElement | null;
    expect(characterNode).toBeTruthy();
    expect(characterNode?.getAttribute("style") ?? "").toContain(
      "var(--color-node-character)",
    );
  });
});
