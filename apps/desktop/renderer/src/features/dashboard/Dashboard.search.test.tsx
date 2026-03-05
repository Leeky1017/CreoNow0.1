import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DashboardPage } from "./DashboardPage";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";

function createInvokeMock() {
  return vi.fn().mockImplementation((channel: string) => {
    if (channel === "project:project:list") {
      return Promise.resolve({
        ok: true,
        data: {
          items: [
            {
              projectId: "p-search-1",
              name: "暗流",
              rootPath: "/tmp/p-search-1",
              updatedAt: Date.now(),
            },
            {
              projectId: "p-search-2",
              name: "晨光",
              rootPath: "/tmp/p-search-2",
              updatedAt: Date.now() - 1000,
            },
          ],
        },
      });
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

describe("Dashboard search (PM1-S8)", () => {
  it("should filter cards by project name and show no-result copy", async () => {
    const user = userEvent.setup();
    const projectStore = createProjectStore({ invoke: createInvokeMock() });

    render(
      <ProjectStoreProvider store={projectStore}>
        <DashboardPage />
      </ProjectStoreProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
    });

    const searchInput = screen.getByTestId("dashboard-search");
    await user.type(searchInput, "暗");

    await waitFor(() => {
      expect(screen.getByText("暗流")).toBeInTheDocument();
      expect(screen.queryByText("晨光")).not.toBeInTheDocument();
    });

    await user.clear(searchInput);
    await user.type(searchInput, "不存在");

    await waitFor(() => {
      expect(screen.getByText("No matching results")).toBeInTheDocument();
    });
  });
});
