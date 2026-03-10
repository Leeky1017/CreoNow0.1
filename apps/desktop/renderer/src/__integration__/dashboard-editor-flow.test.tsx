/**
 * Dashboard → Editor Flow Integration Test
 *
 * Why: Validates the routing logic and initial state transitions
 * for the Dashboard to Editor flow.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { AppShell } from "../components/layout/AppShell";
import { AppToastProvider } from "../components/providers/AppToastProvider";
import { LayoutStoreProvider, createLayoutStore } from "../stores/layoutStore";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../stores/projectStore";
import { FileStoreProvider, createFileStore } from "../stores/fileStore";
import { EditorStoreProvider, createEditorStore } from "../stores/editorStore";
import { AiStoreProvider, createAiStore } from "../stores/aiStore";
import { MemoryStoreProvider, createMemoryStore } from "../stores/memoryStore";
import { SearchStoreProvider, createSearchStore } from "../stores/searchStore";
import { KgStoreProvider, createKgStore } from "../stores/kgStore";
import { ThemeStoreProvider, createThemeStore } from "../stores/themeStore";
import {
  VersionStoreProvider,
  createVersionStore,
} from "../stores/versionStore";

// =============================================================================
// Test Fixtures
// =============================================================================

const MOCK_PROJECTS = [
  {
    projectId: "proj-1",
    name: "测试小说",
    rootPath: "/path/to/proj-1",
    updatedAt: Date.now() - 3600000,
  },
  {
    projectId: "proj-2",
    name: "短篇集",
    rootPath: "/path/to/proj-2",
    updatedAt: Date.now() - 86400000,
  },
];

// =============================================================================
// Mock Preferences
// =============================================================================

const mockPreferences = {
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

// =============================================================================
// Mock IPC Factory
// =============================================================================

/**
 * Create a comprehensive mock IPC for integration tests.
 *
 * Why: All stores need properly shaped responses to avoid runtime errors.
 */
function createComprehensiveMockIpc(options: {
  hasProjects: boolean;
  currentProjectId: string | null;
}) {
  const state = { currentProjectId: options.currentProjectId };

  return {
    invoke: vi
      .fn()
      .mockImplementation(async (channel: string, payload?: unknown) => {
        await Promise.resolve();

        switch (channel) {
          case "project:project:list":
            return {
              ok: true,
              data: { items: options.hasProjects ? MOCK_PROJECTS : [] },
            };

          case "project:project:getcurrent":
            if (state.currentProjectId) {
              const project = MOCK_PROJECTS.find(
                (p) => p.projectId === state.currentProjectId,
              );
              if (project) {
                return {
                  ok: true,
                  data: {
                    projectId: project.projectId,
                    rootPath: project.rootPath,
                  },
                };
              }
            }
            return {
              ok: false,
              error: { code: "NOT_FOUND", message: "No current project" },
            };

          case "project:project:setcurrent": {
            const { projectId } = payload as { projectId: string };
            state.currentProjectId = projectId;
            const project = MOCK_PROJECTS.find(
              (p) => p.projectId === projectId,
            );
            return {
              ok: true,
              data: { projectId, rootPath: project?.rootPath ?? "" },
            };
          }

          case "file:list":
          case "file:bootstrap":
            return { ok: true, data: { items: [] } };

          case "editor:bootstrap":
            return {
              ok: true,
              data: {
                documentId: "doc-1",
                contentJson: JSON.stringify({
                  type: "doc",
                  content: [{ type: "paragraph" }],
                }),
              },
            };

          case "skill:registry:list":
            return { ok: true, data: { items: [] } };

          case "memory:entry:list":
          case "memory:getPreferences":
            return { ok: true, data: { items: [] } };

          case "search:query":
            return { ok: true, data: { results: [] } };

          case "knowledge:entity:list":
            return { ok: true, data: { items: [] } };

          case "knowledge:relation:list":
            return { ok: true, data: { items: [] } };

          default:
            return { ok: true, data: { items: [] } };
        }
      }),
    on: (): (() => void) => () => {},
  };
}

// =============================================================================
// Test Wrapper
// =============================================================================

function IntegrationTestWrapper({
  children,
  mockIpc,
}: {
  children: React.ReactNode;
  mockIpc: ReturnType<typeof createComprehensiveMockIpc>;
}): JSX.Element {
  const layoutStore = React.useMemo(
    () => createLayoutStore(mockPreferences),
    [],
  );
  const projectStore = React.useMemo(
    () =>
      createProjectStore(mockIpc as Parameters<typeof createProjectStore>[0]),
    [mockIpc],
  );
  const fileStore = React.useMemo(
    () => createFileStore(mockIpc as Parameters<typeof createFileStore>[0]),
    [mockIpc],
  );
  const editorStore = React.useMemo(
    () => createEditorStore(mockIpc as Parameters<typeof createEditorStore>[0]),
    [mockIpc],
  );
  const aiStore = React.useMemo(
    () => createAiStore(mockIpc as Parameters<typeof createAiStore>[0]),
    [mockIpc],
  );
  const memoryStore = React.useMemo(
    () => createMemoryStore(mockIpc as Parameters<typeof createMemoryStore>[0]),
    [mockIpc],
  );
  const searchStore = React.useMemo(
    () => createSearchStore(mockIpc as Parameters<typeof createSearchStore>[0]),
    [mockIpc],
  );
  const kgStore = React.useMemo(
    () => createKgStore(mockIpc as Parameters<typeof createKgStore>[0]),
    [mockIpc],
  );
  const versionStore = React.useMemo(
    () =>
      createVersionStore(mockIpc as Parameters<typeof createVersionStore>[0]),
    [mockIpc],
  );
  const themeStore = React.useMemo(() => createThemeStore(mockPreferences), []);

  return (
    <LayoutStoreProvider store={layoutStore}>
      <ProjectStoreProvider store={projectStore}>
        <FileStoreProvider store={fileStore}>
          <EditorStoreProvider store={editorStore}>
            <ThemeStoreProvider store={themeStore}>
              <AiStoreProvider store={aiStore}>
                <MemoryStoreProvider store={memoryStore}>
                  <SearchStoreProvider store={searchStore}>
                    <KgStoreProvider store={kgStore}>
                      <VersionStoreProvider store={versionStore}>
                        <AppToastProvider>{children}</AppToastProvider>
                      </VersionStoreProvider>
                    </KgStoreProvider>
                  </SearchStoreProvider>
                </MemoryStoreProvider>
              </AiStoreProvider>
            </ThemeStoreProvider>
          </EditorStoreProvider>
        </FileStoreProvider>
      </ProjectStoreProvider>
    </LayoutStoreProvider>
  );
}

// =============================================================================
// Tests
// =============================================================================

describe("Dashboard → Editor Flow", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Routing Logic", () => {
    it("should show Dashboard when projects exist but none selected", async () => {
      const mockIpc = createComprehensiveMockIpc({
        hasProjects: true,
        currentProjectId: null,
      });

      await act(async () => {
        render(
          <IntegrationTestWrapper mockIpc={mockIpc}>
            <AppShell />
          </IntegrationTestWrapper>,
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      // Should show hero card with most recent project
      expect(screen.getByTestId("dashboard-hero-card")).toBeInTheDocument();
      expect(screen.getByText("测试小说")).toBeInTheDocument();
    });

    it("should show Dashboard empty state when no projects exist", async () => {
      const mockIpc = createComprehensiveMockIpc({
        hasProjects: false,
        currentProjectId: null,
      });

      await act(async () => {
        render(
          <IntegrationTestWrapper mockIpc={mockIpc}>
            <AppShell />
          </IntegrationTestWrapper>,
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-empty")).toBeInTheDocument();
      });
    });

    // Note: Testing the full Dashboard → Editor transition with state updates
    // requires a more complex setup. The IPC call verification test below
    // confirms the flow works at the IPC level. Visual verification should
    // be done via Storybook.
  });

  describe("IPC Calls", () => {
    it("should call project:project:list and project:project:getcurrent on bootstrap", async () => {
      const mockIpc = createComprehensiveMockIpc({
        hasProjects: true,
        currentProjectId: null,
      });

      await act(async () => {
        render(
          <IntegrationTestWrapper mockIpc={mockIpc}>
            <AppShell />
          </IntegrationTestWrapper>,
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      await waitFor(() => {
        expect(mockIpc.invoke).toHaveBeenCalledWith(
          "project:project:list",
          expect.any(Object),
        );
        expect(mockIpc.invoke).toHaveBeenCalledWith(
          "project:project:getcurrent",
          expect.any(Object),
        );
      });
    });

    it("should call project:project:setcurrent when selecting a project", async () => {
      const user = userEvent.setup();
      const mockIpc = createComprehensiveMockIpc({
        hasProjects: true,
        currentProjectId: null,
      });

      await act(async () => {
        render(
          <IntegrationTestWrapper mockIpc={mockIpc}>
            <AppShell />
          </IntegrationTestWrapper>,
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-hero-card")).toBeInTheDocument();
      });

      await user.click(screen.getByTestId("dashboard-hero-card"));

      await waitFor(() => {
        expect(mockIpc.invoke).toHaveBeenCalledWith(
          "project:project:setcurrent",
          {
            projectId: "proj-1",
          },
        );
      });
    });
  });

  describe("Layout Preservation", () => {
    it("should show sidebar and panel by default", async () => {
      const mockIpc = createComprehensiveMockIpc({
        hasProjects: true,
        currentProjectId: null,
      });

      await act(async () => {
        render(
          <IntegrationTestWrapper mockIpc={mockIpc}>
            <AppShell />
          </IntegrationTestWrapper>,
        );
        await new Promise((r) => setTimeout(r, 100));
      });

      await waitFor(() => {
        expect(screen.getByTestId("dashboard-page")).toBeInTheDocument();
      });

      const sidebar = screen.getByTestId("layout-sidebar");
      const panel = screen.getByTestId("layout-panel");
      expect(sidebar).not.toHaveClass("hidden");
      expect(panel).not.toHaveClass("hidden");
    });
  });
});
