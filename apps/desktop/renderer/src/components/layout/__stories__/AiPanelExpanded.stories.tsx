import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AppShell } from "../AppShell";
import {
  LayoutStoreProvider,
  createLayoutStore,
} from "../../../stores/layoutStore";
import {
  ProjectStoreProvider,
  createProjectStore,
} from "../../../stores/projectStore";
import { FileStoreProvider, createFileStore } from "../../../stores/fileStore";
import {
  EditorStoreProvider,
  createEditorStore,
} from "../../../stores/editorStore";
import { AiStoreProvider, createAiStore } from "../../../stores/aiStore";
import {
  MemoryStoreProvider,
  createMemoryStore,
} from "../../../stores/memoryStore";
import {
  SearchStoreProvider,
  createSearchStore,
} from "../../../stores/searchStore";
import { KgStoreProvider, createKgStore } from "../../../stores/kgStore";
import {
  ThemeStoreProvider,
  createThemeStore,
} from "../../../stores/themeStore";

const mockPreferences = {
  get: <T,>(key: string): T | null => {
    // Expand the right panel by default for this story
    if (key === "layout.panelCollapsed") return false as T;
    if (key === "layout.activeRightPanel") return "ai" as T;
    if (key === "layout.sidebarCollapsed") return true as T;
    return null;
  },
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

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
];

const mockIpc = {
  invoke: async (channel: string): Promise<unknown> => {
    if (channel === "ai:skill:registry:list") {
      return { ok: true, data: { items: mockSkills } };
    }
    return {
      ok: true,
      data: { items: [], settings: {}, content: "" },
    };
  },
  on: (): (() => void) => () => {},
};

function AiPanelWrapper({
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
          </EditorStoreProvider>
        </FileStoreProvider>
      </ProjectStoreProvider>
    </LayoutStoreProvider>
  );
}

/**
 * AI Panel 展开组合
 *
 * 验证 AppShell + AiPanel 展开收起 + 主区域自适应效果。
 * 侧栏默认折叠，右侧 AI 面板展开。
 */
const meta: Meta<typeof AppShell> = {
  title: "Composition/AiPanelExpanded",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <AiPanelWrapper>
        <Story />
      </AiPanelWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * AI 面板展开 – 侧栏折叠，AI 面板展开，主区域自适应。
 */
export const AiPanelOpen: Story = {
  name: "AI 面板展开",
};
