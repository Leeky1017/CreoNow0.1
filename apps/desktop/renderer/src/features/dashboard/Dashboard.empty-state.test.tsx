import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { DashboardPage } from "./DashboardPage";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";

// Mock ipcClient
const mockInvoke = vi.fn();
vi.mock("../../lib/ipcClient", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

function createInvokeMock() {
  return vi.fn().mockImplementation((channel: string) => {
    if (channel === "project:project:list") {
      return Promise.resolve({ ok: true, data: { items: [] } });
    }
    if (channel === "project:project:getcurrent") {
      return Promise.resolve({
        ok: false,
        error: { code: "NOT_FOUND", message: "No current project" },
      });
    }
    return Promise.resolve({ ok: true, data: {} });
  });
}

describe("Dashboard empty state (PM1-S7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({ ok: true, data: {} });
  });

  it("should render empty state illustration and primary create CTA", async () => {
    const projectStore = createProjectStore({ invoke: createInvokeMock() });

    render(
      <ProjectStoreProvider store={projectStore}>
        <DashboardPage />
      </ProjectStoreProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-empty")).toBeInTheDocument();
    });

    expect(screen.getByText("Create your first writing project")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-create-first")).toBeInTheDocument();
  });

  // PM-FE-DASH-S1: Unified empty state (no WelcomeScreen)
  it("renders unified empty state without WelcomeScreen", async () => {
    const projectStore = createProjectStore({ invoke: createInvokeMock() });

    render(
      <ProjectStoreProvider store={projectStore}>
        <DashboardPage />
      </ProjectStoreProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-empty")).toBeInTheDocument();
    });

    // WelcomeScreen testid should NOT be present
    expect(screen.queryByTestId("welcome-screen")).not.toBeInTheDocument();
  });

  // PM-FE-DASH-S2: Empty state has both Create Project + Open Folder
  it("exposes create project and open folder actions in empty state", async () => {
    const projectStore = createProjectStore({ invoke: createInvokeMock() });

    render(
      <ProjectStoreProvider store={projectStore}>
        <DashboardPage />
      </ProjectStoreProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-empty")).toBeInTheDocument();
    });

    expect(screen.getByTestId("dashboard-create-first")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-open-folder")).toBeInTheDocument();
  });

  // PM-FE-DASH-S4: WelcomeScreen module does not exist
  it("WelcomeScreen module does not exist", () => {
    const welcomePath = resolve(__dirname, "../welcome/WelcomeScreen.tsx");
    expect(existsSync(welcomePath)).toBe(false);
  });
});
