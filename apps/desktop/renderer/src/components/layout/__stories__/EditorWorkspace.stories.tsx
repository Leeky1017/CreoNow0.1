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
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

const mockProjectItems = [
  {
    projectId: "proj-1",
    name: "My Novel",
    description: "A story about AI",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockFileItems = [
  { documentId: "doc-1", title: "Chapter 1", type: "chapter" },
  { documentId: "doc-2", title: "Chapter 2", type: "chapter" },
  { documentId: "doc-3", title: "Characters", type: "notes" },
];

const mockIpc = {
  invoke: async (channel: string): Promise<unknown> => {
    if (channel === "project:list") {
      return { ok: true, data: { items: mockProjectItems } };
    }
    if (channel === "file:document:list") {
      return { ok: true, data: { items: mockFileItems } };
    }
    return {
      ok: true,
      data: { items: [], settings: {}, content: "" },
    };
  },
  on: (): (() => void) => () => {},
};

function EditorWrapper({
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
 * Editor 三栏工作区组合
 *
 * 验证 AppShell + EditorPane + FileTree + RightPanel 的三栏布局。
 * 包含 resize 手柄和视觉分割线。
 */
const meta: Meta<typeof AppShell> = {
  title: "Composition/EditorWorkspace",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <EditorWrapper>
        <Story />
      </EditorWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * 三栏编辑区 – 侧栏 + 编辑器 + 右侧面板全部展开。
 */
export const ThreeColumnLayout: Story = {
  name: "三栏编辑区",
};
