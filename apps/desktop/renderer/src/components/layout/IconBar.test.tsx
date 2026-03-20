import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconBar } from "./IconBar";
import { LayoutTestWrapper } from "./test-utils";

describe("IconBar", () => {
  const renderWithWrapper = () => {
    return render(
      <LayoutTestWrapper>
        <IconBar onOpenSettings={() => {}} />
      </LayoutTestWrapper>,
    );
  };

  // ===========================================================================
  // 基础渲染测试
  // ===========================================================================
  describe("渲染", () => {
    it("应该渲染 IconBar 组件", () => {
      renderWithWrapper();

      const iconBar = screen.getByTestId("icon-bar");
      expect(iconBar).toBeInTheDocument();
    });

    it("应该渲染所有 8 个导航按钮", () => {
      renderWithWrapper();

      // 验证所有按钮都存在
      expect(screen.getByTestId("icon-bar-files")).toBeInTheDocument();
      expect(screen.getByTestId("icon-bar-search")).toBeInTheDocument();
      expect(screen.getByTestId("icon-bar-outline")).toBeInTheDocument();
      expect(
        screen.getByTestId("icon-bar-version-history"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("icon-bar-memory")).toBeInTheDocument();
      expect(screen.getByTestId("icon-bar-characters")).toBeInTheDocument();
      expect(
        screen.getByTestId("icon-bar-knowledge-graph"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("icon-bar-settings")).toBeInTheDocument();
    });

    it("应该有正确的固定宽度 (48px)", () => {
      renderWithWrapper();

      const iconBar = screen.getByTestId("icon-bar");
      expect(iconBar.className).toContain("w-12");
      expect(iconBar.className).toContain("shrink-0");
    });
  });

  // ===========================================================================
  // 交互测试
  // ===========================================================================
  describe("交互", () => {
    it("点击非激活的按钮应该激活对应面板", () => {
      renderWithWrapper();

      const searchButton = screen.getByTestId("icon-bar-search");

      // 初始状态：search 未激活
      expect(searchButton).toHaveAttribute("aria-pressed", "false");

      // 点击 search 按钮
      fireEvent.click(searchButton);

      // 按钮应该显示激活状态
      expect(searchButton).toHaveAttribute("aria-pressed", "true");
    });

    it("点击不同按钮应该切换激活状态", () => {
      renderWithWrapper();

      const filesButton = screen.getByTestId("icon-bar-files");
      const searchButton = screen.getByTestId("icon-bar-search");

      // 初始状态：files 应该激活（默认 activeLeftPanel = "files"）
      expect(filesButton).toHaveAttribute("aria-pressed", "true");
      expect(searchButton).toHaveAttribute("aria-pressed", "false");

      // 点击 search
      fireEvent.click(searchButton);

      // search 应该激活，files 不再激活
      expect(searchButton).toHaveAttribute("aria-pressed", "true");
      expect(filesButton).toHaveAttribute("aria-pressed", "false");
    });

    it("点击已激活的按钮应该保持激活（sidebar 折叠时 aria-pressed=false）", () => {
      renderWithWrapper();

      const filesButton = screen.getByTestId("icon-bar-files");

      // 初始激活
      expect(filesButton).toHaveAttribute("aria-pressed", "true");

      // 再次点击同一个按钮会切换折叠状态
      fireEvent.click(filesButton);

      // sidebar 折叠后，即使 activeLeftPanel 仍是 files，aria-pressed 应该为 false
      expect(filesButton).toHaveAttribute("aria-pressed", "false");
    });
  });

  // ===========================================================================
  // 样式测试
  // ===========================================================================
  describe("样式", () => {
    it("应该有边框右侧分隔线", () => {
      renderWithWrapper();

      const iconBar = screen.getByTestId("icon-bar");
      expect(iconBar).toHaveClass("border-r");
    });

    it("应该有正确的背景色类", () => {
      renderWithWrapper();

      const iconBar = screen.getByTestId("icon-bar");
      expect(iconBar.className).toContain("bg-[var(--color-bg-surface)]");
    });

    it("按钮应该有 hover 状态样式类", () => {
      renderWithWrapper();

      const filesButton = screen.getByTestId("icon-bar-files");
      expect(filesButton.className).toContain("hover:");
    });

    it("按钮应该有 focus-visible 样式类", () => {
      renderWithWrapper();

      const filesButton = screen.getByTestId("icon-bar-files");
      expect(filesButton.className).toContain("focus-visible:");
    });
  });

  // ===========================================================================
  // 无障碍测试
  // ===========================================================================
  describe("无障碍", () => {
    it("[WB-A11Y-02] 应支持键盘导航并保持 focus-visible 指示样式", async () => {
      renderWithWrapper();
      const user = userEvent.setup();
      const filesButton = screen.getByTestId("icon-bar-files");
      const searchButton = screen.getByTestId("icon-bar-search");

      expect(filesButton.className).toContain(
        "focus-visible:outline-[var(--color-ring-focus)]",
      );
      expect(filesButton.className).toContain(
        "focus-visible:outline-offset-[var(--ring-focus-offset)]",
      );

      await user.tab();
      expect(filesButton).toHaveFocus();

      await user.tab();
      expect(searchButton).toHaveFocus();
    });

    it("所有按钮应该有 aria-label", () => {
      renderWithWrapper();

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-label");
      });
    });

    it("所有按钮应该有 type='button'", () => {
      renderWithWrapper();

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("type", "button");
      });
    });

    it("所有按钮应该有 aria-pressed 状态", () => {
      renderWithWrapper();

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("aria-pressed");
      });
    });

    it("所有按钮应该有 title 提示", () => {
      renderWithWrapper();

      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        expect(button).toHaveAttribute("title");
      });
    });
  });

  // ===========================================================================
  // Spec 对齐测试（workbench-p5-01）
  // ===========================================================================
  describe("Spec 对齐", () => {
    it("should render a left accent indicator when files icon is active", () => {
      renderWithWrapper();

      const filesButton = screen.getByTestId("icon-bar-files");
      const searchButton = screen.getByTestId("icon-bar-search");

      expect(filesButton).toHaveAttribute("aria-pressed", "true");
      expect(filesButton.className).toContain("border-l-2");
      expect(filesButton.className).toContain("border-l-[var(--color-accent)]");
      expect(filesButton.className).not.toContain(
        "bg-[var(--color-bg-selected)]",
      );

      expect(searchButton).toHaveAttribute("aria-pressed", "false");
      expect(searchButton.className).toContain("border-l-transparent");
    });

    it("should keep the icon order aligned with change-00 contract when rendering main icons", () => {
      renderWithWrapper();

      const iconBar = screen.getByTestId("icon-bar");
      const groups = iconBar.querySelectorAll(
        "div.flex.flex-col.items-center.gap-1",
      );
      const mainGroup = groups.item(0);
      const mainIconOrder = Array.from(
        mainGroup.querySelectorAll<HTMLButtonElement>("button[data-testid]"),
      ).map((button) => button.dataset.testid);

      expect(mainIconOrder).toEqual([
        "icon-bar-files",
        "icon-bar-search",
        "icon-bar-outline",
        "icon-bar-version-history",
        "icon-bar-memory",
        "icon-bar-characters",
        "icon-bar-knowledge-graph",
      ]);
      expect(screen.getByTestId("icon-bar-settings")).toBeInTheDocument();
    });

    it("should render 24px icons and 40x40 button hit areas when icon bar mounts", () => {
      renderWithWrapper();

      const filesButton = screen.getByTestId("icon-bar-files");
      const icon = filesButton.querySelector("svg");

      expect(filesButton.className).toContain("w-10");
      expect(filesButton.className).toContain("h-10");
      expect(filesButton.className).toContain("items-center");
      expect(filesButton.className).toContain("justify-center");

      expect(icon).not.toBeNull();
      expect(icon).toHaveAttribute("width", "24");
      expect(icon).toHaveAttribute("height", "24");
      expect(filesButton).toHaveAttribute("aria-label", "Files");
    });
  });
});
