import React from "react";
import { AppToastProvider } from "../providers/AppToastProvider";
import {
  LayoutStoreProvider,
  createLayoutStore,
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
import { ThemeStoreProvider, createThemeStore } from "../../stores/themeStore";
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

/**
 * Mock preferences for testing layout components.
 */
const mockPreferences = {
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

/**
 * Mock skills data for testing.
 */
const mockSkills = [
  {
    id: "builtin-polish",
    name: "Polish",
    scope: "builtin",
    enabled: true,
    valid: true,
  },
  {
    id: "builtin-expand",
    name: "Expand",
    scope: "builtin",
    enabled: true,
    valid: true,
  },
  {
    id: "builtin-simplify",
    name: "Simplify",
    scope: "builtin",
    enabled: true,
    valid: true,
  },
  {
    id: "custom-rewrite",
    name: "Rewrite in Style",
    scope: "project",
    enabled: true,
    valid: true,
  },
  {
    id: "disabled-skill",
    name: "Disabled Skill",
    scope: "global",
    enabled: false,
    valid: true,
  },
];

/**
 * Mock IPC for testing layout components.
 * Returns proper data structures to avoid null reference errors.
 */
const mockIpc = {
  invoke: async (channel: string): Promise<unknown> => {
    // Return mock skills for skill list requests
    if (channel === "ai:skill:registry:list") {
      return {
        ok: true,
        data: { items: mockSkills },
      };
    }
    // Default response for other channels
    return {
      ok: true,
      data: { items: [], settings: {}, content: "" },
    };
  },
  on: (): (() => void) => () => {},
};

/**
 * Test wrapper that provides all required stores for layout component testing.
 */
export function LayoutTestWrapper({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const layoutStore = React.useMemo(
    () => createLayoutStore(mockPreferences),
    [],
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
  const themeStore = React.useMemo(() => createThemeStore(mockPreferences), []);
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
                      <AppToastProvider>{children}</AppToastProvider>
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

/**
 * Decorator for Storybook that provides layout store context.
 */
export function layoutDecorator(Story: React.ComponentType): JSX.Element {
  return (
    <LayoutTestWrapper>
      <Story />
    </LayoutTestWrapper>
  );
}
