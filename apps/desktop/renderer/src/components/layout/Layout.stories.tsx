import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AppShell } from "./AppShell";
import {
  LayoutStoreProvider,
  createLayoutStore,
  LAYOUT_DEFAULTS,
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

/**
 * Mock preferences for Storybook.
 */
const mockPreferences = {
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

/**
 * Mock IPC for Storybook.
 * Returns proper data structures to avoid null reference errors.
 */
const mockIpc = {
  invoke: async (): Promise<unknown> => ({
    ok: true,
    data: { items: [], settings: {}, content: "" },
  }),
  on: (): (() => void) => () => {},
};

/**
 * Full store provider wrapper for Layout stories.
 */
function LayoutWrapper({
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
 * Layout 综合测试 Stories
 *
 * 用于验证布局在各种条件下的表现，包括溢出/滚动和响应式行为。
 */
const meta: Meta<typeof AppShell> = {
  title: "Layout/综合测试",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <LayoutWrapper>
        <Story />
      </LayoutWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ============================================================================
// 溢出/滚动行为测试
// ============================================================================

/**
 * 溢出测试 - 默认布局
 *
 * 验证 Flex 布局不会溢出容器
 */
export const OverflowDefault: Story = {
  name: "溢出测试 - 默认",
  render: () => (
    <div
      style={{
        height: "600px",
        border: "2px solid var(--color-border-focus)",
        overflow: "hidden",
      }}
    >
      <AppShell />
    </div>
  ),
};

/**
 * 溢出测试 - 小容器
 *
 * 验证在较小容器中布局不会溢出
 */
export const OverflowSmallContainer: Story = {
  name: "溢出测试 - 小容器",
  render: () => (
    <div
      style={{
        height: "400px",
        width: "800px",
        border: "2px solid var(--color-border-focus)",
        overflow: "hidden",
        margin: "20px",
      }}
    >
      <AppShell />
    </div>
  ),
};

/**
 * 溢出测试 - 最小尺寸
 *
 * 验证在最小支持尺寸下布局的表现
 */
export const OverflowMinimumSize: Story = {
  name: "溢出测试 - 最小尺寸",
  render: () => (
    <div>
      <div
        style={{
          marginBottom: "1rem",
          padding: "0.5rem",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
          backgroundColor: "var(--color-bg-surface)",
        }}
      >
        最小窗口尺寸测试：IconBar(48) + Sidebar(180) + Main(400) + Panel(280) =
        908px
      </div>
      <div
        style={{
          height: "300px",
          width: `${LAYOUT_DEFAULTS.iconBarWidth + LAYOUT_DEFAULTS.sidebar.min + LAYOUT_DEFAULTS.mainMinWidth + LAYOUT_DEFAULTS.panel.min}px`,
          border: "2px solid var(--color-border-focus)",
          overflow: "hidden",
        }}
      >
        <AppShell />
      </div>
    </div>
  ),
};

// ============================================================================
// 响应式行为测试
// ============================================================================

/**
 * 响应式测试 - 宽屏
 *
 * 验证在宽屏下的布局表现
 */
export const ResponsiveWide: Story = {
  name: "响应式 - 宽屏 (1920px)",
  render: () => (
    <div
      style={{
        height: "600px",
        width: "1920px",
        border: "2px solid var(--color-border-focus)",
        overflow: "hidden",
      }}
    >
      <AppShell />
    </div>
  ),
};

/**
 * 响应式测试 - 标准屏
 *
 * 验证在标准屏幕下的布局表现
 */
export const ResponsiveStandard: Story = {
  name: "响应式 - 标准 (1440px)",
  render: () => (
    <div
      style={{
        height: "600px",
        width: "1440px",
        border: "2px solid var(--color-border-focus)",
        overflow: "hidden",
      }}
    >
      <AppShell />
    </div>
  ),
};

/**
 * 响应式测试 - 笔记本
 *
 * 验证在笔记本屏幕下的布局表现
 */
export const ResponsiveLaptop: Story = {
  name: "响应式 - 笔记本 (1280px)",
  render: () => (
    <div
      style={{
        height: "500px",
        width: "1280px",
        border: "2px solid var(--color-border-focus)",
        overflow: "hidden",
      }}
    >
      <AppShell />
    </div>
  ),
};

/**
 * 响应式测试 - 小笔记本
 *
 * 验证在小笔记本屏幕下的布局表现
 */
export const ResponsiveSmallLaptop: Story = {
  name: "响应式 - 小笔记本 (1024px)",
  render: () => (
    <div
      style={{
        height: "500px",
        width: "1024px",
        border: "2px solid var(--color-border-focus)",
        overflow: "hidden",
      }}
    >
      <AppShell />
    </div>
  ),
};

/**
 * 高度变化测试
 *
 * 验证不同高度下的布局表现
 */
export const HeightVariations: Story = {
  name: "高度变化测试",
  render: () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        padding: "1rem",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-fg-muted)",
            marginBottom: "0.5rem",
          }}
        >
          高度: 800px
        </div>
        <div
          style={{
            height: "200px",
            width: "100%",
            border: "2px solid var(--color-border-focus)",
            overflow: "hidden",
          }}
        >
          <AppShell />
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: "12px",
            color: "var(--color-fg-muted)",
            marginBottom: "0.5rem",
          }}
        >
          高度: 400px
        </div>
        <div
          style={{
            height: "150px",
            width: "100%",
            border: "2px solid var(--color-border-focus)",
            overflow: "hidden",
          }}
        >
          <AppShell />
        </div>
      </div>
    </div>
  ),
};

/**
 * 布局常量展示
 *
 * 展示所有布局相关的常量值
 */
export const LayoutConstants: Story = {
  name: "布局常量",
  render: () => (
    <div
      style={{
        padding: "2rem",
        backgroundColor: "var(--color-bg-surface)",
        color: "var(--color-fg-default)",
        fontFamily: "monospace",
        fontSize: "13px",
      }}
    >
      <h3 style={{ margin: "0 0 1rem", fontSize: "14px" }}>LAYOUT_DEFAULTS</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th
              style={{
                textAlign: "left",
                padding: "0.5rem",
                borderBottom: "1px solid var(--color-separator)",
              }}
            >
              属性
            </th>
            <th
              style={{
                textAlign: "left",
                padding: "0.5rem",
                borderBottom: "1px solid var(--color-separator)",
              }}
            >
              值
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "0.5rem" }}>iconBarWidth</td>
            <td style={{ padding: "0.5rem" }}>
              {LAYOUT_DEFAULTS.iconBarWidth}px
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>statusBarHeight</td>
            <td style={{ padding: "0.5rem" }}>
              {LAYOUT_DEFAULTS.statusBarHeight}px
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>sidebar.min</td>
            <td style={{ padding: "0.5rem" }}>
              {LAYOUT_DEFAULTS.sidebar.min}px
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>sidebar.max</td>
            <td style={{ padding: "0.5rem" }}>
              {LAYOUT_DEFAULTS.sidebar.max}px
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>sidebar.default</td>
            <td style={{ padding: "0.5rem" }}>
              {LAYOUT_DEFAULTS.sidebar.default}px
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>panel.min</td>
            <td style={{ padding: "0.5rem" }}>{LAYOUT_DEFAULTS.panel.min}px</td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>panel.max</td>
            <td style={{ padding: "0.5rem" }}>{LAYOUT_DEFAULTS.panel.max}px</td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>panel.default</td>
            <td style={{ padding: "0.5rem" }}>
              {LAYOUT_DEFAULTS.panel.default}px
            </td>
          </tr>
          <tr>
            <td style={{ padding: "0.5rem" }}>mainMinWidth</td>
            <td style={{ padding: "0.5rem" }}>
              {LAYOUT_DEFAULTS.mainMinWidth}px
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  ),
};
