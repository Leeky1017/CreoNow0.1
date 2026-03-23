import type { Meta, StoryObj } from "@storybook/react";
import { within, expect } from "@storybook/test";

import { DashboardPage } from "./DashboardPage";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
import { IconBar } from "../../components/layout/IconBar";
import { Sidebar } from "../../components/layout/Sidebar";
import {
  useLayoutStore,
  LayoutStoreProvider,
  createLayoutStore,
  LAYOUT_DEFAULTS,
} from "../../stores/layoutStore";

// =============================================================================
// Mock Data
// =============================================================================

const mockProjects = [
  {
    projectId: "proj-1",
    name: "The Aesthetics of Silence",
    rootPath: "/projects/aesthetics",
    updatedAt: Date.now() - 7200000, // 2 hours ago
  },
  {
    projectId: "proj-2",
    name: "Digital Craftsmanship",
    rootPath: "/projects/craftsmanship",
    updatedAt: Date.now() - 172800000, // 2 days ago
  },
  {
    projectId: "proj-3",
    name: "User Experience Patterns",
    rootPath: "/projects/ux-patterns",
    updatedAt: Date.now() - 259200000, // 3 days ago
  },
  {
    projectId: "proj-4",
    name: "Monochromatic Theory",
    rootPath: "/projects/mono-theory",
    updatedAt: Date.now() - 432000000, // 5 days ago
  },
  {
    projectId: "proj-5",
    name: "Typographic Rhythm",
    rootPath: "/projects/typography",
    updatedAt: Date.now() - 604800000, // 7 days ago
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

function createMockInvoke(projects = mockProjects) {
  return async (channel: string, payload?: unknown) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 100));

    if (channel === "project:project:list") {
      return { ok: true, data: { items: projects } };
    }
    if (channel === "project:project:getcurrent") {
      return { ok: false, error: { code: "NOT_FOUND", message: "No current" } };
    }
    if (channel === "project:project:setcurrent") {
      const id = (payload as { projectId: string })?.projectId;
      const project = projects.find((p) => p.projectId === id);
      if (project) {
        return {
          ok: true,
          data: { projectId: id, rootPath: project.rootPath },
        };
      }
      return {
        ok: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      };
    }
    if (channel === "project:project:create") {
      return {
        ok: true,
        data: {
          projectId: `proj-new-${Date.now()}`,
          rootPath: "/projects/new",
        },
      };
    }
    return { ok: true, data: {} };
  };
}

// =============================================================================
// Story Setup
// =============================================================================

const meta: Meta<typeof DashboardPage> = {
  title: "Features/Dashboard/DashboardPage",
  component: DashboardPage,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof DashboardPage>;

/**
 * AppShell-like wrapper for Dashboard stories.
 * Provides IconBar + Sidebar + main content layout (without StatusBar for simplicity).
 */
function DashboardLayout({ children }: { children: React.ReactNode }) {
  const sidebarWidth = useLayoutStore((s) => s.sidebarWidth);
  const sidebarCollapsed = useLayoutStore((s) => s.sidebarCollapsed);
  const activeLeftPanel = useLayoutStore((s) => s.activeLeftPanel);

  const effectiveSidebarWidth = sidebarCollapsed ? 0 : sidebarWidth;

  return (
    <div className="flex h-full overflow-hidden bg-[var(--color-bg-base)]">
      <IconBar onOpenSettings={() => {}} />
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex flex-1 min-w-0 min-h-0">
          <Sidebar
            width={effectiveSidebarWidth}
            collapsed={sidebarCollapsed}
            projectId={null}
            activePanel={activeLeftPanel}
          />
          <main
            className="flex flex-1 min-h-0 bg-[var(--color-bg-base)] text-[var(--color-fg-muted)] text-[13px] items-stretch justify-stretch"
            style={{ minWidth: LAYOUT_DEFAULTS.mainMinWidth }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

// Mock preferences for Storybook (same pattern as AppShell.stories.tsx)
const mockPreferences = {
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

// Create a layout store using the mock preferences
const mockLayoutStore = createLayoutStore(mockPreferences);

/**
 * Helper to create a story with custom project data.
 */
function createStoryDecorator(projects: typeof mockProjects) {
  return function StoryDecorator(Story: React.ComponentType) {
    const invoke = createMockInvoke(projects);
    const projectStore = createProjectStore({ invoke: invoke as never });

    return (
      <div className="h-screen bg-[var(--color-bg-base)]">
        <LayoutStoreProvider store={mockLayoutStore}>
          <ProjectStoreProvider store={projectStore}>
            <DashboardLayout>
              <Story />
            </DashboardLayout>
          </ProjectStoreProvider>
        </LayoutStoreProvider>
      </div>
    );
  };
}

// =============================================================================
// Stories
// =============================================================================

/**
 * Default dashboard with multiple projects.
 */
export const Default: Story = {
  decorators: [createStoryDecorator(mockProjects)],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("dashboard-page")).toBeInTheDocument();
    await expect(
      await canvas.findByText("The Aesthetics of Silence"),
    ).toBeInTheDocument();
  },
};

export const DefaultMultiProject: Story = {
  decorators: [createStoryDecorator(mockProjects)],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Empty state when user has no projects.
 */
export const Empty: Story = {
  decorators: [createStoryDecorator([])],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("dashboard-page")).toBeInTheDocument();
    await expect(
      await canvas.findByTestId("dashboard-empty"),
    ).toBeInTheDocument();
  },
};

export const EmptyState: Story = {
  decorators: [createStoryDecorator([])],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

export const SearchFiltered: Story = {
  decorators: [createStoryDecorator(mockProjects)],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Single project - shows hero without grid.
 */
export const SingleProject: Story = {
  decorators: [createStoryDecorator([mockProjects[0]])],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

/**
 * Two projects - hero + one card.
 */
export const TwoProjects: Story = {
  decorators: [createStoryDecorator(mockProjects.slice(0, 2))],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};

const manyProjects = [
  ...mockProjects,
  {
    projectId: "proj-6",
    name: "System Architecture Notes",
    rootPath: "/projects/arch",
    updatedAt: Date.now() - 864000000,
  },
  {
    projectId: "proj-7",
    name: "Interface Guidelines",
    rootPath: "/projects/guidelines",
    updatedAt: Date.now() - 1036800000,
  },
  {
    projectId: "proj-8",
    name: "Color Theory Essays",
    rootPath: "/projects/color",
    updatedAt: Date.now() - 1209600000,
  },
  {
    projectId: "proj-9",
    name: "Animation Principles",
    rootPath: "/projects/animation",
    updatedAt: Date.now() - 1382400000,
  },
  {
    projectId: "proj-10",
    name: "Accessibility Best Practices",
    rootPath: "/projects/a11y",
    updatedAt: Date.now() - 1555200000,
  },
];

/**
 * Many projects to test scrolling and grid.
 */
export const ManyProjects: Story = {
  decorators: [createStoryDecorator(manyProjects)],
  args: {
    onProjectSelect: (id: string) => console.log("Selected project:", id),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByTestId("dashboard-page")).toBeInTheDocument();
    await expect(
      await canvas.findByText("The Aesthetics of Silence"),
    ).toBeInTheDocument();
    await expect(
      await canvas.findByText("Accessibility Best Practices"),
    ).toBeInTheDocument();
  },
};

/**
 * Loading state simulation.
 */
export const Loading: Story = {
  decorators: [
    function LoadingDecorator() {
      // Create a store that stays in loading state
      const invoke = async () => {
        await new Promise(() => {}); // Never resolves
        return { ok: true, data: {} };
      };
      const projectStore = createProjectStore({ invoke: invoke as never });

      return (
        <div className="h-screen bg-[var(--color-bg-base)]">
          <LayoutStoreProvider store={mockLayoutStore}>
            <ProjectStoreProvider store={projectStore}>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProjectStoreProvider>
          </LayoutStoreProvider>
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    await expect(canvasElement.children.length).toBeGreaterThan(0);
  },
};
