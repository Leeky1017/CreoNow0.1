import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DashboardPage } from "./DashboardPage";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";

// Mock ipcClient so we can intercept invoke calls
const mockInvoke = vi.fn();
vi.mock("../../lib/ipcClient", () => ({
  invoke: (...args: unknown[]) => mockInvoke(...args),
}));

function createEmptyProjectInvoke() {
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

function renderWithEmptyState() {
  const storeInvoke = createEmptyProjectInvoke();
  const projectStore = createProjectStore({ invoke: storeInvoke });

  return {
    ...render(
      <ProjectStoreProvider store={projectStore}>
        <DashboardPage />
      </ProjectStoreProvider>,
    ),
    storeInvoke,
  };
}

describe("Dashboard Open Folder Entry Point", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvoke.mockResolvedValue({
      ok: true,
      data: { selectedPath: "/home/user/project" },
    });
  });

  // WB-FE-OPENF-UI-S2: Open Folder button exists in empty state
  it("renders open folder button in dashboard empty state", async () => {
    renderWithEmptyState();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-empty")).toBeInTheDocument();
    });

    expect(screen.getByTestId("dashboard-open-folder")).toBeInTheDocument();
  });

  // WB-FE-OPENF-UI-S2b: Click triggers dialog:folder:open IPC
  it("calls dialog:folder:open IPC when open folder button is clicked", async () => {
    renderWithEmptyState();

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-open-folder")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("dashboard-open-folder"));

    expect(mockInvoke).toHaveBeenCalledWith("dialog:folder:open", {});
  });
});
