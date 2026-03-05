import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
          items: [
            {
              id: "rule-1",
              projectId: "proj-1",
              scope: "project",
              version: 1,
              rule: "错误偏好规则",
              category: "style",
              confidence: 0.31,
              supportingEpisodes: ["ep-1", "ep-2"],
              contradictingEpisodes: [],
              userConfirmed: false,
              userModified: false,
              createdAt: 1700000000000,
              updatedAt: 1700000001000,
            },
          ],
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

    if (channel === "memory:semantic:delete") {
      return { ok: true, data: { deleted: true } };
    }

    return { ok: true, data: {} };
  });
}

describe("MemoryPanel delete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupInvokeMock();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("should delete semantic rule when user confirms deletion", async () => {
    const user = userEvent.setup();

    render(<MemoryPanel />);

    await screen.findByText("错误偏好规则");

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("memory:semantic:delete", {
        projectId: "proj-1",
        ruleId: "rule-1",
      });
    });
  });
});
