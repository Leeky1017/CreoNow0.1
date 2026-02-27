import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KgEntity, KgRelation } from "../../stores/kgStore";
import { KnowledgeGraphPanel } from "./KnowledgeGraphPanel";
import { updatePositionInMetadata } from "./kgToGraph";

type MockKgState = {
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  entities: KgEntity[];
  relations: KgRelation[];
  lastError: null;
  bootstrapForProject: (projectId: string | null) => Promise<void>;
  clearError: () => void;
  entityCreate: () => Promise<{ ok: true }>;
  entityUpdate: ReturnType<typeof vi.fn>;
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

describe("metadata parse fail-fast", () => {
  beforeEach(() => {
    mockKgState = {
      bootstrapStatus: "ready",
      entities: [
        {
          id: "ev-1",
          projectId: "project-1",
          type: "event",
          name: "雨夜冲突",
          description: "desc",
          attributes: {},
          aiContextLevel: "when_detected",
          aliases: [],
          metadataJson: "{invalid-json",
          version: 1,
          createdAt: "2026-02-10T12:00:00.000Z",
          updatedAt: "2026-02-10T12:00:00.000Z",
        },
      ],
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

  it("KG-S0-MFF-S1 kgToGraph: invalid metadataJson preserves original", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const invalidMetadata = "{invalid-json";

    const result = updatePositionInMetadata(invalidMetadata, { x: 9, y: 5 });

    expect(result).toBe(invalidMetadata);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("[kgToGraph] metadataJson parse fail-fast:"),
      expect.stringContaining("{invalid-json"),
    );

    warnSpy.mockRestore();
  });

  it("KG-S0-MFF-S1 happy path: valid metadataJson still writes ui.position", () => {
    const currentMetadata = JSON.stringify({ timeline: { order: 3 } });

    const result = updatePositionInMetadata(currentMetadata, { x: 100, y: 80 });

    expect(JSON.parse(result)).toEqual({
      timeline: { order: 3 },
      ui: { position: { x: 100, y: 80 } },
    });
  });

  it("KG-S0-MFF-S1 edge path: empty or non-object metadataJson fail-fast without overwrite", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const samples = ["", "   ", "[]", "123", '"text"'];

    for (const sample of samples) {
      expect(updatePositionInMetadata(sample, { x: 1, y: 2 })).toBe(sample);
    }

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("KG-S0-MFF-S2 KnowledgeGraphPanel: parseMetadataJson invalid path fail-fast stops timeline write", () => {
    render(<KnowledgeGraphPanel projectId="project-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Timeline" }));

    const eventCard = screen.getByTestId("timeline-event-ev-1");
    fireEvent.dragStart(eventCard);
    fireEvent.dragOver(eventCard);
    fireEvent.drop(eventCard);

    expect(mockKgState.entityUpdate).toHaveBeenCalledTimes(0);
  });
});
