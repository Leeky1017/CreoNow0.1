import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

describe("memory conflict resolution flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    invokeMock.mockImplementation(async (channel: string) => {
      if (channel === "memory:semantic:list") {
        return {
          ok: true,
          data: {
            items: [
              {
                id: "rule-a",
                projectId: "proj-1",
                scope: "project",
                version: 1,
                rule: "动作场景偏好长句",
                category: "pacing",
                confidence: 0.7,
                supportingEpisodes: ["ep-1"],
                contradictingEpisodes: ["ep-2"],
                userConfirmed: false,
                userModified: false,
                conflictMarked: true,
                createdAt: 1700000000000,
                updatedAt: 1700000001000,
              },
              {
                id: "rule-b",
                projectId: "proj-1",
                scope: "project",
                version: 1,
                rule: "动作场景偏好短句",
                category: "pacing",
                confidence: 0.72,
                supportingEpisodes: ["ep-3"],
                contradictingEpisodes: ["ep-4"],
                userConfirmed: false,
                userModified: false,
                conflictMarked: true,
                createdAt: 1700000000001,
                updatedAt: 1700000001001,
              },
            ],
            conflictQueue: [
              {
                id: "conflict-1",
                ruleIds: ["rule-a", "rule-b"],
                status: "pending",
              },
            ],
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

      if (channel === "memory:conflict:resolve") {
        return {
          ok: true,
          data: {
            item: {
              id: "conflict-1",
              ruleIds: ["rule-a", "rule-b"],
              status: "resolved",
            },
            keptRule: {
              id: "rule-b",
              projectId: "proj-1",
              scope: "project",
              version: 1,
              rule: "动作场景偏好短句",
              category: "pacing",
              confidence: 0.72,
              supportingEpisodes: ["ep-3"],
              contradictingEpisodes: ["ep-4"],
              userConfirmed: false,
              userModified: true,
              conflictMarked: false,
              createdAt: 1700000000001,
              updatedAt: 1700000002001,
            },
          },
        };
      }

      return { ok: true, data: {} };
    });
  });

  it("should open conflict resolution panel from conflict notice", async () => {
    const user = userEvent.setup();
    render(<MemoryPanel />);

    const openButton = await screen.findByTestId(
      "memory-open-conflict-resolution",
    );
    await user.click(openButton);

    expect(
      await screen.findByTestId("memory-conflict-resolution-panel"),
    ).toBeInTheDocument();
  });

  it("should resolve one conflict by keeping selected rule", async () => {
    const user = userEvent.setup();
    render(<MemoryPanel />);

    await user.click(
      await screen.findByTestId("memory-open-conflict-resolution"),
    );
    await user.click(
      await screen.findByTestId("memory-resolve-conflict-1-rule-b"),
    );

    expect(invokeMock).toHaveBeenCalledWith("memory:conflict:resolve", {
      projectId: "proj-1",
      conflictId: "conflict-1",
      chosenRuleId: "rule-b",
    });
  });
});
