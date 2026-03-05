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
  let paused = false;

  invokeMock.mockImplementation(async (channel: string, payload?: unknown) => {
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
              rule: "动作场景偏好短句",
              category: "pacing",
              confidence: 0.87,
              supportingEpisodes: ["ep-1"],
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
          preferenceLearningEnabled: !paused,
          privacyModeEnabled: false,
          preferenceLearningThreshold: 3,
        },
      };
    }

    if (channel === "memory:settings:update") {
      const next = payload as {
        patch: { preferenceLearningEnabled?: boolean };
      };
      paused = next.patch.preferenceLearningEnabled === false;
      return {
        ok: true,
        data: {
          injectionEnabled: true,
          preferenceLearningEnabled: !paused,
          privacyModeEnabled: false,
          preferenceLearningThreshold: 3,
        },
      };
    }

    return { ok: true, data: {} };
  });
}

describe("MemoryPanel pause learning", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupInvokeMock();
  });

  it("should pause and resume learning when user clicks toggle button", async () => {
    const user = userEvent.setup();

    render(<MemoryPanel />);

    const pauseButton = await screen.findByRole("button", { name: "Pause Learning" });
    await user.click(pauseButton);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("memory:settings:update", {
        patch: {
          preferenceLearningEnabled: false,
        },
      });
    });

    const resumeButton = await screen.findByRole("button", {
      name: "Resume Learning",
    });
    await user.click(resumeButton);

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith("memory:settings:update", {
        patch: {
          preferenceLearningEnabled: true,
        },
      });
    });
  });
});
