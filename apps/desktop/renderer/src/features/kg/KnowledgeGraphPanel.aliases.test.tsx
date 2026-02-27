import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { KgEntity, KgRelation } from "../../stores/kgStore";
import { KnowledgeGraphPanel } from "./KnowledgeGraphPanel";

type MockKgState = {
  bootstrapStatus: "idle" | "loading" | "ready" | "error";
  entities: KgEntity[];
  relations: KgRelation[];
  lastError: null;
  bootstrapForProject: (projectId: string | null) => Promise<void>;
  clearError: () => void;
  entityCreate: ReturnType<typeof vi.fn>;
  entityUpdate: ReturnType<typeof vi.fn>;
  entityDelete: ReturnType<typeof vi.fn>;
  relationCreate: ReturnType<typeof vi.fn>;
  relationUpdate: ReturnType<typeof vi.fn>;
  relationDelete: ReturnType<typeof vi.fn>;
};

let mockKgState: MockKgState;

vi.mock("../../stores/kgStore", () => ({
  useKgStore: (selector: (state: MockKgState) => unknown) =>
    selector(mockKgState),
}));

describe("KnowledgeGraphPanel.aliases", () => {
  beforeEach(() => {
    mockKgState = {
      bootstrapStatus: "ready",
      entities: [],
      relations: [],
      lastError: null,
      bootstrapForProject: async () => {},
      clearError: () => {},
      entityCreate: vi.fn(async () => ({ ok: true })),
      entityUpdate: vi.fn(async () => ({ ok: true })),
      entityDelete: vi.fn(async () => ({ ok: true })),
      relationCreate: vi.fn(async () => ({ ok: true })),
      relationUpdate: vi.fn(async () => ({ ok: true })),
      relationDelete: vi.fn(async () => ({ ok: true })),
    };
  });

  it("passes aliases to entityCreate from list view input", async () => {
    render(<KnowledgeGraphPanel projectId="project-1" />);

    fireEvent.click(screen.getByRole("button", { name: "List" }));

    fireEvent.change(screen.getByTestId("kg-entity-name"), {
      target: { value: "林默" },
    });
    fireEvent.change(screen.getByTestId("kg-entity-aliases"), {
      target: { value: " 小默, 默哥 ,, 小默 " },
    });

    fireEvent.click(screen.getByTestId("kg-entity-create"));

    await waitFor(() => {
      expect(mockKgState.entityCreate).toHaveBeenCalledTimes(1);
    });

    expect(mockKgState.entityCreate).toHaveBeenCalledWith({
      name: "林默",
      type: "",
      description: "",
      aliases: ["小默", "默哥", "小默"],
    });
  });
});
