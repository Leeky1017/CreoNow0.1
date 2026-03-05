import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MemoryPanel } from "../MemoryPanel";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("../../../lib/ipcClient", () => ({
  invoke: invokeMock,
}));

vi.mock("../../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) =>
    selector({ current: { projectId: "proj-1" } }),
  ),
}));

vi.mock("../../../stores/fileStore", () => ({
  useFileStore: vi.fn((selector) => selector({ currentDocumentId: null })),
}));

function setupInvokeMock(): void {
  invokeMock.mockImplementation(async (channel: string, _payload?: unknown) => {
    if (channel === "memory:semantic:list") {
      return {
        ok: true,
        data: {
          items: [],
          conflictQueue: [],
        },
      };
    }

    if (channel === "memory:settings:get") {
      return {
        ok: true,
        data: {
          injectionEnabled: true,
          preferenceLearningEnabled: true,
          privacyModeEnabled: false,
          preferenceLearningThreshold: 3,
        },
      };
    }

    if (channel === "memory:semantic:add") {
      return {
        ok: true,
        data: {
          item: {
            id: "rule-1",
            projectId: "proj-1",
            scope: "project",
            version: 1,
            rule: "所有RolesDialogue不使用感叹号",
            category: "style",
            confidence: 1,
            supportingEpisodes: [],
            contradictingEpisodes: [],
            userConfirmed: true,
            userModified: false,
            createdAt: 1700000000000,
            updatedAt: 1700000000000,
          },
        },
      };
    }

    return { ok: true, data: {} };
  });
}

describe("MemoryPanel manual add on empty state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupInvokeMock();
  });

  it("should create semantic rule when user adds rule from empty-state CTA", async () => {
    const user = userEvent.setup();

    render(<MemoryPanel />);

    const emptyStateHint = await screen.findByText(
      "AI is learning your writing preferences — the more you use it, the more accurate it becomes",
    );
    const emptyState = emptyStateHint.closest("div");
    expect(emptyState).not.toBeNull();

    await user.click(
      within(emptyState as HTMLDivElement).getByRole("button", {
        name: "Add Rule Manually",
      }),
    );

    const editor = await screen.findByLabelText("New Rule");
    await user.type(editor, "所有RolesDialogue不使用感叹号");
    await user.click(screen.getByRole("button", { name: "Save Rule" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "memory:semantic:add",
        expect.objectContaining({
          projectId: "proj-1",
          rule: "所有RolesDialogue不使用感叹号",
          confidence: 1,
          userConfirmed: true,
        }),
      );
    });
  });
});
