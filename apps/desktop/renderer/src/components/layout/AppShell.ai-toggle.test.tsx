import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { AppShell } from "./AppShell";
import {
  LayoutStoreProvider,
  createLayoutStore,
  type UseLayoutStore,
} from "../../stores/layoutStore";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../stores/projectStore";
import { FileStoreProvider, createFileStore } from "../../stores/fileStore";
import {
  EditorStoreProvider,
  createEditorStore,
} from "../../stores/editorStore";
import {
  VersionStoreProvider,
  createVersionStore,
} from "../../stores/versionStore";
import { AiStoreProvider, createAiStore } from "../../stores/aiStore";
import {
  MemoryStoreProvider,
  createMemoryStore,
} from "../../stores/memoryStore";
import {
  SearchStoreProvider,
  createSearchStore,
} from "../../stores/searchStore";
import { KgStoreProvider, createKgStore } from "../../stores/kgStore";
import { ThemeStoreProvider, createThemeStore } from "../../stores/themeStore";

const mockPreferences = {
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

function createMockIpc() {
  return {
    invoke: vi.fn().mockImplementation(async (channel: string) => {
      await Promise.resolve();
      if (channel === "project:project:list") {
        return { ok: true, data: { items: [] } };
      }
      if (channel === "project:project:getcurrent") {
        return {
          ok: false,
          error: { code: "NOT_FOUND", message: "No project" },
        };
      }
      return { ok: true, data: { items: [], settings: {}, content: "" } };
    }),
    on: (): (() => void) => () => {},
  };
}

let mockIpc = createMockIpc();

function TestWrapper({
  children,
  layoutStoreOverride,
}: {
  children: React.ReactNode;
  layoutStoreOverride?: UseLayoutStore;
}): JSX.Element {
  const layoutStore = React.useMemo(
    () => layoutStoreOverride ?? createLayoutStore(mockPreferences),
    [layoutStoreOverride],
  );
  const projectStore = React.useMemo(
    () =>
      createProjectStore(mockIpc as Parameters<typeof createProjectStore>[0]),
    [],
  );
  const fileStore = React.useMemo(
    () => createFileStore(mockIpc as Parameters<typeof createFileStore>[0]),
    [],
  );
  const editorStore = React.useMemo(
    () => createEditorStore(mockIpc as Parameters<typeof createEditorStore>[0]),
    [],
  );
  const versionStore = React.useMemo(
    () =>
      createVersionStore(mockIpc as Parameters<typeof createVersionStore>[0]),
    [],
  );
  const aiStore = React.useMemo(
    () => createAiStore(mockIpc as Parameters<typeof createAiStore>[0]),
    [],
  );
  const memoryStore = React.useMemo(
    () => createMemoryStore(mockIpc as Parameters<typeof createMemoryStore>[0]),
    [],
  );
  const searchStore = React.useMemo(
    () => createSearchStore(mockIpc as Parameters<typeof createSearchStore>[0]),
    [],
  );
  const kgStore = React.useMemo(
    () => createKgStore(mockIpc as Parameters<typeof createKgStore>[0]),
    [],
  );
  const themeStore = React.useMemo(() => createThemeStore(mockPreferences), []);

  return (
    <LayoutStoreProvider store={layoutStore}>
      <ProjectStoreProvider store={projectStore}>
        <FileStoreProvider store={fileStore}>
          <EditorStoreProvider store={editorStore}>
            <VersionStoreProvider store={versionStore}>
              <ThemeStoreProvider store={themeStore}>
                <AiStoreProvider store={aiStore}>
                  <MemoryStoreProvider store={memoryStore}>
                    <SearchStoreProvider store={searchStore}>
                      <KgStoreProvider store={kgStore}>
                        {children}
                      </KgStoreProvider>
                    </SearchStoreProvider>
                  </MemoryStoreProvider>
                </AiStoreProvider>
              </ThemeStoreProvider>
            </VersionStoreProvider>
          </EditorStoreProvider>
        </FileStoreProvider>
      </ProjectStoreProvider>
    </LayoutStoreProvider>
  );
}

async function renderApp(options?: { layoutStoreOverride?: UseLayoutStore }) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <TestWrapper layoutStoreOverride={options?.layoutStoreOverride}>
        <AppShell />
      </TestWrapper>,
    );
  });
  return result!;
}

describe("WB-FE-AI-TGL: AI panel toggle button", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIpc = createMockIpc();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("WB-FE-AI-TGL-S1: renders AI toggle button with correct aria-label", async () => {
    await renderApp();
    const btn = screen.getByRole("button", { name: /ai panel/i });
    expect(btn).toBeDefined();
  });

  it("WB-FE-AI-TGL-S2: shows tooltip with Ctrl+L shortcut hint", async () => {
    await renderApp();
    const btn = screen.getByRole("button", { name: /ai panel/i });
    expect(btn.getAttribute("title")).toContain("Ctrl+L");
  });

  it("WB-FE-AI-TGL-S3: button has minimum 24px touch target", async () => {
    await renderApp();
    const btn = screen.getByRole("button", { name: /ai panel/i });
    const className = btn.className;
    expect(className).toMatch(/min-w-6|min-w-\[24px\]/);
    expect(className).toMatch(/min-h-6|min-h-\[24px\]/);
  });

  it("WB-FE-AI-TGL-S1: click expands panel and activates ai tab when collapsed", async () => {
    const layoutStore = createLayoutStore(mockPreferences);
    layoutStore.setState({
      panelCollapsed: true,
      activeRightPanel: "info",
    });
    await renderApp({ layoutStoreOverride: layoutStore });

    const panel = screen.getByTestId("layout-panel");
    expect(panel).toHaveClass("hidden");

    const btn = screen.getByRole("button", { name: /ai panel/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(panel).not.toHaveClass("hidden");
    expect(screen.getByTestId("right-panel-tab-ai")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("WB-FE-AI-TGL-S1b: click collapses panel when already open on ai tab", async () => {
    const layoutStore = createLayoutStore(mockPreferences);
    layoutStore.setState({
      panelCollapsed: false,
      activeRightPanel: "ai",
    });
    await renderApp({ layoutStoreOverride: layoutStore });

    const panel = screen.getByTestId("layout-panel");
    expect(panel).not.toHaveClass("hidden");

    const btn = screen.getByRole("button", { name: /ai panel/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(panel).toHaveClass("hidden");
  });

  it("WB-FE-AI-TGL-S1c: click switches to ai tab without collapsing when panel is open on different tab", async () => {
    const layoutStore = createLayoutStore(mockPreferences);
    layoutStore.setState({
      panelCollapsed: false,
      activeRightPanel: "info",
    });
    await renderApp({ layoutStoreOverride: layoutStore });

    const panel = screen.getByTestId("layout-panel");
    expect(panel).not.toHaveClass("hidden");

    const btn = screen.getByRole("button", { name: /ai panel/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    // Panel should remain visible
    expect(panel).not.toHaveClass("hidden");
    // AI tab should now be active
    expect(screen.getByTestId("right-panel-tab-ai")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("right-panel-tab-info")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });
});
