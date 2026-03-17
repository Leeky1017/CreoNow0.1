import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { AppShell } from "./AppShell";
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
 * Full store provider wrapper for AppShell stories.
 */
function AppShellWrapper({
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
 * AppShell 组件 Story
 *
 * 设计规范: AppShell 是主要的布局容器，包含 IconBar、Sidebar、Main、RightPanel、StatusBar。
 *
 * 功能：
 * - 三列布局（IconBar + Sidebar + Main + RightPanel）
 * - 支持侧边栏和面板的折叠/展开
 * - 支持 Zen 模式
 * - 支持键盘快捷键
 */
const meta: Meta<typeof AppShell> = {
  title: "Layout/AppShell",
  component: AppShell,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <AppShellWrapper>
        <Story />
      </AppShellWrapper>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// =============================================================================
// Helper: Create wrapper with custom initial layout state
// =============================================================================

function AppShellWithLayoutState({
  sidebarCollapsed = false,
  panelCollapsed = false,
}: {
  sidebarCollapsed?: boolean;
  panelCollapsed?: boolean;
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

  // Set initial layout state - use correct property names
  React.useEffect(() => {
    layoutStore.setState({
      sidebarCollapsed,
      panelCollapsed,
    });
  }, [layoutStore, sidebarCollapsed, panelCollapsed]);

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
                      <div style={{ height: "600px" }}>
                        <AppShell />
                      </div>
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
 * 默认状态
 *
 * 完整的三列布局，侧边栏和面板都展开
 */
export const Default: Story = {
  render: () => (
    <div style={{ height: "600px" }}>
      <AppShell />
    </div>
  ),
};

/**
 * 完整高度
 *
 * 全屏高度的布局
 */
export const FullHeight: Story = {
  render: () => (
    <div style={{ height: "100vh" }}>
      <AppShell />
    </div>
  ),
};

/**
 * 交互指南
 *
 * 展示 AppShell 的交互操作（Windows 快捷键）
 */
export const InteractionGuide: Story = {
  render: () => (
    <div>
      <div
        style={{
          padding: "1rem",
          backgroundColor: "var(--color-bg-surface)",
          borderBottom: "1px solid var(--color-separator)",
          fontSize: "12px",
          color: "var(--color-fg-muted)",
        }}
      >
        <p style={{ marginBottom: "0.5rem", fontWeight: 500 }}>
          键盘快捷键（Windows）：
        </p>
        <ul style={{ paddingLeft: "1rem", margin: 0, lineHeight: 1.8 }}>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Ctrl+\
            </code>{" "}
            切换侧边栏
          </li>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Ctrl+L
            </code>{" "}
            切换右侧面板
          </li>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Ctrl+P
            </code>{" "}
            打开命令面板
          </li>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              F11
            </code>{" "}
            进入 Zen 模式
          </li>
          <li>
            <code
              style={{
                backgroundColor: "var(--color-bg-raised)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              Esc
            </code>{" "}
            退出 Zen 模式
          </li>
        </ul>
      </div>
      <div style={{ height: "500px" }}>
        <AppShell />
      </div>
    </div>
  ),
};

// =============================================================================
// P1: 折叠状态场景
// =============================================================================

/**
 * 侧边栏折叠状态
 *
 * 模拟用户按下 Ctrl+\ 折叠侧边栏后的布局状态。
 *
 * 验证点：
 * - IconBar 仍然可见（左侧 48px 宽度的图标栏）
 * - Sidebar 完全隐藏（宽度为 0）
 * - 左侧 Resizer 隐藏
 * - Main 区域扩展占据原 Sidebar 位置
 * - 右侧面板保持不变
 *
 * 浏览器测试步骤：
 * 1. 验证左侧只有 IconBar 可见（48px 宽）
 * 2. 验证 Main 区域从 IconBar 右侧开始
 * 3. 点击 IconBar 中的文件图标，验证 Sidebar 可以重新展开
 * 4. 按 Ctrl+\ 键，验证可以切换侧边栏
 */
export const SidebarCollapsed: Story = {
  render: () => (
    <AppShellWithLayoutState sidebarCollapsed={true} panelCollapsed={false} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "侧边栏折叠状态。IconBar 可见（48px），Sidebar 隐藏，Main 区域扩展。按 Ctrl+\\ 切换。",
      },
    },
  },
};

/**
 * 右面板折叠状态
 *
 * 模拟用户按下 Ctrl+L 折叠右侧面板后的布局状态。
 *
 * 验证点：
 * - 左侧 IconBar + Sidebar 正常显示
 * - 右侧面板完全隐藏（宽度为 0）
 * - 右侧 Resizer 隐藏
 * - Main 区域向右扩展占据原右面板位置
 * - StatusBar 仍然显示面板切换按钮
 *
 * 浏览器测试步骤：
 * 1. 验证右侧没有面板显示
 * 2. 验证 Main 区域扩展到右边缘
 * 3. 点击 StatusBar 中的 AI 图标，验证右面板可以重新展开
 * 4. 按 Ctrl+L 键，验证可以切换右面板
 */
export const RightPanelCollapsed: Story = {
  render: () => (
    <AppShellWithLayoutState sidebarCollapsed={false} panelCollapsed={true} />
  ),
  parameters: {
    docs: {
      description: {
        story: "右面板折叠状态。Main 区域向右扩展。按 Ctrl+L 切换。",
      },
    },
  },
};

/**
 * 双面板都折叠状态
 *
 * 模拟用户同时折叠侧边栏和右面板，最大化编辑区。
 *
 * 验证点：
 * - 仅 IconBar (48px) 可见
 * - Sidebar 和 RightPanel 都隐藏
 * - Main 区域占据最大可用空间（容器宽度 - 48px）
 * - 两侧 Resizer 都隐藏
 * - StatusBar 仍然可见，显示面板切换按钮
 *
 * 浏览器测试步骤：
 * 1. 验证布局仅显示：IconBar | Main | StatusBar
 * 2. 验证 Main 区域宽度 = 容器宽度 - 48px (IconBar)
 * 3. 测试键盘快捷键：
 *    - 按 Ctrl+\ 展开侧边栏
 *    - 按 Ctrl+L 展开右面板
 * 4. 验证展开后布局正确恢复
 */
export const BothCollapsed: Story = {
  render: () => (
    <AppShellWithLayoutState sidebarCollapsed={true} panelCollapsed={true} />
  ),
  parameters: {
    docs: {
      description: {
        story:
          "双面板都折叠，最大化编辑区。仅显示 IconBar (48px) + Main + StatusBar。",
      },
    },
  },
};

/**
 * 窄视口响应式布局
 *
 * 测试在 800px 宽度视口下的布局行为。
 *
 * 验证点：
 * - 容器宽度限制为 800px
 * - 侧边栏可能需要手动折叠以适应
 * - 所有元素不溢出容器
 * - 文字正确截断（text-overflow: ellipsis）
 * - Resizer 仍可拖拽，但有合理的范围限制
 * - 无水平滚动条
 *
 * 浏览器测试步骤：
 * 1. 使用浏览器开发者工具验证容器宽度为 800px
 * 2. 检查所有面板是否正确显示无溢出
 * 3. 尝试拖拽 Resizer，验证边界限制正确
 * 4. 验证 StatusBar 文字不溢出
 */
export const ResponsiveNarrow: Story = {
  render: () => (
    <div
      style={{
        width: "800px",
        height: "600px",
        overflow: "hidden",
        border: "2px dashed var(--color-border-default)",
      }}
    >
      <AppShellWithLayoutState
        sidebarCollapsed={false}
        panelCollapsed={false}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "窄视口（800px）响应式布局测试。验证元素不溢出、文字截断正确。",
      },
    },
  },
};
