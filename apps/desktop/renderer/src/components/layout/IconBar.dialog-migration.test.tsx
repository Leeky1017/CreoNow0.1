import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import React from "react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { AppShell } from "./AppShell";
import { AppToastProvider } from "../providers/AppToastProvider";
import { LayoutStoreProvider, createLayoutStore } from "../../stores/layoutStore";
import { ProjectStoreProvider, createProjectStore } from "../../stores/projectStore";
import { FileStoreProvider, createFileStore } from "../../stores/fileStore";
import { EditorStoreProvider, createEditorStore } from "../../stores/editorStore";
import { VersionStoreProvider, createVersionStore } from "../../stores/versionStore";
import { AiStoreProvider, createAiStore } from "../../stores/aiStore";
import { MemoryStoreProvider, createMemoryStore } from "../../stores/memoryStore";
import { SearchStoreProvider, createSearchStore } from "../../stores/searchStore";
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
      if (channel === "project:project:getcurrent") {
        return {
          ok: true,
          data: {
            projectId: "project-1",
            rootPath: "/tmp/project-1",
          },
        };
      }
      if (channel === "project:project:list") {
        return {
          ok: true,
          data: {
            items: [
              {
                projectId: "project-1",
                rootPath: "/tmp/project-1",
                name: "Project 1",
                type: "novel",
                state: "active",
              },
            ],
          },
        };
      }
      return {
        ok: true,
        data: { items: [], settings: {}, content: "" },
      };
    }),
    on: (): (() => void) => () => {},
  };
}

function AppShellTestWrapper(props: { children: React.ReactNode }): JSX.Element {
  const mockIpc = React.useMemo(() => createMockIpc(), []);
  const layoutStore = React.useMemo(() => createLayoutStore(mockPreferences), []);
  const projectStore = React.useMemo(
    () => createProjectStore(mockIpc as Parameters<typeof createProjectStore>[0]),
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
  const versionStore = React.useMemo(
    () => createVersionStore(mockIpc as Parameters<typeof createVersionStore>[0]),
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
                        <AppToastProvider>{props.children}</AppToastProvider>
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

function readSource(relativePath: string): string {
  const filePath = fileURLToPath(new URL(relativePath, import.meta.url));
  return readFileSync(filePath, "utf8");
}

function extractLeftPanelTypeUnion(layoutStoreSource: string): string[] {
  const unionMatch = layoutStoreSource.match(
    /export type LeftPanelType\s*=\s*([\s\S]*?);/,
  );

  if (!unionMatch) {
    throw new Error("Cannot locate LeftPanelType union in layoutStore.tsx.");
  }

  return Array.from(unionMatch[1].matchAll(/"([^"]+)"/g)).map(
    (match) => match[1],
  );
}

describe("IconBar dialog migration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("LeftPanelType only includes files and outline (WB-FE-S3-S1)", () => {
    const source = readSource("../../stores/layoutStore.tsx");
    const leftPanelTypes = extractLeftPanelTypeUnion(source);
    expect(leftPanelTypes).toEqual(["files", "outline"]);
  });

  it("memory icon opens dialog instead of docking (WB-FE-S3-S2)", async () => {
    await act(async () => {
      render(
        <AppShellTestWrapper>
          <AppShell />
        </AppShellTestWrapper>,
      );
    });

    const sidebar = screen.getByTestId("layout-sidebar");
    expect(sidebar).toHaveStyle({ width: "240px" });

    fireEvent.click(screen.getByTestId("icon-bar-memory"));

    await waitFor(() => {
      expect(screen.getByTestId("leftpanel-dialog-memory")).toBeInTheDocument();
    });
    expect(sidebar).toHaveStyle({ width: "240px" });
  });

  it("dialog closes with close button and Escape (WB-FE-S3-S3)", async () => {
    await act(async () => {
      render(
        <AppShellTestWrapper>
          <AppShell />
        </AppShellTestWrapper>,
      );
    });

    fireEvent.click(screen.getByTestId("icon-bar-memory"));

    const memoryDialog = await screen.findByTestId("leftpanel-dialog-memory");
    fireEvent.click(within(memoryDialog).getByRole("button", { name: "Close" }));

    await waitFor(() => {
      expect(screen.queryByTestId("leftpanel-dialog-memory")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("icon-bar-memory"));
    await screen.findByTestId("leftpanel-dialog-memory");

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    await waitFor(() => {
      expect(screen.queryByTestId("leftpanel-dialog-memory")).not.toBeInTheDocument();
    });
  });

  it("dialogs are mutually exclusive when switching icons (WB-FE-S3-S3)", async () => {
    await act(async () => {
      render(
        <AppShellTestWrapper>
          <AppShell />
        </AppShellTestWrapper>,
      );
    });

    fireEvent.click(screen.getByTestId("icon-bar-memory"));
    await screen.findByTestId("leftpanel-dialog-memory");

    fireEvent.click(screen.getByTestId("icon-bar-characters"));
    await screen.findByTestId("leftpanel-dialog-characters");

    expect(screen.queryByTestId("leftpanel-dialog-memory")).not.toBeInTheDocument();
  });

  it("search icon opens spotlight and closes on escape (WB-FE-S3-S3)", async () => {
    await act(async () => {
      render(
        <AppShellTestWrapper>
          <AppShell />
        </AppShellTestWrapper>,
      );
    });

    fireEvent.click(screen.getByTestId("icon-bar-search"));

    await waitFor(() => {
      expect(screen.getByTestId("leftpanel-spotlight-search")).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    await waitFor(() => {
      expect(screen.queryByTestId("leftpanel-spotlight-search")).not.toBeInTheDocument();
    });
  });
});
