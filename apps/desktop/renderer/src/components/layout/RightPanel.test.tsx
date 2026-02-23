import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RightPanel } from "./RightPanel";
import { LayoutTestWrapper } from "./test-utils";
import { LAYOUT_DEFAULTS } from "../../stores/layoutStore";

describe("RightPanel", () => {
  const defaultProps: {
    width: number;
    collapsed: boolean;
  } = {
    width: LAYOUT_DEFAULTS.panel.default,
    collapsed: false,
  };

  const renderWithWrapper = (props: typeof defaultProps = defaultProps) => {
    return render(
      <LayoutTestWrapper>
        <RightPanel {...props} />
      </LayoutTestWrapper>,
    );
  };

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 RightPanel 组件", () => {
      renderWithWrapper();

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toBeInTheDocument();
    });

    it("应该有正确的默认宽度 (320px)", () => {
      renderWithWrapper();

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveStyle({
        width: `${LAYOUT_DEFAULTS.panel.default}px`,
      });
    });

    it("应该渲染所有 3 个 tab 按钮", () => {
      renderWithWrapper();

      expect(screen.getByTestId("right-panel-tab-ai")).toBeInTheDocument();
      expect(screen.getByTestId("right-panel-tab-info")).toBeInTheDocument();
      expect(screen.getByTestId("right-panel-tab-quality")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // 折叠状态测试
  // ===========================================================================
  describe("折叠状态", () => {
    it("折叠时应该隐藏", () => {
      renderWithWrapper({ ...defaultProps, collapsed: true });

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveClass("hidden");
    });

    it("折叠时宽度应该为 0", () => {
      renderWithWrapper({ ...defaultProps, collapsed: true, width: 0 });

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveClass("w-0");
    });
  });

  // ===========================================================================
  // Tab 切换测试
  // ===========================================================================
  describe("Tab 切换", () => {
    it("默认应该显示 AI tab 激活", () => {
      renderWithWrapper();

      const aiTab = screen.getByTestId("right-panel-tab-ai");
      expect(aiTab).toHaveAttribute("aria-pressed", "true");
    });

    it("AI 内容不应出现内部 Assistant/Info 子标签", () => {
      renderWithWrapper();

      expect(
        screen.queryByRole("button", { name: /assistant/i }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: /^info$/i })).toHaveLength(
        1,
      );
    });

    it("点击 Info tab 应该切换激活状态", () => {
      renderWithWrapper();

      const aiTab = screen.getByTestId("right-panel-tab-ai");
      const infoTab = screen.getByTestId("right-panel-tab-info");

      // 初始状态
      expect(aiTab).toHaveAttribute("aria-pressed", "true");
      expect(infoTab).toHaveAttribute("aria-pressed", "false");

      // 点击 Info
      fireEvent.click(infoTab);

      // Info 激活
      expect(infoTab).toHaveAttribute("aria-pressed", "true");
      expect(aiTab).toHaveAttribute("aria-pressed", "false");
    });

    it("点击 Quality tab 应该切换激活状态", () => {
      renderWithWrapper();

      const qualityTab = screen.getByTestId("right-panel-tab-quality");

      // 点击 Quality
      fireEvent.click(qualityTab);

      // Quality 激活
      expect(qualityTab).toHaveAttribute("aria-pressed", "true");
    });
  });

  // ===========================================================================
  // 宽度约束测试
  // ===========================================================================
  describe("宽度约束", () => {
    it("应该有最小宽度限制", () => {
      renderWithWrapper({ ...defaultProps, width: LAYOUT_DEFAULTS.panel.min });

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveStyle({
        minWidth: `${LAYOUT_DEFAULTS.panel.min}px`,
      });
    });

    it("应该有最大宽度限制", () => {
      renderWithWrapper({ ...defaultProps, width: LAYOUT_DEFAULTS.panel.max });

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveStyle({
        maxWidth: `${LAYOUT_DEFAULTS.panel.max}px`,
      });
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("[WB-SCROLL-02] 右侧内容滚动区域应由 ScrollArea viewport 承载", () => {
      renderWithWrapper();

      expect(
        screen.getByTestId("right-panel-scroll-viewport"),
      ).toBeInTheDocument();
    });

    it("应该有左边框分隔线", () => {
      renderWithWrapper();

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveClass("border-l");
    });

    it("应该有正确的背景色类", () => {
      renderWithWrapper();

      const panel = screen.getByTestId("layout-panel");
      expect(panel.className).toContain("bg-[var(--color-bg-surface)]");
    });

    it("应该有 flex column 布局", () => {
      renderWithWrapper();

      const panel = screen.getByTestId("layout-panel");
      expect(panel).toHaveClass("flex");
      expect(panel).toHaveClass("flex-col");
    });
  });

  // ===========================================================================
  // 无障碍测试
  // ===========================================================================
  describe("无障碍", () => {
    it("应该渲染为 aside 元素", () => {
      renderWithWrapper();

      const panel = screen.getByTestId("layout-panel");
      expect(panel.tagName).toBe("ASIDE");
    });

    it("Tab 按钮应该有 aria-pressed 状态", () => {
      renderWithWrapper();

      const tabs = [
        screen.getByTestId("right-panel-tab-ai"),
        screen.getByTestId("right-panel-tab-info"),
        screen.getByTestId("right-panel-tab-quality"),
      ];

      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("aria-pressed");
      });
    });

    it("Tab 按钮应该有 type='button'", () => {
      renderWithWrapper();

      const tabs = [
        screen.getByTestId("right-panel-tab-ai"),
        screen.getByTestId("right-panel-tab-info"),
        screen.getByTestId("right-panel-tab-quality"),
      ];

      tabs.forEach((tab) => {
        expect(tab).toHaveAttribute("type", "button");
      });
    });
  });

  // ===========================================================================
  // 折叠按钮测试
  // ===========================================================================
  describe("折叠按钮", () => {
    it("展开状态应该渲染折叠按钮", () => {
      render(
        <LayoutTestWrapper>
          <RightPanel {...defaultProps} onCollapse={() => {}} />
        </LayoutTestWrapper>,
      );

      const collapseBtn = screen.getByTestId("right-panel-collapse-btn");
      expect(collapseBtn).toBeInTheDocument();
    });

    it("点击折叠按钮应该调用 onCollapse 回调", () => {
      const onCollapse = vi.fn();
      render(
        <LayoutTestWrapper>
          <RightPanel {...defaultProps} onCollapse={onCollapse} />
        </LayoutTestWrapper>,
      );

      const collapseBtn = screen.getByTestId("right-panel-collapse-btn");
      fireEvent.click(collapseBtn);

      expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    it("折叠状态不应该渲染折叠按钮", () => {
      renderWithWrapper({ ...defaultProps, collapsed: true });

      expect(
        screen.queryByTestId("right-panel-collapse-btn"),
      ).not.toBeInTheDocument();
    });
  });
});
