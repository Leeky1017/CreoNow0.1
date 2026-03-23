import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { MemoryPanel } from "./MemoryPanel";

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock("../../lib/ipcClient", () => ({
  invoke: invokeMock,
}));

vi.mock("../../stores/projectStore", () => ({
  useProjectStore: vi.fn((selector) =>
    selector({ current: { projectId: "proj-1" } }),
  ),
}));

function setupInvokeMock(options?: {
  paused?: boolean;
  conflictCount?: number;
  hasRule?: boolean;
  confirmed?: boolean;
  distillPending?: boolean;
}): void {
  const paused = options?.paused ?? false;
  const conflictCount = options?.conflictCount ?? 0;
  const hasRule = options?.hasRule ?? false;
  const confirmed = options?.confirmed ?? false;
  const distillPending = options?.distillPending ?? false;

  invokeMock.mockImplementation(async (channel: string, _payload?: unknown) => {
    if (channel === "memory:semantic:list") {
      return {
        ok: true,
        data: {
          items: hasRule
            ? [
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
                  userConfirmed: confirmed,
                  userModified: false,
                  createdAt: 1700000000000,
                  updatedAt: 1700000001000,
                },
              ]
            : [],
          conflictQueue: Array.from({ length: conflictCount }, (_, index) => ({
            id: `cq-${index}`,
            ruleIds: [],
            status: "pending",
          })),
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

    if (channel === "memory:semantic:distill") {
      if (distillPending) {
        return new Promise(() => undefined);
      }
      return { ok: true, data: {} };
    }

    return { ok: true, data: {} };
  });
}

describe("MemoryPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render panel and scope switcher", async () => {
    setupInvokeMock({ hasRule: true });

    render(<MemoryPanel />);

    expect(await screen.findByTestId("memory-panel")).toBeInTheDocument();
    expect(screen.getByTestId("memory-scope-global")).toBeInTheDocument();
    expect(screen.getByTestId("memory-scope-project")).toBeInTheDocument();
  });

  it("should render empty-state message when there is no semantic rule", async () => {
    setupInvokeMock({ hasRule: false });

    render(<MemoryPanel />);

    expect(
      await screen.findByText(
        "AI is learning your writing preferences — the more you use it, the more accurate it becomes",
      ),
    ).toBeInTheDocument();
  });

  it("should render paused learning banner when preference learning is disabled", async () => {
    setupInvokeMock({ paused: true });

    render(<MemoryPanel />);

    expect(
      await screen.findByTestId("memory-learning-paused"),
    ).toBeInTheDocument();
  });

  it("should render conflict banner when conflict queue is not empty", async () => {
    setupInvokeMock({ conflictCount: 1, hasRule: true });

    render(<MemoryPanel />);

    expect(
      await screen.findByTestId("memory-conflict-notice"),
    ).toBeInTheDocument();
  });

  describe("v1-10 PanelHeader unification (AC-1)", () => {
    it("should render unified PanelHeader with panel title", async () => {
      setupInvokeMock({ hasRule: true });

      render(<MemoryPanel />);

      await screen.findByTestId("memory-panel");

      const header = document.querySelector(".panel-header");
      expect(header).toBeInTheDocument();
      expect(screen.getByText("Memory")).toBeInTheDocument();
    });

    it("should render a 40px-high header with bottom border separator", async () => {
      setupInvokeMock({ hasRule: true });

      render(<MemoryPanel />);

      await screen.findByTestId("memory-panel");

      const header = document.querySelector(".panel-header");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("h-10");
      expect(header).toHaveClass("border-b");
    });
  });

  it("should render LoadingState while distilling preferences", async () => {
    const user = userEvent.setup();
    setupInvokeMock({ hasRule: true, distillPending: true });

    render(<MemoryPanel />);

    await screen.findByTestId("memory-panel");
    await user.click(
      screen.getByRole("button", { name: "Update Preferences" }),
    );

    expect(
      await screen.findByTestId("memory-panel-skeleton"),
    ).toBeInTheDocument();
  });

  it("should label unconfirmed rules as auto-generated", async () => {
    setupInvokeMock({ hasRule: true, confirmed: false });

    render(<MemoryPanel />);

    expect(await screen.findByText("Auto-generated")).toBeInTheDocument();
  });

  it("should label confirmed rules as confirmed", async () => {
    setupInvokeMock({ hasRule: true, confirmed: true });

    render(<MemoryPanel />);

    expect((await screen.findAllByText("Confirmed")).length).toBeGreaterThan(0);
  });

  it("should render sticky conflict resolver when opened", async () => {
    const user = userEvent.setup();
    setupInvokeMock({ conflictCount: 1, hasRule: true });

    render(<MemoryPanel />);

    await user.click(
      await screen.findByTestId("memory-open-conflict-resolution"),
    );

    const panel = await screen.findByTestId("memory-conflict-resolution-panel");
    expect(panel).toHaveClass("sticky");
    expect(panel).toHaveClass("top-0");
  });
});
