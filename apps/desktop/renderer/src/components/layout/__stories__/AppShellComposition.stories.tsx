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
import { ThemeStoreProvider, createThemeStore } from "../../../stores/themeStore";

const mockPreferences = {
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

const mockIpc = {
  invoke: async (): Promise<unknown> => ({
    ok: true,
    data: { items: [], settings: {}, content: "" },
  }),
  on: (): (() => void) => () => {},
};

function CompositionWrapper({
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
 * AppShell + Dashboard 全窗口组合
 *
 * 验证全窗布局 + 侧栏宽度比例 + Panel 切换的整体效果。
 * 无项目时展示 Dashboard 欢迎页。
 */
const meta: Meta<typeof AppShell> = {
  title: "Composition/AppShellComposition",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <CompositionWrapper>
        <Story />
      </CompositionWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Dashboard 模式 – 无项目时展示欢迎页面，侧栏可折叠。
 */
export const DashboardView: Story = {
  name: "Dashboard 全窗口",
};
