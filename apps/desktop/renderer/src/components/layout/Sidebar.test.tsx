import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { LayoutTestWrapper } from "./test-utils";
import { LAYOUT_DEFAULTS, type LeftPanelType } from "../../stores/layoutStore";

describe("Sidebar", () => {
  const defaultProps: {
    width: number;
    collapsed: boolean;
    projectId: string | null;
    activePanel: LeftPanelType;
  } = {
    width: LAYOUT_DEFAULTS.sidebar.default,
    collapsed: false,
    projectId: null,
    activePanel: "files",
  };

  const renderWithWrapper = (props: typeof defaultProps = defaultProps) => {
    return render(
      <LayoutTestWrapper>
        <Sidebar {...props} />
      </LayoutTestWrapper>,
    );
  };

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 Sidebar 组件", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toBeInTheDocument();
    });

    it("应该有正确的默认宽度 (240px)", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveStyle({
        width: `${LAYOUT_DEFAULTS.sidebar.default}px`,
      });
    });

    it("应该渲染当前面板的标题", () => {
      renderWithWrapper();

      // Files 面板标题应该是 "Explorer"
      expect(screen.getByText("Explorer")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 折叠状态测试
  // ===========================================================================
  describe("折叠状态", () => {
    it("折叠时应该隐藏", () => {
      renderWithWrapper({ ...defaultProps, collapsed: true });

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveClass("hidden");
    });

    it("折叠时宽度应该为 0", () => {
      renderWithWrapper({ ...defaultProps, collapsed: true, width: 0 });

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveClass("w-0");
    });
  });

  // ===========================================================================
  // 宽度约束测试
  // ===========================================================================
  describe("宽度约束", () => {
    it("应该有最小宽度限制", () => {
      renderWithWrapper({
        ...defaultProps,
        width: LAYOUT_DEFAULTS.sidebar.min,
      });

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveStyle({
        minWidth: `${LAYOUT_DEFAULTS.sidebar.min}px`,
      });
    });

    it("应该有最大宽度限制", () => {
      renderWithWrapper({
        ...defaultProps,
        width: LAYOUT_DEFAULTS.sidebar.max,
      });

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveStyle({
        maxWidth: `${LAYOUT_DEFAULTS.sidebar.max}px`,
      });
    });
  });

  // ===========================================================================
  // 面板切换测试
  // ===========================================================================
  describe("面板切换", () => {
    it("activePanel=files 应该显示 Explorer 标题", () => {
      renderWithWrapper({ ...defaultProps, activePanel: "files" });

      expect(screen.getByText("Explorer")).toBeInTheDocument();
    });

    it("activePanel=search 应该显示 Search 标题", () => {
      renderWithWrapper({ ...defaultProps, activePanel: "search" });

      expect(screen.getByText("Search")).toBeInTheDocument();
    });

    it("activePanel=outline 应该显示 Outline 标题", () => {
      renderWithWrapper({ ...defaultProps, activePanel: "outline" });

      expect(screen.getByText("Outline")).toBeInTheDocument();
    });

    it("activePanel=memory 应该显示 Memory 标题", () => {
      renderWithWrapper({ ...defaultProps, activePanel: "memory" });

      // MemoryPanel 内部也有 "Memory" 文本，使用更宽松的断言
      const headers = screen.getAllByText("Memory");
      expect(headers.length).toBeGreaterThan(0);
    });

    it("activePanel=versionHistory 应该显示 Version History 标题", () => {
      renderWithWrapper({ ...defaultProps, activePanel: "versionHistory" });

      expect(screen.getByText("Version History")).toBeInTheDocument();
    });

    it("activePanel=characters 应该显示 Characters 标题", () => {
      renderWithWrapper({ ...defaultProps, activePanel: "characters" });

      expect(screen.getByText("Characters")).toBeInTheDocument();
    });

    it("activePanel=knowledgeGraph 应该显示 Knowledge Graph 标题", () => {
      renderWithWrapper({ ...defaultProps, activePanel: "knowledgeGraph" });

      expect(screen.getByText("Knowledge Graph")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 项目状态测试
  // ===========================================================================
  describe("项目状态", () => {
    it("无项目时应该显示提示信息", () => {
      renderWithWrapper({ ...defaultProps, projectId: null });

      expect(screen.getByText(/no project/i)).toBeInTheDocument();
    });

    it("有项目时不应该显示无项目提示", () => {
      renderWithWrapper({ ...defaultProps, projectId: "test-project" });

      expect(screen.queryByText(/no project/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("[WB-SCROLL-01] 侧栏滚动区域应由 ScrollArea viewport 承载", () => {
      renderWithWrapper();

      const viewport = screen.getByTestId("sidebar-scroll-viewport");
      const header = screen.getByTestId("sidebar-panel-header");
      const projectSwitcher = screen.getByTestId("sidebar-project-switcher");

      expect(viewport).toBeInTheDocument();
      expect(header).toBeInTheDocument();
      expect(projectSwitcher).toBeInTheDocument();
      expect(viewport).not.toContainElement(header);
      expect(viewport).not.toContainElement(projectSwitcher);
    });

    it("应该有右边框分隔线", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveClass("border-r");
    });

    it("应该有正确的背景色类", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar.className).toContain("bg-[var(--color-bg-surface)]");
    });

    it("应该有 flex column 布局", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar).toHaveClass("flex");
      expect(sidebar).toHaveClass("flex-col");
    });
  });

  // ===========================================================================
  // 无障碍测试
  // ===========================================================================
  describe("无障碍", () => {
    it("[WB-A11Y-01] 侧栏不应有 width transition（避免拖动卡顿）", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar.style.transition).toBe("");
    });

    it("应该渲染为 aside 元素", () => {
      renderWithWrapper();

      const sidebar = screen.getByTestId("layout-sidebar");
      expect(sidebar.tagName).toBe("ASIDE");
    });
  });
});
