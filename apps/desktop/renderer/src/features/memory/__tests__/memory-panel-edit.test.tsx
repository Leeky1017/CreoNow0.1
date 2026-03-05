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
          preferenceLearningEnabled: true,
          privacyModeEnabled: false,
          preferenceLearningThreshold: 3,
        },
      };
    }

    if (channel === "memory:semantic:update") {
      return {
        ok: true,
        data: {
          item: {
            id: "rule-1",
            projectId: "proj-1",
            scope: "project",
            version: 1,
            rule: "动作场景偏好短句（修订）",
            category: "pacing",
            confidence: 0.87,
            supportingEpisodes: ["ep-1"],
            contradictingEpisodes: [],
            userConfirmed: false,
            userModified: true,
            createdAt: 1700000000000,
            updatedAt: 1700000002000,
          },
        },
      };
    }

    return { ok: true, data: {} };
  });
}

describe("MemoryPanel edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupInvokeMock();
  });

  it("should update semantic rule text when user edits and saves", async () => {
    const user = userEvent.setup();

    render(<MemoryPanel />);

    await screen.findByText("动作场景偏好短句");

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const editor = await screen.findByLabelText("Rule Text");
    await user.clear(editor);
    await user.type(editor, "动作场景偏好短句（修订）");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(invokeMock).toHaveBeenCalledWith(
        "memory:semantic:update",
        expect.objectContaining({
          projectId: "proj-1",
          ruleId: "rule-1",
          patch: expect.objectContaining({
            rule: "动作场景偏好短句（修订）",
            userModified: true,
          }),
        }),
      );
    });
  });
});
