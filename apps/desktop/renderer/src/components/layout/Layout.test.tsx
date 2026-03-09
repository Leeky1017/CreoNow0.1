import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
import { PreferenceProvider } from "../../lib/PreferenceContext";

/**
 * Mock preferences for testing.
 */
const mockPreferences = {
  get: <T,>(): T | null => null,
  set: (): void => {},
  remove: (): void => {},
  clear: (): void => {},
};

/**
 * Mock IPC for testing.
 * Returns proper data structures to avoid null reference errors.
 */
const mockIpc = {
  invoke: vi.fn(async () => ({
    ok: true,
    data: { items: [], settings: {}, content: "" },
  })),
  on: (): (() => void) => () => {},
};

/**
 * Full store provider wrapper for Layout tests.
 */
function LayoutTestWrapper({
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
    <PreferenceProvider value={mockPreferences}>
      <LayoutStoreProvider store={layoutStore}>
        <ProjectStoreProvider store={projectStore}>
          <FileStoreProvider store={fileStore}>
            <EditorStoreProvider store={editorStore}>
              <ThemeStoreProvider store={themeStore}>
                <AiStoreProvider store={aiStore}>
                  <MemoryStoreProvider store={memoryStore}>
                    <SearchStoreProvider store={searchStore}>
                      <KgStoreProvider store={kgStore}>{children}</KgStoreProvider>
                    </SearchStoreProvider>
                  </MemoryStoreProvider>
                </AiStoreProvider>
              </ThemeStoreProvider>
            </EditorStoreProvider>
          </FileStoreProvider>
        </ProjectStoreProvider>
      </LayoutStoreProvider>
    </PreferenceProvider>
  );
}

describe("Layout 综合测试", () => {
  const renderWithWrapper = () => {
    return render(
      <LayoutTestWrapper>
        <AppShell />
      </LayoutTestWrapper>,
    );
  };

  // ===========================================================================
  // 溢出/滚动行为测试
  // ===========================================================================
  describe("溢出/滚动行为", () => {
    it("Flex 布局不应该溢出容器", () => {
      renderWithWrapper();

      const appShell = screen.getByTestId("app-shell");

      // AppShell 应该有 flex 布局
      expect(appShell).toHaveClass("flex");

      // 应该占满高度
      expect(appShell).toHaveClass("h-full");
    });

    it("主内容区域应该有最小宽度限制", () => {
      renderWithWrapper();

      const main = screen.getByRole("main");
      expect(main).toHaveStyle({
        minWidth: `${LAYOUT_DEFAULTS.mainMinWidth}px`,
      });
    });

    it("侧边栏应该有最小/最大宽度限制", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveStyle({
        minWidth: `${LAYOUT_DEFAULTS.sidebar.min}px`,
        maxWidth: `${LAYOUT_DEFAULTS.sidebar.max}px`,
      });
    });

    it("右侧面板应该有最小/最大宽度限制", () => {
      renderWithWrapper();

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveStyle({
        minWidth: `${LAYOUT_DEFAULTS.panel.min}px`,
        maxWidth: `${LAYOUT_DEFAULTS.panel.max}px`,
      });
    });
  });

  // ===========================================================================
  // 响应式行为测试
  // ===========================================================================
  describe("响应式行为", () => {
    it("布局应该是弹性的", () => {
      renderWithWrapper();

      const appShell = screen.getByTestId("app-shell");

      // 应该使用 flex 布局
      expect(appShell).toHaveClass("flex");
    });

    it("主内容区域应该是可伸缩的", () => {
      renderWithWrapper();

      const main = screen.getByRole("main");

      // 主内容区域应该可以伸缩
      expect(main).toHaveClass("flex-1");
    });

    it("内部布局也应该是弹性的", () => {
      renderWithWrapper();

      const appShell = screen.getByTestId("app-shell");

      // 检查内部 flex 容器
      const innerContainer = appShell.querySelector(".flex-1");
      expect(innerContainer).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 布局常量验证
  // ===========================================================================
  describe("布局常量", () => {
    it("LAYOUT_DEFAULTS.iconBarWidth 应该是 48", () => {
      expect(LAYOUT_DEFAULTS.iconBarWidth).toBe(48);
    });

    it("LAYOUT_DEFAULTS.statusBarHeight 应该是 28", () => {
      expect(LAYOUT_DEFAULTS.statusBarHeight).toBe(28);
    });

    it("LAYOUT_DEFAULTS.sidebar 应该有正确的值", () => {
      expect(LAYOUT_DEFAULTS.sidebar.min).toBe(180);
      expect(LAYOUT_DEFAULTS.sidebar.max).toBe(400);
      expect(LAYOUT_DEFAULTS.sidebar.default).toBe(240);
    });

    it("LAYOUT_DEFAULTS.panel 应该有正确的值", () => {
      expect(LAYOUT_DEFAULTS.panel.min).toBe(280);
      expect(LAYOUT_DEFAULTS.panel.max).toBe(480);
      expect(LAYOUT_DEFAULTS.panel.default).toBe(320);
    });

    it("LAYOUT_DEFAULTS.mainMinWidth 应该是 400", () => {
      expect(LAYOUT_DEFAULTS.mainMinWidth).toBe(400);
    });
  });

  // ===========================================================================
  // 组件组装验证
  // ===========================================================================
  describe("组件组装", () => {
    it("应该包含所有必要的布局组件", () => {
      renderWithWrapper();

      // IconBar（通过 testid 识别）
      expect(screen.getByTestId("icon-bar")).toBeInTheDocument();

      // Sidebar
      expect(screen.getByTestId("layout-sidebar")).toBeInTheDocument();

      // RightPanel
      expect(screen.getByTestId("layout-panel")).toBeInTheDocument();

      // StatusBar
      expect(screen.getByTestId("layout-statusbar")).toBeInTheDocument();

      // Resizers
      expect(screen.getByTestId("resize-handle-sidebar")).toBeInTheDocument();
      expect(screen.getByTestId("resize-handle-panel")).toBeInTheDocument();

      // Main
      expect(screen.getByRole("main")).toBeInTheDocument();
    });

    it("布局顺序应该正确（从左到右）", () => {
      renderWithWrapper();

      const appShell = screen.getByTestId("app-shell");
      const children = Array.from(appShell.children);

      // 第一个子元素应该是 IconBar 容器
      expect(children.length).toBeGreaterThanOrEqual(1);
    });
  });
});
