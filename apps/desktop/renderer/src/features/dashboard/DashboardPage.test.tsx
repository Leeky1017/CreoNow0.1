import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DashboardPage } from "./DashboardPage";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";

// =============================================================================
// Test Helpers
// =============================================================================

function createMockInvoke() {
  return vi.fn().mockImplementation((channel: string) => {
    if (channel === "project:project:list") {
      return Promise.resolve({
        ok: true,
        data: {
          items: [
            {
              projectId: "proj-1",
              name: "My First Novel",
              rootPath: "/path/to/proj-1",
              updatedAt: Date.now() - 3600000, // 1 hour ago
            },
            {
              projectId: "proj-2",
              name: "Short Stories",
              rootPath: "/path/to/proj-2",
              updatedAt: Date.now() - 86400000, // 1 day ago
            },
            {
              projectId: "proj-3",
              name: "Poetry Collection",
              rootPath: "/path/to/proj-3",
              updatedAt: Date.now() - 172800000, // 2 days ago
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
    if (channel === "project:project:setcurrent") {
      return Promise.resolve({
        ok: true,
        data: { projectId: "proj-1", rootPath: "/path/to/proj-1" },
      });
    }
    return Promise.resolve({ ok: true, data: {} });
  });
}

function createEmptyMockInvoke() {
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

/**
 * Build an invoke mock that includes one archived project in project:project:list.
 *
 * Why: archived section behavior requires explicit archived fixture data.
 */
function createArchivedMockInvoke() {
  return vi.fn().mockImplementation((channel: string) => {
    if (channel === "project:project:list") {
      return Promise.resolve({
        ok: true,
        data: {
          items: [
            {
              projectId: "proj-1",
              name: "My First Novel",
              rootPath: "/path/to/proj-1",
              updatedAt: Date.now() - 3600000,
            },
            {
              projectId: "proj-2",
              name: "Archived Draft",
              rootPath: "/path/to/proj-2",
              updatedAt: Date.now() - 86400000,
              archivedAt: Date.now() - 3600000,
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
    if (channel === "project:project:setcurrent") {
      return Promise.resolve({
        ok: true,
        data: { projectId: "proj-1", rootPath: "/path/to/proj-1" },
      });
    }
    if (channel === "project:project:archive") {
      return Promise.resolve({
        ok: true,
        data: {
          projectId: "proj-2",
          archived: false,
        },
      });
    }
    return Promise.resolve({ ok: true, data: {} });
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  options?: {
    projectStore?: ReturnType<typeof createProjectStore>;
  },
) {
  const invoke = createMockInvoke();
  const projectStore = options?.projectStore ?? createProjectStore({ invoke });

  return {
    ...render(
      <ProjectStoreProvider store={projectStore}>{ui}</ProjectStoreProvider>,
    ),
    projectStore,
    invoke,
  };
}

// =============================================================================
// Tests
// =============================================================================

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading spinner while bootstrapping", () => {
      const invoke = createMockInvoke();
      // Make the invoke hang
      invoke.mockImplementation(() => new Promise(() => {}));
      const projectStore = createProjectStore({ invoke });

      renderWithProviders(<DashboardPage />, { projectStore });

      expect(screen.getByTestId("dashboard-loading")).toBeInTheDocument();
    });
  });

  describe("Empty State", () => {
    it("shows empty state when no projects exist", async () => {
      const invoke = createEmptyMockInvoke();
      const projectStore = createProjectStore({ invoke });

      renderWithProviders(<DashboardPage />, { projectStore });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-empty")).toBeInTheDocument();
      });

      expect(screen.getByText("开始创建你的第一个创作项目")).toBeInTheDocument();
      expect(screen.getByTestId("dashboard-create-first")).toBeInTheDocument();
    });

    it("opens create dialog when clicking create button in empty state", async () => {
      const invoke = createEmptyMockInvoke();
      const projectStore = createProjectStore({ invoke });

      renderWithProviders(<DashboardPage />, { projectStore });

      await waitFor(() => {
        expect(
          screen.getByTestId("dashboard-create-first"),
        ).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("dashboard-create-first"));

      await waitFor(() => {
        expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument();
      });
    });
  });

  describe("Project List", () => {
    it("renders dashboard with projects", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      // Hero card should show most recent project
      expect(screen.getByTestId("dashboard-hero-card")).toBeInTheDocument();
      expect(screen.getByText("My First Novel")).toBeInTheDocument();

      // Project cards should show remaining projects
      const projectCards = screen.getAllByTestId("dashboard-project-card");
      expect(projectCards).toHaveLength(2);
    });

    it("renders hero card for most recent project", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-hero-card")).toBeInTheDocument();
      });

      // Hero should contain the most recent project (My First Novel, 1 hour ago)
      const heroCard = screen.getByTestId("dashboard-hero-card");
      expect(heroCard).toHaveTextContent("My First Novel");
    });

    it("renders new draft card", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-new-draft")).toBeInTheDocument();
      });
    });
  });

  describe("Search", () => {
    it("filters projects by search query", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("dashboard-search");
      await user.type(searchInput, "Short");

      // Should only show matching project
      await waitFor(() => {
        expect(screen.queryByText("My First Novel")).not.toBeInTheDocument();
        expect(screen.getByText("Short Stories")).toBeInTheDocument();
      });
    });

    it("shows no results message when search has no matches", async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      const searchInput = screen.getByTestId("dashboard-search");
      await user.type(searchInput, "nonexistent");

      await waitFor(() => {
        expect(screen.getByText("未找到匹配结果")).toBeInTheDocument();
      });
    });
  });

  describe("Project Selection", () => {
    it("calls onProjectSelect when clicking a project card", async () => {
      const onProjectSelect = vi.fn();
      renderWithProviders(<DashboardPage onProjectSelect={onProjectSelect} />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-hero-card")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("dashboard-hero-card"));

      await waitFor(() => {
        expect(onProjectSelect).toHaveBeenCalledWith("proj-1");
      });
    });

    it("sets current project when clicking a card", async () => {
      const invoke = createMockInvoke();
      const projectStore = createProjectStore({ invoke });

      renderWithProviders(<DashboardPage />, { projectStore });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-hero-card")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("dashboard-hero-card"));

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith("project:project:setcurrent", {
          projectId: "proj-1",
        });
      });
    });
  });

  describe("Create Project", () => {
    it("opens create dialog when clicking Create New button", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-create-new")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("dashboard-create-new"));

      await waitFor(() => {
        expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument();
      });
    });

    it("opens create dialog when clicking new draft card", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-new-draft")).toBeInTheDocument();
      });

      await userEvent.click(screen.getByTestId("dashboard-new-draft"));

      await waitFor(() => {
        expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument();
      });
    });
  });

  describe("Project Actions", () => {
    it("submits rename from project menu", async () => {
      const invoke = createMockInvoke();
      const projectStore = createProjectStore({ invoke });

      renderWithProviders(<DashboardPage />, { projectStore });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      const menuTriggers = screen.getAllByTestId("project-card-menu-trigger");
      await userEvent.click(menuTriggers[0]);
      await userEvent.click(screen.getByTestId("dropdown-item-rename"));
      await userEvent.clear(screen.getByTestId("rename-project-name"));
      await userEvent.type(
        screen.getByTestId("rename-project-name"),
        "Renamed",
      );
      await userEvent.click(screen.getByTestId("rename-project-submit"));

      await waitFor(() => {
        expect(invoke).toHaveBeenCalledWith("project:project:rename", {
          projectId: "proj-2",
          name: "Renamed",
        });
      });
    });

    it("hides archived projects by default and expands archived section on demand", async () => {
      const invoke = createArchivedMockInvoke();
      const projectStore = createProjectStore({ invoke });

      renderWithProviders(<DashboardPage />, { projectStore });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      expect(screen.getByText("已归档 (1)")).toBeInTheDocument();
      expect(screen.queryByText("Archived Draft")).not.toBeInTheDocument();

      await userEvent.click(screen.getByTestId("dashboard-archived-toggle"));

      await waitFor(() => {
        expect(screen.getByText("Archived Draft")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("project cards are keyboard accessible", async () => {
      const onProjectSelect = vi.fn();
      renderWithProviders(<DashboardPage onProjectSelect={onProjectSelect} />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-hero-card")).toBeInTheDocument();
      });

      const heroCard = screen.getByTestId("dashboard-hero-card");
      heroCard.focus();
      fireEvent.keyDown(heroCard, { key: "Enter" });

      await waitFor(() => {
        expect(onProjectSelect).toHaveBeenCalled();
      });
    });

    it("new draft card is keyboard accessible", async () => {
      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-new-draft")).toBeInTheDocument();
      });

      const newDraftCard = screen.getByTestId("dashboard-new-draft");
      newDraftCard.focus();
      fireEvent.keyDown(newDraftCard, { key: "Enter" });

      await waitFor(() => {
        expect(screen.getByTestId("create-project-dialog")).toBeInTheDocument();
      });
    });
  });
});
